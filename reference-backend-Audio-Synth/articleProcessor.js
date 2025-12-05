// Article Text Extraction Module
// Handles fetching articles from URLs and extracting clean readable text

const { fetchArticleContent, validateUrl } = require('./urlFetcher');

const DEBUG = process.env.ARTICLE_DEBUG === 'true';

function debugLog(message, data = null) {
  if (DEBUG) {
    console.log(`📄 [ARTICLE] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Extract clean article text from URL
 * @param {string} url - The article URL to process
 * @returns {Promise<Object>} Object containing cleaned text and metadata
 */
async function extractArticleText(url) {
  console.log(`📄 [ARTICLE] Starting article text extraction from: ${url}`);

  try {
    // Fetch and extract the article content
    const articleData = await fetchArticleContent(url);

    console.log(`📄 [ARTICLE] Successfully extracted: "${articleData.title}"`);
    console.log(`📄 [ARTICLE] Content length: ${articleData.content.length} characters`);

    debugLog('Article extraction complete', {
      title: articleData.title,
      source: articleData.source,
      date: articleData.date,
      contentPreview: articleData.content.substring(0, 200) + '...'
    });

    return {
      cleanedText: articleData.content,
      articleMetadata: {
        title: articleData.title,
        source: articleData.source,
        date: articleData.date,
        url: articleData.url,
        extractedAt: articleData.extractedAt,
        contentLength: articleData.content.length
      }
    };

  } catch (error) {
    console.error('❌ [ARTICLE] Error extracting article text:', error.message);
    throw new Error(`Failed to extract article text: ${error.message}`);
  }
}

/**
 * Validate input parameters for article text extraction
 * @param {string} url - The article URL to validate
 */
function validateArticleTextInput(url) {
  validateUrl(url);
}

module.exports = {
  extractArticleText,
  validateArticleTextInput
};
