import { Octokit } from '@octokit/core'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { GraaOctokit, RepoOfAuthenticatedUser } from './lib/types.js'
import { licenseDate } from './automations/license-date.js'

class ConfigError extends Error {
  constructor (message: string) {
    super(message)
    this.name = ConfigError.name
  }
}

function ensureToken (): string {
  const token = process.env.GRAA_TOKEN
  if (typeof token !== 'string' || token.length <= 0) {
    throw new ConfigError('Cannot run, the GRAA_TOKEN env variable is not set!')
  }

  return token
}

const GRAA_TOKEN = ensureToken()

const MyOctokit = Octokit.plugin(paginateRest).plugin(restEndpointMethods)
const octokit: GraaOctokit = new MyOctokit({
  auth: GRAA_TOKEN
})

async function handleAllRepos (): Promise<void> {
  const repoFilter = {
    affiliation: 'owner',
    visibility: 'public',
    per_page: 100
  } as const

  for await (const repos of octokit.paginate.iterator(octokit.rest.repos.listForAuthenticatedUser, repoFilter)) {
    for (const repo of repos.data) {
      await handleRepo(repo)
    }
  }
}

async function handleRepo (repo: RepoOfAuthenticatedUser): Promise<void> {
  if (repo.private || repo.archived || repo.disabled || repo.fork || repo.owner.type !== 'User') {
    return
  }

  await licenseDate(octokit, repo)
}

await handleAllRepos()
