/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Get current tenant from env
const currentTenant = process.env.TENANT || 'main';

// Find all tenant asset folders (exclude _global)
const assetsDir = path.resolve(__dirname, 'assets');
const tenantFolders = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter((f) => {
      const fullPath = path.join(assetsDir, f);
      return fs.statSync(fullPath).isDirectory() && !f.startsWith('_') && !f.startsWith('.');
    })
  : [];

// Block other tenants' asset folders
const otherTenantPatterns = tenantFolders
  .filter((folder) => folder !== currentTenant)
  .map((folder) => new RegExp(path.resolve(assetsDir, folder) + '/.*'));

// Force cache reset and improve resolver
config.resetCache = true;
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'js', 'jsx', 'ts', 'tsx', 'json'],
  blockList: [
    ...(config.resolver?.blockList || []),
    new RegExp(path.resolve(__dirname, '__old') + '/.*'),
    ...otherTenantPatterns,
  ],
};

module.exports = withNativeWind(config, { input: './global.css' });
