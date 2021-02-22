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
  always,
  eq,
  Expression,
  failure,
  hashFiles,
  interpolate,
  neq,
  success,
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
  use('actions/setup-node@v1', {
    with: {
      'node-version': nodeVersion,
      'registry-url': 'https://registry.npmjs.org',
    },
  });

  add(yarnInstallWithCache(nodeVersion));

  run('yarn build');

  function dumpContext(name: string, context: Expression<unknown>) {
    run(`Dump ${name} context`, `echo $${name.toUpperCase()}_CONTEXT`, {
      env: {[`${name.toUpperCase()}_CONTEXT`]: toJSON(context)},
    });
  }
  dumpContext('github_event', github.event);
  dumpContext('job', job);
  dumpContext('steps', steps);
  dumpContext('runner', runner);
  dumpContext('strategy', strategy);
  dumpContext('matrix', matrix);

  // sucess is the default, but failure replaces the default
  when(success(), () => {
    run(`Success`, `echo sucess`);
  });
  when(failure(), () => {
    run(`Failed`, `echo failed`);
  });
  when(always(), () => {
    run(`Always`, `echo always`);
  });

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
