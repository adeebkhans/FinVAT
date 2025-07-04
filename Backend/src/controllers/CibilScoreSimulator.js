const User = require('../models/User');
const Bait = require('../models/BaitSchema');
const { watermarkUserData } = require('./steganographyController');
const crypto = require('crypto');

// Enum of companies
const COMPANIES = ['creder', 'PayFriend', 'LoanIt'];

// Generate dummy CIBIL score response
const generateDummyCibilResponse = (userData) => {
  // Generate a random but consistent score based on user data
  const seed = userData.user_id || userData.full_name || 'default';
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const baseScore = parseInt(hash.slice(0, 3), 16) % 400 + 300; // Score between 300-700

  return {
    success: true,
    message: "CIBIL Score retrieved successfully",
    data: {
      user_id: userData.user_id,
      full_name: userData.full_name,
      cibil_score: baseScore,
      score_range: getScoreRange(baseScore),
      report_date: new Date().toISOString().split('T')[0],
      factors_affecting_score: generateScoreFactors(baseScore),
      recommendations: generateRecommendations(baseScore),
      next_update_date: getNextUpdateDate()
    }
  };
};

// Helper function to get score range description
const getScoreRange = (score) => {
  if (score >= 750) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 650) return "Fair";
  if (score >= 600) return "Poor";
  return "Very Poor";
};

// Generate factors affecting score
const generateScoreFactors = (score) => {
  const factors = [];
  
  if (score < 650) {
    factors.push("High credit utilization ratio");
    factors.push("Recent late payments detected");
  }
  if (score < 700) {
    factors.push("Limited credit history length");
    factors.push("Multiple recent credit inquiries");
  }
  if (score >= 700) {
    factors.push("Good payment history");
    factors.push("Optimal credit utilization");
  }
  if (score >= 750) {
    factors.push("Excellent payment track record");
    factors.push("Long credit history");
    factors.push("Diverse credit mix");
  }

  return factors;
};

// Generate recommendations
const generateRecommendations = (score) => {
  const recommendations = [];
  
  if (score < 650) {
    recommendations.push("Pay all bills on time consistently");
    recommendations.push("Reduce credit card balances");
    recommendations.push("Avoid applying for new credit");
  } else if (score < 700) {
    recommendations.push("Maintain low credit utilization");
    recommendations.push("Keep old credit accounts open");
  } else {
    recommendations.push("Continue current financial habits");
    recommendations.push("Monitor credit report regularly");
  }

  return recommendations;
};

// Get next update date (30 days from now)
const getNextUpdateDate = () => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 30);
  return nextDate.toISOString().split('T')[0];
};

// Main CIBIL score simulation API
const simulateCibilScore = async (req, res) => {
  try {
    const userId = req.user.username; // Get from auth middleware
    
    // Check if user has profile data
    const user = await User.findById(req.user._id);
    if (!user || !user.profile) {
      return res.status(400).json({
        success: false,
        message: "User profile not found. Please generate profile first."
      });
    }

    // Select a random company for simulation first
    const selectedCompany = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];

    // Check if we already have bait data for this user with this specific company
    const existingBait = await Bait.findOne({ 
      user_id: userId, 
      company: selectedCompany 
    });
    
    if (existingBait) {
      // User already has data with this company, return dummy CIBIL score without watermarking again
      const dummyResponse = generateDummyCibilResponse(existingBait);
      return res.status(200).json({
        ...dummyResponse,
        message: "CIBIL Score retrieved from existing record",
        company_used: existingBait.company,
        data_already_shared: true,
        note: `Data was previously shared with ${selectedCompany}`
      });
    }

    // Prepare user data for watermarking
    const userData = {
      user_id: userId,
      ...user.profile
    };

    // Call watermark function from steganography controller
    const watermarkedData = await watermarkUserData(userData, selectedCompany);
    
    // Save watermarked data to Bait schema
    const baitData = new Bait({
      company: selectedCompany,
      ...watermarkedData // This contains the watermarked user data
    });

    await baitData.save();

    // Generate dummy CIBIL response
    const dummyResponse = generateDummyCibilResponse(userData);

    // Return response with additional info about the simulation
    res.status(200).json({
      ...dummyResponse,
      simulation_info: {
        company_shared_with: selectedCompany,
        data_watermarked: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('CIBIL Score Simulation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during CIBIL score simulation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  simulateCibilScore
};