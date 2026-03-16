// Get actual schools data from MongoDB
const mongoose = require('mongoose');

async function getSchoolsData() {
    try {
        // Load environment variables
        require('dotenv').config();
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Import School model
        const School = require('../modules/schools/models/School');
        
        console.log('\n📊 Getting Schools Data...\n');
        
        // Get all schools (including deleted for complete picture)
        const allSchools = await School.find({});
        console.log(`Total schools in database: ${allSchools.length}`);
        
        // Get active schools only
        const activeSchools = await School.find({ isActive: true });
        console.log(`Active schools: ${activeSchools.length}`);
        
        // Get inactive schools
        const inactiveSchools = await School.find({ isActive: false });
        console.log(`Inactive schools: ${inactiveSchools.length}`);
        
        if (allSchools.length === 0) {
            console.log('\n❌ No schools found in database');
            console.log('\n💡 To add schools:');
            console.log('   1. Start server: node app.js');
            console.log('   2. Go to: http://localhost:3001/admin/login');
            console.log('   3. Navigate to: http://localhost:3001/admin/schools');
            console.log('   4. Click "Add School" and fill in details');
            return;
        }
        
        console.log('\n📋 Complete School List:');
        console.log('═'.repeat(80));
        
        allSchools.forEach((school, index) => {
            const status = school.isActive ? '✅ Active' : '🔴 Inactive';
            const type = school.type || 'unknown';
            const city = school.address?.city || school.address?.region || 'Unknown';
            const location = school.latitude && school.longitude ? 
                `${school.latitude.toFixed(4)}, ${school.longitude.toFixed(4)}` : 'No coordinates';
            
            console.log(`${index + 1}. ${school.name}`);
            console.log(`   Status: ${status}`);
            console.log(`   Type: ${type}`);
            console.log(`   Location: ${city}`);
            console.log(`   Coordinates: ${location}`);
            console.log(`   ID: ${school._id}`);
            console.log(`   Created: ${school.createdAt?.toLocaleDateString() || 'Unknown'}`);
            
            if (school.address?.formattedAddress) {
                console.log(`   Address: ${school.address.formattedAddress}`);
            }
            
            if (school.contactInfo?.phone) {
                console.log(`   Phone: ${school.contactInfo.phone}`);
            }
            
            if (school.studentCapacity > 0) {
                const enrollment = school.currentStudents || 0;
                const percentage = Math.round((enrollment / school.studentCapacity) * 100);
                console.log(`   Capacity: ${enrollment}/${school.studentCapacity} (${percentage}%)`);
            }
            
            if (school.serviceRadius) {
                console.log(`   Service Radius: ${school.serviceRadius}km`);
            }
            
            console.log('─'.repeat(80));
        });
        
        // Group by city
        console.log('\n🏙️ Schools by City:');
        const schoolsByCity = {};
        allSchools.forEach(school => {
            const city = school.address?.city || school.address?.region || 'Unknown';
            if (!schoolsByCity[city]) schoolsByCity[city] = [];
            schoolsByCity[city].push(school);
        });
        
        Object.entries(schoolsByCity).forEach(([city, schools]) => {
            const activeCount = schools.filter(s => s.isActive).length;
            console.log(`   ${city}: ${schools.length} total (${activeCount} active)`);
            schools.forEach(school => {
                const status = school.isActive ? '✅' : '🔴';
                console.log(`     ${status} ${school.name}`);
            });
        });
        
        // Group by type
        console.log('\n📚 Schools by Type:');
        const schoolsByType = {};
        allSchools.forEach(school => {
            const type = school.type || 'unknown';
            if (!schoolsByType[type]) schoolsByType[type] = [];
            schoolsByType[type].push(school);
        });
        
        Object.entries(schoolsByType).forEach(([type, schools]) => {
            const activeCount = schools.filter(s => s.isActive).length;
            console.log(`   ${type}: ${schools.length} total (${activeCount} active)`);
        });
        
        // Show sample data for API usage
        console.log('\n💾 Sample Data for API Usage:');
        if (activeSchools.length > 0) {
            const sampleSchool = activeSchools[0];
            const apiFormat = {
                _id: sampleSchool._id,
                name: sampleSchool.name,
                latitude: sampleSchool.latitude,
                longitude: sampleSchool.longitude,
                address: sampleSchool.address,
                type: sampleSchool.type,
                isActive: sampleSchool.isActive,
                studentCapacity: sampleSchool.studentCapacity,
                currentStudents: sampleSchool.currentStudents,
                serviceRadius: sampleSchool.serviceRadius
            };
            
            console.log(JSON.stringify(apiFormat, null, 2));
        }
        
        // Close connection
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.name === 'MongooseServerSelectionError') {
            console.log('\n🔧 MongoDB connection issue:');
            console.log('   1. Check if MongoDB is running: mongod');
            console.log('   2. Verify connection string in .env file');
            console.log('   3. Check database name: ugo_admin');
        }
        
        process.exit(1);
    }
}

getSchoolsData();
