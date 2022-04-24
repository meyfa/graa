import { GraaOctokit, RepoOfAuthenticatedUser } from './types.js'

export interface FileChange {
  fileBlobSha: string
  path: string
  content: string
}

export interface PullRequestMetadata {
  branch: string
  parentCommitSha: string
  subject: string
  comment: string
}

export interface PullRequestResult {
  webUrl: string
}

export async function createPrToUpdateFile (octokit: GraaOctokit, repo: RepoOfAuthenticatedUser, change: FileChange, meta: PullRequestMetadata): Promise<PullRequestResult> {
  await octokit.rest.git.createRef({
    owner: repo.owner.login,
    repo: repo.name,
    ref: `refs/heads/${meta.branch}`,
    sha: meta.parentCommitSha
  })

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: repo.owner.login,
    repo: repo.name,
    branch: meta.branch,
    path: change.path,
    sha: change.fileBlobSha,
    content: Buffer.from(change.content, 'utf8').toString('base64'),
    message: meta.subject
  })

  const pr = await octokit.rest.pulls.create({
    owner: repo.owner.login,
    repo: repo.name,
    title: meta.subject,
    body: meta.comment,
    head: meta.branch,
    base: repo.default_branch
  })

  return {
    webUrl: pr.data._links.html.href
  }
}
