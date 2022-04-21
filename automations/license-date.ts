import { tryReadFileAsUtf8 } from '../lib/content.js'
import { GraaOctokit, RepoOfAuthenticatedUser } from '../lib/types.js'
import { createPrToUpdateFile } from '../lib/pr.js'

const LICENSE_PATH = 'LICENSE'

interface LicenseYearRange {
  start: number
  end: number
}

/**
 * Run a job for updating the year range in the 'LICENSE' file to include the year of the most recent commit.
 *
 * @param octokit The API instance.
 * @param repo The repo to run this action on.
 */
export async function licenseDate (octokit: GraaOctokit, repo: RepoOfAuthenticatedUser): Promise<void> {
  const license = await tryReadFileAsUtf8(octokit, {
    owner: repo.owner.login,
    repo: repo.name,
    path: LICENSE_PATH
  })
  if (license == null) {
    return
  }

  const licenseYears = extractRange(license.content)
  if (licenseYears == null) {
    return
  }

  const mainBranch = await octokit.rest.repos.getBranch({
    owner: repo.owner.login,
    repo: repo.name,
    branch: repo.default_branch
  })

  const lastCommit = mainBranch.data.commit
  const lastCommitDate = lastCommit?.commit?.committer?.date
  if (lastCommitDate == null) {
    return
  }

  const commitYear = parseInt(lastCommitDate.slice(0, 4), 10)

  if (licenseYears.end < commitYear) {
    const newRange: LicenseYearRange = {
      ...licenseYears,
      end: commitYear
    }

    await createPrToUpdateFile(octokit, repo, {
      fileBlobSha: license.sha,
      path: LICENSE_PATH,
      content: updateRange(license.content, newRange)
    }, {
      branch: 'chore/license-copyright-year',
      parentCommitSha: lastCommit.sha,
      subject: 'chore(license): Update copyright range',
      comment: `Note: This PR was created automatically by [GRAA](https://github.com/meyfa/graa).\n\nIt looks like the most recent commit is dated to the year ${commitYear}. This PR updates the copyright range in LICENSE to match that.`
    })
  }
}

function extractRange (licenseText: string): LicenseYearRange | undefined {
  if (!licenseText.startsWith('MIT License')) {
    // can only handle MIT for now
    return undefined
  }

  // uncaptured prefix + range start + optional range end + uncaptured suffix
  const match = licenseText.match(/^Copyright \(c\) (\d{4})(?: - (\d{4}))? .+$/m)
  if (match == null) {
    return undefined
  }

  const start = parseInt(match[1], 10)
  const end = match[2]?.length > 0 ? parseInt(match[2], 10) : start

  return { start, end }
}

function updateRange (licenseText: string, newRange: LicenseYearRange): string {
  const rangeString = newRange.end === newRange.start ? `${newRange.start}` : `${newRange.start} - ${newRange.end}`

  // prefix + current range spec + suffix
  return licenseText.replace(/^(Copyright \(c\) )(\d{4}(?: - \d{4})?)( .+)$/m, '$1' + rangeString + '$3')
}
