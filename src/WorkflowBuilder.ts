import {github, matrix, needs, NeedsJobContext, StepContext} from './context';
import {and, ContextValue, eq, Expression} from './expression';
import createContextValue from './ContextValue';
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
  workingDirectory?: string;
  shell?: 'bash' | 'pwsh' | 'python' | 'sh' | 'cmd' | 'powershell';
  env?: {[key: string]: Expression<unknown>};
  continueOnError?: Expression<boolean>;
  timeoutMinutes?: Expression<number>;
}
export interface UseStepOptions {
  with?: {[key: string]: Expression<unknown>};
  env?: {[key: string]: Expression<unknown>};
  continueOnError?: Expression<boolean>;
  timeoutMinutes?: Expression<number>;
}
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
  setContainer(container: {
    image: Expression<'string'>;
    env?: {[key in string]?: Expression<'string'>};
    [key: string]: any;
  }): void;
  setEnv(name: string, value: Expression<'string'>): void;
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
    env?: {[key in string]?: Expression<'string'>};
    volumes?: Expression<'string'>[];
    options?: any;
  }): void;

  addDependencies<TJobOutputs>(
    job: JobReference<TJobOutputs>,
    ...jobs: JobReference<unknown>[]
  ): ContextValue<NeedsJobContext<TJobOutputs>>;

  add<TStepOutput>(step: Steps<TStepOutput>): TStepOutput;

  run<TStepOutput>(
    script: string,
    options?: RunStepOptions,
  ): ContextValue<StepContext<TStepOutput>>;
  run<TStepOutput = {}>(
    stepName: string,
    script: string,
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
                ...(options.include ? {include: options.include} : {}),
                ...(options.exclude ? {exclude: options.exclude} : {}),
              },
              ...(options.failFast ? {'fail-fast': options.failFast} : {}),
              ...(options.maxParallel
                ? {'max-parallel': options.maxParallel}
                : {}),
            };
            return matrix as any;
          },
          addService({name = `service_${nextServiceID++}`, ...config}) {
            if (!job.services) {
              job.services = {};
            }
            job.services[name] = config;
          },
          addDependencies(dependency, ...otherDependencies) {
            if (!job.needs) job.needs = [];
            job.needs.push(dependency.name);
            for (const {name} of otherDependencies) {
              job.needs.push(name);
            }
            return needs[dependency.name] as any;
          },
          add(steps) {
            return steps(jobContext);
          },
          run: ((
            nameOrScript: string,
            scriptOrOptions?: string | RunStepOptions,
            optionsOrUndefined?: RunStepOptions,
          ) => {
            const id = `step_${nextStepID++}`;
            const [name, script, options] =
              typeof scriptOrOptions === 'string'
                ? [nameOrScript, scriptOrOptions, optionsOrUndefined]
                : [undefined, nameOrScript, scriptOrOptions];
            const step: any = {
              ...(name ? {name} : {}),
              ...currentJobCondition(),
              run: script,
              ...(options?.workingDirectory
                ? {'working-directory': options.workingDirectory}
                : {}),
              ...(options?.shell ? {shell: options.shell} : {}),
              ...(options?.env ? {env: options.env} : {}),
              ...(options?.continueOnError
                ? {'continue-on-error': options.continueOnError}
                : {}),
              ...(options?.timeoutMinutes
                ? {'timeout-minutes': options.timeoutMinutes}
                : {}),
            };
            job.steps.push(step);
            return createContextValue(`steps.${id}`, () => {
              step.id = id;
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
              ...(name ? {name} : {}),
              ...currentJobCondition(),
              uses,
              ...(options?.with ? {with: options.with} : {}),
              ...(options?.env ? {env: options.env} : {}),
              ...(options?.continueOnError
                ? {'continue-on-error': options.continueOnError}
                : {}),
              ...(options?.timeoutMinutes
                ? {'timeout-minutes': options.timeoutMinutes}
                : {}),
            };
            job.steps.push(step);
            return createContextValue(`steps.${id}`, () => {
              step.id = id;
            });
          }) as any,
        };
        const outputs = fn(jobContext);
        if (outputs) {
          job.outputs = outputs;
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
    return sortKeys(workflow, ['name', 'on', 'env', 'deults', 'jobs']);
  } finally {
    creatingWorkflow = false;
  }
}
