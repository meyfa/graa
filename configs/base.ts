import { PartialConfig } from '../lib/config.js'

export const baseConfig: PartialConfig = {
  automations: {
    reconfigure: {
      'delete-branch-on-merge': true
    },
    'license-date': {}
  }
}
