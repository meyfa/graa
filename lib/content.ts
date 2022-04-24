import { GraaOctokit } from './types.js'

function isObjectWithStatus (thing: unknown): thing is { status: unknown } {
  return typeof thing === 'object' && thing != null && 'status' in thing
}

export interface ReadFile {
  sha: string
  content: string
}

export async function tryReadFileAsUtf8 (octokit: GraaOctokit, params: { owner: string, repo: string, path: string }): Promise<ReadFile | undefined> {
  let response

  try {
    response = await octokit.rest.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path
    })
  } catch (err: unknown) {
    if (isObjectWithStatus(err) && err.status === 404) {
      return undefined
    }
    throw err
  }

  if (!('encoding' in response.data) || response.data.encoding !== 'base64') {
    return undefined
  }

  return {
    sha: response.data.sha,
    content: Buffer.from(response.data.content, 'base64').toString('utf8')
  }
}
