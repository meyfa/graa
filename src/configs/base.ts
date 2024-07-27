import { PartialConfig } from '../config.js'
import { indent } from '../util/indent.js'

export const commonRenovatePackageRules = `{
  "matchDepTypes": ["devDependencies"],
  "extends": ["schedule:weekly"]
},
{
  "matchDepTypes": ["devDependencies"],
  "matchUpdateTypes": ["minor", "patch"],
  "excludePackagePatterns": [
    "^@types/",
    "-types$"
  ],
  "groupName": "dev dependencies (non-major)",
  "groupSlug": "dev-dependencies-non-major"
},
{
  "matchDepTypes": ["devDependencies"],
  "matchUpdateTypes": ["minor", "patch", "lockFileMaintenance"],
  "matchPackageNames": [
    "typescript",
    "eslint",
    "mocha",
    "chai",
    "stylelint",
    "stylelint-config-standard",
    "@meyfa/eslint-config"
  ],
  "automerge": true
},
{
  "matchPackagePatterns": ["^@octokit/"],
  "groupName": "octokit packages"
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
