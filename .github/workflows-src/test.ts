import createWorkflow from '../../';
import {env, job, steps, runner, needs, strategy, matrix} from '../../context';
import {
  Expression,
  hashFiles,
  interpolate,
  neq,
  toJSON,
} from '../../expression';

export default createWorkflow(({setWorkflowName, addTrigger, addJob}) => {
  setWorkflowName('Test');

  addTrigger('push', {branches: ['master']});
  addTrigger('pull_request', {branches: ['master']});

  addJob('test', ({setBuildMatrix, use, run, when}) => {
    const nodeVersion = setBuildMatrix({
      'node-version': ['10.x', '12.x', '14.x'],
    })['node-version'];

    use('actions/checkout@v2');
    use('actions/setup-node@v1', {with: {'node-version': nodeVersion}});

    const {
      outputs: {'cache-hit': cacheHit},
    } = use<{'cache-hit': 'true' | 'false'}>(
      'Enable Cache',
      'actions/cache@v2',
      {
        with: {
          path: 'node_modules',
          key: interpolate`${runner.os}-${nodeVersion}-${hashFiles(
            'package.json',
            'yarn.lock',
          )}`,
        },
      },
    );

    when(neq(cacheHit, 'true'), () => {
      run('yarn install --frozen-lockfile');
    });

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
  });
});
