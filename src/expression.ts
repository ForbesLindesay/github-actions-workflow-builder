import {contextValueString, ContextValue, isContextValue} from './ContextValue';

export {ContextValue};

const ExpressionString = Symbol('expressionString');
const ExpressionType = Symbol('expressionType');
const JsonStringType = Symbol('jsonStringType');
export type ComplexExpression<T> = {
  readonly [ExpressionString]: string;
  readonly [ExpressionType]?: T;
  readonly toJSON: () => string;
};

export type Literal = string | number | boolean | null;

export type Expression<T> =
  | ComplexExpression<T>
  | ContextValue<T>
  | Extract<Literal, T>;

export type JsonExpression<T> = ComplexExpression<string> & {
  readonly [JsonStringType]?: T;
};

function createExpression<T>(str: string): ComplexExpression<T> {
  return {
    [ExpressionString]: str,
    toJSON: () => '${{ ' + str + ' }}',
  };
}

function isComplexExpression(
  expression: unknown,
): expression is ComplexExpression<unknown> {
  return (
    typeof expression === 'object' &&
    !!expression &&
    typeof (expression as any)[ExpressionString] === 'string'
  );
}

function valueToString(
  value: Expression<unknown>,
  withBrackets: boolean = false,
): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return JSON.stringify(value);
  // tslint:disable-next-line:strict-type-predicates
  if (typeof value === 'string') return `'${value.replace(/\'/g, `''`)}'`;

  if (isContextValue(value)) {
    return contextValueString(value);
  }

  if (withBrackets) {
    const str = valueToString(value, false);
    const stack: (`'` | `(`)[] = [];
    for (const c of str) {
      if (stack.length && stack[stack.length - 1] === `'`) {
        if (c === `'`) {
          stack.pop();
        }
      } else {
        switch (c) {
          case `'`:
            stack.push(`'`);
            break;
          case `(`:
            stack.push(`(`);
            break;
          case `)`:
            stack.pop();
            break;
          case ' ':
            if (stack.length === 0) {
              return `(${str})`;
            }
            break;
        }
      }
    }
    return str;
  }

  if (isComplexExpression(value)) {
    return value[ExpressionString].trim();
  }

  throw new Error(`Unsupported type: ${typeof value}`);
}

export function not(value: Expression<boolean>): Expression<boolean> {
  return createExpression(`!${valueToString(value, true)}`);
}

export function gt(
  left: Expression<number>,
  right: Expression<number>,
): Expression<boolean> {
  return createExpression(
    `${valueToString(left, true)} > ${valueToString(right, true)}`,
  );
}

export function gteq(
  left: Expression<number>,
  right: Expression<number>,
): Expression<boolean> {
  return createExpression(
    `${valueToString(left, true)} >= ${valueToString(right, true)}`,
  );
}

export function lt(
  left: Expression<number>,
  right: Expression<number>,
): Expression<boolean> {
  return createExpression(
    `${valueToString(left, true)} < ${valueToString(right, true)}`,
  );
}

export function lteq(
  left: Expression<number>,
  right: Expression<number>,
): Expression<boolean> {
  return createExpression(
    `${valueToString(left, true)} <= ${valueToString(right, true)}`,
  );
}

export function eq(
  left: Expression<unknown>,
  right: Expression<unknown>,
): Expression<boolean> {
  return createExpression(
    `${valueToString(left, true)} == ${valueToString(right, true)}`,
  );
}

export function neq(
  left: Expression<unknown>,
  right: Expression<unknown>,
): Expression<boolean> {
  return createExpression(
    `${valueToString(left, true)} != ${valueToString(right, true)}`,
  );
}

export function and(...conditions: Expression<boolean>[]): Expression<boolean> {
  return joinConditions(' && ', ...conditions);
}

export function or(...conditions: Expression<boolean>[]): Expression<boolean> {
  return joinConditions(' || ', ...conditions);
}

function joinConditions(
  joiner: ' && ' | ' || ',
  ...conditions: Expression<boolean>[]
): Expression<boolean> {
  if (conditions.length === 1) {
    return createExpression(valueToString(conditions[0]));
  }
  return createExpression(
    conditions.map((c) => valueToString(c, true)).join(joiner),
  );
}

export function contains(
  search: Expression<unknown>,
  item: Expression<unknown>,
): Expression<boolean> {
  return createExpression(
    `contains(${valueToString(search)}, ${valueToString(item)})`,
  );
}

export function startsWith(
  search: Expression<unknown>,
  item: Expression<unknown>,
): Expression<boolean> {
  return createExpression(
    `startsWith(${valueToString(search)}, ${valueToString(item)})`,
  );
}

export function endsWith(
  search: Expression<unknown>,
  item: Expression<unknown>,
): Expression<boolean> {
  return createExpression(
    `endsWith(${valueToString(search)}, ${valueToString(item)})`,
  );
}

export function format(
  format: string,
  ...items: Expression<unknown>[]
): Expression<string> {
  return createExpression(
    `format(${valueToString(format)}, ${items
      .map((item) => valueToString(item))
      .join(', ')})`,
  );
}

export function join(
  array: Expression<unknown>,
  separator: string = ', ',
): Expression<string> {
  return createExpression(
    `join(${valueToString(array)}, ${valueToString(separator)})`,
  );
}

export function toJSON<T>(value: Expression<T>): JsonExpression<T> {
  return createExpression(`toJSON(${valueToString(value)})`);
}

export function fromJSON<T>(value: JsonExpression<T>): Expression<T>;
export function fromJSON(value: Expression<string>): Expression<unknown>;
export function fromJSON(value: Expression<string>): Expression<unknown> {
  return createExpression(`fromJSON(${valueToString(value)})`);
}

export function hashFiles(
  ...paths: [Expression<string>, ...Expression<string>[]]
): Expression<string> {
  return createExpression(
    `hashFiles(${paths.map((path) => valueToString(path)).join(', ')})`,
  );
}

export function success(): Expression<boolean> {
  return createExpression(`success()`);
}
export function always(): Expression<boolean> {
  return createExpression(`always()`);
}
export function cancelled(): Expression<boolean> {
  return createExpression(`cancelled()`);
}
export function failure(): Expression<boolean> {
  return createExpression(`failure()`);
}

export function interpolate(
  strings: TemplateStringsArray,
  ...parameters: Expression<string>[]
): Expression<string> {
  const result: Expression<string>[] = [];
  for (let i = 0; i < strings.length; i++) {
    result.push(strings[i]);
    if (i < parameters.length) {
      result.push(parameters[i]);
    }
  }
  return joinStrings(result, '');
}

export function joinStrings(
  strings: Expression<string>[],
  separator: string = ',',
): Expression<string> {
  let index = 0;
  const params: string[] = [];
  const formatString = strings
    .map((str) => {
      switch (typeof str) {
        case 'string':
        case 'number':
        case 'boolean':
          return str.replace(/\{/g, '{{').replace(/\}/g, '}}');
        default:
          params.push(valueToString(str));
          return `{${index++}}`;
      }
    })
    .join(separator.replace(/\{/g, '{{').replace(/\}/g, '}}'));
  if (params.length === 0) {
    return formatString.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
  }
  return {
    [ExpressionString]: `format(${valueToString(formatString)}, ${params.join(
      ',',
    )})`,
    toJSON: () =>
      strings
        .map((str) => {
          switch (typeof str) {
            case 'string':
            case 'number':
            case 'boolean':
              return str;
            default:
              return '${{' + valueToString(str) + '}}';
          }
        })
        .join(separator),
  };
}
