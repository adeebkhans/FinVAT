const User = require('../models/User');
const Bait = require('../models/BaitSchema');

// API to simulate data leak - returns JSON file for download
const leakData = async (req, res) => {
  try {
    const { company } = req.params;
    
    // Validate company name
    const validCompanies = ['creder', 'PayFriend', 'LoanIt'];
    if (!validCompanies.includes(company)) {
      return res.status(400).json({
        success: false,
        message: `Invalid company. Must be one of: ${validCompanies.join(', ')}`
      });
    }

    // Get up to 10 random users with profiles
    const randomUsers = await User.aggregate([
      { $match: { profile: { $exists: true, $ne: null } } },
      { $sample: { size: 10 } },
      { $project: { 
          username: 1,
          profile: 1
        }}
    ]);

    // Get up to 5 random bait records from the specified company
    const baitRecords = await Bait.aggregate([
      { $match: { company: company } },
      { $sample: { size: 5 } }
    ]);

    // Combine user profiles and bait data - all in BaitSchema format
    const leakedData = [];

    // Add real user profiles (convert to BaitSchema format without company field)
    randomUsers.forEach(user => {
      leakedData.push({
        ...user.profile
      });
    });

    // Add bait records (clean up MongoDB fields and remove company field)
    baitRecords.forEach(bait => {
      const cleanBait = { ...bait };
      delete cleanBait._id;
      delete cleanBait.__v;
      delete cleanBait.createdAt;
      delete cleanBait.updatedAt;
      delete cleanBait.company; // Remove company field
      
      leakedData.push(cleanBait);
    });

    // Shuffle the combined data to mix real users and baits
    for (let i = leakedData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [leakedData[i], leakedData[j]] = [leakedData[j], leakedData[i]];
    }

    // Set headers to trigger file download
    const filename = `data_leak_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    // Send the JSON array directly (no metadata wrapper)
    res.status(200).json(leakedData);

  } catch (error) {
    console.error('Data Leak Simulation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during data leak simulation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// API to get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total users with profiles
    const totalUsersWithProfiles = await User.countDocuments({ 
      profile: { $exists: true, $ne: null } 
    });

    // Get bait statistics by company
    const baitStats = await Bait.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
          latest_created: { $max: '$createdAt' }
        }
      }
    ]);

    // Get total baits
    const totalBaits = await Bait.countDocuments();

    // Format company statistics
    const companyStats = {};
    const validCompanies = ['creder', 'PayFriend', 'LoanIt'];
    
    validCompanies.forEach(company => {
      const stat = baitStats.find(s => s._id === company);
      companyStats[company] = {
        bait_count: stat ? stat.count : 0,
        latest_activity: stat ? stat.latest_created : null
      };
    });

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        total_users_with_profiles: totalUsersWithProfiles,
        total_bait_records: totalBaits,
        company_statistics: companyStats,
        available_companies: validCompanies,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  leakData,
  getDashboardStats
};