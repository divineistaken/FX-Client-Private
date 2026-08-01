import { execSync } from 'child_process';
import fs from 'fs';

execSync('mkdir -p dist', { stdio: 'inherit' });
execSync('cp latest.html dist/', { stdio: 'inherit' });
execSync('cp latest.js dist/', { stdio: 'inherit' });
execSync('cp -r build dist/', { stdio: 'inherit' });
fs.writeFileSync('dist/index.html', '<meta http-equiv="refresh" content="0; url=latest.html">');
console.log('Dist folder prepared successfully!');
