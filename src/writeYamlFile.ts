import {writeFileSync, readFileSync} from 'fs';
import {stringify} from 'yaml';

function tryReadFileSync(filename: string) {
  try {
    return readFileSync(filename, 'utf8');
  } catch (ex: any) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
    return null;
  }
}

export function generateYamlString(
  object: any,
  {originalFilename, command}: {originalFilename: string; command: string},
) {
  return `# !!! This file is auto-generated, do not edit by hand !!!\n# To make changes, edit ${originalFilename} and then run:\n#\n#   ${command}\n\n${stringify(
    object,
    {aliasDuplicateObjects: false},
  )}`;
}
export default function writeYamlFile(
  filename: string,
  object: any,
  {
    dryRun = false,
    originalFilename,
    command,
  }: {dryRun: boolean; originalFilename: string; command: string},
) {
  const yamlSource = generateYamlString(object, {originalFilename, command});

  if (tryReadFileSync(filename) !== yamlSource) {
    if (!dryRun) {
      writeFileSync(filename, yamlSource);
    }
    return true;
  } else {
    return false;
  }
}
