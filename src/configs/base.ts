import { PartialConfig } from '../config.js'
import { indent } from '../util/indent.js'

export const commonRenovatePackageRules = `{
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
    "config:base"
  ],
  "labels": ["dependencies"],
  "packageRules": [
    {
      "matchDepTypes": ["devDependencies"],
      "extends": ["schedule:weekly"]
    },
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
