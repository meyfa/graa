import { PartialConfig } from '../config.js'
import { indent } from '../util/indent.js'

export const commonRenovatePackageRules = `{
  "matchDepTypes": ["devDependencies"],
  "extends": ["schedule:monthly"]
},
{
  "matchDepTypes": ["devDependencies"],
  "matchUpdateTypes": ["minor", "patch"],
  "groupName": "dev dependencies (non-major)",
  "groupSlug": "dev-dependencies-non-major"
},
{
  "matchManagers": ["github-actions"],
  "matchDepTypes": ["action"],
  "groupName": "actions"
}`

const renovateJson = `{
  "extends": [
    "config:recommended"
  ],
  "labels": ["dependencies"],
  "packageRules": [
    ${indent(commonRenovatePackageRules, '    ')}
  ]
}
`

export const baseConfig: PartialConfig = {
  automations: {
    reconfigure: {
      'delete-branch-on-merge': true
    },
    'license-date': {},
    files: {
      'renovate.json': renovateJson
    }
  }
}
