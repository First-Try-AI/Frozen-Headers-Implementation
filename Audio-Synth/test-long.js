// Local test script with longer text to test chunking and pagination
const { chunkText, structureChunk } = require('./textProcessor');
const { generateAudio, processAudioOptimized } = require('./audioProcessor');
const { generateTimestamps, createPageBreaks, uploadPaginationData, uploadToGCS } = require('./outputProcessor');

async function testLongText() {
  try {
    console.log('🧪 [TEST] Starting long text JavaScript test...');
    
    // 700+ character text about joy
    const longInput = "Joy is the purest expression of the human spirit, a radiant light that illuminates even the darkest corners of our existence. It bubbles up from within like a natural spring, refreshing and renewing our perspective on life. True joy cannot be manufactured or forced; it emerges spontaneously when we align with our authentic self and embrace the present moment with gratitude. It transforms ordinary experiences into extraordinary memories, turning a simple walk in the park into a celebration of being alive. Joy connects us to others, creating ripples of happiness that spread far beyond our immediate circle. It is both a gift we receive and a gift we give, multiplying as we share it freely. In times of difficulty, joy becomes our anchor, reminding us that beauty and wonder still exist in the world. It teaches us that happiness is not dependent on external circumstances but flows from our inner state of being. When we cultivate joy, we become more resilient, more compassionate, and more fully human. It is the music of the soul, playing the sweetest melodies even when life's symphony seems discordant.";
    
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
    
    console.log('📝 [TEST] Input text length:', longInput.length, 'characters');
    console.log('📝 [TEST] First 100 chars:', longInput.substring(0, 100) + '...');
    
    // Step 1: Chunk text
    console.log('\n📦 [TEST] Step 1: Chunking text...');
    const chunkResult = chunkText(longInput);
    const chunks = chunkResult.chunks;
    console.log(`✅ Created ${chunks.length} chunks`);
    console.log('📊 Chunk details:');
    chunks.forEach((chunk, i) => {
      console.log(`  Chunk ${i + 1}: ${chunk.length} characters`);
    });
    
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
        inputTextLength: structuredChunk.inputText ? structuredChunk.inputText.length : 0,
        combinedTextLength: structuredChunk.combinedText ? structuredChunk.combinedText.length : 0
      });
    }
    
    // Step 3: Test pagination with mock word timestamps
    console.log('\n📄 [TEST] Step 3: Testing pagination logic...');
    
    // Create mock word timestamps for the first chunk (simulating audio processing)
    const firstChunkWords = chunks[0].split(/\s+/).filter(w => w.length > 0);
    const mockWordTimestamps = firstChunkWords.map((word, index) => ({
      word: word,
      start: index * 0.5, // 0.5 seconds per word
      end: (index * 0.5) + 0.3, // 0.3 seconds duration per word
      index: index + 1
    }));
    
    console.log(`📊 Mock timestamps: ${mockWordTimestamps.length} words`);
    
    const pageBreaksData = createPageBreaks(mockWordTimestamps, thresholds);
    console.log('✅ Page breaks created:', {
      pageBreaks: pageBreaksData.pageBreaks.length,
      totalPages: pageBreaksData.summary.totalPages,
      thresholdUsed: pageBreaksData.summary.thresholdUsed,
      averagePageSize: pageBreaksData.summary.averagePageSize
    });
    
    if (pageBreaksData.pageBreaks.length > 0) {
      console.log('📄 Page break details:');
      pageBreaksData.pageBreaks.forEach((break_, i) => {
        console.log(`  Break ${i + 1}: Word ${break_.wordIndex}, ${break_.breakType}, ${break_.pauseDuration}ms pause`);
      });
    }
    
    console.log('\n🎉 [TEST] Long text processing completed successfully!');
    console.log('📊 [TEST] Final Summary:');
    console.log(`  - Input length: ${longInput.length} characters`);
    console.log(`  - Chunks created: ${chunks.length}`);
    console.log(`  - Structured chunks: ${structuredChunks.length}`);
    console.log(`  - Mock words: ${mockWordTimestamps.length}`);
    console.log(`  - Page breaks: ${pageBreaksData.pageBreaks.length}`);
    console.log(`  - Total pages: ${pageBreaksData.summary.totalPages}`);
    
  } catch (error) {
    console.error('❌ [TEST] Error during long text testing:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testLongText();
