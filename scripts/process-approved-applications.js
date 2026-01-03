const fs = require('fs')
const path = require('path')

const FRIENDS_FILE = path.join(__dirname, '../src/data/friends.json')
const APPLICATIONS_DIR = path.join(__dirname, '../src/data/friend-applications')

// Ensure directories exist
if (!fs.existsSync(APPLICATIONS_DIR)) {
  fs.mkdirSync(APPLICATIONS_DIR, { recursive: true })
}

function processApprovedApplications() {
  try {
    // Read current friends data
    let friendsData = { pending: [], approved: [], rejected: [] }
    if (fs.existsSync(FRIENDS_FILE)) {
      friendsData = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8'))
    }

    // Get all approved applications
    const approvedApplications = friendsData.pending.filter(app => app.status === 'approved')

    for (const application of approvedApplications) {
      // Convert application to friend format
      const friend = {
        id: application.id,
        name: application.name,
        url: application.url,
        description: application.description,
        avatar: application.avatar,
        category: application.category,
        contact: application.contact,
        addedAt: new Date().toISOString(),
        status: 'active',
        rel: 'friend'
      }

      // Add to approved list
      friendsData.approved.push(friend)

      // Remove from pending
      friendsData.pending = friendsData.pending.filter(app => app.id !== application.id)

      console.log(`✅ Processed approved application: ${application.name}`)
    }

    // Save updated friends data
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(friendsData, null, 2))

    // Clean up processed application files
    const applicationFiles = fs.readdirSync(APPLICATIONS_DIR)
    for (const file of applicationFiles) {
      const filePath = path.join(APPLICATIONS_DIR, file)
      try {
        const application = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        if (approvedApplications.find(app => app.id === application.id)) {
          fs.unlinkSync(filePath)
          console.log(`🗑️  Cleaned up application file: ${file}`)
        }
      } catch (error) {
        console.warn(`Warning: Could not process file ${file}:`, error.message)
      }
    }

    console.log('✅ Friends list updated successfully')

  } catch (error) {
    console.error('❌ Error processing approved applications:', error)
    process.exit(1)
  }
}

// Check if applications need manual approval
function checkPendingApplications() {
  try {
    const friendsData = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf8'))
    const pendingApplications = friendsData.pending.filter(app => app.status === 'pending')

    if (pendingApplications.length > 0) {
      console.log(`ℹ️  Found ${pendingApplications.length} pending applications:`)
      for (const app of pendingApplications) {
        console.log(`   - ${app.name} (${app.url})`)
      }
      console.log('   Please review and set status to "approved" or "rejected" in friends.json')
    }

  } catch (error) {
    console.error('Error checking pending applications:', error)
  }
}

// Main execution
if (process.argv.includes('--check-pending')) {
  checkPendingApplications()
} else {
  processApprovedApplications()
}