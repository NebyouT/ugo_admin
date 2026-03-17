const mongoose = require('mongoose');

// Create a test parent user
async function createTestParent() {
  try {
    console.log('🧪 Creating Test Parent User...\n');
    
    // Connect to database
    await mongoose.connect('mongodb+srv://ugoo:ugo1234@cluster0.cq73g0t.mongodb.net/?appName=Cluster0');
    console.log('✅ Database connected');
    
    const User = require('./modules/user-management/models/User');
    
    // Check if parent already exists
    const existingParent = await User.findOne({ 
      $or: [
        { email: 'parent@test.com' },
        { phone: '+2519112345678' }
      ]
    });
    
    if (existingParent) {
      console.log('✅ Test parent already exists:');
      console.log(`   Email: ${existingParent.email}`);
      console.log(`   Name: ${existingParent.firstName} ${existingParent.lastName}`);
      console.log(`   User Type: ${existingParent.userType}`);
      console.log(`   Status: ${existingParent.status}`);
      return existingParent;
    }
    
    // Create new parent user
    const parentData = {
      firstName: 'Test',
      lastName: 'Parent',
      email: 'parent@test.com',
      phone: '+2519112345678',
      password: '12345678',
      userType: 'parent',
      role: 'parent',
      customerType: 'parent',
      isActive: true,
      status: 'active',
      emailVerified: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      address: {
        street: '123 Parent Street',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1000',
        country: 'Ethiopia',
        coordinates: {
          latitude: 9.0192,
          longitude: 38.7525
        }
      },
      parentInfo: {
        occupation: 'Software Engineer',
        company: 'Test Company',
        workAddress: {
          street: '456 Work Street',
          city: 'Addis Ababa',
          state: 'Addis Ababa',
          zipCode: '2000'
        },
        emergencyContacts: [{
          name: 'Emergency Contact',
          phone: '+2519112345679',
          relationship: 'Spouse',
          isPrimary: true
        }],
        preferences: {
          language: 'english',
          timezone: 'Africa/Addis_Ababa',
          currency: 'ETB',
          distanceUnit: 'km',
          familySize: 2
        },
        preferredCommunication: 'email'
      },
      notificationPreferences: {
        email: true,
        sms: true,
        push: true,
        pickupReminders: true,
        dropoffReminders: true,
        subscriptionUpdates: true,
        driverUpdates: true,
        paymentReminders: true,
        promotionalOffers: false
      }
    };
    
    const parent = await User.createParentIfNotExists(parentData);
    
    console.log('\n✅ Test parent created successfully!');
    console.log(`📧 Email: ${parent.email}`);
    console.log(`👤 Name: ${parent.firstName} ${parent.lastName}`);
    console.log(`📱 Phone: ${parent.phone}`);
    console.log(`👪 User Type: ${parent.userType}`);
    console.log(`📊 Status: ${parent.status}`);
    console.log(`🏠 Address: ${parent.address.street}, ${parent.address.city}`);
    console.log(`💼 Occupation: ${parent.parentInfo.occupation}`);
    console.log(`🏢 Company: ${parent.parentInfo.company}`);
    console.log(`👨‍👩‍👧‍👦 Family Size: ${parent.parentInfo.familySize}`);
    console.log(`📱 Preferred Communication: ${parent.parentInfo.preferredCommunication}`);
    
    console.log('\n🎉 Test parent is ready for testing!');
    console.log('📝 You can now:');
    console.log('   1. Login as parent@test.com / 12345678');
    console.log('   2. Navigate to /admin/parents/children');
    console.log('   3. Add children and test the functionality');
    
  } catch (error) {
    console.error('❌ Error creating test parent:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Database disconnected');
  }
}

// Run the test
createTestParent();
