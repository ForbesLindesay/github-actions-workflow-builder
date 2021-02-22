import {secrets} from './context';
import {eq, Expression, joinStrings, neq} from './expression';
import {Steps} from './WorkflowBuilder';

export interface CheckoutOptions {
  stepName?: string;
  repository?: Expression<string>;
  ref?: Expression<string>;
  token?: Expression<string>;
  sshKey?: Expression<string>;
  sshKnownHosts?: Expression<string>;
  sshStrict?: Expression<boolean>;
  persistCredentials?: Expression<boolean>;
  path?: Expression<string>;
  clean?: Expression<boolean>;
  fetchDepth?: Expression<number>;
  lfs?: Expression<boolean>;
  submodules?: Expression<boolean>;
}
export function checkout(options: CheckoutOptions = {}): Steps {
  return ({use}) => {
    use(options.stepName || 'Git Checkout', 'actions/checkout@v2', {
      with: {
        repository: options.repository,
        ref: options.ref,
        token: options.token,
        'ssh-key': options.sshKey,
        'ssh-known-hosts': options.sshKnownHosts,
        'ssh-strict': options.sshStrict,
        'persist-credentials': options.persistCredentials,
        path: options.path,
        clean: options.clean,
        'fetch-depth': options.fetchDepth,
        lfs: options.lfs,
        submodules: options.submodules,
      },
    });
  };
}

export interface SetupNodeOptions {
  stepName?: string;
  alwaysAuth?: Expression<boolean>;
  nodeVersion?: Expression<string>;
  architecture?: Expression<string>;
  checkLatest?: Expression<boolean>;
  registryUrl?: Expression<string>;
  scope?: Expression<string>;
  token?: Expression<string>;
}
export function setupNode(options: SetupNodeOptions = {}): Steps {
  return ({use}) => {
    use(options.stepName || 'Setup Node', 'actions/setup-node@v2', {
      with: {
        'always-auth': options.alwaysAuth,
        'node-version': options.nodeVersion,
        architecture: options.architecture,
        'check-latest': options.checkLatest,
        'registry-url': options.registryUrl,
        scope: options.scope,
        token: options.token,
      },
    });
  };
}

export interface CacheOptions {
  stepName?: string;
  paths: Expression<string>[];
  key: Expression<string>;
  restoreKeys?: Expression<string>[];
}
export function cache({
  stepName,
  key,
  paths,
  restoreKeys,
}: CacheOptions): Steps<{
  cacheHit: Expression<boolean>;
  cacheMiss: Expression<boolean>;
}> {
  return ({use}) => {
    const {outputs} = use<{'cache-hit': string}>(
      stepName || 'Enable Cache',
      'actions/cache@v2',
      {
        with: {
          key,
          path: joinStrings(paths, '\n'),
          'restore-keys': restoreKeys && joinStrings(restoreKeys, '\n'),
        },
      },
    );
    return {
      cacheHit: eq(outputs['cache-hit'], 'true'),
      cacheMiss: neq(outputs['cache-hit'], 'true'),
    };
  };
}

export interface UploadArtifactOptions {
  stepName?: string;
  name: Expression<string>;
  paths: Expression<string>[];
  ifNoFound?: Expression<'warn' | 'error' | 'ignore'>;
  retentionDays?: Expression<number>;
}
export function uploadArtifact(
  options: UploadArtifactOptions,
): Steps<{name: Expression<string>}> {
  return ({use}) => {
    use(options.stepName || 'Upload Artifact', 'actions/upload-artifact@v2', {
      with: {
        name: options.name,
        path: joinStrings(options.paths, '\n'),
        'if-no-files-found': options.ifNoFound,
        'retention-days': options.retentionDays,
      },
    });
    return {name: options.name};
  };
}

export interface DownloadArtifactOptions {
  stepName?: string;
  name: Expression<string>;
  path: Expression<string>;
}
export function downloadArtifact(options: DownloadArtifactOptions): Steps {
  return ({use}) => {
    use(
      options.stepName || 'Download Artifact',
      'actions/download-artifact@v2',
      {
        with: {
          name: options.name,
          path: options.path,
        },
      },
    );
  };
}

interface TurnstyleOptions {
  stepName?: string;
  pollIntervalSeconds: Expression<number>;
  sameBranchOnly: Expression<boolean>;
}
export function turnstyle(options: TurnstyleOptions): Steps {
  return ({use}) => {
    use(options.stepName || 'Turnstyle', 'softprops/turnstyle@v1', {
      with: {
        'poll-interval-seconds': options.pollIntervalSeconds,
        'same-branch-only': options.sameBranchOnly,
      },
      env: {GITHUB_TOKEN: secrets.GITHUB_TOKEN},
    });
  };
}

export interface SlackNotifyBuildOptons {
  stepName?: string;
  slackBotToken: Expression<string>;
  channel: Expression<string>;
  status: Expression<string>; // Just a string to display, e.g. "STARTED" or "DEPLOYED"
  color: Expression<'good' | 'warning' | 'danger' | string>; // can be any hex colour
  existingMessageID?: Expression<string>;
  continueOnError?: boolean;
  timeoutMinutes?: number;
}
export function slackNotifyBuild(
  options: SlackNotifyBuildOptons,
): Steps<{messageID: Expression<string>}> {
  return ({use}) => {
    const {outputs} = use<{message_id: string}>(
      options.stepName || 'Post to Slack',
      'voxmedia/github-action-slack-notify-build@v1',
      {
        with: {
          status: options.status,
          channel_id: options.channel,
          color: options.color === 'gray' ? '#cccccc' : options.color,
          ...(options.existingMessageID
            ? {message_id: options.existingMessageID}
            : {}),
        },
        env: {SLACK_BOT_TOKEN: options.slackBotToken},
        continueOnError: options.continueOnError,
        timeoutMinutes: options.timeoutMinutes,
      },
    );
    return {messageID: outputs.message_id};
  };
}

export interface AsanaCommentOptions {
  stepName?: string;
  asanaAccessToken: Expression<string>;
  taskComment: Expression<string>;
  env?: {[key: string]: Expression<string> | undefined};
  continueOnError?: boolean;
  timeoutMinutes?: number;
}
export function asanaComment(options: AsanaCommentOptions): Steps {
  return ({use}) => {
    use(
      options.stepName || 'Comment on Asana Task',
      'mavenoid/github-asana-action@4.0.0',
      {
        with: {
          'asana-pat': options.asanaAccessToken,
          'task-comment': options.taskComment,
        },
        env: options.env,
        continueOnError: options.continueOnError,
        timeoutMinutes: options.timeoutMinutes,
      },
    );
  };
}
