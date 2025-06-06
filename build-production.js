#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building for production deployment...');

// Set production environment
process.env.NODE_ENV = 'production';

try {
  // Use the production vite config that excludes Replit plugins
  console.log('Building frontend with production config...');
  execSync('vite build --config vite.config.production.ts', { stdio: 'inherit' });
  
  console.log('Copying production server...');
  execSync('cp server/index.production.ts dist/index.js', { stdio: 'inherit' });
  
  console.log('Production build completed successfully!');
  console.log('Files ready for deployment:');
  console.log('- Frontend: dist/public/');
  console.log('- Backend: dist/index.js');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}