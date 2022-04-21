import { GraaOctokit } from './types.js'

export interface ReadFile {
  sha: string
  content: string
}

export async function tryReadFileAsUtf8 (octokit: GraaOctokit, params: { owner: string, repo: string, path: string }): Promise<ReadFile | undefined> {
  const response = await octokit.rest.repos.getContent({
    owner: params.owner,
    repo: params.repo,
    path: params.path
  })

  if (!('encoding' in response.data) || response.data.encoding !== 'base64') {
    return undefined
  }

  return {
    sha: response.data.sha,
    content: Buffer.from(response.data.content, 'base64').toString('utf8')
  }
}
