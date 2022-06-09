import { GraaOctokit, RepoDetail } from './github/types.js'

export interface FileChange {
  fileBlobSha?: string
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

export async function searchExistingPr (octokit: GraaOctokit, repo: RepoDetail, branch: string): Promise<PullRequestResult | undefined> {
  const options = {
    q: `repo:${repo.full_name} is:pr is:open head:${branch}`
  } as const

  const search = await octokit.rest.search.issuesAndPullRequests(options)
  for (const result of search.data.items) {
    // safety check that we're actually dealing with an open pull request
    if (result.pull_request?.html_url != null && result.state === 'open') {
      return {
        webUrl: result.pull_request.html_url
      }
    }
  }

  return undefined
}

export async function createPrToUpdateFile (octokit: GraaOctokit, repo: RepoDetail, change: FileChange, meta: PullRequestMetadata): Promise<PullRequestResult> {
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
    body: `Note: This PR was created automatically by [GRAA](https://github.com/meyfa/graa).\n\n${meta.comment}`,
    head: meta.branch,
    base: repo.default_branch
  })

  return {
    webUrl: pr.data._links.html.href
  }
}
