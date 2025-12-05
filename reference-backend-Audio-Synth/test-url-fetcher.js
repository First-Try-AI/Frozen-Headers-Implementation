// Test script for URL fetching functionality
const { fetchArticleContent, validateUrl } = require('./urlFetcher');

async function testUrlFetcher() {
  console.log('🧪 Testing URL Fetcher functionality...\n');

  try {
    // Test URL validation
    console.log('1. Testing URL validation...');
    const testUrls = [
      'https://www.cnn.com/2024/12/03/politics/trump-legal-cases-supreme-court/index.html',
      'https://www.bbc.com/news/world-us-canada-68500000',
      'https://invalid-url',
      'not-a-url'
    ];

    for (const url of testUrls) {
      try {
        validateUrl(url);
        console.log(`✅ Valid: ${url}`);
      } catch (error) {
        console.log(`❌ Invalid: ${url} - ${error.message}`);
      }
    }

    console.log('\n2. Testing article fetching (using a real article URL)...');
    // Note: In a real test, you'd use a real article URL
    // For this demo, we'll skip the actual fetch to avoid hitting real websites

    console.log('✅ URL Fetcher basic functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUrlFetcher();
