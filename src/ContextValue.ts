const ContextValueString = Symbol('contextValueString');
const ContextValueType = Symbol('contextValueString');

type ExtraContextValue<T> = T extends string | number | boolean | null
  ? {}
  : {
      readonly [key in keyof T]: ContextValue<T[key]>;
    };
export type ContextValue<T> = ExtraContextValue<T> & {
  readonly [ContextValueString]: () => string;
  readonly [ContextValueType]?: T;
  readonly toJSON: () => string;
};

export function isContextValue(proxy: unknown): proxy is ContextValue<unknown> {
  return (
    typeof proxy === 'object' &&
    !!proxy &&
    typeof (proxy as any)[ContextValueString] === 'function'
  );
}
export function contextValueString<T>(proxy: ContextValue<T>): string {
  return proxy[ContextValueString]();
}

export default function createContextValue<T>(
  path: string,
  onAccess?: () => void,
): ContextValue<T> {
  const getProp = (key: string | number | symbol): any => {
    if (onAccess) onAccess();
    if (key === ContextValueString) return () => path;
    if (key === 'toJSON') return () => '${{ ' + path + ' }}';

    if (typeof key === 'number') {
      return getProp(JSON.stringify(key));
    }
    if (typeof key === 'string') {
      if (key === '*') {
        // returns an array
        return createContextValue<any>(`${path}.${key}`);
      }
      if (/^[a-z_][a-z0-9-_]+$/i.test(key)) {
        return createContextValue<any>(`${path}.${key}`);
      }
      return createContextValue<any>(`${path}['${key.replace(/\'/g, `''`)}']`);
    }
    return undefined;
  };
  return new Proxy<any>(
    {},
    {
      get(_target, key) {
        return getProp(key);
      },
      set() {
        throw new Error('Cannot set on ContextValue');
      },
      deleteProperty() {
        throw new Error('Cannot delete on ContextValue');
      },
      enumerate() {
        throw new Error('Cannot get keys on ContextValue');
      },
      ownKeys() {
        throw new Error('Cannot get keys on ContextValue');
      },
      has(_target, key) {
        return getProp(key) !== undefined;
      },
      defineProperty() {
        throw new Error('Cannot defineProperty on ContextValue');
      },
      getOwnPropertyDescriptor(_target, key) {
        const value = getProp(key);
        if (value === undefined) return undefined;
        return {
          value,
          writable: false,
          enumerable: false,
          configurable: false,
        };
      },
    },
  );
}
