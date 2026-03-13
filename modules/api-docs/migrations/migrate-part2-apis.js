const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo_admin')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const ApiEndpoint = require('../models/ApiEndpoint');

const part2Apis = [
  // ==========================================
  // User & Profile APIs
  // ==========================================
  {
    title: 'Update Profile',
    method: 'PUT',
    endpoint: '/api/users/profile',
    description: 'Update user profile (parent or driver). Parents can update name and photo. Drivers can also update date of birth and address.',
    category: 'User Profile',
    requiresAuth: true,
    order: 10,
    requestBody: {
      full_name: 'string (optional, min 2 words)',
      date_of_birth: 'string (optional, driver only, format: YYYY-MM-DD)',
      address: 'object (optional, driver only) { city, area }',
      photo: 'string (optional, base64 image)'
    },
    requestExample: JSON.stringify({
      full_name: "Meron Haile Gebremedhin",
      photo: "base64_image_string"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: "user_001",
          full_name: "Meron Haile Gebremedhin",
          phone: "0911234567",
          user_type: "parent",
          photo: "https://storage.ugo.et/users/user_001.jpg",
          status: "active",
          updated_at: "2026-03-07T10:00:00Z"
        }
      }
    },
    responseError: {
      success: false,
      error: { code: "INVALID_NAME", message: "Name must contain at least 2 words" }
    },
    notes: 'Driver response includes additional fields: date_of_birth, address, license_number'
  },
  {
    title: 'Request Phone Change',
    method: 'POST',
    endpoint: '/api/users/phone/change',
    description: 'Request phone number change. Requires current password for verification. OTP will be sent to the new phone number.',
    category: 'User Profile',
    requiresAuth: true,
    order: 11,
    requestBody: {
      new_phone: 'string (required, format: 0912345678)',
      password: 'string (required, current password)'
    },
    requestExample: JSON.stringify({
      new_phone: "0912345678",
      password: "SecurePass123"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: "OTP sent to new phone number",
      data: { new_phone: "0912345678", otp_expires_in: 300 }
    },
    responseError: {
      success: false,
      error: { code: "PHONE_EXISTS", message: "This phone number is already registered" }
    },
    notes: 'OTP hardcoded to 123456 for testing. Possible errors: PHONE_EXISTS, WRONG_PASSWORD'
  },
  {
    title: 'Verify New Phone',
    method: 'POST',
    endpoint: '/api/users/phone/verify',
    description: 'Verify new phone number with OTP received. Completes the phone change process.',
    category: 'User Profile',
    requiresAuth: true,
    order: 12,
    requestBody: {
      new_phone: 'string (required)',
      otp: 'string (required, 6 digits)'
    },
    requestExample: JSON.stringify({
      new_phone: "0912345678",
      otp: "123456"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: "Phone number updated successfully",
      data: { phone: "0912345678", updated_at: "2026-03-07T10:00:00Z" }
    },
    responseError: {
      success: false,
      error: { code: "INVALID_OTP", message: "OTP is invalid or expired" }
    }
  },

  // ==========================================
  // Children APIs
  // ==========================================
  {
    title: 'Get All Children',
    method: 'GET',
    endpoint: '/api/children',
    description: 'Get all children for the authenticated parent. Returns a list with basic info and subscription status.',
    category: 'Children',
    requiresAuth: true,
    order: 12,
    requestBody: null,
    requestExample: 'Headers: { Authorization: "Bearer <token>" }',
    responseSuccess: {
      success: true,
      data: {
        children: [
          {
            id: "child_001",
            full_name: "Abebe Kebede",
            school: { id: "school_001", name: "Dire Dawa Primary School" },
            grade: "Grade 5",
            pickup_location: { address: "Kezira, House #123" },
            subscription: { id: "sub_001", status: "active", group_name: "DD Primary - Morning A", driver_name: "Ato Bekele" },
            created_at: "2026-01-20T10:00:00Z"
          }
        ],
        total: 1
      }
    },
    responseError: {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" }
    }
  },
  {
    title: 'Get Single Child',
    method: 'GET',
    endpoint: '/api/children/{id}',
    description: 'Get detailed information about a single child including subscription, driver, and schedule details.',
    category: 'Children',
    requiresAuth: true,
    order: 13,
    requestBody: null,
    requestExample: 'GET /api/children/child_001\nHeaders: { Authorization: "Bearer <token>" }',
    responseSuccess: {
      success: true,
      data: {
        child: {
          id: "child_001",
          full_name: "Abebe Kebede",
          date_of_birth: "2015-05-10",
          gender: "male",
          school: { id: "school_001", name: "Dire Dawa Primary School" },
          grade: "Grade 5",
          pickup_location: { address: "Kezira, House #123", lat: 9.6, lng: 41.85 },
          emergency_contact: { name: "Almaz Kebede", phone: "0922345678", relationship: "Mother" },
          medical_notes: "None",
          subscription: {
            id: "sub_001",
            status: "active",
            group: { id: "group_001", name: "DD Primary - Morning A" },
            driver: { id: "driver_001", name: "Ato Bekele Tadesse", phone: "0933456789", rating: 4.8 },
            schedule: { pickup_time: "07:15", drop_time: "16:30" },
            price: 2800,
            start_date: "2026-03-01",
            payment_due: "2026-03-25"
          },
          created_at: "2026-01-20T10:00:00Z"
        }
      }
    },
    responseError: {
      success: false,
      error: { code: "CHILD_NOT_FOUND", message: "Child not found" }
    }
  },
  {
    title: 'Add New Child',
    method: 'POST',
    endpoint: '/api/children',
    description: 'Add a new child to the parent account. Required fields: full_name and pickup_location. After adding, the next step is to search for a transport group.',
    category: 'Children',
    requiresAuth: true,
    order: 14,
    requestBody: {
      full_name: 'string (required)',
      date_of_birth: 'string (optional, YYYY-MM-DD)',
      gender: 'string (optional: "male" or "female")',
      school_id: 'string (optional)',
      grade: 'string (optional)',
      pickup_location: 'object (required) { address, lat, lng }',
      emergency_contact: 'object (optional) { name, phone, relationship }',
      medical_notes: 'string (optional)',
      photo: 'string (optional, base64)'
    },
    requestExample: JSON.stringify({
      full_name: "Abebe Kebede",
      date_of_birth: "2015-05-10",
      gender: "male",
      school_id: "school_001",
      grade: "Grade 5",
      pickup_location: { address: "Kezira, House #123", lat: 9.6, lng: 41.85 },
      emergency_contact: { name: "Almaz Kebede", phone: "0922345678", relationship: "Mother" },
      medical_notes: "None"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: "Child added successfully",
      data: {
        child: {
          id: "child_001",
          full_name: "Abebe Kebede",
          school: { id: "school_001", name: "Dire Dawa Primary School" },
          grade: "Grade 5",
          subscription: null,
          created_at: "2026-03-07T10:00:00Z"
        },
        next_step: "search_group"
      }
    },
    responseError: {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Missing required fields",
        details: { full_name: "Full name is required", pickup_location: "Pickup location is required" }
      }
    }
  },
  {
    title: 'Update Child',
    method: 'PUT',
    endpoint: '/api/children/{id}',
    description: 'Update child information. Cannot change school while subscription is active.',
    category: 'Children',
    requiresAuth: true,
    order: 15,
    requestBody: {
      full_name: 'string (optional)',
      grade: 'string (optional)',
      pickup_location: 'object (optional) { address, lat, lng }',
      emergency_contact: 'object (optional) { name, phone, relationship }',
      medical_notes: 'string (optional)',
      photo: 'string (optional, base64)'
    },
    requestExample: JSON.stringify({
      full_name: "Abebe Kebede Tadesse",
      grade: "Grade 6",
      pickup_location: { address: "Megala, House #456", lat: 9.61, lng: 41.86 },
      emergency_contact: { name: "Kebede Tadesse", phone: "0911234567", relationship: "Father" }
    }, null, 2),
    responseSuccess: {
      success: true,
      message: "Child updated successfully",
      data: {
        child: {
          id: "child_001",
          full_name: "Abebe Kebede Tadesse",
          grade: "Grade 6",
          updated_at: "2026-03-07T10:00:00Z"
        }
      }
    },
    responseError: {
      success: false,
      error: { code: "CANNOT_CHANGE_SCHOOL", message: "Cannot change school while subscription is active. Cancel subscription first." }
    },
    notes: 'Cannot change school_id while child has an active subscription.'
  },
  {
    title: 'Delete Child',
    method: 'DELETE',
    endpoint: '/api/children/{id}',
    description: 'Soft-delete a child. Cannot delete a child with an active subscription.',
    category: 'Children',
    requiresAuth: true,
    order: 16,
    requestBody: null,
    requestExample: 'DELETE /api/children/child_001\nHeaders: { Authorization: "Bearer <token>" }',
    responseSuccess: {
      success: true,
      message: "Child removed successfully"
    },
    responseError: {
      success: false,
      error: { code: "HAS_ACTIVE_SUBSCRIPTION", message: "Cannot delete child with active subscription. Cancel subscription first." }
    }
  }
];

async function migrate() {
  try {
    console.log('Starting Part 2 API migration...');
    
    // Clear existing Part 2 categories
    await ApiEndpoint.deleteMany({ category: { $in: ['Children'] } });
    
    // Update existing User Profile entries (keep auth ones, add new ones)
    const existingProfileApis = await ApiEndpoint.find({ 
      category: 'User Profile',
      endpoint: { $in: ['/api/users/profile', '/api/users/phone/change', '/api/users/phone/verify'] }
    });
    
    if (existingProfileApis.length > 0) {
      await ApiEndpoint.deleteMany({
        category: 'User Profile',
        endpoint: { $in: ['/api/users/profile', '/api/users/phone/change', '/api/users/phone/verify'] }
      });
      console.log('Cleared existing Part 2 User Profile APIs');
    }
    
    console.log('Cleared existing Children APIs');
    
    const result = await ApiEndpoint.insertMany(part2Apis);
    console.log(`✅ Successfully migrated ${result.length} Part 2 API endpoints`);
    
    // Show summary
    const allEndpoints = await ApiEndpoint.find({ isActive: true }).sort({ category: 1, order: 1 });
    const grouped = {};
    allEndpoints.forEach(ep => {
      if (!grouped[ep.category]) grouped[ep.category] = 0;
      grouped[ep.category]++;
    });
    
    console.log('\n📊 API Documentation Summary:');
    Object.entries(grouped).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} endpoints`);
    });
    console.log(`   Total: ${allEndpoints.length} endpoints`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
