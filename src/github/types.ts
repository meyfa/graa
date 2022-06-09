import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import { Octokit } from '@octokit/core'
import { Constructor } from '@octokit/core/dist-types/types.js'
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types.js'
import { PaginateInterface } from '@octokit/plugin-paginate-rest'

export type GraaOctokit = InstanceType<typeof Octokit & Constructor<Api> & Constructor<{ paginate: PaginateInterface }>>

// this is the type of the octokit.rest object
type RestMethods = GraaOctokit['rest']

export type RepoOfAuthenticatedUser = GetResponseDataTypeFromEndpointMethod<RestMethods['repos']['listForAuthenticatedUser']>[number]
export type RepoDetail = GetResponseDataTypeFromEndpointMethod<RestMethods['repos']['get']>
export type BranchOfRepo = GetResponseDataTypeFromEndpointMethod<RestMethods['repos']['getBranch']>
