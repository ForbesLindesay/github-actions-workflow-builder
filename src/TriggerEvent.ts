export interface User {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}
export interface Organization {
  login: string;
  id: number;
  node_id: string;
  url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issues_url: string;
  members_url: string;
  public_members_url: string;
  avatar_url: string;
  description: string;
}
export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  html_url: string;
  description: null;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: null | string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  forks_count: number;
  mirror_url: null | string;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: null | string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
}

export interface PullRequest {
  url: string;
  id: number;
  node_id: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  issue_url: string;
  number: 2;
  state: 'open' | 'closed';
  locked: boolean;
  title: string;
  user: User;
  body: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged: boolean;
  merged_at: string | null;
  merge_commit_sha: string | null;
  commits_url: string;
  review_comments_url: string;
  review_comment_url: string;
  comments_url: string;
  statuses_url: string;
  base: {
    ref: string
  }
  // TODO: way more stuff goes here
}

export interface Release {
  html_url: string;
  tarball_url: string;
  zipball_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: User;
  assets: {
    url: string;
    browser_download_url: string;
    id: number;
    node_id: string;
    name: string;
    content_type: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    uploader: User;
  }[];
}

export type WorkflowTriggerEvent<TConfig, TPayload> = (
  config: TConfig,
) => TPayload;

export interface TriggerEvents {
  schedule: WorkflowTriggerEvent<[{cron: string}, ...{cron: string}[]], {}>;
  workflow_dispatch: WorkflowTriggerEvent<
    {
      inputs: {
        [name: string]: {
          description?: string;
          required: boolean;
          default?: string;
        };
      };
    },
    {
      inputs: {[name: string]: string};
      repository: Repository;
      organization: Organization;
      sender: User;
    }
  >;
  repository_dispatch: WorkflowTriggerEvent<
    {
      types: string[];
    },
    {
      client_payload: {[name: string]: string};
      repository: Repository;
      organization: Organization;
      sender: User;
      installation: {id: number; node_id: string};
    }
  >;

  check_run: WorkflowTriggerEvent<
    {
      types: ('created' | 'rerequested' | 'completed' | 'requested_action')[];
    },
    {
      action: 'created' | 'completed' | 'requested' | 'requested_action';
      check_run: {
        status: 'queued' | 'in_progress' | 'completed';
        conclusion:
          | null
          | 'success'
          | 'failure'
          | 'neutral'
          | 'cancelled'
          | 'timed_out'
          | 'action_required'
          | 'stale';
        name: string;
        check_suite: {id: number};
      };
      requested_action: {
        identifier: string;
      };
      repository: Repository;
      organization: Organization;
    }
  >;
  check_suite: WorkflowTriggerEvent<
    {
      types: ('completed' | 'requested' | 'rerequested')[];
    },
    unknown
  >;
  create: WorkflowTriggerEvent<unknown, unknown>;
  delete: WorkflowTriggerEvent<unknown, unknown>;
  deployment: WorkflowTriggerEvent<unknown, unknown>;
  deployment_status: WorkflowTriggerEvent<unknown, unknown>;
  fork: WorkflowTriggerEvent<unknown, unknown>;
  gollum: WorkflowTriggerEvent<unknown, unknown>;
  issue_comment: WorkflowTriggerEvent<unknown, unknown>;
  issues: WorkflowTriggerEvent<unknown, unknown>;
  label: WorkflowTriggerEvent<unknown, unknown>;
  milestone: WorkflowTriggerEvent<unknown, unknown>;
  page_build: WorkflowTriggerEvent<unknown, unknown>;
  project: WorkflowTriggerEvent<unknown, unknown>;
  project_card: WorkflowTriggerEvent<unknown, unknown>;
  project_column: WorkflowTriggerEvent<unknown, unknown>;
  public: WorkflowTriggerEvent<unknown, unknown>;
  pull_request: WorkflowTriggerEvent<
    {
      types?: (
        | 'assigned'
        | 'unassigned'
        | 'labeled'
        | 'unlabeled'
        | 'opened'
        | 'edited'
        | 'closed'
        | 'reopened'
        | 'synchronize'
        | 'ready_for_review'
        | 'locked'
        | 'unlocked'
        | 'review_requested'
        | 'review_request_removed'
      )[];
      branches?: string[];
      'branches-ignore'?: string[];
      tags?: string[];
      'tags-ignore'?: string[];
      paths?: string[];
      'paths-ignore'?: string[];
    },
    {
      action:
        | 'opened'
        | 'edited'
        | 'closed'
        | 'assigned'
        | 'unassigned'
        | 'review_requested'
        | 'review_request_removed'
        | 'ready_for_review'
        | 'labeled'
        | 'unlabeled'
        | 'synchronize'
        | 'locked'
        | 'unlocked'
        | 'reopened';
      number: number;
      pull_request: PullRequest;
      repository: Repository;
      organization: Organization;
      sender: User;
    }
  >;
  pull_request_review: WorkflowTriggerEvent<unknown, unknown>;
  pull_request_review_comment: WorkflowTriggerEvent<unknown, unknown>;
  pull_request_target: WorkflowTriggerEvent<unknown, unknown>;
  push: WorkflowTriggerEvent<
    {
      branches?: string[];
      'branches-ignore'?: string[];
      tags?: string[];
      'tags-ignore'?: string[];
      paths?: string[];
      'paths-ignore'?: string[];
    },
    {
      // The webhook payload available to GitHub Actions does not include the added, removed, and modified attributes in the commit object.
      ref: string;
      before: string;
      after: string;
      commits: {
        id: string;
        timestamp: string;
        message: string;
        author: {name: string; email: string; url: string};
      }[];
      pusher: User;
      repository: Repository;
      organization: Organization;
      sender: User;
    }
  >;
  registry_package: WorkflowTriggerEvent<unknown, unknown>;
  release: WorkflowTriggerEvent<
    {
      types: (
        | 'published'
        | 'unpublished'
        | 'created'
        | 'edited'
        | 'deleted'
        | 'prereleased'
        | 'released'
      )[];
    },
    {
      action:
        | 'published'
        | 'unpublished'
        | 'created'
        | 'edited'
        | 'deleted'
        | 'prereleased'
        | 'released';
      release: Release;
      repository: Repository;
      organization: Organization;
      sender: User;
    }
  >;
  status: WorkflowTriggerEvent<unknown, unknown>;
  watch: WorkflowTriggerEvent<unknown, unknown>;
  workflow_run: WorkflowTriggerEvent<unknown, unknown>;
}
