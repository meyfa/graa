import { PartialConfig } from '../config.js'

const renovateJson = `{
  "extends": [
    "config:base"
  ],
  "labels": ["dependencies"],
  "packageRules": [
    {
      "matchDepTypes": ["devDependencies"],
      "extends": ["schedule:weekly"]
    }
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
