import { Struct } from 'superstruct'
import { RepoOfAuthenticatedUser } from './types.js'
import { RepoConfigError } from './errors.js'

export function assertAutomationOptions<T> (repo: RepoOfAuthenticatedUser, struct: Struct<T>, options: unknown): T {
  const [err, validatedBody] = struct.validate(options, { coerce: true })
  if (err != null || validatedBody == null) {
    throw new RepoConfigError(repo, 'Invalid options object')
  }
  return validatedBody
}
