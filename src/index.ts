import { Octokit } from '@octokit/core'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { GraaOctokit, RepoDetail, RepoOfAuthenticatedUser } from './github/types.js'
import { getEffectiveConfig } from './config.js'
import { globalLog, Log, withRepoScope, withAutomationScope } from './log.js'
import { AuthError, RepoConfigError } from './errors.js'
import { getAutomation } from './automation.js'

function ensureToken (): string {
  const token = process.env.GRAA_TOKEN
  if (typeof token !== 'string' || token.length <= 0) {
    throw new AuthError('Cannot run, the GRAA_TOKEN env variable is not set!')
  }

  return token
}

const GRAA_TOKEN = ensureToken()

const MyOctokit = Octokit.plugin(paginateRest).plugin(restEndpointMethods)
const octokit: GraaOctokit = new MyOctokit({
  auth: GRAA_TOKEN
})

async function handleAllRepos (log: Log): Promise<void> {
  const repoFilter = {
    affiliation: 'owner',
    visibility: 'public',
    per_page: 100
  } as const

  for await (const repos of octokit.paginate.iterator(octokit.rest.repos.listForAuthenticatedUser, repoFilter)) {
    for (const repo of repos.data) {
      const scopedLog = withRepoScope(log, repo)
      try {
        await handleRepo(scopedLog, repo)
      } catch (err: unknown) {
        scopedLog.error(err)
      }
    }
  }
}

async function handleRepo (log: Log, repo: RepoOfAuthenticatedUser): Promise<void> {
  if (repo.private || repo.archived || repo.disabled || repo.fork || repo.owner.type !== 'User') {
    return
  }

  const config = await getEffectiveConfig(octokit, repo)
  if (config == null) {
    log.info('Skipping (not configured)')
    return
  }

  log.info('Running')

  // Listing does not include all relevant data, so we need to fetch the repo again separately.
  // For example, the following property is only present on the GET response: delete_branch_on_merge
  const repoGet = await octokit.rest.repos.get({
    owner: repo.owner.login,
    repo: repo.name
  })

  for (const [automationId, options] of Object.entries(config.automations)) {
    // At this point, the options object is guaranteed to match the required struct.
    // This is accomplished as part of the config resolution process.
    await runAutomation(log, repoGet.data, automationId, options)
  }
}

async function runAutomation (log: Log, repo: RepoDetail, automationId: string, options: object): Promise<void> {
  const automation = getAutomation(automationId)
  if (automation == null) {
    throw new RepoConfigError(repo, `Unknown automation '${automationId}'!`)
  }

  const scopedLog = withAutomationScope(log, automationId)
  scopedLog.info('Running')

  await automation.run(scopedLog, octokit, repo, options)
}

try {
  await handleAllRepos(globalLog)
} catch (err: unknown) {
  globalLog.error(err)
  process.exit(1)
}
