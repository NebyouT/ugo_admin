// Debug why Groups routes aren't loading
const path = require('path');

console.log('=== Debugging Groups Routes Loading ===\n');

// Check if Groups module files exist
const groupsRoutePath = path.join(__dirname, 'modules/groups/routes/groups.js');
const groupsControllerPath = path.join(__dirname, 'modules/groups/controllers/GroupsController.js');
const groupsModelPath = path.join(__dirname, 'modules/groups/models/Group.js');

console.log('Checking Groups module files...');
console.log('Groups route file exists:', require('fs').existsSync(groupsRoutePath));
console.log('Groups controller exists:', require('fs').existsSync(groupsControllerPath));
console.log('Groups model exists:', require('fs').existsSync(groupsModelPath));

// Try to load Groups routes
try {
    console.log('\nTrying to load Groups routes...');
    const groupsRoutes = require('../modules/groups/routes/groups.js');
    console.log('✅ Groups routes loaded successfully');
    console.log('Routes module type:', typeof groupsRoutes);
    
    // Check if it's an Express router
    if (typeof groupsRoutes === 'function') {
        console.log('✅ Groups routes is an Express router function');
    } else {
        console.log('❌ Groups routes is not an Express router');
        console.log('Type:', typeof groupsRoutes);
    }
    
} catch (error) {
    console.log('❌ Failed to load Groups routes:', error.message);
}

// Check app.js route registration
try {
    console.log('\nChecking app.js...');
    const fs = require('fs');
    const appContent = fs.readFileSync('./app.js', 'utf8');
    
    if (appContent.includes("app.use('/api/groups'")) {
        console.log('✅ Groups route registered in app.js');
        
        // Extract the line
        const lines = appContent.split('\n');
        const groupsRouteLine = lines.find(line => line.includes("app.use('/api/groups'"));
        console.log('Registration line:', groupsRouteLine.trim());
    } else {
        console.log('❌ Groups route NOT registered in app.js');
    }
    
} catch (error) {
    console.log('❌ Failed to check app.js:', error.message);
}

console.log('\n=== Debug Complete ===');
