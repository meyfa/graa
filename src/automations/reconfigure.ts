import { Automation } from '../automation.js'
import { boolean, defaulted, Infer, object } from 'superstruct'

const Options = object({
  'delete-branch-on-merge': defaulted(boolean(), false)
})

/**
 * An automation for reconfiguring a subset of the repository settings.
 */
export const reconfigure: Automation<Infer<typeof Options>> = {
  optionsStruct: Options,

  combineOptions (base, extend) {
    return { ...base, ...extend }
  },

  async run (log, octokit, repo, options) {
    if (repo.delete_branch_on_merge === options['delete-branch-on-merge']) {
      log.info('Already in expected state')
      return
    }

    log.info('Updating settings')

    await octokit.rest.repos.update({
      owner: repo.owner.login,
      repo: repo.name,

      delete_branch_on_merge: options['delete-branch-on-merge']
    })
  }
}
