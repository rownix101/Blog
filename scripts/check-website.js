const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
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

// Check each website
let hasErrors = false

function checkWebsite(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http
    const timeout = 10000 // 10 seconds

    const req = protocol.get(url, { timeout }, (res) => {
      resolve({
        accessible: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
        contentType: res.headers['content-type']
      })
    })

    req.on('error', () => {
      resolve({ accessible: false, error: 'Connection error' })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({ accessible: false, error: 'Timeout' })
    })
  })
}

async function main() {
  for (const file of applicationFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8')
      const application = JSON.parse(content)

      console.log(`Checking website: ${application.url}`)

      const result = await checkWebsite(application.url)

      if (!result.accessible) {
        console.error(`❌ Website not accessible: ${application.url} (${result.error || result.statusCode})`)
        hasErrors = true
        continue
      }

      // Check if it's a valid website (not just a placeholder)
      if (result.contentType && !result.contentType.includes('text/html')) {
        console.warn(`⚠️  Website may not be a standard HTML page: ${application.url} (${result.contentType})`)
      }

      console.log(`✅ Website accessible: ${application.url} (${result.statusCode})`)

    } catch (error) {
      console.error(`❌ Error checking website in ${file}:`, error.message)
      hasErrors = true
    }
  }

  if (hasErrors) {
    console.error('Website accessibility check failed')
    process.exit(1)
  }

  console.log('All websites are accessible')
}

main().catch(console.error)