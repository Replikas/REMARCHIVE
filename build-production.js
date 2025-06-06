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
  
  console.log('Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('Production build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}