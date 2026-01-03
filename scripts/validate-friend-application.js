const fs = require('fs')
const path = require('path')

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

// Validate each application
let hasErrors = false

for (const file of applicationFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8')
    const application = JSON.parse(content)

    // Required fields
    const requiredFields = ['id', 'name', 'url', 'description', 'contact', 'submittedAt', 'status']
    for (const field of requiredFields) {
      if (!application[field]) {
        console.error(`❌ Missing required field: ${field} in ${file}`)
        hasErrors = true
      }
    }

    // URL validation
    try {
      new URL(application.url)
    } catch {
      console.error(`❌ Invalid URL: ${application.url} in ${file}`)
      hasErrors = true
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(application.contact)) {
      console.error(`❌ Invalid email: ${application.contact} in ${file}`)
      hasErrors = true
    }

    // Name length
    if (application.name.length < 2 || application.name.length > 50) {
      console.error(`❌ Name length must be 2-50 characters in ${file}`)
      hasErrors = true
    }

    // Description length
    if (application.description.length < 10 || application.description.length > 200) {
      console.error(`❌ Description length must be 10-200 characters in ${file}`)
      hasErrors = true
    }

    if (!hasErrors) {
      console.log(`✅ Application validation passed: ${file}`)
    }

  } catch (error) {
    console.error(`❌ Error parsing ${file}:`, error.message)
    hasErrors = true
  }
}

if (hasErrors) {
  console.error('Application validation failed')
  process.exit(1)
}

console.log('All applications validated successfully')