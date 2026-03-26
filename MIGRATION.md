# UGO Admin Database Migration Guide

This guide helps you migrate important data to your new UGO Admin database.

## 🚀 Quick Start

### Option 1: Essential Migration (Recommended for new setups)
```bash
npm run migrate:essentials
```

This creates:
- Default admin user
- Sample schools
- Basic integration settings

### Option 2: Full Migration (For existing data)
```bash
npm run migrate
```

This migrates:
- All user accounts
- Children profiles
- Schools and locations
- Integration settings

## 📋 Migration Components

### 👥 Users & Authentication
- **Admin Account**: Creates default admin (admin@ugo.com / admin123456)
- **Parent Accounts**: Migrates existing parent users
- **Driver Accounts**: Migrates driver profiles
- **Authentication**: Preserves passwords and tokens

### 👶 Children Profiles
- **Basic Info**: Name, grade, age
- **School Assignment**: Links to migrated schools
- **Pickup Locations**: Home addresses with coordinates
- **Transportation Schedules**: Morning/afternoon pickup times
- **Emergency Contacts**: Parent contact information

### 🏫 Schools & Locations
- **School Details**: Name, type, grades offered
- **Geolocation**: Coordinates for map services
- **Contact Info**: Phone, email, website
- **Operating Hours**: School schedule
- **Service Areas**: Transportation radius

### ⚙️ Integration Settings
- **Google Maps**: API key configuration
- **SMS Gateway**: Text message settings
- **Push Notifications**: Firebase configuration
- **Email Service**: SMTP settings

## 🔧 Before Migration

### 1. Backup Current Database
```bash
# MongoDB backup
mongodump --uri="your_current_db_uri" --out=backup_$(date +%Y%m%d)
```

### 2. Update Environment Variables
```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/ugo_admin_new
MONGODB_URL=mongodb://localhost:27017/ugo_admin_new
```

### 3. Install Dependencies
```bash
npm install
```

## 🚀 Running Migration

### Essential Migration (New Setup)
```bash
# Creates basic data needed for system to work
npm run migrate:essentials
```

**What it creates:**
- ✅ Default admin user
- ✅ 3 sample schools (Addis Ababa, Mekelle, Dire Dawa)
- ✅ Google Maps integration setup
- ✅ SMS, email, and notification settings

### Full Migration (Existing Data)
```bash
# Migrates all existing data from old database
npm run migrate
```

**What it migrates:**
- ✅ All user accounts (parents, drivers, admins)
- ✅ All children profiles with schedules
- ✅ All schools and location data
- ✅ All integration settings
- ✅ Preserves relationships and references

## 📊 Migration Results

After migration, you'll see:
```
📊 Migration Summary:
👥 Users: 15 total
👶 Children: 42 total
🏫 Schools: 8 total
⚙️  Settings: 12 total

📈 Migration Statistics:
✅ Successfully migrated: 77 items
❌ Failed migrations: 0 items

🎉 Migration completed successfully!
```

## 🔍 Post-Migration Checklist

### 1. Verify Data
```bash
# Check database counts
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const User = require('./modules/auth/models/User');
const Child = require('./modules/children/models/Child');
const School = require('./modules/schools/models/School');
Promise.all([
  User.countDocuments(),
  Child.countDocuments(),
  School.countDocuments()
]).then(([users, children, schools]) => {
  console.log(\`Users: \${users}, Children: \${children}, Schools: \${schools}\`);
  process.exit(0);
});
"
```

### 2. Test Login
- Go to: `http://localhost:3001/admin/login`
- Login with: `admin@ugo.com` / `admin123456`

### 3. Configure Settings
1. **Google Maps API**: Update with your API key
2. **SMS Gateway**: Configure Twilio or other provider
3. **Email**: Set up SMTP settings
4. **Push Notifications**: Add Firebase config

### 4. Verify Features
- ✅ Admin can create parents
- ✅ Parents can add children
- ✅ School selection works
- ✅ Address geocoding functions
- ✅ Schedule creation works

## 🛠️ Troubleshooting

### Common Issues

#### 1. Connection Error
```
❌ Failed to connect to new database
```
**Solution**: Check MONGODB_URI in .env file

#### 2. Duplicate Data
```
⚠️  User already exists, skipping...
```
**Solution**: This is normal - script prevents duplicates

#### 3. Missing References
```
❌ Child has no parent, skipping...
```
**Solution**: Ensure parent users exist before migrating children

#### 4. Validation Errors
```
❌ Failed to migrate user: validation failed
```
**Solution**: Check required fields in model schemas

### Manual Fixes

#### Create Missing Admin
```bash
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./modules/auth/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hashed = await bcrypt.hash('admin123456', 12);
  const admin = new User({
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@ugo.com',
    phone: '+251911000001',
    password: hashed,
    userType: 'admin',
    status: 'active',
    emailVerified: true
  });
  await admin.save();
  console.log('✅ Admin user created');
  process.exit(0);
});
"
```

#### Reset Database
```bash
# ⚠️ WARNING: This deletes all data!
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await mongoose.connection.db.dropDatabase();
  console.log('✅ Database reset');
  process.exit(0);
});
"
```

## 🔄 Advanced Migration

### Custom Migration Script
Create `custom-migration.js`:
```javascript
const mongoose = require('mongoose');
const User = require('./modules/auth/models/User');

async function customMigrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Your custom migration logic here
  const users = await User.find({ userType: 'customer' });
  console.log(\`Found \${users.length} customers\`);
  
  await mongoose.connection.close();
}

customMigrate().catch(console.error);
```

### Partial Migration
```bash
# Migrate only users
node -e "
require('./migrate-database.js').then(migrator => {
  migrator.migrateUsers();
});
"
```

## 📞 Support

If you encounter issues:

1. Check the migration logs for specific error messages
2. Verify your .env configuration
3. Ensure MongoDB is running and accessible
4. Check model schemas for validation requirements

## 🎯 Best Practices

1. **Always backup before migration**
2. **Test migration on development first**
3. **Run essential migration for new setups**
4. **Verify data after migration**
5. **Update default passwords immediately**
6. **Configure integrations before going live**

---

**Ready to migrate? Run `npm run migrate:essentials` to get started!** 🚀
