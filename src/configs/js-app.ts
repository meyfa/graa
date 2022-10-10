import { PartialConfig } from '../config.js'
import { commonRenovatePackageRules } from './base.js'
import { indent } from '../util/indent.js'

const renovateJson = `{
  "extends": [
    "config:js-app"
  ],
  "labels": ["dependencies"],
  "packageRules": [
    {
      "matchDepTypes": ["devDependencies"],
      "extends": ["schedule:weekly"]
    },
    ${indent(commonRenovatePackageRules, '    ')}
  ],
  "lockFileMaintenance": {
    "enabled": true,
    "automerge": true
  }
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
