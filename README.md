# npm-package-template

A template for npm packages built in TypeScript

[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen)](https://rollingversions.com/ForbesLindesay/npm-package-template)


## Setting Up the New Repo

1. Hit "Use This Template" to create the repository
1. Enable [CircleCI](https://circleci.com/add-projects/gh/ForbesLindesay)
1. Enable [Change Log Version](https://changelogversion.com) using [My Change Log Version Installation](https://github.com/settings/installations/7328191)
1. In Settings
   1. Disable "Wikis"
   1. Disable "Projects"
   1. Disable "Allow merge commits"
   1. Disable "Allow rebase merging"
   1. Enable "Automatically delete head branches"
1. Create a new branch
1. Commit initial code to the branch (be sure to replace all refernces to npm-package-template, and remove these instructions from the README)
1. Push the new branch and create a PR
1. In Settings -> Branch Protection, create a new rule
   1. Use "master" as the branch name pattern
   1. Enable "Require status checks to pass before merging"
   1. Select the unit tests and changelog as required
   1. Enable "Include administrators"
   1. Enable "Restrict who can push to matching branches"
1. Merge the PR

## Installation

```
yarn add @forbeslindesay/npm-package-template
```

## Usage

```ts
import add from '@forbeslindesay/npm-package-template';

const result = add(2, 3);
// => 5
```
