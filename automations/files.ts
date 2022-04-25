import { Automation } from '../lib/automation.js'
import { Log } from '../lib/log.js'
import { GraaOctokit, RepoOfAuthenticatedUser } from '../lib/types.js'
import { Infer, record, string } from 'superstruct'
import { tryReadFileAsUtf8 } from '../lib/content.js'
import { createPrToUpdateFile, searchExistingPr } from '../lib/pr.js'

const Options = record(string(), string())

function pathToBranchName (path: string): string {
  const normalized = path.slice(-50)
    .replace(/[^a-zA-Z\d]/g, '-')
    .replace(/-+/, '-')
    .replace(/^-|-$/g, '')

  return `chore/update-${normalized}`
}

async function handleFile (log: Log, octokit: GraaOctokit, repo: RepoOfAuthenticatedUser, path: string, expectedContent: string): Promise<void> {
  const mainBranch = await octokit.rest.repos.getBranch({
    owner: repo.owner.login,
    repo: repo.name,
    branch: repo.default_branch
  })

  const current = await tryReadFileAsUtf8(octokit, {
    owner: repo.owner.login,
    repo: repo.name,
    path
  })

  if (current?.content === expectedContent) {
    log.info(`${path}: Already up to date`)
    return
  }

  if (current == null) {
    log.info(`${path}: File does not exist, should create`)
  } else {
    log.info(`${path}: File contents differ from expected, should update`)
  }

  const branch = pathToBranchName(path)

  const existing = await searchExistingPr(octokit, repo, branch)
  if (existing != null) {
    log.info(`A PR already exists for branch ${branch}, see ${existing.webUrl}`)
    return
  }

  const pr = await createPrToUpdateFile(octokit, repo, {
    path,
    fileBlobSha: current?.sha,
    content: expectedContent
  }, {
    branch,
    parentCommitSha: mainBranch.data.commit.sha,
    subject: `chore: ${current == null ? 'Create' : 'Update'} ${path}`,
    comment: 'The file content currently does not match the configured expected value, which is fixed through this PR.'
  })

  log.info(`PR created, see ${pr.webUrl}`)
}

/**
 * An automation for setting the contents of one or more files to specific fixed values.
 */
export const files: Automation<Infer<typeof Options>> = {
  optionsStruct: Options,

  combineOptions (base, extend) {
    return { ...base, ...extend }
  },

  async run (log, octokit, repo, options) {
    for (const [path, contents] of Object.entries(options)) {
      await handleFile(log, octokit, repo, path, contents)
    }
  }
}
