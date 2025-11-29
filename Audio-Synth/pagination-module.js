// Hierarchical Punctuation-Based Pagination Module
// Thin wrapper that maintains backward compatibility
// Main logic has been refactored into focused modules

const { createPageBreaks } = require('./pagination-core');

module.exports = {
  createPageBreaks
};