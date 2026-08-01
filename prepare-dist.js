import fs from 'fs';

fs.mkdirSync('dist', { recursive: true });

try {
  fs.copyFileSync('latest.html', 'dist/latest.html');
  console.log('Copied latest.html');
} catch (e) {
  console.error('Failed to copy latest.html:', e.message);
}

try {
  fs.copyFileSync('latest.js', 'dist/latest.js');
  console.log('Copied latest.js');
} catch (e) {
  console.error('Failed to copy latest.js:', e.message);
}

try {
  fs.cpSync('build', 'dist/build', { recursive: true });
  console.log('Copied build folder');
} catch (e) {
  console.error('Failed to copy build folder:', e.message);
}

fs.writeFileSync('dist/index.html', '<meta http-equiv="refresh" content="0; url=latest.html">');
console.log('Created index.html');
console.log('Dist folder prepared successfully!');
