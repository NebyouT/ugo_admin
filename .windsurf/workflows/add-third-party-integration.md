---
description: Integrate a third-party service (API, payment gateway, etc.)
---

# Add Third-Party Integration Workflow

Follow these steps to integrate a third-party service:

## 1. Create Migration Script
File: `modules/integrations/migrations/init-[service].js`

```javascript
const Setting = require('../models/Setting');

async function initialize[Service]() {
  try {
    const existing = await Setting.findOne({ keyName: '[service_key]' });
    
    if (!existing) {
      await Setting.create({
        keyName: '[service_key]',
        settingsType: '[type]', // sms_gateway, payment_gateway, map_api, etc.
        description: '[Service] integration',
        value: {
          api_key: '',
          // other config fields
        },
        liveValues: {},
        testValues: {},
        mode: 'test',
        isActive: false
      });
      console.log('[Service] integration initialized');
    }
  } catch (error) {
    console.error('Failed to initialize [service]:', error);
  }
}

module.exports = initialize[Service];
```

## 2. Create Service Class
File: `modules/integrations/services/[Service]Service.js`

Must include:
- `getAPIKey()` - Fetch API key from database
- `getConfig()` - Get full configuration
- Service-specific methods
- `validateAPIKey()` - Test if API key works

**IMPORTANT**: Always fetch API key from database, NEVER hardcode!

```javascript
class [Service]Service {
  static async getAPIKey() {
    const integration = await Setting.findOne({ keyName: '[service_key]' });
    if (!integration || !integration.isActive) {
      throw new Error('[Service] integration not configured');
    }
    const config = integration.mode === 'live' ? integration.liveValues : integration.testValues || integration.value;
    return config.api_key;
  }
  
  static async validateAPIKey() {
    // Test actual API call
    // Return { valid: boolean, message: string }
  }
}
```

## 3. Add Test Method to IntegrationController
File: `modules/integrations/controllers/IntegrationController.js`

a. Add case to switch statement in `test()` method:
```javascript
case '[type]':
  testResult = await this.test[Service]API(config, testResult);
  break;
```

b. Add test method:
```javascript
static async test[Service]API(config, testResult) {
  try {
    const [Service]Service = require('../services/[Service]Service');
    const validation = await [Service]Service.validateAPIKey();
    
    if (validation.valid) {
      testResult.status = 'success';
      testResult.message = '[Service] API is working correctly';
    } else {
      testResult.status = 'failed';
      testResult.message = validation.message;
    }
  } catch (error) {
    testResult.status = 'failed';
    testResult.message = error.message;
  }
  return testResult;
}
```

## 4. Initialize on Server Start
File: `app.js` (in database initialization section)

```javascript
const init[Service] = require('./modules/integrations/migrations/init-[service]');
await init[Service]();
```

## 5. Use Service in Controllers
```javascript
const [Service]Service = require('../../integrations/services/[Service]Service');

class MyController {
  static async myMethod(req, res) {
    try {
      const result = await [Service]Service.performAction(params);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVICE_ERROR', message: error.message }
      });
    }
  }
}
```

## 6. Configure via Admin Panel
1. Go to `/admin/integrations`
2. Find your integration
3. Click Edit
4. Add API key and configuration in JSON format
5. Toggle Active
6. Click Test to validate

## Checklist
- [ ] Migration script created
- [ ] Service class created with getAPIKey()
- [ ] Service methods implemented
- [ ] validateAPIKey() method added
- [ ] Test method added to IntegrationController
- [ ] Initialization added to app.js
- [ ] Service used in controllers (not hardcoded)
- [ ] Integration tested via admin panel
- [ ] Documentation updated

## Important Rules
1. **NEVER hardcode API keys** - Always fetch from database
2. **Support live/test modes** - Use mode field to switch configs
3. **Test method required** - Must validate actual API
4. **Error handling** - Graceful fallbacks for missing config
5. **Security** - Store sensitive data in database, not code

## Reference
See existing integrations:
- `modules/integrations/services/GoogleMapsService.js` - Complete example
