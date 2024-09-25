import {generateYamlString} from './writeYamlFile';

test('generateYamlString', () => {
  const VERSIONS = [1, 2, 3, 4, 5];
  expect(
    generateYamlString(
      {
        a: VERSIONS,
        b: VERSIONS,
      },
      {originalFilename: 'input.ts', command: 'generate-output'},
    ),
  ).toMatchInlineSnapshot(`
    "# !!! This file is auto-generated, do not edit by hand !!!
    # To make changes, edit input.ts and then run:
    #
    #   generate-output

    a:
      - 1
      - 2
      - 3
      - 4
      - 5
    b:
      - 1
      - 2
      - 3
      - 4
      - 5
    "
  `);
});
