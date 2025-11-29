// Local test script using real timestamp data for realistic pagination testing
const { chunkText, structureChunk } = require('./textProcessor');
const { generateAudio, processAudioOptimized } = require('./audioProcessor');
const { generateTimestamps, createPageBreaks, uploadPaginationData, uploadToGCS } = require('./outputProcessor');

async function testRealTimestamps() {
  try {
    console.log('🧪 [TEST] Starting real timestamp pagination test...');
    
    // Real timestamp data from your library
    const realTimestampData = {
      "originalText": "okay great - now we need to dial in where we are cutting the pages - the function worked beautifully by the way - ther issue is when we have two short words that sit right next to each other paging in btween those words feels off, so we need to only page were have a break of xxMS between words, but not less than yyMS.",
      "processedText": "okay great - now we need to dial in where we are cutting the pages - the function worked beautifully by the way - ther issue is when we have two short words that sit right next to each other paging in btween those words feels off, so we need to only page were have a break of xxMS between words, but not less than yyMS.",
      "totalDuration": 22.105,
      "partIndex": 1,
      "words": [
        {"word":"okay","start":0,"end":0.371,"index":0},
        {"word":"great","start":0.429,"end":0.743,"index":1},
        {"word":"-","start":0.894,"end":1.068,"index":2},
        {"word":"now","start":1.347,"end":1.498,"index":3},
        {"word":"we","start":1.567,"end":1.625,"index":4},
        {"word":"need","start":1.683,"end":1.857,"index":5},
        {"word":"to","start":1.892,"end":1.939,"index":6},
        {"word":"dial","start":2.02,"end":2.299,"index":7},
        {"word":"in","start":2.392,"end":2.484,"index":8},
        {"word":"where","start":2.554,"end":2.682,"index":9},
        {"word":"we","start":2.717,"end":2.775,"index":10},
        {"word":"are","start":2.798,"end":2.891,"index":11},
        {"word":"cutting","start":2.926,"end":3.204,"index":12},
        {"word":"the","start":3.251,"end":3.32,"index":13},
        {"word":"pages","start":3.378,"end":3.82,"index":14},
        {"word":"-","start":3.994,"end":4.04,"index":15},
        {"word":"the","start":4.284,"end":4.388,"index":16},
        {"word":"function","start":4.446,"end":4.806,"index":17},
        {"word":"worked","start":4.864,"end":5.108,"index":18},
        {"word":"beautifully","start":5.166,"end":5.724,"index":19},
        {"word":"by","start":5.805,"end":5.933,"index":20},
        {"word":"the","start":5.991,"end":6.06,"index":21},
        {"word":"way","start":6.107,"end":6.339,"index":22},
        {"word":"-","start":6.583,"end":6.629,"index":23},
        {"word":"ther","start":6.873,"end":7.047,"index":24},
        {"word":"issue","start":7.094,"end":7.43,"index":25},
        {"word":"is","start":7.488,"end":7.639,"index":26},
        {"word":"when","start":7.732,"end":7.906,"index":27},
        {"word":"we","start":7.964,"end":8.046,"index":28},
        {"word":"have","start":8.138,"end":8.394,"index":29},
        {"word":"two","start":8.44,"end":8.684,"index":30},
        {"word":"short","start":8.777,"end":9.067,"index":31},
        {"word":"words","start":9.137,"end":9.532,"index":32},
        {"word":"that","start":9.59,"end":9.752,"index":33},
        {"word":"sit","start":9.833,"end":10.077,"index":34},
        {"word":"right","start":10.159,"end":10.368,"index":35},
        {"word":"next","start":10.426,"end":10.635,"index":36},
        {"word":"to","start":10.669,"end":10.716,"index":37},
        {"word":"each","start":10.774,"end":10.913,"index":38},
        {"word":"other","start":10.96,"end":11.215,"index":39},
        {"word":"paging","start":11.54,"end":11.993,"index":40},
        {"word":"in","start":12.074,"end":12.295,"index":41},
        {"word":"btween","start":12.678,"end":13.235,"index":42},
        {"word":"those","start":13.305,"end":13.537,"index":43},
        {"word":"words","start":13.584,"end":13.92,"index":44},
        {"word":"feels","start":13.978,"end":14.28,"index":45},
        {"word":"off,","start":14.349,"end":14.907,"index":46},
        {"word":"so","start":15.15,"end":15.278,"index":47},
        {"word":"we","start":15.348,"end":15.394,"index":48},
        {"word":"need","start":15.464,"end":15.661,"index":49},
        {"word":"to","start":15.708,"end":15.928,"index":50},
        {"word":"only","start":16.207,"end":16.567,"index":51},
        {"word":"page","start":16.636,"end":16.996,"index":52},
        {"word":"were","start":17.031,"end":17.182,"index":53},
        {"word":"have","start":17.217,"end":17.356,"index":54},
        {"word":"a","start":17.391,"end":17.414,"index":55},
        {"word":"break","start":17.472,"end":17.797,"index":56},
        {"word":"of","start":17.879,"end":18.006,"index":57},
        {"word":"xxMS","start":18.181,"end":18.912,"index":58},
        {"word":"between","start":19.005,"end":19.318,"index":59},
        {"word":"words,","start":19.376,"end":20.003,"index":60},
        {"word":"but","start":20.178,"end":20.363,"index":61},
        {"word":"not","start":20.41,"end":20.572,"index":62},
        {"word":"less","start":20.642,"end":20.886,"index":63},
        {"word":"than","start":20.921,"end":21.06,"index":64},
        {"word":"yyMS.","start":21.13,"end":22.105,"index":65}
      ]
    };
    
    const thresholds = {
      threshold1: 100,
      threshold2: 70,
      threshold3: 45
    };
    
    console.log('📝 [TEST] Real timestamp data:');
    console.log(`  - Text: "${realTimestampData.originalText.substring(0, 50)}..."`);
    console.log(`  - Duration: ${realTimestampData.totalDuration}s`);
    console.log(`  - Words: ${realTimestampData.words.length}`);
    
    // Test pagination with real timestamps
    console.log('\n📄 [TEST] Testing pagination with real timestamps...');
    
    const pageBreaksData = createPageBreaks(realTimestampData.words, thresholds);
    console.log('✅ Page breaks created:', {
      pageBreaks: pageBreaksData.pageBreaks.length,
      totalPages: pageBreaksData.summary.totalPages,
      thresholdUsed: pageBreaksData.summary.thresholdUsed,
      averagePageSize: pageBreaksData.summary.averagePageSize,
      targetPages: pageBreaksData.summary.targetPages
    });
    
    if (pageBreaksData.pageBreaks.length > 0) {
      console.log('\n📄 Page break details:');
      pageBreaksData.pageBreaks.forEach((break_, i) => {
        const word = realTimestampData.words[break_.wordIndex - 1];
        console.log(`  Break ${i + 1}: After "${word?.word}" (word ${break_.wordIndex}), ${break_.breakType}, ${break_.pauseDuration}ms pause`);
      });
    } else {
      console.log('📄 No page breaks created - text flows as single page');
    }
    
    // Show some pause duration examples
    console.log('\n⏱️ [TEST] Sample pause durations between words:');
    for (let i = 0; i < Math.min(10, realTimestampData.words.length - 1); i++) {
      const currentWord = realTimestampData.words[i];
      const nextWord = realTimestampData.words[i + 1];
      const pauseDuration = (nextWord.start - currentWord.end) * 1000; // Convert to ms
      console.log(`  "${currentWord.word}" → "${nextWord.word}": ${pauseDuration.toFixed(1)}ms`);
    }
    
    console.log('\n🎉 [TEST] Real timestamp pagination test completed!');
    console.log('📊 [TEST] Final Summary:');
    console.log(`  - Total words: ${realTimestampData.words.length}`);
    console.log(`  - Total duration: ${realTimestampData.totalDuration}s`);
    console.log(`  - Page breaks: ${pageBreaksData.pageBreaks.length}`);
    console.log(`  - Total pages: ${pageBreaksData.summary.totalPages}`);
    console.log(`  - Threshold used: ${pageBreaksData.summary.thresholdUsed}`);
    console.log(`  - Average page size: ${pageBreaksData.summary.averagePageSize} words`);
    
  } catch (error) {
    console.error('❌ [TEST] Error during real timestamp testing:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRealTimestamps();
