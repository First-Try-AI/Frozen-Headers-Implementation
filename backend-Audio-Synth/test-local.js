// Local test script to test the JavaScript processing steps
const { chunkText, structureChunk } = require('./textProcessor');
const { generateAudio, processAudioOptimized } = require('./audioProcessor');
const { generateTimestamps, createPageBreaks, uploadPaginationData, uploadToGCS } = require('./outputProcessor');

async function testLocalProcessing() {
  try {
    console.log('🧪 [TEST] Starting local JavaScript test...');
    
    // Test input
    const testInput = "This is a test sentence for audio generation. It should be processed through all the steps.";
    const originalParams = {
      vprf: 'lower',
      vmode: 'oneVoice',
      speed: 1.0
    };
    const vlist = [];
    const thresholds = {
      threshold1: 100,
      threshold2: 70,
      threshold3: 45
    };
    
    console.log('📝 [TEST] Input text:', testInput);
    
    // Step 1: Chunk text
    console.log('\n📦 [TEST] Step 1: Chunking text...');
    const chunkResult = chunkText(testInput);
    const chunks = chunkResult.chunks;
    console.log(`✅ Created ${chunks.length} chunks`);
    console.log('Chunks:', chunks);
    
    // Step 2: Structure chunks
    console.log('\n🎭 [TEST] Step 2: Structuring chunks...');
    const structuredChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const structuredChunk = await structureChunk(chunk, originalParams, i, chunks.length, vlist);
      structuredChunks.push(structuredChunk);
      console.log(`✅ Structured chunk ${i + 1}:`, {
        chunkIndex: structuredChunk.chunkIndex,
        voiceId: structuredChunk.voiceId,
        inputText: structuredChunk.inputText ? structuredChunk.inputText.substring(0, 50) + '...' : 'undefined',
        combinedText: structuredChunk.combinedText ? structuredChunk.combinedText.substring(0, 50) + '...' : 'undefined'
      });
    }
    
    // Step 3: Test pagination (without audio generation)
    console.log('\n📄 [TEST] Step 3: Testing pagination logic...');
    const mockWordTimestamps = [
      { word: 'This', start: 0.0, end: 0.3, index: 1 },
      { word: 'is', start: 0.3, end: 0.5, index: 2 },
      { word: 'a', start: 0.5, end: 0.6, index: 3 },
      { word: 'test', start: 0.6, end: 0.9, index: 4 },
      { word: 'sentence', start: 0.9, end: 1.4, index: 5 },
      { word: 'for', start: 1.4, end: 1.6, index: 6 },
      { word: 'audio', start: 1.6, end: 2.0, index: 7 },
      { word: 'generation', start: 2.0, end: 2.6, index: 8 }
    ];
    
    const pageBreaksData = createPageBreaks(mockWordTimestamps, thresholds);
    console.log('✅ Page breaks created:', pageBreaksData);
    
    console.log('\n🎉 [TEST] All JavaScript steps completed successfully!');
    console.log('📊 [TEST] Summary:');
    console.log(`  - Chunks: ${chunks.length}`);
    console.log(`  - Structured chunks: ${structuredChunks.length}`);
    console.log(`  - Page breaks: ${pageBreaksData.pageBreaks.length}`);
    console.log(`  - Total pages: ${pageBreaksData.summary.totalPages}`);
    
  } catch (error) {
    console.error('❌ [TEST] Error during testing:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testLocalProcessing();
