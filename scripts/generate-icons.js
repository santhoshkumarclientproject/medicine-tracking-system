const fs = require('fs');
const path = require('path');

// Simple 1x1 or basic PNG generator if canvas isn't installed
// Minimal valid 1x1 PNG bytes:
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAE4wH89+b4sgAAAABJRU5ErkJggg==',
  'base64'
);

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), minimalPng);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), minimalPng);
console.log('PWA icons created in public/');
