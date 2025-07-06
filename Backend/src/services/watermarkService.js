const crypto = require('crypto');
const { addWatermark } = require('../utils/watermarkUtils');

class WatermarkService {
  /**
   * Generate a unique watermark for a user and data type
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data being watermarked
   * @param {Object} metadata - Additional metadata
   * @returns {string} Unique watermark identifier
   */
  generateWatermark(userId, dataType, metadata = {}) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    
    // Create a unique watermark identifier
    const watermarkData = {
      userId,
      dataType,
      timestamp,
      sessionId: randomString,
      ...metadata
    };
    
    // Create a hash-based watermark
    const watermarkString = JSON.stringify(watermarkData);
    const watermarkHash = crypto.createHash('sha256').update(watermarkString).digest('hex');
    
    return {
      watermarkId: `${userId}_${dataType}_${timestamp}_${randomString}`,
      watermarkHash: watermarkHash.substring(0, 16), // Use first 16 characters
      metadata: watermarkData
    };
  }

  /**
   * Apply watermark to data
   * @param {Object|Array} data - Data to be watermarked
   * @param {Object} watermarkInfo - Watermark information
   * @returns {Object} Watermarked data with metadata
   */
  async applyWatermark(data, watermarkInfo) {
    try {
      // Clone the data to avoid modifying original
      const watermarkedData = JSON.parse(JSON.stringify(data));
      
      // Add invisible watermark metadata
      const watermarkMetadata = {
        __watermark: {
          id: watermarkInfo.watermarkId,
          hash: watermarkInfo.watermarkHash,
          timestamp: watermarkInfo.metadata.timestamp,
          applied: true
        }
      };

      // If data is an array, add watermark to metadata
      if (Array.isArray(watermarkedData)) {
        return {
          data: watermarkedData,
          metadata: watermarkMetadata,
          totalRecords: watermarkedData.length,
          watermarked: true
        };
      }

      // If data is an object, embed watermark subtly
      if (typeof watermarkedData === 'object') {
        // Add watermark as a hidden property
        Object.defineProperty(watermarkedData, '__wm', {
          value: watermarkInfo.watermarkHash,
          enumerable: false,
          writable: false
        });
        
        return {
          ...watermarkedData,
          __metadata: watermarkMetadata
        };
      }

      return {
        data: watermarkedData,
        watermark: watermarkMetadata
      };
    } catch (error) {
      throw new Error(`Failed to apply watermark: ${error.message}`);
    }
  }

  /**
   * Apply steganographic watermark using image/text embedding
   * @param {Buffer|string} content - Content to watermark
   * @param {string} watermarkText - Watermark text to embed
   * @param {string} contentType - Type of content (image, text, etc.)
   * @returns {Buffer|string} Watermarked content
   */
  async applySteganographicWatermark(content, watermarkText, contentType = 'text') {
    try {
      if (contentType === 'image' && Buffer.isBuffer(content)) {
        // Use the watermarkUtils for image steganography
        return await addWatermark(content, watermarkText);
      } else if (contentType === 'text') {
        // For text, use zero-width characters or other text steganography
        return this.embedTextWatermark(content.toString(), watermarkText);
      }
      
      // For other types, return content with metadata
      return {
        content,
        watermark: watermarkText,
        type: contentType
      };
    } catch (error) {
      throw new Error(`Failed to apply steganographic watermark: ${error.message}`);
    }
  }

  /**
   * Embed watermark in text using zero-width characters
   * @param {string} text - Original text
   * @param {string} watermark - Watermark to embed
   * @returns {string} Text with embedded watermark
   */
  embedTextWatermark(text, watermark) {
    // Convert watermark to binary
    const watermarkBinary = watermark
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');

    // Zero-width characters for steganography
    const zeroWidthChars = {
      '0': '\u200B', // Zero-width space
      '1': '\u200C'  // Zero-width non-joiner
    };

    // Convert binary to zero-width characters
    const hiddenWatermark = watermarkBinary
      .split('')
      .map(bit => zeroWidthChars[bit])
      .join('');

    // Insert watermark at random positions in text
    const words = text.split(' ');
    const insertPositions = Math.min(3, Math.floor(words.length / 4));
    
    for (let i = 0; i < insertPositions; i++) {
      const position = Math.floor((words.length / insertPositions) * i);
      if (position < words.length) {
        words[position] += hiddenWatermark;
      }
    }

    return words.join(' ');
  }

  /**
   * Create watermark log entry for audit trail
   * @param {Object} watermarkInfo - Watermark information
   * @param {string} action - Action performed (created, applied, detected)
   * @returns {Object} Log entry
   */
  createWatermarkLog(watermarkInfo, action = 'created') {
    return {
      watermarkId: watermarkInfo.watermarkId,
      action,
      timestamp: new Date(),
      userId: watermarkInfo.metadata.userId,
      dataType: watermarkInfo.metadata.dataType,
      sessionId: watermarkInfo.metadata.sessionId,
      hash: watermarkInfo.watermarkHash
    };
  }

  /**
   * Validate watermark integrity
   * @param {Object} watermarkInfo - Watermark information to validate
   * @returns {boolean} True if watermark is valid
   */
  validateWatermark(watermarkInfo) {
    try {
      if (!watermarkInfo || !watermarkInfo.watermarkId || !watermarkInfo.watermarkHash) {
        return false;
      }

      // Check timestamp validity (not older than 24 hours for active sessions)
      const timestamp = watermarkInfo.metadata?.timestamp;
      if (timestamp) {
        const age = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (age > maxAge) {
          console.warn(`Watermark is older than 24 hours: ${watermarkInfo.watermarkId}`);
        }
      }

      // Validate hash format
      const hashPattern = /^[a-f0-9]{16}$/;
      return hashPattern.test(watermarkInfo.watermarkHash);
    } catch (error) {
      console.error('Watermark validation error:', error);
      return false;
    }
  }
}

module.exports = new WatermarkService();
