const PNG = require('pngjs').PNG;
const fs = require('fs');
const onfidoBait = require('../models/onfidoBait');

class ImageSteganographyService {
  
  /**
   * Hide a company name in a PNG image using LSB steganography
   * @param {Buffer} imageBuffer - The input PNG image buffer
   * @param {string} companyName - The company name to hide
   * @returns {Buffer} - The modified PNG image buffer with hidden message
   */
  hideCompanyNameInImage(imageBuffer, companyName) {
    try {
      console.log(`🔧 Starting image steganography for company: ${companyName}`);
      
      // Parse the PNG image
      const png = PNG.sync.read(imageBuffer);
      const { width, height, data } = png;
      
      console.log(`Image dimensions: ${width}x${height}, Data length: ${data.length}`);
      
      // Convert company name to binary with delimiter
      const message = companyName + '\0'; // Null terminator to mark end
      const binaryMessage = this.stringToBinary(message);
      
      console.log(`Message: "${message}", Binary length: ${binaryMessage.length} bits`);
      
      // Check if image is large enough to hold the message
      const maxCapacity = Math.floor(data.length / 4) * 3; // 3 color channels per pixel (RGB, skip Alpha)
      if (binaryMessage.length > maxCapacity) {
        throw new Error(`Image too small. Need ${binaryMessage.length} bits, but only ${maxCapacity} available.`);
      }
      
      // Hide message in LSB of RGB channels
      let messageIndex = 0;
      
      for (let i = 0; i < data.length && messageIndex < binaryMessage.length; i += 4) {
        // Process R, G, B channels (skip A channel at i+3)
        for (let channel = 0; channel < 3 && messageIndex < binaryMessage.length; channel++) {
          const pixelIndex = i + channel;
          const originalValue = data[pixelIndex];
          const messageBit = parseInt(binaryMessage[messageIndex]);
          
          // Clear LSB and set to message bit
          data[pixelIndex] = (originalValue & 0xFE) | messageBit;
          
          console.log(`Bit ${messageIndex}: ${messageBit} embedded at pixel ${Math.floor(i/4)}, channel ${channel}`);
          messageIndex++;
        }
      }
      
      console.log(`✅ Successfully embedded ${messageIndex} bits in image`);
      
      // Return the modified PNG buffer
      return PNG.sync.write(png);
      
    } catch (error) {
      console.error('Error in hideCompanyNameInImage:', error.message);
      throw error;
    }
  }
  
  /**
   * Extract hidden company name from a PNG image using LSB steganography
   * @param {Buffer} imageBuffer - The PNG image buffer with hidden message
   * @returns {string|null} - The extracted company name or null if not found
   */
  extractCompanyNameFromImage(imageBuffer) {
    try {
      console.log(' Starting message extraction from image');
      
      // Parse the PNG image
      const png = PNG.sync.read(imageBuffer);
      const { data } = png;
      
      let binaryMessage = '';
      let extractedChars = '';
      let bitCount = 0;
      const maxBitsToCheck = Math.min(data.length, 50000); // Limit to first 50k bits for speed
      
      // Extract bits from LSB of RGB channels
      for (let i = 0; i < maxBitsToCheck && bitCount < 1000; i += 4) { // Limit to 1000 bits max
        // Process R, G, B channels (skip A channel at i+3)
        for (let channel = 0; channel < 3; channel++) {
          const pixelIndex = i + channel;
          if (pixelIndex >= data.length) break;
          
          const lsb = data[pixelIndex] & 1; // Get LSB
          binaryMessage += lsb.toString();
          bitCount++;
          
          // Check every 8 bits if we have a complete character
          if (binaryMessage.length % 8 === 0) {
            const lastByte = binaryMessage.slice(-8);
            const charCode = parseInt(lastByte, 2);
            
            // Check for null terminator (end of message)
            if (charCode === 0) {
              console.log(`✅ Found null terminator after ${extractedChars.length} characters`);
              return extractedChars || null;
            }
            
            // Only accept printable ASCII characters (32-126)
            if (charCode >= 32 && charCode <= 126) {
              const char = String.fromCharCode(charCode);
              extractedChars += char;
              console.log(`Extracted char: "${char}" (${charCode}), total: "${extractedChars}"`);
              
              // Stop if we have a reasonable company name length
              if (extractedChars.length >= 20) {
                console.log('⚠️ Message too long, stopping extraction');
                break;
              }
            } else if (charCode !== 0) {
              // Invalid character found, might not be steganographic data
              console.log(`❌ Invalid character code: ${charCode}, stopping extraction`);
              break;
            }
          }
          
          // Safety check - don't process too many bits
          if (bitCount >= 1000) break;
        }
      }
      
      // If we found some valid characters but no null terminator
      if (extractedChars.length > 0) {
        console.log(`✅ Extracted partial message: "${extractedChars}"`);
        return extractedChars;
      }
      
      console.log('❌ No valid message found');
      return null;
      
    } catch (error) {
      console.error('Error in extractCompanyNameFromImage:', error.message);
      return null;
    }
  }
  
  /**
   * Convert string to binary representation
   * @param {string} str - Input string
   * @returns {string} - Binary representation
   */
  stringToBinary(str) {
    return str
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
  }
  
  /**
   * Convert binary representation to string
   * @param {string} binary - Binary string
   * @returns {string} - Decoded string
   */
  binaryToString(binary) {
    let result = '';
    
    // Process 8 bits at a time
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.slice(i, i + 8);
      if (byte.length === 8) {
        const charCode = parseInt(byte, 2);
        if (charCode !== 0) { // Skip null characters
          result += String.fromCharCode(charCode);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Analyze image capacity for steganography
   * @param {Buffer} imageBuffer - The PNG image buffer
   * @returns {Object} - Capacity analysis
   */
  analyzeImageCapacity(imageBuffer) {
    try {
      const png = PNG.sync.read(imageBuffer);
      const { width, height, data } = png;
      
      const totalPixels = width * height;
      const maxBits = Math.floor(data.length / 4) * 3; // 3 bits per pixel (RGB)
      const maxChars = Math.floor(maxBits / 8);
      
      return {
        width,
        height,
        totalPixels,
        maxBits,
        maxChars,
        maxMessageLength: maxChars - 1 // Reserve 1 char for null terminator
      };
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }
  
  /**
   * Validate if message can fit in image
   * @param {Buffer} imageBuffer - The PNG image buffer
   * @param {string} message - Message to hide
   * @returns {boolean} - Whether message fits
   */
  canFitMessage(imageBuffer, message) {
    try {
      const capacity = this.analyzeImageCapacity(imageBuffer);
      return (message.length + 1) <= capacity.maxMessageLength; // +1 for null terminator
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Create a sample PNG image for testing (solid color)
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {Object} color - RGB color {r, g, b}
   * @returns {Buffer} - PNG image buffer
   */
  createSampleImage(width = 100, height = 100, color = { r: 128, g: 128, b: 128 }) {
    const png = new PNG({ width, height });
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        
        png.data[idx] = color.r;     // Red
        png.data[idx + 1] = color.g; // Green
        png.data[idx + 2] = color.b; // Blue
        png.data[idx + 3] = 255;     // Alpha (fully opaque)
      }
    }
    
    return PNG.sync.write(png);
  }
  
  /**
   * Get a random steganographic image by company name
   * @param {string} companyName - The company name to search for
   * @returns {Object} - Image buffer and metadata or null if not found
   */
  async getRandomImageByCompany(companyName) {
    try {
      console.log(`Searching for random image from company: ${companyName}`);
      
      // Find all bait records for the specified company
      const baitRecords = await onfidoBait.find({ company: companyName });
      
      if (baitRecords.length === 0) {
        console.log(`❌ No images found for company: ${companyName}`);
        return null;
      }
      
      // Select a random record
      const randomIndex = Math.floor(Math.random() * baitRecords.length);
      const selectedRecord = baitRecords[randomIndex];
      
      console.log(`📋 Selected record ${randomIndex + 1} of ${baitRecords.length} for company: ${companyName}`);
      
      // Download image from Cloudinary URL
      const imageUrl = selectedRecord.steganographic_image.path;
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      console.log(`✅ Successfully downloaded image: ${selectedRecord.steganographic_image.filename}`);
      
      return {
        imageBuffer,
        metadata: {
          filename: selectedRecord.steganographic_image.filename,
          size: selectedRecord.steganographic_image.size,
          hidden_message: selectedRecord.steganographic_image.hidden_message,
          user_id: selectedRecord.user_id,
          created_date: selectedRecord.steganographic_image.created_date,
          image_capacity: selectedRecord.steganographic_image.image_capacity,
          bait_id: selectedRecord._id
        }
      };
      
    } catch (error) {
      console.error('Error in getRandomImageByCompany:', error.message);
      throw error;
    }
  }
  
// ...existing code...

  /**
   * Get the latest steganographic image from database (most recent upload)
   * @returns {Object} - Image buffer and metadata or null if not found
   */
  async getLatestImage() {
    try {
      console.log(`Searching for latest image in database`);
      
      // Find the most recent bait record (any company)
      const latestRecord = await onfidoBait.findOne()
        .sort({ createdAt: -1 }) // Sort by creation date, newest first
        .limit(1);
      
      if (!latestRecord) {
        console.log(`❌ No images found in database`);
        return null;
      }
      
      console.log(`📋 Found latest record from company: ${latestRecord.company}, created: ${latestRecord.createdAt}`);
      
      // Download image from Cloudinary URL
      const imageUrl = latestRecord.steganographic_image.path;
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      console.log(`✅ Successfully downloaded latest image: ${latestRecord.steganographic_image.filename}`);
      
      return {
        imageBuffer,
        metadata: {
          filename: latestRecord.steganographic_image.filename,
          size: latestRecord.steganographic_image.size,
          hidden_message: latestRecord.steganographic_image.hidden_message,
          user_id: latestRecord.user_id,
          company: latestRecord.company,
          created_date: latestRecord.steganographic_image.created_date,
          uploaded_date: latestRecord.createdAt,
          image_capacity: latestRecord.steganographic_image.image_capacity,
          bait_id: latestRecord._id
        }
      };
      
    } catch (error) {
      console.error('Error in getLatestImage:', error.message);
      throw error;
    }
  }

}

module.exports = new ImageSteganographyService();