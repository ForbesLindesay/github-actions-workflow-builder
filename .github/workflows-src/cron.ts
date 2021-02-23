import createWorkflow from '../../lib';
import {interpolate} from '../../lib/expression';

export default createWorkflow(({setWorkflowName, addTrigger, addJob}) => {
  setWorkflowName('CRON');

  addTrigger('schedule', [{cron: '0 18 * * *'}]);

  addJob('cron', ({run}) => {
    run(interpolate`echo "hello world"`);
  });
});
