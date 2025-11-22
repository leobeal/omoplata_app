// Setup global mocks before Jest environment loads
// This handles Expo SDK 54's winter runtime

// Add structuredClone if not available (Node.js < 17)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock the __ExpoImportMetaRegistry global
if (typeof global.__ExpoImportMetaRegistry === 'undefined') {
  global.__ExpoImportMetaRegistry = {
    register: () => {},
    get: () => ({}),
  };
}
