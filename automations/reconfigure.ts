import { Automation } from '../lib/automation.js'
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
    await octokit.rest.repos.update({
      owner: repo.owner.login,
      repo: repo.name,

      // sample setting
      delete_branch_on_merge: options['delete-branch-on-merge']
    })
  }
}
