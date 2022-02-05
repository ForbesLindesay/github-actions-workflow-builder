import {github, matrix, needs, NeedsJobContext, StepContext} from './context';
import {
  and,
  ContextValue,
  eq,
  Expression,
  isComplexExpression,
  toJSON,
} from './expression';
import createContextValue, {isContextValue} from './ContextValue';
import {TriggerEvents, WorkflowTriggerEvent} from './TriggerEvent';
import sortKeys from './sortKeys';

declare const JobOutputsSymbol: unique symbol;
export interface JobReference<T> {
  name: string;
  [JobOutputsSymbol]?: T;
}

export type Steps<TStepOutput = unknown> = (context: JobContext) => TStepOutput;
export type Job<
  TJobOutput extends void | Record<string, Expression<any>> = void
> = ({
  jobName,
  setName,
  setMachineType,
  setContainer,
  setEnv,
  setTimeout,
  continueOnError,
  setBuildMatrix,
  addService,
  addDependencies,
  add,
  run,
  use,
  when,
  whenTrigger,
}: JobContext) => TJobOutput;

export interface RunStepOptions {
  jsonOutputs?: boolean;
  workingDirectory?: string;
  shell?: 'bash' | 'pwsh' | 'python' | 'sh' | 'cmd' | 'powershell';
  env?: {[key: string]: Expression<unknown> | undefined};
  continueOnError?: Expression<boolean>;
  timeoutMinutes?: Expression<number>;
}
export interface UseStepOptions {
  jsonOutputs?: boolean;
  with?: {[key: string]: Expression<unknown> | undefined};
  env?: {[key: string]: Expression<unknown> | undefined};
  continueOnError?: Expression<boolean>;
  timeoutMinutes?: Expression<number>;
}
export type JobPermissions =
  | 'read-all'
  | 'write-all'
  | {
      actions?: 'read' | 'write' | 'none';
      checks?: 'read' | 'write' | 'none';
      contents?: 'read' | 'write' | 'none';
      deployments?: 'read' | 'write' | 'none';
      'id-token'?: 'read' | 'write' | 'none';
      issues?: 'read' | 'write' | 'none';
      discussions?: 'read' | 'write' | 'none';
      packages?: 'read' | 'write' | 'none';
      pages?: 'read' | 'write' | 'none';
      'pull-requests'?: 'read' | 'write' | 'none';
      'repository-projects'?: 'read' | 'write' | 'none';
      'security-events'?: 'read' | 'write' | 'none';
      statuses?: 'read' | 'write' | 'none';
    };
export interface JobContext {
  readonly jobName: string;

  setName(name: string): void;
  setMachineType(
    label:
      | 'ubuntu-latest'
      | 'ubuntu-18.04'
      | 'ubuntu-20.04'
      | 'ubuntu-16.04'
      | 'macos-11.0'
      | 'macos-latest'
      | 'macos-10.15'
      | 'windows-latest'
      | 'windows-2019'
      | string,
  ): void;
  setPermissions(permissions: JobPermissions): void;
  setContainer(container: {
    image: Expression<string>;
    env?: {[key in string]?: Expression<string>};
    [key: string]: any;
  }): void;
  setEnv(name: string, value: Expression<string>): void;
  /**
   * Defaults to 360
   */
  setTimeout(minutes: number): void;
  continueOnError(): void;

  setBuildMatrix<
    T extends Record<string, string[]>,
    TIncludeKeys extends string = Extract<keyof T, string>
  >(
    matrix: T,
    options?: {
      include?: {[key in TIncludeKeys]?: string}[];
      exclude?: {[key in keyof T]?: string}[];
      failFast?: boolean;
      maxParallel?: number;
    },
  ): ContextValue<{[key in TIncludeKeys | keyof T]: string}>;

  addService(config: {
    image: Expression<string>;
    name?: string;
    ports?: Expression<string>[];
    credentials?: {username: Expression<string>; password: Expression<string>};
    env?: {[key in string]?: Expression<string>};
    volumes?: Expression<string>[];
    options?: any;
  }): void;

  addDependencies<TJobOutputs>(
    job: JobReference<TJobOutputs>,
    ...jobs: JobReference<unknown>[]
  ): ContextValue<NeedsJobContext<TJobOutputs>>;
  addDependencies(...jobs: JobReference<unknown>[]): unknown;

  add<TStepOutput>(step: Steps<TStepOutput>): TStepOutput;

  run<TStepOutput = {}>(
    script: Expression<string>,
    options?: RunStepOptions,
  ): ContextValue<StepContext<TStepOutput>>;
  run<TStepOutput = {}>(
    stepName: string,
    script: Expression<string>,
    options?: RunStepOptions,
  ): ContextValue<StepContext<TStepOutput>>;
  use<TStepOutput = {}>(
    actionName: string,
    options?: UseStepOptions,
  ): ContextValue<StepContext<TStepOutput>>;
  use<TStepOutput = {}>(
    stepName: string,
    actionName: string,
    options?: UseStepOptions,
  ): ContextValue<StepContext<TStepOutput>>;

  when<T>(condition: Expression<boolean>, fn: () => T): T;
  whenTrigger<TriggerName extends keyof TriggerEvents, T>(
    name: TriggerName,
    fn: (event: TriggerContext<TriggerName>) => T,
  ): T;
}

export interface WorkflowContext {
  setWorkflowName(name: string): void;

  addTrigger<TriggerName extends keyof TriggerEvents>(
    name: TriggerName,
    config?: TriggerEvents[TriggerName] extends WorkflowTriggerEvent<
      infer TConfig,
      any
    >
      ? TConfig
      : never,
  ): TriggerContext<TriggerName>;

  setPermissions(permissions: JobPermissions): void;

  addJob<TJobOutputs extends void | Record<string, Expression<any>>>(
    jobName: string,
    fn: Job<TJobOutputs>,
  ): JobReference<
    TJobOutputs extends Record<string, Expression<any>>
      ? {
          [key in keyof TJobOutputs]: TJobOutputs[key] extends Expression<
            infer T
          >
            ? T
            : unknown;
        }
      : void
  >;

  when<T>(condition: Expression<boolean>, fn: () => T): T;
  whenTrigger<TriggerName extends keyof TriggerEvents, T>(
    name: TriggerName,
    fn: (event: TriggerContext<TriggerName>) => T,
  ): T;
}

type TriggerContext<TriggerName extends keyof TriggerEvents> = ContextValue<
  TriggerEvents[TriggerName] extends WorkflowTriggerEvent<any, infer TContext>
    ? TContext
    : unknown
>;
function conditions() {
  const currentConditions: Expression<boolean>[] = [];
  return {
    currentCondition: (): {
      if?: Expression<boolean>;
    } => (currentConditions.length ? {if: and(...currentConditions)} : {}),
    conditionHelpers: {
      when<T>(condition: Expression<boolean>, fn: () => T): T {
        currentConditions.push(condition);
        try {
          return fn();
        } finally {
          currentConditions.pop();
        }
      },

      whenTrigger<TriggerName extends keyof TriggerEvents, T>(
        name: TriggerName,
        fn: (event: TriggerContext<TriggerName>) => T,
      ): T {
        currentConditions.push(eq(github.event_name, name));
        try {
          return fn(github.event as any);
        } finally {
          currentConditions.pop();
        }
      },
    },
  };
}

let creatingWorkflow = false;
export default function createWorkflow(
  fn: ({
    setWorkflowName,
    addTrigger,
    addJob,
    when,
    whenTrigger,
  }: WorkflowContext) => void,
): any {
  if (creatingWorkflow) {
    throw new Error('You can only create one workflow at a time.');
  }
  creatingWorkflow = true;
  try {
    const {
      currentCondition: currentWorkflowCondition,
      conditionHelpers,
    } = conditions();
    const workflow: any = {
      jobs: {},
    };
    fn({
      ...conditionHelpers,
      setWorkflowName(workflowName) {
        if (workflow.name) {
          throw new Error('You cannot set the workflow name multiple times.');
        }
        workflow.name = workflowName;
      },
      addTrigger(name, config) {
        if (!workflow.on) {
          workflow.on = {};
        }
        if (workflow.on[name] !== undefined) {
          throw new Error(
            `Cannot specify the "${name}" trigger multiple times.`,
          );
        }
        workflow.on[name] = config ?? null;
        return github.event as any;
      },
      setPermissions(permissions) {
        workflow.permissions = permissions;
      },
      addJob(jobName, fn) {
        const {
          currentCondition: currentJobCondition,
          conditionHelpers,
        } = conditions();
        let nextServiceID = 1;
        let nextStepID = 1;
        let hasSetRunsOn = false;
        const job: any = {
          ...currentWorkflowCondition(),
          'runs-on': 'ubuntu-latest',
          steps: [],
        };
        const jobContext: JobContext = {
          ...conditionHelpers,
          get jobName() {
            return job.name ?? jobName;
          },
          setName(jobName) {
            if (job.name) {
              throw new Error('You cannot set the job name multiple times.');
            }
            job.name = jobName;
          },
          setMachineType(machineType) {
            if (hasSetRunsOn) {
              throw new Error(
                'You cannot set the machine type multiple times.',
              );
            }
            hasSetRunsOn = true;
            job['runs-on'] = machineType;
          },
          setPermissions(permissions) {
            job.permissions = permissions;
          },
          setContainer(container) {
            if (job.container) {
              throw new Error(
                'You cannot set the job container multiple times.',
              );
            }
            job.container = container;
          },
          setEnv(name, value) {
            if (!job.env) {
              job.env = {};
            }
            job.env[name] = value;
          },
          setTimeout(timeoutMinutes) {
            if (job['timeout-minutes']) {
              throw new Error('You cannot set the job timeout multiple times.');
            }
            job['timeout-minutes'] = timeoutMinutes;
          },
          continueOnError() {
            if (job['continue-on-error']) {
              throw new Error(
                'You cannot set continue-on-error multiple times.',
              );
            }
            job['continue-on-error'] = true;
          },
          setBuildMatrix(matrixConfig, options = {}) {
            if (job.strategy) {
              throw new Error(
                `You cannot set the job's matrix multiple times.`,
              );
            }
            job.strategy = {
              matrix: {
                ...matrixConfig,
                ...optionalObject('include', options.include),
                ...optionalObject('exclude', options.exclude),
              },
              ...optionalObject('fail-fast', options.failFast),
              ...optionalObject('max-parallel', options.maxParallel),
            };
            return matrix as any;
          },
          addService({name = `service_${nextServiceID++}`, ...config}) {
            if (!job.services) {
              job.services = {};
            }
            job.services[name] = config;
          },
          addDependencies(...dependencies: readonly JobReference<unknown>[]) {
            if (!job.needs) job.needs = [];
            for (const {name} of dependencies) {
              job.needs.push(name);
            }
            return dependencies.length
              ? (needs[dependencies[0].name] as any)
              : undefined;
          },
          add(steps) {
            return steps(jobContext);
          },
          run: ((
            nameOrScript: string,
            scriptOrOptions?: Expression<string> | RunStepOptions,
            optionsOrUndefined?: RunStepOptions,
          ) => {
            const id = `step_${nextStepID++}`;
            const [name, script, options] =
              typeof scriptOrOptions === 'string' ||
              isComplexExpression(scriptOrOptions) ||
              isContextValue(scriptOrOptions)
                ? [nameOrScript, scriptOrOptions, optionsOrUndefined]
                : [undefined, nameOrScript, scriptOrOptions];
            const step: any = {
              ...optionalObject('name', name),
              ...currentJobCondition(),
              run: script,
              ...optionalObject('working-directory', options?.workingDirectory),
              ...optionalObject('shell', options?.shell),
              ...optionalObject('env', options?.env),
              ...optionalObject('continue-on-error', options?.continueOnError),
              ...optionalObject('timeout-minutes', options?.timeoutMinutes),
            };
            job.steps.push(step);
            return createContextValue([`steps`, id], {
              jsonDepth: options?.jsonOutputs ? 4 : undefined,
              onAccess: () => {
                step.id = id;
              },
            });
          }) as any,
          use: ((
            nameOrScript: string,
            scriptOrOptions?: string | UseStepOptions,
            optionsOrUndefined?: UseStepOptions,
          ) => {
            const id = `step_${nextStepID++}`;
            const [name, uses, options] =
              typeof scriptOrOptions === 'string'
                ? [nameOrScript, scriptOrOptions, optionsOrUndefined]
                : [undefined, nameOrScript, scriptOrOptions];
            const step: any = {
              ...optionalObject('name', name),
              ...currentJobCondition(),
              uses,
              ...optionalObject('with', options?.with),
              ...optionalObject('env', options?.env),
              ...optionalObject('continue-on-error', options?.continueOnError),
              ...optionalObject('timeout-minutes', options?.timeoutMinutes),
            };
            job.steps.push(step);
            return createContextValue([`steps`, id], {
              jsonDepth: options?.jsonOutputs ? 4 : undefined,
              onAccess: () => {
                step.id = id;
              },
            });
          }) as any,
        };
        const outputs = fn(jobContext);
        if (
          outputs &&
          Object.values(outputs as any).some((o) => o !== undefined)
        ) {
          job.outputs = Object.fromEntries(
            Object.entries(outputs as any)
              .filter(([, value]) => value !== undefined)
              .map(([key, value]) => [key, toJSON(value as any)]),
          );
        }
        workflow.jobs[jobName] = sortKeys(job, [
          'name',
          'needs',
          'runs-on',
          'env',
          'defaults',
          'if',
          'timeout-minutes',
          'strategy',
          'continue-on-error',
          'container',
          'services',
          'steps',
          'outputs',
        ]);
        return {name: jobName};
      },
    });
    const w = sortKeys(workflow, ['name', 'on', 'env', 'deults', 'jobs']);
    // We need to stringify the workflow to generate all necessary step IDs
    // The first pass at stringifying won't have all IDs initialized, but future
    // stringifies will.
    JSON.stringify(w);
    return w;
  } finally {
    creatingWorkflow = false;
  }
}

function optionalObject(key: string, obj: undefined | any) {
  if (obj === undefined) {
    return {};
  }

  if (
    typeof obj !== 'object' ||
    obj === null ||
    isContextValue(obj) ||
    isComplexExpression(obj)
  ) {
    return {[key]: obj};
  }

  if (!Object.values(obj).some((v) => v !== undefined)) {
    return {};
  }

  return {
    [key]: Object.fromEntries(
      Object.entries(obj).filter(([_key, value]) => value !== undefined),
    ),
  };
}
