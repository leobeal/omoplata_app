#!/usr/bin/env node
/**
 * Generates tenant-specific asset imports at build time.
 * Run before expo start/build: node scripts/generate-tenant-assets.js
 */
const fs = require('fs');
const path = require('path');

const tenant = process.env.TENANT || 'main';
const outputPath = path.resolve(__dirname, '../generated/tenant-icon.ts');
const outputDir = path.dirname(outputPath);

// Ensure generated directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if tenant has an icon
const tenantIconPath = path.resolve(__dirname, `../assets/${tenant}/icon.png`);
const hasTenantIcon = fs.existsSync(tenantIconPath);

const content = hasTenantIcon
  ? `// Auto-generated for tenant: ${tenant}
// Do not edit manually - run: TENANT=${tenant} node scripts/generate-tenant-assets.js
export const TENANT_ICON = require('@/assets/${tenant}/icon.png');
`
  : `// Auto-generated for tenant: ${tenant} (no custom icon)
export const TENANT_ICON = null;
`;

fs.writeFileSync(outputPath, content);
console.log(`Generated tenant assets for: ${tenant}`);
