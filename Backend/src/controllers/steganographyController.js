const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Fingerprint = require('../models/FingerprintSchema');
const OnfidoBait = require('../models/onfidoBait');
const imageStegano = require('../services/imageSteganoService');
const {
  watermarkJson,
  detectWatermark,
  manipulations,
  insertZeroWidth,
  tweakFloat,
  tweakString,
  tweakDate,
  encodeBinaryToZeroWidth,
  decodeZeroWidthToBinary,
  generateBinaryWatermark,
} = require('../utils/watermarkUtils');
const crypto = require('crypto');

// Configure Cloudinary (add to your .env file)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG files are allowed for steganography'), false);
    }
  }
});

// POST /onfido - Simulate Onfido KYC document verification with steganography
const onfidoSimulation = async (req, res) => {
  try {
    const { user_id, company, document_type = 'PAN Card' } = req.body;

    if (!user_id || !company) {
      return res.status(400).json({
        success: false,
        message: 'user_id and company are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PNG image file is required'
      });
    }

    console.log(`🔧 Processing Onfido verification for user: ${user_id}, company: ${company}`);

    // Step 1: Analyze original image capacity
    const originalImageBuffer = req.file.buffer;
    const imageCapacity = imageStegano.analyzeImageCapacity(originalImageBuffer);

    // Step 2: Check if company name can fit in the image
    if (!imageStegano.canFitMessage(originalImageBuffer, company)) {
      return res.status(400).json({
        success: false,
        message: `Image too small to hide company name "${company}"`
      });
    }

    // Step 3: Apply steganography - hide company name in image
    const steganographicImageBuffer = imageStegano.hideCompanyNameInImage(originalImageBuffer, company);

    // Step 4: Upload steganographic image to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'onfido_baits',
          public_id: `${user_id}_${company}_${Date.now()}`,
          format: 'png'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(steganographicImageBuffer);
    });

    // Step 5: Save to database
    const onfidoBait = new OnfidoBait({
      user_id,
      company,
      steganographic_image: {
        filename: `${user_id}_${company}_${Date.now()}.png`,
        path: uploadResult.secure_url,
        size: steganographicImageBuffer.length,
        hidden_message: company,
        image_capacity: {
          width: imageCapacity.width,
          height: imageCapacity.height,
          max_message_length: imageCapacity.maxMessageLength
        }
      }
    });

    await onfidoBait.save();

    // Step 6: Generate simple verification result
    const outcomes = ['verified', 'pending', 'rejected'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    // Step 7: Return simple response
    res.json({
      success: true,
      message: 'Document verification completed',
      verification_result: {
        id: `verification_${crypto.randomUUID().slice(0, 8)}`,
        status: outcome,
        document_type: document_type,
        created_at: new Date().toISOString()
      },
      steganography_info: {
        image_watermarked: true,
        company_hidden: company,
        cloudinary_url: uploadResult.secure_url
      },
      database_record: {
        id: onfidoBait._id,
        created_at: onfidoBait.createdAt
      }
    });

  } catch (error) {
    console.error('Error in onfidoSimulation:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
};

// POST /watermark/:companyId
const watermark = async (req, res) => {
  const { companyId } = req.params;
  const userData = req.body;

  // Ensure address_history structure exists for company code watermarking
  if (!userData.address_history) {
    userData.address_history = [];
  }

  // Ensure we have at least 2 address entries
  while (userData.address_history.length < 2) {
    userData.address_history.push({
      address_line1: "Sample Address",
      address_line2: "Near Central Park",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001"
    });
  }

  // Ensure address_line2 exists in the second entry
  if (!userData.address_history[1].address_line2) {
    userData.address_history[1].address_line2 = "Near Central Park";
  }

  let record = await Fingerprint.findOne({ companyId });
  let watermarkSeed;
  if (!record) {
    watermarkSeed = crypto.randomUUID();
  } else {
    watermarkSeed = record.watermarkSeed;
  }

  // Generate binary watermark and embed ---
  const binaryCode = generateBinaryWatermark(watermarkSeed + companyId, 16);
  const zeroWidth = encodeBinaryToZeroWidth(binaryCode);

  // Embed in a safe field (e.g. full_name or a new field)
  if (userData.full_name) {
    userData.full_name += zeroWidth;
  } else {
    userData.__binary_wm = zeroWidth;
  }

  // Pass companyId to watermarkJson function
  const { modified, fingerprint, patternApplied } = watermarkJson(userData, watermarkSeed, companyId);

  // Also embed in modified result ---
  if (modified.full_name) {
    modified.full_name += zeroWidth;
  } else {
    modified.__binary_wm = zeroWidth;
  }

  if (!record) {
    await Fingerprint.create({
      companyId,
      watermarkSeed,
      patternApplied,
      fingerprintCode: fingerprint,
      binaryWatermark: binaryCode 
    });
  } else {
    record.patternApplied = patternApplied;
    record.fingerprintCode = fingerprint;
    record.binaryWatermark = binaryCode;
    await record.save();
  }
  res.json(modified);
};

// Exact copy of watermark endpoint but as function
const watermarkUserData = async (userData, companyId) => {
  // Ensure address_history structure exists for company code watermarking
  if (!userData.address_history) {
    userData.address_history = [];
  }

  // Ensure we have at least 2 address entries
  while (userData.address_history.length < 2) {
    userData.address_history.push({
      address_line1: "Sample Address",
      address_line2: "Near Central Park",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001"
    });
  }

  // Ensure address_line2 exists in the second entry
  if (!userData.address_history[1].address_line2) {
    userData.address_history[1].address_line2 = "Near Central Park";
  }

  let record = await Fingerprint.findOne({ companyId });
  let watermarkSeed;
  if (!record) {
    watermarkSeed = crypto.randomUUID();
  } else {
    watermarkSeed = record.watermarkSeed;
  }

  // Generate binary watermark and embed ---
  const binaryCode = generateBinaryWatermark(watermarkSeed + companyId, 16);
  const zeroWidth = encodeBinaryToZeroWidth(binaryCode);

  if (userData.full_name) {
    userData.full_name += zeroWidth;
  } else {
    userData.__binary_wm = zeroWidth;
  }

  const { modified, fingerprint, patternApplied } = watermarkJson(userData, watermarkSeed, companyId);

  if (modified.full_name) {
    modified.full_name += zeroWidth;
  } else {
    modified.__binary_wm = zeroWidth;
  }

  if (!record) {
    await Fingerprint.create({
      companyId,
      watermarkSeed,
      patternApplied,
      fingerprintCode: fingerprint,
      binaryWatermark: binaryCode
    });
  } else {
    record.patternApplied = patternApplied;
    record.fingerprintCode = fingerprint;
    record.binaryWatermark = binaryCode;
    await record.save();
  }
  return modified;
};

// POST /detect
const detect = async (req, res) => {
  const suspects = Array.isArray(req.body) ? req.body : [req.body];
  const all = await Fingerprint.find();

  let allCompanyMatches = {};
  let detailedResults = [];

  // Process each suspect data
  for (let suspectIndex = 0; suspectIndex < suspects.length; suspectIndex++) {
    const suspect = suspects[suspectIndex];
    let suspectResults = {
      suspectIndex,
      companyMatches: {},
      bestMatch: null,
      bestScore: 0,
      bestConfidence: 0
    };

    // Check against all stored fingerprints
    for (const rec of all) {
      let score = 0;
      let detectedFields = [];
      let hasCompanyCodeMatch = false; // Track if company code was found

      // Check each manipulation to see if it appears to be applied in the suspect data
      for (let i = 0; i < manipulations.length; i++) {
        const manipulation = manipulations[i];
        const subSeed = parseInt(crypto.createHash('sha256').update(rec.watermarkSeed + i).digest('hex').slice(0, 8), 16);
        const shouldApply = (subSeed % 100) < 50; // Same logic as watermarking

        // Only check fields that should have been watermarked for this company
        if (shouldApply && rec.fingerprintCode[i] === '1') {
          // Navigate to the field in suspect data
          let objS = suspect;
          for (let j = 0; j < manipulation.path.length - 1; j++) {
            objS = objS ? objS[manipulation.path[j]] : undefined;
          }

          const key = manipulation.path[manipulation.path.length - 1];
          if (objS && objS[key] !== undefined) {
            // Check if this field looks like it has been watermarked
            const value = objS[key];
            let hasWatermark = false;

            if (manipulation.fn === insertZeroWidth) {
              // Check for zero-width characters
              hasWatermark = typeof value === 'string' && value.includes('\u200B');
            } else if (manipulation.fn === tweakFloat) {
              // Check for very specific 5th decimal place watermark (0.00001-0.00009)
              hasWatermark = typeof value === 'number' &&
                value % 1 !== 0 && // Has decimal places
                value.toString().includes('.') &&
                value.toString().split('.')[1] &&
                value.toString().split('.')[1].length >= 5 && // At least 5 decimal places
                /\d{4}[1-9]$/.test(value.toString().split('.')[1]); // Ends with non-zero at 5th position
            } else if (manipulation.fn === tweakString) {
              // Check for subtle string watermarks (hyphens, underscores)
              if (typeof value === 'string') {
                hasWatermark = value.includes('-') && !value.match(/^\d{4}-\d{2}-\d{2}$/) || // Has hyphen but not date format
                  value.endsWith('_') || // Ends with underscore
                  value.includes('_') && !value.includes('@'); // Has underscore but not email
              }
            } else if (manipulation.fn === tweakDate) {
              // Check for date format manipulation (day-month swap when day > 12)
              if (typeof value === 'string') {
                const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (dateMatch) {
                  const [, year, part1, part2] = dateMatch;
                  const num1 = parseInt(part1);
                  const num2 = parseInt(part2);
                  // Detect if day appears to be in month position (>12) with valid month in day position
                  hasWatermark = num1 > 12 && num2 <= 12;
                }
              }
            } else if (manipulation.fn === 'insertCompanyCode') {
              // NEW: Check for company-specific code patterns
              if (typeof value === 'string') {
                const companyCodes = {
                  'creder': ['CR01', 'CRD2', 'CR03'],
                  'PayFriend': ['PF01', 'PFD2', 'PF03'],
                  'LoanIt': ['LI01', 'LID2', 'LI03'],
                  'TCS': ['TC01', 'TCD2', 'TC03'],
                  'HDFC': ['HD01', 'HDD2', 'HD03'],
                  'Axis Bank': ['AX01', 'AXD2', 'AX03'],
                  'ICICI': ['IC01', 'ICD2', 'IC03']
                };

                const codes = companyCodes[rec.companyId] || [`${rec.companyId.substring(0, 2).toUpperCase()}01`];
                hasWatermark = codes.some(code =>
                  value.includes(`Block ${code}`) ||
                  value.includes(`- ${code}`) ||
                  value.includes(`Sector ${code}`) ||
                  value.includes(`(${code})`) ||
                  value.includes(`Unit ${code}`)
                );

                if (hasWatermark) {
                  hasCompanyCodeMatch = true; // Flag that company code was found
                }
              }
            }

            if (hasWatermark) {
              score++;
              detectedFields.push(manipulation.path.join('.'));
            }
          }
        }
      }

      // Calculate confidence based on the company's actual fingerprint pattern
      const totalWatermarkedFields = rec.fingerprintCode.split('').filter(bit => bit === '1').length;
      let confidence = totalWatermarkedFields > 0 ? score / totalWatermarkedFields : 0;

      // NEW: Apply 10% boost if company code matched and base confidence < 90%
      let finalConfidence = confidence;
      if (hasCompanyCodeMatch && confidence < 0.9) {
        finalConfidence = Math.min(1.0, confidence + 0.1); // Add 10% but cap at 100%
      }

      // Check for binary watermark ---
      let binaryBoost = 0;
      if (rec.binaryWatermark) {
        // Try to extract from suspect.full_name or __binary_wm
        let field = suspect.full_name || suspect.__binary_wm || '';
        const extractedBinary = decodeZeroWidthToBinary(field);
        if (extractedBinary && extractedBinary.length >= rec.binaryWatermark.length) {
          if (extractedBinary.startsWith(rec.binaryWatermark)) {
            // Boost confidence: new_conf = conf/2 + 0.5
            binaryBoost = 0.5;
            finalConfidence = Math.min(1.0, finalConfidence / 2 + binaryBoost);
            detectedFields = [
              ...detectedFields,
              "full_name (binary code)"
            ]
          }
        }
      }
  

      // Store result for this company-suspect pair
      suspectResults.companyMatches[rec.companyId] = {
        score,
        confidence: (finalConfidence * 100).toFixed(2) + '%',
        matchedFields: detectedFields,
        detectedPattern: detectedFields.length + '/' + totalWatermarkedFields,
        storedPattern: rec.fingerprintCode,
        hasCompanyCodeMatch, // Include for debugging
        baseConfidence: (confidence * 100).toFixed(2) + '%', // Show original confidence
        boostApplied: hasCompanyCodeMatch && confidence < 0.9 // Show if boost was applied
      };

      // Track company matches across all suspects (use final confidence for tracking)
      if (score > 0) {
        if (!allCompanyMatches[rec.companyId]) {
          allCompanyMatches[rec.companyId] = {
            totalScore: 0,
            matchCount: 0,
            suspectMatches: []
          };
        }

        allCompanyMatches[rec.companyId].totalScore += score;
        allCompanyMatches[rec.companyId].matchCount++;
        allCompanyMatches[rec.companyId].suspectMatches.push({
          suspectIndex,
          score,
          confidence: (finalConfidence * 100).toFixed(2) + '%' // Use final confidence
        });
      }

      // Update best match for this suspect (use final confidence)
      if (score > suspectResults.bestScore) {
        suspectResults.bestScore = score;
        suspectResults.bestMatch = rec.companyId;
        suspectResults.bestConfidence = finalConfidence;
      }
    }

    detailedResults.push(suspectResults);
  }

  // Calculate average scores and sort companies by match percentage
  const companyScores = [];

  for (const [companyId, data] of Object.entries(allCompanyMatches)) {
    const avgScore = data.totalScore / data.matchCount;
    // Find the company's fingerprint to get correct watermarked field count
    const companyRecord = all.find(rec => rec.companyId === companyId);
    const totalWatermarkedFields = companyRecord ? companyRecord.fingerprintCode.split('').filter(bit => bit === '1').length : manipulations.length;
    const avgPercentage = (avgScore / totalWatermarkedFields) * 100;
    data.avgPercentage = avgPercentage.toFixed(2) + '%';

    companyScores.push({
      companyId,
      avgPercentage: avgPercentage, // Store as number for comparison
      avgPercentageFormatted: avgPercentage.toFixed(2) + '%', // Store formatted for display
      data
    });
  }

  // Sort by average percentage (highest first)
  companyScores.sort((a, b) => b.avgPercentage - a.avgPercentage);

  if (companyScores.length === 0) {
    return res.json({
      MatchedCompaniesCount: 0,
      BestMatchCompanyId: null,
      BestMatchAvgPercentage: "0.00%",
      Message: "No watermark matches found"
    });
  }

  // Get the best match
  const bestMatch = companyScores[0];
  const bestPercentage = bestMatch.avgPercentage;

  // Only include companies within 5% of the best match
  const qualifyingCompanies = companyScores.filter(company => {
    return (bestPercentage - company.avgPercentage) <= 5;
  });

  // Prepare qualifying company summary
  const qualifyingSummary = {};
  qualifyingCompanies.forEach(company => {
    qualifyingSummary[company.companyId] = company.data;
  });

  // Filter detailed results to only include qualifying companies
  const qualifyingCompanyIds = new Set(qualifyingCompanies.map(c => c.companyId));
  const filteredDetailedResults = detailedResults.map(suspectResult => {
    const filteredCompanyMatches = Object.fromEntries(
      Object.entries(suspectResult.companyMatches).filter(([companyId]) =>
        qualifyingCompanyIds.has(companyId)
      )
    );

    // Recalculate best match from the filtered companies
    let newBestMatch = null;
    let newBestScore = 0;
    let newBestConfidence = 0;

    for (const [companyId, match] of Object.entries(filteredCompanyMatches)) {
      if (match.score > newBestScore) {
        newBestScore = match.score;
        newBestMatch = companyId;
        newBestConfidence = parseFloat(match.confidence) / 100;
      }
    }

    return {
      ...suspectResult,
      companyMatches: filteredCompanyMatches,
      bestMatch: newBestMatch,
      bestScore: newBestScore,
      bestConfidence: newBestConfidence
    };
  });

  res.json({
    MatchedCompaniesCount: qualifyingCompanies.length,
    BestMatchCompanyId: bestMatch.companyId,
    BestMatchConfidence: bestMatch.avgPercentageFormatted,
    TotalSuspectsAnalyzed: suspects.length,
    TotalManipulations: manipulations.length,
    QualifyingCompaniesSummary: qualifyingSummary,
    QualifyingCompaniesRanking: qualifyingCompanies.map((company, index) => ({
      rank: index + 1,
      companyId: company.companyId,
      confidence: company.avgPercentageFormatted,
      totalMatches: company.data.matchCount
    })),
    DetailedAnalysis: filteredDetailedResults
  });
};

// POST /detect-image - Extract company name from steganographic image
const detectImageSteganography = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PNG image file is required'
      });
    }

    console.log('🔍 Starting image steganography detection');

    // Step 1: Extract hidden message from image
    const imageBuffer = req.file.buffer;
    const extractedCompany = imageStegano.extractCompanyNameFromImage(imageBuffer);

    if (!extractedCompany) {
      return res.json({
        success: true,
        message: 'No hidden message detected in image',
        detection_result: {
          has_steganography: false,
          extracted_company: null,
          confidence: '0.00%'
        }
      });
    }

    // Step 2: Check if extracted company exists in our bait database
    const baitRecord = await OnfidoBait.findOne({
      'steganographic_image.hidden_message': extractedCompany
    });

    // Step 3: Analyze image capacity for validation
    const imageCapacity = imageStegano.analyzeImageCapacity(imageBuffer);

    // Step 4: Calculate confidence based on message clarity and database match
    let confidence = 75; // Base confidence for successful extraction

    if (baitRecord) {
      confidence += 20; // Boost if found in our bait database
      console.log(`✅ Found matching bait record for company: ${extractedCompany}`);
    }

    // Step 5: Return detection results
    res.json({
      success: true,
      message: 'Steganography detected successfully',
      detection_result: {
        has_steganography: true,
        extracted_company: extractedCompany,
        confidence: `${confidence.toFixed(2)}%`,
        image_analysis: {
          width: imageCapacity.width,
          height: imageCapacity.height,
          total_pixels: imageCapacity.totalPixels,
          max_capacity: imageCapacity.maxMessageLength
        }
      },
      bait_info: baitRecord ? {
        found_in_database: true,
        original_user: baitRecord.user_id,
        shared_with_company: baitRecord.company,
        created_date: baitRecord.createdAt,
        bait_id: baitRecord._id
      } : {
        found_in_database: false,
        message: 'This image may be from an external source'
      }
    });

  } catch (error) {
    console.error('Error in detectImageSteganography:', error);
    res.status(500).json({
      success: false,
      message: 'Detection failed',
      error: error.message
    });
  }
};

// Add this test endpoint temporarily
const testSteganography = async (req, res) => {
  try {
    // Create a test image
    const testImage = imageStegano.createSampleImage(200, 200);

    // Hide a simple message
    const watermarkedImage = imageStegano.hideCompanyNameInImage(testImage, 'TCS');

    // Try to extract it
    const extracted = imageStegano.extractCompanyNameFromImage(watermarkedImage);

    res.json({
      success: true,
      original_message: 'TCS',
      extracted_message: extracted,
      match: extracted === 'TCS'
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

const getLatestImage = async (req, res) => {
  try {
    console.log(`🔍 Getting latest image from database`);

    // Get latest image from the service (no company parameter needed)
    const result = await imageStegano.getLatestImage();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `No images found in database`
      });
    }

    const { imageBuffer, metadata } = result;

    // Set response headers for image download
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Content-Disposition': `attachment; filename="${metadata.filename}"`,
      'X-Image-Metadata': JSON.stringify({
        hidden_message: metadata.hidden_message,
        user_id: metadata.user_id,
        company: metadata.company,
        created_date: metadata.created_date,
        uploaded_date: metadata.uploaded_date,
        bait_id: metadata.bait_id
      })
    });

    // Send the image buffer directly
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error in getLatestImage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve latest image',
      error: error.message
    });
  }
};

// Update module.exports
module.exports = {
  watermark,
  detect,
  watermarkUserData,
  testSteganography,
  getLatestImage, // Updated name
  onfidoSimulation: [upload.single('document'), onfidoSimulation],
  detectImageSteganography: [upload.single('image'), detectImageSteganography]
};