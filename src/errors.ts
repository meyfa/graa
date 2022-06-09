import { RepoDetail, RepoOfAuthenticatedUser } from './github/types.js'

export class AuthError extends Error {
  constructor (message: string) {
    super(message)
    this.name = AuthError.name
  }
}

export abstract class RepoError extends Error {
  readonly repo: string

  protected constructor (repo: RepoOfAuthenticatedUser | RepoDetail, message: string) {
    super(message)
    this.repo = repo.full_name
  }
}

export class RepoConfigError extends RepoError {
  constructor (repo: RepoOfAuthenticatedUser | RepoDetail, message: string) {
    super(repo, message)
    this.name = RepoConfigError.name
  }
}
