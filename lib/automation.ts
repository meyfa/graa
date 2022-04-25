import { GraaOctokit, RepoOfAuthenticatedUser } from './types.js'
import { licenseDate } from '../automations/license-date.js'
import { reconfigure } from '../automations/reconfigure.js'
import { files } from '../automations/files.js'
import { Struct } from 'superstruct'
import { Log } from './log.js'

export interface Automation<Opt> {
  /**
   * The struct for validation of options objects.
   */
  optionsStruct: Struct<Opt>

  /**
   * A reducer to combine options from a base config with options from an extending config.
   *
   * The simplest case would be to return just the extend object here, to completely ignore and options from further up
   * the config hierarchy. Other strategies such as merging keys or custom behavior are possible as well.
   *
   * @param base The options object found in the base config.
   * @param extend The options object found in the extending config.
   * @returns The resulting combined options.
   */
  combineOptions: (base: Opt, extend: Opt) => Opt

  /**
   * Execute this automation.
   *
   * @param log The logger.
   * @param octokit The API client.
   * @param repo The repo for which to run the automation.
   * @param options The fully resolved and validated options.
   */
  run: (log: Log, octokit: GraaOctokit, repo: RepoOfAuthenticatedUser, options: Opt) => Promise<void>
}

const AUTOMATIONS: ReadonlyMap<string, Automation<any>> = new Map<string, Automation<any>>([
  ['license-date', licenseDate],
  ['reconfigure', reconfigure],
  ['files', files]
])

export function getAutomation (id: string): Automation<any> | undefined {
  return AUTOMATIONS.get(id)
}
