import { PartialConfig } from '../lib/config.js'

const renovateJson = `{
  "extends": [
    "config:js-app"
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

export const jsAppConfig: PartialConfig = {
  extends: 'config:base',
  automations: {
    files: {
      'renovate.json': renovateJson
    }
  }
}
