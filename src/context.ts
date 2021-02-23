import createContextValue, {ContextValue} from './ContextValue';
import {TriggerEvents} from './TriggerEvent';

export type Result = 'success' | 'failure' | 'cancelled' | 'skipped';

export interface GitHubContext<
  WorkflowEventName = keyof TriggerEvents,
  WorkflowEvent = unknown
> {
  action: string;
  action_path: string;
  actor: string;
  /**
   * The base_ref or target branch of the pull request in a workflow run.
   * This property is only available when the event that triggers a workflow
   * run is a pull_request.
   */
  base_ref: string;
  event: WorkflowEvent;
  event_name: WorkflowEventName;
  event_path: string;
  /**
   * The head_ref or source branch of the pull request in a workflow run. This
   * property is only available when the event that triggers a workflow run is
   * a pull_request.
   */
  head_ref: string;
  job: string;
  ref: string;
  repository: string;
  repository_owner: string;
  run_id: string;
  run_number: string;
  sha: string;
  token: string;
  workflow: string;
  workspace: string;
}
export const github: ContextValue<GitHubContext> = createContextValue([
  'github',
]);

export interface EnvContext {
  [key: string]: string;
}
export const env: ContextValue<EnvContext> = createContextValue(['env']);

export interface JobContext {
  container: {
    id: string;
    network: string;
  };
  services: {
    [serviceID: string]: {id: string; network: string; ports: any};
  };
  status: 'success' | 'failure' | 'cancelled';
}
export const job: ContextValue<JobContext> = createContextValue(['job']);

export interface StepContext<TOutputs = {[key: string]: string}> {
  conclusion: Result;
  outcome: Result;
  outputs: TOutputs;
}
export interface StepsContext {
  [key: string]: StepContext;
}
export const steps: ContextValue<StepsContext> = createContextValue(['steps']);

export interface RunnerContext {
  os: 'Linux' | 'Windows' | 'macOS';
  temp: string;
  tool_cache: string;
}
export const runner: ContextValue<RunnerContext> = createContextValue([
  'runner',
]);

export interface NeedsJobContext<TOutputs = {}> {
  outputs: TOutputs;
  result: Result;
}
export interface Needs {
  [jobID: string]: {
    outputs: NeedsJobContext<{[key: string]: string}>;
    result: Result;
  };
}
export const needs: ContextValue<Needs> = createContextValue(['needs'], {
  jsonDepth: 4,
});

export interface SecretsContext {
  [key: string]: string;
}
export const secrets: ContextValue<SecretsContext> = createContextValue([
  'secrets',
]);

export interface StrategyContext {
  [key: string]: any;
}
export const strategy: ContextValue<StrategyContext> = createContextValue([
  'strategy',
]);

interface MatrixContext {
  [key: string]: string;
}
export const matrix: ContextValue<MatrixContext> = createContextValue([
  'matrix',
]);
