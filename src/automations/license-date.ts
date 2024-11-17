import { Automation } from '../automation.js'
import { tryReadFileAsUtf8 } from '../github/content.js'
import { createPrToUpdateFile, searchExistingPr } from '../pr.js'
import { Infer, object } from 'superstruct'

const LICENSE_PATH = 'LICENSE'
const BRANCH_NAME = 'chore/license-copyright-year'

const Options = object({})

interface LicenseYearRange {
  start: number
  end: number
}

/**
 * An automation for updating the year range in the 'LICENSE' file to include the year of the most recent commit.
 */
export const licenseDate: Automation<Infer<typeof Options>> = {
  optionsStruct: Options,

  combineOptions (base, extend) {
    return { ...base, ...extend }
  },

  async run (log, octokit, repo, options) {
    const license = await tryReadFileAsUtf8(octokit, {
      owner: repo.owner.login,
      repo: repo.name,
      path: LICENSE_PATH
    })
    if (license == null) {
      log.info('Skipping (no license file found)')
      return
    }

    const licenseYears = extractRange(license.content)
    if (licenseYears == null) {
      log.info('Skipping (unable to extract a date range from the license file)')
      return
    }

    const mainBranch = await octokit.rest.repos.getBranch({
      owner: repo.owner.login,
      repo: repo.name,
      branch: repo.default_branch
    })

    const lastCommit = mainBranch.data.commit
    const lastCommitDate = lastCommit.commit.committer?.date
    if (lastCommitDate == null) {
      log.info('Skipping (no commit found on default branch)')
      return
    }

    const commitYear = Number.parseInt(lastCommitDate.slice(0, 4), 10)
    if (licenseYears.end >= commitYear) {
      log.info('Already up to date')
      return
    }

    const newRange: LicenseYearRange = {
      ...licenseYears,
      end: commitYear
    }

    log.info(`Should update from ${licenseYears.start}-${licenseYears.end} to ${newRange.start}-${newRange.end}`)

    const existing = await searchExistingPr(octokit, repo, BRANCH_NAME)
    if (existing != null) {
      log.info(`A PR already exists for branch ${BRANCH_NAME}, see ${existing.webUrl}`)
      return
    }

    const pr = await createPrToUpdateFile(octokit, repo, {
      fileBlobSha: license.sha,
      path: LICENSE_PATH,
      content: updateRange(license.content, newRange)
    }, {
      branch: BRANCH_NAME,
      parentCommitSha: lastCommit.sha,
      subject: 'chore(license): Update copyright range',
      comment: `It looks like the most recent commit is dated to the year ${commitYear}. This PR updates the copyright range in LICENSE to match that.`
    })

    log.info(`PR created, see ${pr.webUrl}`)
  }
}

function extractRange (licenseText: string): LicenseYearRange | undefined {
  if (!licenseText.startsWith('MIT License')) {
    // can only handle MIT for now
    return undefined
  }

  // uncaptured prefix + range start + optional range end + uncaptured suffix
  const match = /^Copyright \(c\) (\d{4})(?: - (\d{4}))? .+$/m.exec(licenseText)
  if (match == null) {
    return undefined
  }

  const start = Number.parseInt(match[1], 10)
  const end = (match.at(2) ?? '').length > 0 ? Number.parseInt(match[2], 10) : start

  return { start, end }
}

function updateRange (licenseText: string, newRange: LicenseYearRange): string {
  const rangeString = newRange.end === newRange.start ? `${newRange.start}` : `${newRange.start} - ${newRange.end}`

  // prefix + current range spec + suffix
  return licenseText.replace(/^(Copyright \(c\) )(\d{4}(?: - \d{4})?)( .+)$/m, '$1' + rangeString + '$3')
}
