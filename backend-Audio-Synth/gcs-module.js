// Google Cloud Storage Module
// Handles file uploads and signed URL generation

const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Upload pagination data to Google Cloud Storage
async function uploadPaginationData(pageBreaksData, sessionId) {
  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || "storage_audio_gcs");
  const folder = "audioalchemy_combined";
  const timestamp = Date.now();
  
  const paginationFileName = `${folder}/FTA_${timestamp}_${sessionId}_pagination.json`;
  const paginationFile = bucket.file(paginationFileName);

  // Upload pagination JSON file
  await paginationFile.save(JSON.stringify(pageBreaksData), {
    contentType: "application/json",
    resumable: false,
    metadata: { 
      contentType: "application/json", 
      sessionId: sessionId,
      totalPages: pageBreaksData.summary.totalPages.toString(),
      totalWords: pageBreaksData.summary.totalWords.toString(),
      thresholdUsed: pageBreaksData.summary.thresholdUsed || 'unknown',
      totalBreaks: pageBreaksData.summary.totalBreaks.toString()
    }
  });

  // Generate signed URL with URL-safe base64 encoding
  const urlExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000);
  const [paginationUrl] = await paginationFile.getSignedUrl({ 
    action: "read", 
    expires: urlExpiration,
    version: 'v4',
    virtualHostedStyle: false
  });

  return {
    paginationFile: paginationFileName,
    pageBreaksUrl: paginationUrl
  };
}

// YON - Restoring original multi-purpose upload function
async function uploadToGCS(processedAudio, timestamps, chunkIndex, totalChunks, sessionId) {
  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || "storage_audio_gcs");
  const folder = "audioalchemy_combined";
  const timestamp = Date.now();

  // Create user-friendly part labels
  const partLabel = `Part_${chunkIndex}`;
  const audioFileName = `${folder}/FTA_${timestamp}_${sessionId}_audio_${partLabel}_of_${totalChunks}.mp3`;
  const audioFile = bucket.file(audioFileName);

  // Upload audio file from file path
  await new Promise((resolve, reject) => {
    const readStream = require('fs').createReadStream(processedAudio.filePath);
    const writeStream = audioFile.createWriteStream({
      contentType: "audio/mpeg",
      resumable: false,
    });
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    readStream.on('error', reject);
    readStream.pipe(writeStream);
  });

  const urlExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000);
  const [audioUrl] = await audioFile.getSignedUrl({ 
      action: "read", 
      expires: urlExpiration,
      version: 'v4',
  });

  return {
    audioFile: audioFileName,
    audioUrl: audioUrl,
  };
}


/**
 * Uploads word timestamp data to GCS as a JSON file.
 * @param {object} wordTimestamps - The word timestamp data.
 * @param {string} sessionId - The session ID.
 * @param {number} chunkIndex - The index of the chunk.
 * @returns {Promise<object>} - A promise that resolves with the upload result.
 */
async function uploadWordTimestamps(wordTimestampsJson, sessionId, chunkIndex) {
  try {
    const fileName = `timestamps/session_${sessionId}_chunk_${chunkIndex}_word_timestamps.json`;
    const data = wordTimestampsJson; // YON - Already a JSON string
    
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || "storage_audio_gcs");
    const file = bucket.file(fileName);
    await file.save(data, { contentType: "application/json" });

    const urlExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000);
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires: urlExpiration, version: 'v4' });
    
    console.log(`✅ [GCS] Word timestamps uploaded for chunk ${chunkIndex}`);
    return { url: signedUrl, fileName };
  } catch (error) {
    console.error(`❌ [GCS] Word timestamps upload failed for chunk ${chunkIndex}:`, error.message);
    throw error;
  }
}

/**
 * Uploads letter timestamp data to GCS as a JSON file.
 * @param {object} letterTimestamps - The letter timestamp data.
 * @param {string} sessionId - The session ID.
 * @param {number} chunkIndex - The index of the chunk.
 * @returns {Promise<object>} - A promise that resolves with the upload result.
 */
async function uploadLetterTimestamps(letterTimestamps, sessionId, chunkIndex) {
  try {
    const fileName = `timestamps/session_${sessionId}_chunk_${chunkIndex}_letter_timestamps.json`;
    const data = JSON.stringify(letterTimestamps, null, 2);
    
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || "storage_audio_gcs");
    const file = bucket.file(fileName);
    await file.save(data, { contentType: "application/json" });

    const urlExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000);
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires: urlExpiration, version: 'v4' });

    console.log(`✅ [GCS] Letter timestamps uploaded for chunk ${chunkIndex}`);
    return { url: signedUrl, fileName };
  } catch (error) {
    console.error(`❌ [GCS] Letter timestamps upload failed for chunk ${chunkIndex}:`, error.message);
    throw error;
  }
}


module.exports = { 
  uploadToGCS, 
  uploadPaginationData,
  uploadWordTimestamps,
  uploadLetterTimestamps
};