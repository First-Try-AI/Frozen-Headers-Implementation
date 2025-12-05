// URL Fetching and Content Extraction Module
// Handles fetching articles from URLs and extracting readable content

const axios = require('axios');

let cheerio;
try {
  cheerio = require('cheerio');
} catch (error) {
  console.warn('⚠️ [URL-FETCHER] Cheerio not available, HTML parsing will be limited');
  cheerio = null;
}

const DEBUG = process.env.URL_DEBUG === 'true';

function debugLog(message, data = null) {
  if (DEBUG) {
    console.log(`🌐 [URL-FETCHER] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Fetch article content from URL and extract readable text
 * @param {string} url - The article URL to fetch
 * @returns {Promise<Object>} Object containing title, source, and content
 */
async function fetchArticleContent(url) {
  console.log(`🌐 [URL-FETCHER] Starting article fetch from: ${url}`);

  // TEMPORARY TEST: Return mock data for testing
  if (url.includes('test-article')) {
    console.log(`🌐 [URL-FETCHER] Returning mock data for test URL`);
    return {
      title: "Test Article: Political Divide in Congress",
      source: "Test News",
      date: "December 4, 2025",
      content: "This is a test article about political divisions in Congress. Republican women are expressing frustration with Speaker Mike Johnson's conservative leadership style. The article discusses various perspectives on how different political factions are approaching legislative priorities. Some members feel that the current approach is too rigid while others believe it's necessary for maintaining party principles. The story examines the balance between pragmatism and ideology in modern politics.",
      url: url,
      extractedAt: new Date().toISOString()
    };
  }

  try {
    // Validate URL
    if (!url || typeof url !== 'string' || !isValidUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    debugLog('Fetching URL', { url });

    // Fetch the HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000, // 15 second timeout
      maxContentLength: 5 * 1024 * 1024 // 5MB max
    });

    debugLog('HTML fetched successfully', { status: response.status, contentLength: response.data.length });

    // Parse HTML and extract content
    const extractedContent = extractArticleContent(response.data, url);

    console.log(`🌐 [URL-FETCHER] Successfully extracted content: "${extractedContent.title}" from ${extractedContent.source}`);

    return extractedContent;

  } catch (error) {
    console.error('❌ [URL-FETCHER] Error fetching article:', error.message);
    if (error.response) {
      console.error('❌ [URL-FETCHER] Response status:', error.response.status);
    }
    throw new Error(`Failed to fetch article: ${error.message}`);
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extract article content from HTML
 * @param {string} html - Raw HTML content
 * @param {string} url - Original URL for source detection
 * @returns {Object} Extracted title, source, and content
 */
function extractArticleContent(html, url) {
  if (!cheerio) {
    // Fallback parsing without cheerio
    console.warn('⚠️ [URL-FETCHER] Using fallback HTML parsing (limited functionality)');
    return extractArticleContentFallback(html, url);
  }

  const $ = cheerio.load(html);

  // Remove script, style, and other non-content elements
  $('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, .related, .comments').remove();

  // Try multiple selectors for title extraction
  let title = '';
  const titleSelectors = [
    'title',
    'h1',
    '[data-testid="headline"]',
    '.headline',
    '.article-title',
    '.entry-title',
    'meta[property="og:title"]',
    'meta[name="title"]'
  ];

  for (const selector of titleSelectors) {
    if (selector.startsWith('meta[')) {
      const content = $(selector).attr('content');
      if (content && content.trim().length > 0) {
        title = content.trim();
        break;
      }
    } else {
      const element = $(selector).first();
      if (element.length > 0 && element.text().trim().length > 0) {
        title = element.text().trim();
        break;
      }
    }
  }

  // Extract source from URL or meta tags
  let source = extractSourceFromUrl(url);

  // Try to get source from meta tags if URL parsing didn't work
  if (!source || source === 'Unknown') {
    const sourceSelectors = [
      'meta[property="og:site_name"]',
      'meta[name="publisher"]',
      'meta[name="author"]',
      '.source',
      '.byline',
      '.publisher'
    ];

    for (const selector of sourceSelectors) {
      const content = $(selector).attr('content') || $(selector).text();
      if (content && content.trim().length > 0 && content.trim().length < 100) {
        source = content.trim();
        break;
      }
    }
  }

  // Extract main article content
  let content = '';

  // Try article-specific selectors first
  const contentSelectors = [
    'article',
    '[data-testid="article-body"]',
    '.article-body',
    '.entry-content',
    '.post-content',
    '.content',
    'main',
    '.main-content'
  ];

  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      content = element.text().trim();
      if (content.length > 500) { // Only use if substantial content
        break;
      }
    }
  }

  // Fallback: get all paragraph text if no article content found
  if (!content || content.length < 500) {
    content = $('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
  }

  // Extract date from article
  let date = extractArticleDate($, url);

  // Clean up content
  content = cleanContent(content);

  // Ensure we have minimum viable content
  if (!title || title.length < 5) {
    title = 'Article Title Not Found';
  }

  if (!source || source.length < 2) {
    source = 'Unknown Source';
  }

  if (!date || date === 'Unknown Date') {
    date = 'Date Not Available';
  }

  if (!content || content.length < 100) {
    throw new Error('Insufficient article content extracted');
  }

  debugLog('Content extraction complete', {
    titleLength: title.length,
    source,
    date,
    contentLength: content.length
  });

  return {
    title,
    source,
    date,
    content,
    url,
    extractedAt: new Date().toISOString()
  };
}

/**
 * Extract source/domain from URL
 * @param {string} url - Full URL
 * @returns {string} Clean source name
 */
function extractSourceFromUrl(url) {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname.toLowerCase();

    // Remove www. prefix
    domain = domain.replace(/^www\./, '');

    // Handle common domains
    const domainMap = {
      'cnn.com': 'CNN',
      'bbc.com': 'BBC',
      'bbc.co.uk': 'BBC',
      'nytimes.com': 'New York Times',
      'washingtonpost.com': 'Washington Post',
      'foxnews.com': 'Fox News',
      'msnbc.com': 'MSNBC',
      'npr.org': 'NPR',
      'reuters.com': 'Reuters',
      'apnews.com': 'Associated Press',
      'politico.com': 'Politico',
      'theguardian.com': 'The Guardian',
      'wsj.com': 'Wall Street Journal',
      'usatoday.com': 'USA Today',
      'news.yahoo.com': 'Yahoo News',
      'news.google.com': 'Google News'
    };

    return domainMap[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch {
    return 'Unknown Source';
  }
}

/**
 * Extract article publication date
 * @param {object} $ - Cheerio instance
 * @param {string} url - Article URL
 * @returns {string} Formatted date or 'Unknown Date'
 */
function extractArticleDate($, url) {
  // Try various date selectors
  const dateSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="publishdate"]',
    'meta[name="date"]',
    'meta[name="DC.date"]',
    'time[datetime]',
    '.published-date',
    '.article-date',
    '.byline-date',
    '.timestamp',
    '[data-date]',
    '.date'
  ];

  for (const selector of dateSelectors) {
    try {
      let dateValue = '';

      if (selector.startsWith('meta[')) {
        dateValue = $(selector).attr('content');
      } else if (selector.includes('[datetime]')) {
        dateValue = $(selector).first().attr('datetime');
      } else {
        dateValue = $(selector).first().text().trim();
      }

      if (dateValue && dateValue.length > 0) {
        // Try to parse and format the date
        const parsedDate = parseAndFormatDate(dateValue);
        if (parsedDate !== 'Unknown Date') {
          return parsedDate;
        }
      }
    } catch (error) {
      // Continue to next selector
      continue;
    }
  }

  // Try to extract date from URL pattern (common in news sites)
  const urlDateMatch = extractDateFromUrl(url);
  if (urlDateMatch) {
    return urlDateMatch;
  }

  return 'Unknown Date';
}

/**
 * Parse and format various date formats
 * @param {string} dateStr - Raw date string
 * @returns {string} Formatted date or 'Unknown Date'
 */
function parseAndFormatDate(dateStr) {
  try {
    // Handle ISO dates
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Handle YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Handle MM/DD/YYYY format
    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Handle "Month DD, YYYY" format
    if (dateStr.match(/^[A-Za-z]+ \d{1,2}, \d{4}/)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }

    // If we can't parse it but it looks like a date string, return as-is
    if (dateStr.length > 5 && dateStr.length < 50) {
      return dateStr;
    }

  } catch (error) {
    // Fall through to return 'Unknown Date'
  }

  return 'Unknown Date';
}

/**
 * Try to extract date from URL patterns
 * @param {string} url - Article URL
 * @returns {string|null} Formatted date or null
 */
function extractDateFromUrl(url) {
  try {
    // Common URL patterns: /2024/12/03/ or /2024-12-03/ or /12/03/2024/
    const patterns = [
      /\/(\d{4})\/(\d{1,2})\/(\d{1,2})\//,  // /2024/12/03/
      /\/(\d{4})-(\d{1,2})-(\d{1,2})\//,    // /2024-12-03/
      /\/(\d{1,2})\/(\d{1,2})\/(\d{4})\//   // /12/03/2024/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let year, month, day;

        if (match[1].length === 4) {
          // YYYY/MM/DD or YYYY-MM-DD format
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1; // JS months are 0-based
          day = parseInt(match[3]);
        } else {
          // MM/DD/YYYY format
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        }

        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
    }
  } catch (error) {
    // Return null on error
  }

  return null;
}

/**
 * Clean and normalize extracted content
 * @param {string} content - Raw extracted content
 * @returns {string} Clean content
 */
function cleanContent(content) {
  if (!content) return '';

  return content
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    // Remove common ad/marketing phrases
    .replace(/\b(?:read more|click here|subscribe|follow us|share this|advertisement|advertising|sponsored)\b/gi, '')
    // Remove excessive punctuation
    .replace(/[^\w\s.,!?-]/g, '')
    // Trim and clean up
    .trim()
    // Limit to reasonable length (first 10,000 characters should be sufficient for analysis)
    .substring(0, 10000);
}

/**
 * Validate URL input
 * @param {string} url - URL to validate
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('URL is required and must be a non-empty string');
  }

  if (!isValidUrl(url.trim())) {
    throw new Error('Invalid URL format provided');
  }

  // Basic security check - prevent localhost/private IPs
  const urlObj = new URL(url.trim());
  const hostname = urlObj.hostname.toLowerCase();

  if (hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')) {
    throw new Error('Local/private IP addresses are not allowed');
  }
}

/**
 * Fallback HTML parsing when cheerio is not available
 * @param {string} html - Raw HTML content
 * @param {string} url - Article URL
 * @returns {Object} Extracted article data
 */
function extractArticleContentFallback(html, url) {
  console.warn('⚠️ [URL-FETCHER] Using basic fallback HTML parsing');

  // Basic title extraction using regex
  let title = 'Article Title Not Found';
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Basic content extraction - look for paragraph tags
  const paragraphs = [];
  const paraRegex = /<p[^>]*>(.*?)<\/p>/gi;
  let match;
  while ((match = paraRegex.exec(html)) !== null) {
    const content = match[1].replace(/<[^>]*>/g, '').trim();
    if (content.length > 20) { // Only include substantial paragraphs
      paragraphs.push(content);
    }
  }

  const content = paragraphs.join('\n\n');

  return {
    title,
    source: extractSourceFromUrl(url),
    date: 'Date Not Available',
    content,
    url,
    extractedAt: new Date().toISOString()
  };
}

module.exports = {
  fetchArticleContent,
  validateUrl,
  extractArticleContent,
  extractSourceFromUrl,
  cleanContent
};
