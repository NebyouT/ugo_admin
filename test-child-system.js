const mongoose = require('mongoose');

// Test the new child management system
async function testChildSystem() {
  try {
    console.log('🧪 Testing New Child Management System...\n');
    
    // Connect to database
    await mongoose.connect('mongodb+srv://ugoo:ugo1234@cluster0.cq73g0t.mongodb.net/?appName=Cluster0');
    console.log('✅ Database connected');
    
    // Import the new Child model
    const Child = require('./modules/children/models/Child');
    const User = require('./modules/user-management/models/User');
    
    // Find a parent user for testing
    const parent = await User.findOne({ userType: 'parent' });
    if (!parent) {
      console.log('⚠️  No parent user found for testing');
      console.log('💡 Create a parent user first to test child creation');
      return;
    }
    
    console.log(`✅ Found parent user: ${parent.firstName} ${parent.lastName}`);
    
    // Test child creation
    const testChild = {
      parent: parent._id,
      name: 'Test Child',
      grade: 'Grade 3',
      pickupAddress: {
        address: '123 Test Street, Addis Ababa, Ethiopia',
        coordinates: [38.7525, 9.0192],
        landmark: 'Near Test Landmark'
      },
      schedules: [
        {
          type: 'pickup',
          time: '07:30',
          day: 'monday',
          isActive: true,
          notes: 'Morning pickup'
        },
        {
          type: 'dropoff',
          time: '08:00',
          day: 'monday',
          isActive: true,
          notes: 'At school'
        },
        {
          type: 'pickup',
          time: '15:30',
          day: 'monday',
          isActive: true,
          notes: 'Afternoon pickup'
        },
        {
          type: 'dropoff',
          time: '16:00',
          day: 'monday',
          isActive: true,
          notes: 'At home'
        }
      ],
      school: {
        name: 'Test School'
      },
      createdBy: parent._id
    };
    
    console.log('\n📝 Creating test child...');
    const child = new Child(testChild);
    await child.save();
    
    console.log('✅ Test child created successfully!');
    console.log(`👶 Child ID: ${child._id}`);
    console.log(`📛 Child Name: ${child.name}`);
    console.log(`🎓 Grade: ${child.grade}`);
    console.log(`📍 Pickup Address: ${child.pickupAddress.address}`);
    console.log(`⏰ Schedules: ${child.schedules.length} schedules created`);
    
    // Test formatted schedules virtual
    console.log('\n📅 Formatted Schedules:');
    console.log(JSON.stringify(child.formattedSchedules, null, 2));
    
    // Test finding children by parent
    console.log('\n🔍 Testing findByParent...');
    const parentChildren = await Child.findByParent(parent._id);
    console.log(`✅ Found ${parentChildren.length} children for parent`);
    
    // Test geospatial query
    console.log('\n🗺️ Testing geospatial query...');
    const nearbyChildren = await Child.find({
      isActive: true,
      'pickupAddress.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [38.7525, 9.0192]
          },
          $maxDistance: 1000 // 1km
        }
      }
    });
    console.log(`✅ Found ${nearbyChildren.length} children within 1km`);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Child.deleteOne({ _id: child._id });
    console.log('✅ Test child removed');
    
    console.log('\n🎉 All tests passed! Child management system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Database disconnected');
  }
}

// Run the test
testChildSystem();
