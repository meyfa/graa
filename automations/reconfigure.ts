import { Log } from '../lib/log.js'
import { GraaOctokit, RepoOfAuthenticatedUser } from '../lib/types.js'
import { boolean, defaulted, object } from 'superstruct'
import { assertAutomationOptions } from '../lib/validation.js'

const Options = object({
  'delete-branch-on-merge': defaulted(boolean(), false)
})

/**
 * Run a job for reconfiguring a subset of the repository settings.
 *
 * @param log The scoped logger.
 * @param octokit The API instance.
 * @param repo The repo to run this action on.
 * @param options The automation options.
 */
export async function reconfigure (log: Log, octokit: GraaOctokit, repo: RepoOfAuthenticatedUser, options: object): Promise<void> {
  const opt = assertAutomationOptions(repo, Options, options)

  octokit.rest.repos.update({
    owner: repo.owner.login,
    repo: repo.name,

    // sample setting
    delete_branch_on_merge: opt['delete-branch-on-merge']
  })
}
