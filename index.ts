import { Octokit } from '@octokit/core'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { GraaOctokit, RepoOfAuthenticatedUser } from './lib/types.js'
import { licenseDate } from './automations/license-date.js'
import { getConfig } from './lib/config.js'
import { globalLog, Log, withRepoScope, withAutomationScope } from './lib/log.js'
import { AuthError, RepoConfigError } from './lib/errors.js'

type Automation = (log: Log, octokit: GraaOctokit, repo: RepoOfAuthenticatedUser) => Promise<void>

const AUTOMATIONS: ReadonlyMap<string, Automation> = new Map([
  ['license-date', licenseDate]
])

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

  const config = await getConfig(octokit, repo)
  if (config == null) {
    log.info('Skipping (not configured)')
    return
  }

  log.info('Running')
  for (const automationId of config.automations) {
    await runAutomation(log, repo, automationId)
  }
  await runAutomation(log, repo, 'license-date')
}

async function runAutomation (log: Log, repo: RepoOfAuthenticatedUser, automationId: string): Promise<void> {
  const automation = AUTOMATIONS.get(automationId)
  if (automation == null) {
    throw new RepoConfigError(repo, `Unknown automation '${automationId}'!`)
  }

  const scopedLog = withAutomationScope(log, automationId)
  scopedLog.info('Running')

  await automation(log, octokit, repo)
}

try {
  await handleAllRepos(globalLog)
} catch (err: unknown) {
  globalLog.error(err)
  process.exit(1)
}
