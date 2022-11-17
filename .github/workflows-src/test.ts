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
    'node-version': ['12.x', '14.x', '16.x', '18.x'],
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

  run(
    `Print node.js version`,
    interpolate`echo "node version = ${nodeVersion}"`,
  );

  run(
    `Print using nested interpolation`,
    interpolate`echo "${interpolate`node version = ${nodeVersion}`}"`,
  );

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
  const testOutputs = addJob('test_outputs', ({run}) => {
    const {outputs: s} = run<{true_output: string; false_output: string}>(
      'String Outputs',
      `echo "::set-output name=true_output::true" && echo "::set-output name=false_output::false"`,
    );
    const {outputs: j} = run<{true_output: boolean; false_output: boolean}>(
      'JSON Outputs',
      `echo "::set-output name=true_output::true" && echo "::set-output name=false_output::false"`,
      {jsonOutputs: true},
    );

    return {
      amazingString: '{{ something something }}',
      stringTrue: 'true',
      stringFalse: 'false',
      booleanTrue: eq('true', 'true'),
      booleanFalse: eq('false', 'true'),
      stringCmdTrue: s.true_output,
      stringCmdFalse: s.false_output,
      booleanCmdTrue: j.true_output,
      booleanCmdFalse: j.false_output,
    };
  });
  addJob('test_needs', ({run, addDependencies, when}) => {
    const {outputs} = addDependencies(testOutputs);
    run(interpolate`echo "${outputs.amazingString}"`);
    when(outputs.stringTrue as any, () => {
      run('echo "string true"');
    });
    when(outputs.stringFalse as any, () => {
      run('echo "string false"');
    });
    when(outputs.booleanTrue as any, () => {
      run('echo "boolean true"');
    });
    when(outputs.booleanFalse as any, () => {
      run('echo "boolean false"');
    });
    when(outputs.stringCmdTrue as any, () => {
      run('echo "string cmd true"');
    });
    when(outputs.stringCmdFalse as any, () => {
      run('echo "string cmd false"');
    });
    when(outputs.booleanCmdTrue as any, () => {
      run('echo "boolean cmd true"');
    });
    when(outputs.booleanCmdFalse as any, () => {
      run('echo "boolean cmd false"');
    });
    return {
      amazingString: outputs.amazingString,
      stringTrue: outputs.stringTrue,
      stringFalse: outputs.stringFalse,
      booleanTrue: outputs.booleanTrue,
      booleanFalse: outputs.booleanFalse,
    };
  });
});
