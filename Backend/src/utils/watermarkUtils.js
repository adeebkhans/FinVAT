// Watermarking utility for deeply nested JSON
// Applies subtle, deterministic manipulations based on a seed
const crypto = require('crypto');

// Utility: Insert zero-width space at a deterministic position in a string
function insertZeroWidth(str, seed) {
  if (!str || str.length === 0) return str;
  const pos = Math.max(1, seed % str.length);
  return str.slice(0, pos) + '\u200B' + str.slice(pos);
}

// Utility: Tweak a float value by adding a very small amount at 5th decimal place
function tweakFloat(val, seed) {
  if (typeof val !== 'number') return val;
  // Add a unique signature at the 5th decimal place (0.00001 to 0.00009)
  const variations = [0.00001, 0.00002, 0.00003, 0.00004, 0.00005, 0.00006, 0.00007, 0.00008, 0.00009];
  const tweak = variations[seed % variations.length];
  // Always add (don't subtract) to ensure consistency
  return Math.round((val + tweak) * 100000) / 100000;
}

// Utility: Add subtle watermarks to strings using strategic hyphen insertion
function tweakString(str, seed) {
  if (!str || str.length === 0) return str;
  
  const methods = [
    // Method 0: Insert hyphen in middle of word (Maha-rashtra)
    (s) => {
      // Find a good spot to insert hyphen (middle of a longer word)
      const words = s.split(' ');
      const longestWordIndex = words.reduce((maxIdx, word, idx) => 
        word.length > words[maxIdx].length ? idx : maxIdx, 0);
      
      if (words[longestWordIndex].length > 4) {
        const word = words[longestWordIndex];
        const mid = Math.floor(word.length / 2);
        words[longestWordIndex] = word.slice(0, mid) + '-' + word.slice(mid);
      }
      return words.join(' ');
    },
    // Method 1: Add underscore suffix (TCS_Ltd_)
    (s) => s.endsWith('_') ? s : s + '_',
    // Method 2: Insert hyphen between words (MG-Road)
    (s) => s.replace(' ', '-'),
    // Method 3: Insert underscore between words
    (s) => s.replace(' ', '_')
  ];
  
  const method = methods[seed % methods.length];
  return method(str);
}

// Utility: Manipulate date format by swapping day-month when day > 12
function tweakDate(dateStr, seed) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  
  // Only manipulate if it looks like a date (YYYY-MM-DD format)
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(dateRegex);
  
  if (match) {
    const [, year, month, day] = match;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    // Only swap if day > 12 (so we can detect it later) and month is valid (≤12)
    if (dayNum > 12 && monthNum <= 12) {
      // Swap day and month: YYYY-MM-DD becomes YYYY-DD-MM
      return `${year}-${day}-${month}`;
    }
  }
  
  return dateStr;
}

// NEW: Company-specific watermark insertion in address_line2
function insertCompanyCode(str, companyId, seed) {
  if (!str || str.length === 0) return str;
  
  // Generate company-specific codes (3-4 character codes that look natural)
  const companyCodes = {
    'creder': ['CR01', 'CRD2', 'CR03'],
    'PayFriend': ['PF01', 'PFD2', 'PF03'], 
    'LoanIt': ['LI01', 'LID2', 'LI03'],
  };
  
  // Get company-specific code or generate a fallback
  const codes = companyCodes[companyId] || [`${companyId.substring(0,2).toUpperCase()}01`];
  const code = codes[seed % codes.length];
  
  // Natural ways to append the code
  const appendMethods = [
    (s, c) => `${s}, Block ${c}`,           // "Near Park, Block CR01"
    (s, c) => `${s} - ${c}`,               // "Near Park - CR01" 
    (s, c) => `${s}, Sector ${c}`,         // "Near Park, Sector PF01"
    (s, c) => `${s} (${c})`,               // "Near Park (LI01)"
    (s, c) => `${s}, Unit ${c}`,           // "Near Park, Unit TC01"
  ];
  
  const method = appendMethods[seed % appendMethods.length];
  return method(str, code);
}

// Define which fields to watermark and which technique to use
// This can be made more dynamic/pluggable
const manipulations = [
  { path: ['contact_details', 'email'], fn: insertZeroWidth },
  { path: ['pan'], fn: insertZeroWidth },
  { path: ['employment_details', 'monthly_income'], fn: tweakFloat },
  { path: ['employment_details', 'employer_name'], fn: tweakString },
  { path: ['dob'], fn: tweakDate }, // Add date manipulation
  { path: ['aadhaar'], fn: insertZeroWidth },
  { path: ['contact_details', 'mobile'], fn: insertZeroWidth },
  { path: ['employment_details', 'designation'], fn: tweakString },
  { path: ['employment_details', 'years_of_experience'], fn: tweakFloat },
  { path: ['address_history', 0, 'address_line1'], fn: tweakString },
  { path: ['address_history', 0, 'city'], fn: tweakString },
  { path: ['address_history', 0, 'state'], fn: tweakString },
  { path: ['address_history', 0, 'pincode'], fn: insertZeroWidth },
  // NEW: Company-specific watermark (higher weight in detection)
  { path: ['address_history', 1, 'address_line2'], fn: 'insertCompanyCode', isCompanySpecific: true },
  { path: ['bank_accounts', 0, 'bank_name'], fn: tweakString },
  { path: ['bank_accounts', 0, 'current_balance'], fn: tweakFloat },
  { path: ['bank_accounts', 0, 'opening_date'], fn: tweakDate }, // Add date manipulation
  { path: ['bank_accounts', 0, 'last_updated'], fn: tweakDate }, // Add date manipulation
  { path: ['bank_accounts', 1, 'bank_name'], fn: tweakString },
  { path: ['bank_accounts', 1, 'current_balance'], fn: tweakFloat },
  { path: ['bank_accounts', 1, 'opening_date'], fn: tweakDate }, // Add date manipulation
  { path: ['bank_accounts', 1, 'last_updated'], fn: tweakDate }, // Add date manipulation
  { path: ['credit_accounts', 0, 'lender_name'], fn: tweakString },
  { path: ['credit_accounts', 0, 'loan_amount'], fn: tweakFloat },
  { path: ['credit_accounts', 0, 'emi_amount'], fn: tweakFloat },
  { path: ['credit_accounts', 0, 'sanctioned_date'], fn: tweakDate }, // Add date manipulation
  { path: ['credit_accounts', 1, 'lender_name'], fn: tweakString },
  { path: ['credit_accounts', 1, 'credit_limit'], fn: tweakFloat },
  { path: ['credit_accounts', 1, 'current_outstanding_balance'], fn: tweakFloat },
  { path: ['enquiries', 0, 'lender_name'], fn: tweakString },
  { path: ['enquiries', 0, 'enquiry_date'], fn: tweakDate }, // Add date manipulation
  { path: ['enquiries', 1, 'lender_name'], fn: tweakString },
  { path: ['public_records', 0, 'details'], fn: tweakString },
  { path: ['guarantee_details', 0, 'guaranteed_party_name'], fn: tweakString },
  { path: ['guarantee_details', 0, 'guarantee_amount'], fn: tweakFloat },
  { path: ['disputes', 0, 'description'], fn: tweakString },
  { path: ['cibil_score_history', 0, 'score'], fn: tweakFloat },
  { path: ['cibil_score_history', 1, 'score'], fn: tweakFloat },
  { path: ['cibil_score_history', 2, 'score'], fn: tweakFloat },
];

// Main watermarking function
function watermarkJson(json, seed, companyId = null) {
  let fingerprint = '';
  let patternApplied = [];
  let modified = JSON.parse(JSON.stringify(json));

  console.log(`🔧 Starting watermarking for company: ${companyId}`);
  console.log(`Total manipulations to process: ${manipulations.length}`);

  manipulations.forEach((m, i) => {
    // Derive a sub-seed for each manipulation
    const subSeed = parseInt(crypto.createHash('sha256').update(seed + i).digest('hex').slice(0, 8), 16);
    
    // Decide whether to apply this manipulation based on seed
    const shouldApply = (subSeed % 100) < 50; // 50% chance based on seed
      
    if (shouldApply) {
      // Traverse to the field
      let obj = modified;
      let pathExists = true;
      
      for (let j = 0; j < m.path.length - 1; j++) {
        if (!obj[m.path[j]]) {
          fingerprint += '0';
          pathExists = false;
          break;
        }
        obj = obj[m.path[j]];
      }
      
      if (!pathExists) return;
      
      const key = m.path[m.path.length - 1];
      if (obj[key] !== undefined) {
        const original = obj[key];
        let changed;
        
        console.log(`Processing field: ${m.path.join('.')}, original value: "${original}"`);
        
        // Handle company-specific watermark
        if (m.fn === 'insertCompanyCode' && companyId) {
          console.log(`Applying company code for: ${companyId}`);
          changed = insertCompanyCode(original, companyId, subSeed);
          console.log(`Company code result: "${original}" -> "${changed}"`);
        } else if (typeof m.fn === 'function') {
          changed = m.fn(original, subSeed);
          console.log(`Function result: "${original}" -> "${changed}"`);
        } else {
          changed = original;
          console.log(`Unknown function type: ${m.fn}`);
        }
        
        if (changed !== original) {
          obj[key] = changed;
          fingerprint += '1';
          patternApplied.push(m.path.join('.'));
          console.log(`✅ Applied watermark to ${m.path.join('.')}: "${original}" -> "${changed}"`);
        } else {
          fingerprint += '0';
          console.log(`No change made to ${m.path.join('.')}`);
        }
      } else {
        fingerprint += '0';
        console.log(`Field ${key} not found in object`);
      }
    } else {
      fingerprint += '0';
    }
  });
  
  console.log(`Watermarking complete. Fingerprint: ${fingerprint}`);
  console.log(`Patterns applied: ${patternApplied}`);
  
  return { modified, fingerprint, patternApplied };
}

// Detection: Compare a suspicious JSON to a reference JSON and return which manipulations are present
function detectWatermark(suspectJson, referenceJson, manipulations, seed) {
  let detected = '';
  let matchedFields = [];
  manipulations.forEach((m, i) => {
    const subSeed = parseInt(crypto.createHash('sha256').update(seed + i).digest('hex').slice(0, 8), 16);
    
    // Check if this manipulation should have been applied based on the same logic
    const shouldApply = (subSeed % 100) < 50; // Same 50% chance logic
    
    if (shouldApply) {
      // Traverse to the field
      let objS = suspectJson;
      let objR = referenceJson;
      for (let j = 0; j < m.path.length - 1; j++) {
        objS = objS ? objS[m.path[j]] : undefined;
        objR = objR ? objR[m.path[j]] : undefined;
      }
      const key = m.path[m.path.length - 1];
      if (objS && objR && objS[key] !== undefined && objR[key] !== undefined) {
        const expected = m.fn(objR[key], subSeed);
        if (objS[key] === expected && expected !== objR[key]) {
          detected += '1';
          matchedFields.push(m.path.join('.'));
        } else {
          detected += '0';
        }
      } else {
        detected += '0';
      }
    } else {
      detected += '0';
    }
  });
  return { detected, matchedFields };
}

// Encode binary string as zero-width chars
function encodeBinaryToZeroWidth(binary) {
  return binary.replace(/0/g, '\u200B').replace(/1/g, '\u200C');
}

// Decode zero-width chars to binary string
function decodeZeroWidthToBinary(str) {
  return str.replace(/[^\u200B\u200C]/g, '')
            .replace(/\u200B/g, '0')
            .replace(/\u200C/g, '1');
}

// Generate deterministic binary code for a company/seed
function generateBinaryWatermark(seed, length = 16) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  let binary = '';
  for (let i = 0; i < length; i++) {
    binary += (parseInt(hash[i], 16) % 2).toString();
  }
  return binary;
}

module.exports = {
  insertZeroWidth,
  tweakFloat,
  tweakString,
  tweakDate,
  insertCompanyCode,
  watermarkJson,
  detectWatermark,
  manipulations,
  encodeBinaryToZeroWidth,
  decodeZeroWidthToBinary,
  generateBinaryWatermark,
};
