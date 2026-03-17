const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ugoo:ugo1234@cluster0.cq73g0t.mongodb.net/?appName=Cluster0');

const Setting = require('../modules/integrations/models/Setting');

async function verifyApiKey() {
  try {
    console.log('🔍 Verifying Google Maps API Key Configuration...\n');
    
    const integration = await Setting.findOne({ keyName: 'google_maps' });
    
    if (!integration) {
      console.log('❌ Google Maps integration not found');
      return;
    }
    
    console.log('✅ Google Maps Integration Found:');
    console.log('- Key Name:', integration.keyName);
    console.log('- Active:', integration.isActive);
    console.log('- Mode:', integration.mode);
    console.log('- Settings Type:', integration.settingsType);
    
    console.log('\n🔑 API Keys:');
    console.log('- liveValues.api_key:', integration.liveValues?.api_key?.substring(0, 20) + '...');
    console.log('- testValues.api_key:', integration.testValues?.api_key?.substring(0, 20) + '...');
    console.log('- value.api_key:', integration.value?.api_key?.substring(0, 20) + '...');
    
    // Check which key matches the working key
    const workingKey = 'AIzaSyBxOv1W4MJkfVHPk7cccICUTBAJ-WdZ2pA';
    
    console.log('\n🎯 API Key Verification:');
    console.log('- Working Key:', workingKey.substring(0, 20) + '...');
    
    const liveValuesMatch = integration.liveValues?.api_key === workingKey;
    const testValuesMatch = integration.testValues?.api_key === workingKey;
    const valueMatch = integration.value?.api_key === workingKey;
    
    console.log('- liveValues matches:', liveValuesMatch ? '✅' : '❌');
    console.log('- testValues matches:', testValuesMatch ? '✅' : '❌');
    console.log('- value matches:', valueMatch ? '✅' : '❌');
    
    if (liveValuesMatch && testValuesMatch && valueMatch) {
      console.log('\n🎉 SUCCESS: All API keys are correctly configured!');
      console.log('🗺️ Google Maps should work in both school and zone modules');
    } else {
      console.log('\n⚠️  WARNING: Some API keys don\'t match the working key');
    }
    
    // Show what the frontend will receive
    console.log('\n📡 What Frontend Will Receive:');
    console.log('Endpoint: /api/integrations/google_maps');
    console.log('Expected Response Structure:');
    console.log('{');
    console.log('  success: true,');
    console.log('  data: {');
    console.log('    integration: {');
    console.log('      keyName: "google_maps",');
    console.log('      isActive: true,');
    console.log('      mode: "live",');
    console.log('      value: {');
    console.log('        api_key: "' + workingKey.substring(0, 20) + '..."');
    console.log('      }');
    console.log('    }');
    console.log('  }');
    console.log('}');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

verifyApiKey();
