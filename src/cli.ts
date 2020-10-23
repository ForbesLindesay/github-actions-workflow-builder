#! /usr/bin/env node

import 'sucrase/register';
import {statSync, readdirSync, unlinkSync} from 'fs';
import {join, relative, resolve} from 'path';
import {startChain, param, parse} from 'parameter-reducers';
import {writeYamlFile} from './';

const parser = startChain()
  .addParam(param.flag(['-c', '--check'], 'check'))
  .addParam(param.flag(['-C', '--cleanup'], 'cleanup'))
  .addParam(param.string(['-d', '--directory'], 'directory'));

const {check = false, cleanup = false, directory} = parse(
  parser,
  process.argv.slice(2),
).extract();

if (!directory) {
  console.error('You must specify the source directory for your workflows:');
  console.error('');
  console.error(
    '  github-actions-workflow-builder --directory .github/workflows-src',
  );
  process.exit(1);
}

const sourceDirectory = resolve(directory);
const outputDirectory = resolve(`.github/workflows`);

const workflows = [];
for (const fullFilename of expandDirectories(sourceDirectory)) {
  if (!/\.ts$/.test(fullFilename)) {
    continue;
  }
  const yamlFile = resolve(
    outputDirectory,
    relative(sourceDirectory, fullFilename)
      .replace(/\\|\//g, '_')
      .replace(/\.ts$/, '.yml'),
  );
  const workflow = require(fullFilename).default;
  if (writeYamlFile(yamlFile, workflow, {dryRun: check}) && check) {
    console.error(
      'Your github actions workflows are out of date. Run github-actions-workflow-builder to update them.',
    );
    process.exit(1);
  }
  workflows.push(yamlFile);
}

if (cleanup) {
  for (const filename of readdirSync(outputDirectory)) {
    const fullFilename = join(outputDirectory, filename);
    if (/\.yml$/.test(fullFilename) && !workflows.includes(fullFilename)) {
      if (check) {
        console.error(
          'Your github actions workflows are out of date. Run github-actions-workflow-builder to update them.',
        );
        process.exit(1);
      } else {
        unlinkSync(fullFilename);
      }
    }
  }
}

function expandDirectories(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path)
      .sort()
      .filter((entry) => entry[0] !== '_')
      .flatMap((entry) => expandDirectories(join(path, entry)));
  }
  return [path];
}
