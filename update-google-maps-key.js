const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ugoo:ugo1234@cluster0.cq73g0t.mongodb.net/?appName=Cluster0');

const Setting = require('./modules/integrations/models/Setting');

async function updateGoogleMapsKey() {
  try {
    const result = await Setting.findOneAndUpdate(
      { keyName: 'google_maps' },
      { 
        $set: {
          'liveValues.api_key': 'AIzaSyBxOv1W4MJkfVHPk7cccICUTBAJ-WdZ2pA',
          'testValues.api_key': 'AIzaSyBxOv1W4MJkfVHPk7cccICUTBAJ-WdZ2pA'
        }
      },
      { new: true }
    );
    
    console.log('✅ Google Maps API key updated successfully!');
    console.log('Updated liveValues and testValues with working key');
    console.log('Key: AIzaSyBxOv1W4MJkfVHPk7cccICUTBAJ-WdZ2pA');
    console.log('Integration Status:');
    console.log('- Active:', result.isActive);
    console.log('- Mode:', result.mode);
    console.log('- liveValues key:', result.liveValues.api_key.substring(0, 20) + '...');
    console.log('- testValues key:', result.testValues.api_key.substring(0, 20) + '...');
    console.log('- value key:', result.value.api_key.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Error updating:', error.message);
  } finally {
    process.exit();
  }
}

updateGoogleMapsKey();
