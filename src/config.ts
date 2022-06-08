import { GraaOctokit, RepoOfAuthenticatedUser } from './github/types.js'
import { tryReadFileAsUtf8 } from './github/content.js'
import { Infer, object, optional, record, string, validate } from 'superstruct'
import * as YAML from 'yaml'
import { RepoConfigError } from './errors.js'
import { baseConfig } from './configs/base.js'
import { jsLibConfig } from './configs/js-lib.js'
import { jsAppConfig } from './configs/js-app.js'
import { getAutomation } from './automation.js'
import { assertAutomationOptions } from './validation.js'

const CONFIG_PATH = '.graa.yml'

export interface Config {
  readonly automations: Readonly<Record<string, object>>
}

const EMPTY_CONFIG: Config = {
  automations: {}
}

const PartialConfigSchema = object({
  extends: optional(string()),
  automations: optional(record(string(), object()))
})

export type PartialConfig = Infer<typeof PartialConfigSchema>

async function readPartialConfig (octokit: GraaOctokit, repo: RepoOfAuthenticatedUser): Promise<PartialConfig | undefined> {
  const configFile = await tryReadFileAsUtf8(octokit, {
    owner: repo.owner.login,
    repo: repo.name,
    path: CONFIG_PATH
  })

  if (configFile != null) {
    const asYaml = YAML.parse(configFile.content)
    const [error, config] = validate(asYaml, PartialConfigSchema, { coerce: true })
    if (error == null && config != null) {
      return config
    }
  }

  return undefined
}

function mergeConfig (repo: RepoOfAuthenticatedUser, base: Config, extend: PartialConfig): Config {
  const automations = { ...base.automations }
  for (const [automationId, options] of Object.entries(extend.automations ?? {})) {
    const automation = getAutomation(automationId)
    if (automation == null) {
      throw new RepoConfigError(repo, `Unknown automation '${automationId}'`)
    }
    const validatedOptions = assertAutomationOptions(repo, automation.optionsStruct, options)
    // not yet configured -> options are completely new
    if (automations[automationId] == null) {
      automations[automationId] = validatedOptions
      continue
    }
    // already configured before -> extend the previous options with the new ones
    automations[automationId] = automation.combineOptions(automations[automationId], validatedOptions)
  }

  return { ...base, automations }
}

function getBundledPartialConfig (repo: RepoOfAuthenticatedUser, name: string): PartialConfig {
  switch (name) {
    case 'config:base':
      return baseConfig
    case 'config:js-app':
      return jsAppConfig
    case 'config:js-lib':
      return jsLibConfig
  }
  throw new RepoConfigError(repo, `Unknown config name '${name}'`)
}

function resolveConfig (repo: RepoOfAuthenticatedUser, partial: PartialConfig): Config {
  const base = partial.extends != null
    ? resolveConfig(repo, getBundledPartialConfig(repo, partial.extends))
    : EMPTY_CONFIG

  return mergeConfig(repo, base, partial)
}

export async function getEffectiveConfig (octokit: GraaOctokit, repo: RepoOfAuthenticatedUser): Promise<Config | undefined> {
  const partial = await readPartialConfig(octokit, repo)
  return partial != null ? resolveConfig(repo, partial) : undefined
}
