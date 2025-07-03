const crypto = require('crypto');
const { extractWatermark } = require('../utils/watermarkUtils');

class DetectionService {
  /**
   * Detect watermark in data
   * @param {Object|Array|Buffer|string} data - Data to analyze
   * @param {string} contentType - Type of content being analyzed
   * @returns {Object} Detection results
   */
  async detectWatermark(data, contentType = 'json') {
    try {
      const detectionResult = {
        watermarkDetected: false,
        watermarkInfo: null,
        confidence: 0,
        detectionMethod: '',
        timestamp: new Date(),
        analysis: {}
      };

      switch (contentType.toLowerCase()) {
        case 'json':
        case 'object':
          return await this.detectJSONWatermark(data, detectionResult);
        
        case 'image':
          return await this.detectImageWatermark(data, detectionResult);
        
        case 'text':
          return await this.detectTextWatermark(data, detectionResult);
        
        default:
          return await this.detectGenericWatermark(data, detectionResult);
      }
    } catch (error) {
      return {
        watermarkDetected: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Detect watermark in JSON/Object data
   * @param {Object|Array} data - JSON data to analyze
   * @param {Object} detectionResult - Base detection result object
   * @returns {Object} Enhanced detection result
   */
  async detectJSONWatermark(data, detectionResult) {
    // Check for metadata watermarks
    if (data.__metadata && data.__metadata.__watermark) {
      const watermark = data.__metadata.__watermark;
      detectionResult.watermarkDetected = true;
      detectionResult.watermarkInfo = watermark;
      detectionResult.confidence = 0.95;
      detectionResult.detectionMethod = 'metadata_analysis';
      detectionResult.analysis.location = 'metadata';
    }

    // Check for hidden properties
    if (data.__wm) {
      detectionResult.watermarkDetected = true;
      detectionResult.watermarkInfo = {
        hash: data.__wm,
        type: 'hidden_property'
      };
      detectionResult.confidence = 0.90;
      detectionResult.detectionMethod = 'hidden_property';
      detectionResult.analysis.location = 'hidden_property';
    }

    // Check for array metadata watermarks
    if (data.metadata && data.metadata.__watermark) {
      const watermark = data.metadata.__watermark;
      detectionResult.watermarkDetected = true;
      detectionResult.watermarkInfo = watermark;
      detectionResult.confidence = 0.95;
      detectionResult.detectionMethod = 'array_metadata';
      detectionResult.analysis.location = 'array_metadata';
    }

    // Statistical analysis for subtle watermarks
    if (!detectionResult.watermarkDetected) {
      const statisticalAnalysis = this.performStatisticalAnalysis(data);
      if (statisticalAnalysis.suspicious) {
        detectionResult.watermarkDetected = true;
        detectionResult.confidence = statisticalAnalysis.confidence;
        detectionResult.detectionMethod = 'statistical_analysis';
        detectionResult.analysis = statisticalAnalysis;
      }
    }

    return detectionResult;
  }

  /**
   * Detect watermark in image data using steganography
   * @param {Buffer} imageData - Image buffer to analyze
   * @param {Object} detectionResult - Base detection result object
   * @returns {Object} Enhanced detection result
   */
  async detectImageWatermark(imageData, detectionResult) {
    try {
      if (!Buffer.isBuffer(imageData)) {
        throw new Error('Image data must be a Buffer');
      }

      // Use steganography utility to extract watermark
      const extractedData = await extractWatermark(imageData);
      
      if (extractedData && extractedData.length > 0) {
        detectionResult.watermarkDetected = true;
        detectionResult.watermarkInfo = {
          extractedText: extractedData,
          type: 'steganographic'
        };
        detectionResult.confidence = 0.85;
        detectionResult.detectionMethod = 'steganographic_extraction';
        detectionResult.analysis = {
          extractedLength: extractedData.length,
          method: 'LSB_steganography'
        };
      }

      // Additional image analysis
      const imageAnalysis = this.analyzeImageMetadata(imageData);
      if (imageAnalysis.suspicious) {
        detectionResult.watermarkDetected = true;
        detectionResult.confidence = Math.max(detectionResult.confidence, imageAnalysis.confidence);
        detectionResult.analysis.imageMetadata = imageAnalysis;
      }

      return detectionResult;
    } catch (error) {
      detectionResult.error = `Image watermark detection failed: ${error.message}`;
      return detectionResult;
    }
  }

  /**
   * Detect watermark in text using zero-width character analysis
   * @param {string} text - Text to analyze
   * @param {Object} detectionResult - Base detection result object
   * @returns {Object} Enhanced detection result
   */
  async detectTextWatermark(text, detectionResult) {
    // Zero-width characters that might contain watermarks
    const zeroWidthChars = [
      '\u200B', // Zero-width space
      '\u200C', // Zero-width non-joiner
      '\u200D', // Zero-width joiner
      '\uFEFF'  // Zero-width no-break space
    ];

    let foundZeroWidth = false;
    let zeroWidthCount = 0;
    let extractedBinary = '';

    // Scan for zero-width characters
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (zeroWidthChars.includes(char)) {
        foundZeroWidth = true;
        zeroWidthCount++;
        
        // Map to binary
        if (char === '\u200B') extractedBinary += '0';
        if (char === '\u200C') extractedBinary += '1';
      }
    }

    if (foundZeroWidth && zeroWidthCount > 5) {
      detectionResult.watermarkDetected = true;
      detectionResult.confidence = Math.min(0.8, zeroWidthCount / 50);
      detectionResult.detectionMethod = 'zero_width_analysis';
      detectionResult.analysis = {
        zeroWidthCount,
        extractedBinary: extractedBinary.substring(0, 64), // First 64 bits
        suspiciousPatterns: true
      };

      // Try to decode the binary watermark
      if (extractedBinary.length >= 8) {
        try {
          const watermarkText = this.binaryToText(extractedBinary);
          if (watermarkText) {
            detectionResult.watermarkInfo = {
              extractedText: watermarkText,
              type: 'zero_width_steganography'
            };
            detectionResult.confidence = 0.9;
          }
        } catch (error) {
          // Binary might not be valid text
        }
      }
    }

    // Check for unusual text patterns
    const textAnalysis = this.analyzeTextPatterns(text);
    if (textAnalysis.suspicious) {
      detectionResult.watermarkDetected = true;
      detectionResult.confidence = Math.max(detectionResult.confidence, textAnalysis.confidence);
      detectionResult.analysis.textPatterns = textAnalysis;
    }

    return detectionResult;
  }

  /**
   * Generic watermark detection for unknown content types
   * @param {any} data - Data to analyze
   * @param {Object} detectionResult - Base detection result object
   * @returns {Object} Enhanced detection result
   */
  async detectGenericWatermark(data, detectionResult) {
    // Convert data to string for analysis
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Look for watermark patterns in the string representation
    const patterns = [
      /watermark/i,
      /\b[a-f0-9]{16,}\b/, // Hex patterns
      /__wm[a-z0-9]*/i,   // Watermark property patterns
      /[0-9]{13}\_[a-f0-9]{8}/ // Timestamp + random pattern
    ];

    for (const pattern of patterns) {
      const matches = dataString.match(pattern);
      if (matches) {
        detectionResult.watermarkDetected = true;
        detectionResult.confidence = 0.6;
        detectionResult.detectionMethod = 'pattern_matching';
        detectionResult.analysis.matchedPattern = pattern.toString();
        detectionResult.analysis.matches = matches;
        break;
      }
    }

    return detectionResult;
  }

  /**
   * Perform statistical analysis to detect subtle watermarks
   * @param {Object|Array} data - Data to analyze
   * @returns {Object} Statistical analysis result
   */
  performStatisticalAnalysis(data) {
    const analysis = {
      suspicious: false,
      confidence: 0,
      anomalies: []
    };

    try {
      if (Array.isArray(data)) {
        // Analyze array patterns
        const uniqueValues = new Set(data.map(item => JSON.stringify(item))).size;
        const duplicateRatio = 1 - (uniqueValues / data.length);
        
        if (duplicateRatio > 0.9) {
          analysis.suspicious = true;
          analysis.confidence = 0.3;
          analysis.anomalies.push('High duplicate ratio in data');
        }

        // Check for unusual data distributions
        if (data.length > 0 && typeof data[0] === 'object') {
          const keys = Object.keys(data[0]);
          const keyConsistency = data.every(item => 
            keys.every(key => key in item)
          );
          
          if (!keyConsistency) {
            analysis.suspicious = true;
            analysis.confidence = Math.max(analysis.confidence, 0.4);
            analysis.anomalies.push('Inconsistent object structure');
          }
        }
      } else if (typeof data === 'object') {
        // Analyze object properties
        const keys = Object.keys(data);
        const hiddenKeys = keys.filter(key => 
          key.startsWith('_') || key.includes('meta') || key.includes('wm')
        );
        
        if (hiddenKeys.length > 0) {
          analysis.suspicious = true;
          analysis.confidence = 0.5;
          analysis.anomalies.push(`Suspicious property names: ${hiddenKeys.join(', ')}`);
        }
      }

      return analysis;
    } catch (error) {
      return {
        suspicious: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Analyze image metadata for watermark indicators
   * @param {Buffer} imageData - Image buffer
   * @returns {Object} Image analysis result
   */
  analyzeImageMetadata(imageData) {
    const analysis = {
      suspicious: false,
      confidence: 0,
      indicators: []
    };

    try {
      // Simple header analysis for common image formats
      const header = imageData.slice(0, 20);
      const headerHex = header.toString('hex');

      // Check for unusual patterns in header
      if (headerHex.includes('77617465726d61726b')) { // 'watermark' in hex
        analysis.suspicious = true;
        analysis.confidence = 0.8;
        analysis.indicators.push('Watermark text found in image header');
      }

      // Check file size irregularities (simplified)
      if (imageData.length % 8 !== 0) {
        analysis.confidence += 0.1;
        analysis.indicators.push('Unusual file size alignment');
      }

      // Look for steganography indicators
      const unusualBytePatterns = this.detectUnusualBytePatterns(imageData);
      if (unusualBytePatterns.found) {
        analysis.suspicious = true;
        analysis.confidence = Math.max(analysis.confidence, unusualBytePatterns.confidence);
        analysis.indicators.push('Unusual byte patterns detected');
      }

      return analysis;
    } catch (error) {
      return {
        suspicious: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Analyze text patterns for watermark indicators
   * @param {string} text - Text to analyze
   * @returns {Object} Text analysis result
   */
  analyzeTextPatterns(text) {
    const analysis = {
      suspicious: false,
      confidence: 0,
      patterns: []
    };

    // Check character frequency distribution
    const charFreq = {};
    for (const char of text) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }

    // Look for unusual character frequency patterns
    const totalChars = text.length;
    const uniqueChars = Object.keys(charFreq).length;
    const avgFreq = totalChars / uniqueChars;

    // Statistical analysis
    const deviations = Object.values(charFreq).map(freq => 
      Math.abs(freq - avgFreq) / avgFreq
    );
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

    if (avgDeviation > 2.0) {
      analysis.suspicious = true;
      analysis.confidence = Math.min(0.6, avgDeviation / 5);
      analysis.patterns.push('Unusual character frequency distribution');
    }

    // Check for repeated patterns
    const wordCounts = {};
    const words = text.split(/\s+/);
    for (const word of words) {
      if (word.length > 3) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    const repeatedWords = Object.entries(wordCounts)
      .filter(([word, count]) => count > Math.sqrt(words.length))
      .length;

    if (repeatedWords > words.length * 0.1) {
      analysis.suspicious = true;
      analysis.confidence = Math.max(analysis.confidence, 0.4);
      analysis.patterns.push('Excessive word repetition detected');
    }

    return analysis;
  }

  /**
   * Detect unusual byte patterns in binary data
   * @param {Buffer} data - Binary data to analyze
   * @returns {Object} Pattern detection result
   */
  detectUnusualBytePatterns(data) {
    const result = {
      found: false,
      confidence: 0,
      patterns: []
    };

    try {
      // Sample analysis on first 1KB to avoid performance issues
      const sampleSize = Math.min(1024, data.length);
      const sample = data.slice(0, sampleSize);

      // Byte frequency analysis
      const byteFreq = new Array(256).fill(0);
      for (let i = 0; i < sample.length; i++) {
        byteFreq[sample[i]]++;
      }

      // Calculate entropy
      const entropy = this.calculateEntropy(byteFreq, sample.length);
      
      // High entropy might indicate compressed or encrypted data (steganography)
      if (entropy > 7.5) {
        result.found = true;
        result.confidence = Math.min(0.5, (entropy - 7.5) * 2);
        result.patterns.push(`High entropy detected: ${entropy.toFixed(2)}`);
      }

      // Look for LSB patterns (simplified check)
      let lsbPatterns = 0;
      for (let i = 0; i < sample.length - 1; i++) {
        if ((sample[i] & 1) !== (sample[i + 1] & 1)) {
          lsbPatterns++;
        }
      }

      const lsbRatio = lsbPatterns / (sample.length - 1);
      if (lsbRatio > 0.6) {
        result.found = true;
        result.confidence = Math.max(result.confidence, 0.3);
        result.patterns.push('Possible LSB steganography pattern');
      }

      return result;
    } catch (error) {
      return {
        found: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate Shannon entropy of byte frequency distribution
   * @param {Array} frequencies - Byte frequency array
   * @param {number} total - Total number of bytes
   * @returns {number} Entropy value
   */
  calculateEntropy(frequencies, total) {
    let entropy = 0;
    for (const freq of frequencies) {
      if (freq > 0) {
        const probability = freq / total;
        entropy -= probability * Math.log2(probability);
      }
    }
    return entropy;
  }

  /**
   * Convert binary string to text
   * @param {string} binary - Binary string
   * @returns {string} Decoded text
   */
  binaryToText(binary) {
    let text = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8);
      if (byte.length === 8) {
        const charCode = parseInt(byte, 2);
        if (charCode >= 32 && charCode <= 126) { // Printable ASCII
          text += String.fromCharCode(charCode);
        }
      }
    }
    return text;
  }

  /**
   * Generate detection report
   * @param {Object} detectionResult - Detection result
   * @returns {Object} Formatted detection report
   */
  generateDetectionReport(detectionResult) {
    return {
      summary: {
        watermarkDetected: detectionResult.watermarkDetected,
        confidence: detectionResult.confidence,
        detectionMethod: detectionResult.detectionMethod,
        timestamp: detectionResult.timestamp
      },
      details: {
        watermarkInfo: detectionResult.watermarkInfo,
        analysis: detectionResult.analysis,
        error: detectionResult.error
      },
      recommendations: this.generateRecommendations(detectionResult)
    };
  }

  /**
   * Generate recommendations based on detection results
   * @param {Object} detectionResult - Detection result
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(detectionResult) {
    const recommendations = [];

    if (detectionResult.watermarkDetected) {
      recommendations.push('Watermark detected - verify data source and access permissions');
      
      if (detectionResult.confidence < 0.7) {
        recommendations.push('Low confidence detection - manual verification recommended');
      }
      
      if (detectionResult.detectionMethod === 'statistical_analysis') {
        recommendations.push('Statistical anomalies detected - investigate data integrity');
      }
    } else {
      recommendations.push('No watermark detected - data appears clean');
      recommendations.push('Consider applying watermark for data traceability');
    }

    return recommendations;
  }
}

module.exports = new DetectionService();
