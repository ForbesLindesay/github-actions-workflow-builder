import {writeFileSync, readFileSync} from 'fs';
import {stringify} from 'yaml';

function tryReadFileSync(filename: string) {
  try {
    return readFileSync(filename, 'utf8');
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
    return null;
  }
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
  const yamlSource = `# !!! This file is auto-generated, do not edit by hand !!!\n# To make changes, edit ${originalFilename} and then run:\n#\n#   ${command}"\n\n${stringify(
    object,
  )}`;

  if (tryReadFileSync(filename) !== yamlSource) {
    if (!dryRun) {
      writeFileSync(filename, yamlSource);
    }
    return true;
  } else {
    return false;
  }
}
