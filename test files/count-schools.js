// Count schools in the database
const mongoose = require('mongoose');

async function countSchools() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo_admin', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // Import School model
        const School = require('../modules/schools/models/School');
        
        // Count all schools (including deleted)
        const totalSchools = await School.countDocuments();
        console.log(`\n📊 Total schools in database: ${totalSchools}`);
        
        // Count active schools (not deleted)
        const activeSchools = await School.countDocuments({ isDeleted: false });
        console.log(`✅ Active schools: ${activeSchools}`);
        
        // Count inactive schools (deleted)
        const deletedSchools = await School.countDocuments({ isDeleted: true });
        console.log(`🗑️ Deleted schools: ${deletedSchools}`);
        
        // Count by status
        const activeEnabledSchools = await School.countDocuments({ 
            isDeleted: false, 
            isActive: true 
        });
        console.log(`🟢 Active & Enabled schools: ${activeEnabledSchools}`);
        
        const activeDisabledSchools = await School.countDocuments({ 
            isDeleted: false, 
            isActive: false 
        });
        console.log(`🔴 Active but Disabled schools: ${activeDisabledSchools}`);
        
        // Show sample schools if any exist
        if (totalSchools > 0) {
            console.log('\n📋 Sample schools:');
            const sampleSchools = await School.find({ isDeleted: false })
                .select('name address city isActive _id')
                .limit(5)
                .sort({ name: 1 });
                
            sampleSchools.forEach((school, i) => {
                const status = school.isActive ? '✅' : '🔴';
                const location = school.address?.city || school.address?.region || 'Unknown';
                console.log(`   ${i + 1}. ${status} ${school.name} - ${location} (${school._id.substring(0, 8)}...)`);
            });
        } else {
            console.log('\n❌ No schools found in database');
            console.log('💡 To add schools:');
            console.log('   1. Go to: http://localhost:3001/admin/schools');
            console.log('   2. Click "Add School"');
            console.log('   3. Fill in school details');
            console.log('   4. Save the school');
        }
        
        // Close connection
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.name === 'MongooseServerSelectionError') {
            console.log('\n🔧 MongoDB connection issue:');
            console.log('   1. Make sure MongoDB is running');
            console.log('   2. Check connection string in .env file');
            console.log('   3. Verify database name is correct');
        }
        
        process.exit(1);
    }
}

countSchools();
