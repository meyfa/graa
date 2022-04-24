import { GraaOctokit, RepoOfAuthenticatedUser } from './types.js'
import { tryReadFileAsUtf8 } from './content.js'
import { array, Infer, object, optional, string, validate } from 'superstruct'
import * as YAML from 'yaml'

const CONFIG_PATH = '.graa.yml'

export interface Config {
  readonly automations: readonly string[]
}

const EMPTY_CONFIG: Config = {
  automations: []
}

const PartialConfigSchema = object({
  automations: optional(array(string()))
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
    if (error != null || config == null) {
      return undefined
    }
    return config
  }

  return undefined
}

function mergeConfig (base: Config, extend: PartialConfig): Config {
  const automations = [...base.automations]
  for (const automation of extend.automations ?? []) {
    if (!automations.includes(automation)) {
      automations.push(automation)
    }
  }

  return { ...base, automations }
}

export async function getConfig (octokit: GraaOctokit, repo: RepoOfAuthenticatedUser): Promise<Config | undefined> {
  const partial = await readPartialConfig(octokit, repo)

  if (partial != null) {
    return mergeConfig(EMPTY_CONFIG, partial)
  }

  return undefined
}
