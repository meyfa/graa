import { PartialConfig } from '../lib/config.js'

const renovateJson = `{
  "extends": [
    "config:js-lib"
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

export const jsLibConfig: PartialConfig = {
  extends: 'config:base',
  automations: {
    files: {
      'renovate.json': renovateJson
    }
  }
}
