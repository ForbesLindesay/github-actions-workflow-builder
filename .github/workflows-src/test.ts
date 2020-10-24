import createWorkflow, {Job, Steps} from '../../';
import {
  job,
  steps,
  runner,
  strategy,
  matrix,
  secrets,
  github,
} from '../../context';
import {
  eq,
  Expression,
  hashFiles,
  interpolate,
  neq,
  toJSON,
} from '../../expression';

export function yarnInstallWithCache(nodeVersion: Expression<string>): Steps {
  return ({use, run, when}) => {
    const {
      outputs: {'cache-hit': cacheHit},
    } = use<{'cache-hit': 'true' | null}>('Enable Cache', 'actions/cache@v2', {
      with: {
        path: 'node_modules',
        key: interpolate`${runner.os}-${nodeVersion}-${hashFiles(
          'package.json',
          'yarn.lock',
        )}`,
      },
    });

    when(neq(cacheHit, 'true'), () => {
      run('yarn install --frozen-lockfile');
    });
  };
}
export const TEST_JOB: Job = ({setBuildMatrix, add, use, run, when}) => {
  const nodeVersion = setBuildMatrix({
    'node-version': ['10.x', '12.x', '14.x'],
  })['node-version'];

  use('actions/checkout@v2');
  use('actions/setup-node@v1', {with: {'node-version': nodeVersion}});

  add(yarnInstallWithCache(nodeVersion));

  run('yarn build');

  function dumpContext(name: string, context: Expression<unknown>) {
    run(`Dump ${name} context`, `echo $${name.toUpperCase()}_CONTEXT`, {
      env: {[`${name.toUpperCase()}_CONTEXT`]: toJSON(context)},
    });
  }
  dumpContext('job', job);
  dumpContext('steps', steps);
  dumpContext('runner', runner);
  dumpContext('strategy', strategy);
  dumpContext('matrix', matrix);

  when(eq(github.event_name, 'push'), () => {
    run('npx rollingversions publish --dry-run', {
      env: {
        GITHUB_TOKEN: secrets.GITHUB_TOKEN,
        NODE_AUTH_TOKEN: secrets.NPM_TOKEN,
      },
    });
  });
};
export default createWorkflow(({setWorkflowName, addTrigger, addJob}) => {
  setWorkflowName('Test');

  addTrigger('push', {branches: ['master']});
  addTrigger('pull_request', {branches: ['master']});

  addJob('test', TEST_JOB);
});
