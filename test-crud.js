// Test CRUD operations for parent and driver creation
const testParentCreation = async () => {
  const parentData = {
    firstName: "Test",
    lastName: "Parent",
    email: "testparent@example.com",
    phone: "+251911111111",
    password: "password123",
    address: "123 Test St",
    userType: "customer",
    role: "parent",
    children: [
      {
        firstName: "Child",
        lastName: "One",
        age: 8,
        gender: "male",
        grade: "3rd"
      },
      {
        firstName: "Child",
        lastName: "Two",
        age: 6,
        gender: "female",
        grade: "1st"
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parentData)
    });

    const result = await response.json();
    console.log('Parent creation result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Parent created successfully with', result.data.user.children?.length || 0, 'children');
    } else {
      console.log('❌ Parent creation failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

const testDriverCreation = async () => {
  const driverData = {
    firstName: "Test",
    lastName: "Driver",
    email: "testdriver@example.com",
    phone: "+251922222222",
    password: "password123",
    address: "456 Test Ave",
    userType: "driver",
    role: "driver",
    driverInfo: {
      licenseNumber: "DL123456",
      licenseExpiry: "2026-12-31",
      vehicleType: "sedan",
      isVerified: false
    }
  };

  try {
    const response = await fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData)
    });

    const result = await response.json();
    console.log('Driver creation result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Driver created successfully with license:', result.data.user.driverInfo?.licenseNumber);
    } else {
      console.log('❌ Driver creation failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

const testGetUsers = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/users?limit=5');
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Get users successful. Found', result.data.pagination.total, 'users');
      console.log('Sample users:', result.data.users.slice(0, 2).map(u => ({
        name: `${u.firstName} ${u.lastName}`,
        type: u.userType,
        hasChildren: u.children?.length > 0
      })));
    } else {
      console.log('❌ Get users failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run tests
(async () => {
  console.log('\n=== Testing Parent Creation ===');
  await testParentCreation();
  
  console.log('\n=== Testing Driver Creation ===');
  await testDriverCreation();
  
  console.log('\n=== Testing Get Users ===');
  await testGetUsers();
  
  console.log('\n=== Tests Complete ===\n');
})();
