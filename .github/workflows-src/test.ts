import createWorkflow, {Job, Steps} from '../../';
import {cache, checkout, setupNode} from '../../actions';
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
  return ({add, use, run, when}) => {
    const {cacheMiss} = add(
      cache({
        key: interpolate`${runner.os}-${nodeVersion}-${hashFiles(
          'package.json',
          'yarn.lock',
        )}`,
        paths: ['node_modules'],
      }),
    );

    when(cacheMiss, () => {
      run('yarn install --frozen-lockfile');
    });
  };
}
export const TEST_JOB: Job = ({setBuildMatrix, add, use, run, when}) => {
  const nodeVersion = setBuildMatrix({
    'node-version': ['10.x', '12.x', '14.x'],
  })['node-version'];

  add(checkout());
  add(
    setupNode({
      nodeVersion: nodeVersion,
      registryUrl: 'https://registry.npmjs.org',
    }),
  );

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
