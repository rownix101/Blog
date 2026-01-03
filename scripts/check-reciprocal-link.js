const fs = require('fs')
const https = require('https')
const { URL } = require('url')

// Get the PR files
const prFiles = process.env.PR_FILES ? JSON.parse(process.env.PR_FILES) : []

// Find application files
const applicationFiles = prFiles.filter(file =>
  file.includes('src/data/friend-applications/') && file.endsWith('.json')
)

if (applicationFiles.length === 0) {
  console.log('No friend application files found in PR')
  process.exit(0)
}

// Blog URL to check for reciprocal link
const BLOG_URL = process.env.BLOG_URL || 'https://www.rownix.dev'
const BLOG_DOMAIN = new URL(BLOG_URL).hostname

let hasErrors = false

function checkReciprocalLink(siteUrl) {
  return new Promise((resolve) => {
    try {
      const url = new URL(siteUrl)

      https.get(siteUrl, { timeout: 10000 }, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          // Check if the page contains a link to our blog
          const hasLink = data.includes(BLOG_DOMAIN) ||
                         data.includes(BLOG_URL) ||
                         data.includes('rownix.dev')

          resolve({
            hasReciprocalLink: hasLink,
            statusCode: res.statusCode
          })
        })
      }).on('error', () => {
        resolve({ hasReciprocalLink: false, error: 'Connection error' })
      }).on('timeout', () => {
        resolve({ hasReciprocalLink: false, error: 'Timeout' })
      })

    } catch (error) {
      resolve({ hasReciprocalLink: false, error: 'Invalid URL' })
    }
  })
}

async function main() {
  for (const file of applicationFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8')
      const application = JSON.parse(content)

      console.log(`Checking reciprocal link on: ${application.url}`)

      const result = await checkReciprocalLink(application.url)

      if (!result.hasReciprocalLink) {
        console.warn(`⚠️  No reciprocal link found on ${application.url}`)
        console.warn(`   Please add a link to ${BLOG_URL} on your website`)
        // Don't fail the check, just warn - this can be verified manually
      } else {
        console.log(`✅ Reciprocal link found on: ${application.url}`)
      }

    } catch (error) {
      console.error(`❌ Error checking reciprocal link in ${file}:`, error.message)
      hasErrors = true
    }
  }

  if (hasErrors) {
    console.error('Reciprocal link check failed')
    process.exit(1)
  }

  console.log('Reciprocal link check completed')
}

main().catch(console.error)