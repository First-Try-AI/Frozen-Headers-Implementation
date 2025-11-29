// Output and Storage Processing Module
// Main orchestrator for timestamp generation, pagination, and storage

// Import specialized modules
const { createPageBreaks } = require('./pagination-module');
const { uploadPaginationData, uploadToGCS, uploadWordTimestamps, uploadLetterTimestamps } = require('./gcs-module');
const { generateLetterTimestamps, filterLetterTimestamps, calculateTrimMarkers } = require('./letter-timestamps');
const { generateTimestamps } = require('./timestamp-module');


// Export functions with same interface as before for compatibility
module.exports = {
  generateTimestamps,
  createPageBreaks,
  uploadPaginationData,
  uploadToGCS,
  uploadWordTimestamps,
  uploadLetterTimestamps,
  generateLetterTimestamps,
  filterLetterTimestamps,
  calculateTrimMarkers
};