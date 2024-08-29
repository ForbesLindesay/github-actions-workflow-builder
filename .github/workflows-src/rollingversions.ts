import createWorkflow from '../../lib';
import {secrets} from '../../lib/context';
import {TEST_JOB, yarnInstallWithCache} from './test';

export default createWorkflow(({setWorkflowName, addTrigger, addJob}) => {
  setWorkflowName('Release');

  addTrigger('repository_dispatch', {
    types: ['rollingversions_publish_approved'],
  });

  const testJob = addJob('test', TEST_JOB);

  addJob('publish', ({addDependencies, add, run, use}) => {
    addDependencies(testJob);
    use('actions/checkout@v4');
    use('actions/setup-node@v1', {
      with: {
        'node-version': '12.x',
        'registry-url': 'https://registry.npmjs.org',
      },
    });
    add(yarnInstallWithCache('12.x'));
    run('yarn build');
    run('npx rollingversions publish', {
      env: {
        GITHUB_TOKEN: secrets.GITHUB_TOKEN,
        NODE_AUTH_TOKEN: secrets.NPM_TOKEN,
      },
    });
  });
});
