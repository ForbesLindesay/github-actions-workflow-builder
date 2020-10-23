import createWorkflow from '../../';
import {env, job, steps, runner, needs, strategy, matrix} from '../../context';
import {Expression, toJSON} from '../../expression';

export default createWorkflow(({setWorkflowName, addTrigger, addJob}) => {
  setWorkflowName('Test');

  addTrigger('push', {branches: ['master']});
  addTrigger('pull_request', {branches: ['master']});

  addJob('test', ({setBuildMatrix, use, run}) => {
    const nodeVersion = setBuildMatrix({
      'node-version': ['10.x', '12.x', '14.x'],
    })['node-version'];

    use('actions/checkout@v2');
    use('actions/setup-node@v1', {with: {'node-version': nodeVersion}});
    run('yarn install --frozen-lockfile');
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
