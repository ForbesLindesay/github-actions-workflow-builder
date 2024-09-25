# github-actions-workflow-builder

Build workflows for GitHub Actions using TypeScript.

[![Build Status](https://img.shields.io/github/actions/workflow/status/ForbesLindesay/github-actions-workflow-builder/test.yml?branch=master&style=for-the-badge)](https://github.com/ForbesLindesay/github-actions-workflow-builder/actions?query=workflow%3ATest+branch%3Amaster)
[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen?style=for-the-badge)](https://rollingversions.com/ForbesLindesay/github-actions-workflow-builder)
[![NPM version](https://img.shields.io/npm/v/github-actions-workflow-builder?style=for-the-badge)](https://www.npmjs.com/package/github-actions-workflow-builder)

## Installation

```
yarn add github-actions-workflow-builder
```

## Usage

Put workflows in TypeScript files. See `.github/workflows-src` for some inspiration. Then run:

```
github-actions-workflow-builder --clean --directory .github/workflows-src
```
