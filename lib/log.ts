import { RepoOfAuthenticatedUser } from './types.js'

export interface Log {
  info: (message: any, ...args: any[]) => void
  error: (message: any, ...args: any[]) => void
}

export const globalLog: Log = {
  info (message, ...args) {
    console.log(message, ...args)
  },

  error (message, ...args) {
    console.error(message, ...args)
  }
}

function prefixedLog (base: Log, prefix: string): Log {
  return {
    info: (message, ...args) => base.info(prefix, message, ...args),
    error: (message, ...args) => base.error(prefix, message, ...args)
  }
}

export const withRepoScope = (log: Log, repo: RepoOfAuthenticatedUser): Log => prefixedLog(log, `${repo.full_name}:`)
export const withAutomationScope = (log: Log, automationId: string): Log => prefixedLog(log, `${automationId}:`)
