// Test script to verify static files can be served
const fs = require('fs');
const path = require('path');

console.log('Testing static files...\n');

// Check if login.js exists
const loginJsPath = path.join(__dirname, 'public/js/login.js');
const exists = fs.existsSync(loginJsPath);

console.log('Login.js file path:', loginJsPath);
console.log('File exists:', exists);

if (exists) {
  const stats = fs.statSync(loginJsPath);
  const content = fs.readFileSync(loginJsPath, 'utf8');
  
  console.log('File size:', stats.size, 'bytes');
  console.log('File modified:', stats.mtime);
  console.log('First 100 characters:', content.substring(0, 100));
  console.log('Last 100 characters:', content.substring(content.length - 100));
} else {
  console.log('ERROR: login.js file not found!');
  
  // Check public directory structure
  const publicDir = path.join(__dirname, 'public');
  const jsDir = path.join(__dirname, 'public/js');
  
  console.log('\nPublic directory exists:', fs.existsSync(publicDir));
  console.log('JS directory exists:', fs.existsSync(jsDir));
  
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir);
    console.log('JS directory contents:', jsFiles);
  }
}

console.log('\nTest completed.');
