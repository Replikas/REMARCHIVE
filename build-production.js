#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building for production deployment...');

// Set production environment
process.env.NODE_ENV = 'production';

try {
  // Ensure all dependencies are available for build
  console.log('Ensuring build dependencies...');
  
  // Use the production vite config that excludes Replit plugins
  console.log('Building frontend with production config...');
  execSync('npx vite build --config vite.config.production.ts', { stdio: 'inherit' });
  
  console.log('Building production server...');
  execSync('npx esbuild server/index.production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', { stdio: 'inherit' });
  
  console.log('Production build completed successfully!');
  console.log('Files ready for deployment:');
  console.log('- Frontend: dist/public/');
  console.log('- Backend: dist/index.js');
} catch (error) {
  console.error('Build failed:', error.message);
  console.error('Trying alternative build approach...');
  
  try {
    // Fallback: use npx with explicit vite call
    console.log('Using npx vite execution...');
    execSync('npx --yes vite build --config vite.config.production.ts', { stdio: 'inherit' });
    execSync('npx esbuild server/index.production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', { stdio: 'inherit' });
    console.log('Fallback build completed successfully!');
  } catch (fallbackError) {
    console.error('Both build methods failed:', fallbackError.message);
    process.exit(1);
  }
}