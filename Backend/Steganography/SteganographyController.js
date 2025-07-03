const express = require('express');
const Fingerprint = require('./FingerprintSchema');
const {
  watermarkJson,
  detectWatermark,
  manipulations,
  insertZeroWidth,
  tweakFloat,
  tweakString,
  tweakDate
} = require('./watermarkUtils');
const crypto = require('crypto');

// POST /watermark/:companyId
exports.watermark = async (req, res) => {
  const { companyId } = req.params;
  const userData = req.body;
  let record = await Fingerprint.findOne({ companyId });
  let watermarkSeed;
  if (!record) {
    watermarkSeed = crypto.randomUUID();
  } else {
    watermarkSeed = record.watermarkSeed;
  }
  const { modified, fingerprint, patternApplied } = watermarkJson(userData, watermarkSeed);
  if (!record) {
    await Fingerprint.create({
      companyId,
      watermarkSeed,
      patternApplied,
      fingerprintCode: fingerprint
    });
  } else {
    record.patternApplied = patternApplied;
    record.fingerprintCode = fingerprint;
    await record.save();
  }
  res.json(modified);
};

// POST /detect
exports.detect = async (req, res) => {
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
            // We look for specific watermark signatures
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
      const confidence = totalWatermarkedFields > 0 ? score / totalWatermarkedFields : 0;
      
      // Store result for this company-suspect pair
      suspectResults.companyMatches[rec.companyId] = {
        score,
        confidence: (confidence * 100).toFixed(2) + '%',
        matchedFields: detectedFields,
        detectedPattern: detectedFields.length + '/' + totalWatermarkedFields,
        storedPattern: rec.fingerprintCode
      };
      
      // Track company matches across all suspects
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
          confidence: (confidence * 100).toFixed(2) + '%'
        });
      }
      
      // Update best match for this suspect
      if (score > suspectResults.bestScore) {
        suspectResults.bestScore = score;
        suspectResults.bestMatch = rec.companyId;
        suspectResults.bestConfidence = confidence;
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
