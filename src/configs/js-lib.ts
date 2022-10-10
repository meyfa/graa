import { PartialConfig } from '../config.js'
import { commonRenovatePackageRules } from './base.js'
import { indent } from '../util/indent.js'

const renovateJson = `{
  "extends": [
    "config:js-lib"
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

export const jsLibConfig: PartialConfig = {
  extends: 'config:base',
  automations: {
    files: {
      'renovate.json': renovateJson
    }
  }
}
