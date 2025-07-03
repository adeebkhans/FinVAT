const crypto = require('crypto');

// Indian bank names for realistic simulation
const INDIAN_BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank',
  'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'Bank of India',
  'Central Bank of India', 'Indian Overseas Bank', 'UCO Bank', 'Indian Bank',
  'IDBI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'IndusInd Bank',
  'Yes Bank', 'Federal Bank', 'South Indian Bank', 'Karnataka Bank'
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad'
];

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan',
  'Uttar Pradesh', 'West Bengal', 'Madhya Pradesh', 'Haryana', 'Punjab',
  'Kerala', 'Odisha', 'Telangana', 'Andhra Pradesh', 'Assam', 'Bihar'
];

const LOAN_TYPES = ['personal', 'home', 'auto', 'education'];
const CARD_TYPES = ['Credit', 'Debit', 'Platinum', 'Gold', 'Silver'];
const ACCOUNT_TYPES = ['savings', 'current', 'salary'];
const RISK_TOLERANCES = ['conservative', 'moderate', 'aggressive'];

const generateRandomName = () => {
  const firstNames = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Amit', 'Kavya', 'Ravi', 'Ananya', 'Suresh', 'Meera'];
  const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Gupta', 'Joshi', 'Iyer', 'Menon'];
  
  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
};

const generateRandomAddress = () => {
  const city = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
  const state = INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)];
  
  return {
    street: `${Math.floor(Math.random() * 999) + 1}, ${['MG Road', 'Brigade Road', 'Park Street', 'Commercial Street'][Math.floor(Math.random() * 4)]}`,
    city,
    state,
    pincode: String(Math.floor(Math.random() * 900000) + 100000),
    country: 'India'
  };
};

const generatePersonalInfo = () => {
  const name = generateRandomName();
  const address = generateRandomAddress();
  
  return {
    ...name,
    dateOfBirth: new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    address,
    aadharNumber: String(Math.floor(Math.random() * 900000000000) + 100000000000),
    panNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
  };
};

const generateBankingInfo = () => {
  const numAccounts = Math.floor(Math.random() * 3) + 1; // 1-3 accounts
  const accounts = [];
  let totalBalance = 0;

  for (let i = 0; i < numAccounts; i++) {
    const balance = Math.floor(Math.random() * 500000) + 10000; // 10k to 510k
    totalBalance += balance;
    
    accounts.push({
      accountNumber: String(Math.floor(Math.random() * 9000000000000000) + 1000000000000000),
      accountType: ACCOUNT_TYPES[Math.floor(Math.random() * ACCOUNT_TYPES.length)],
      bankName: INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)],
      branchName: `${INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)]} Branch`,
      ifscCode: `${['SBIN', 'HDFC', 'ICIC', 'PUNB'][Math.floor(Math.random() * 4)]}0${String(Math.floor(Math.random() * 900000) + 100000)}`,
      balance,
      isActive: Math.random() > 0.1 // 90% chance active
    });
  }

  return { accounts, totalBalance };
};

const generateCreditInfo = () => {
  const creditScore = Math.floor(Math.random() * 600) + 300; // 300-900
  const numCards = Math.floor(Math.random() * 4); // 0-3 cards
  const numLoans = Math.floor(Math.random() * 3); // 0-2 loans
  
  const creditCards = [];
  for (let i = 0; i < numCards; i++) {
    const creditLimit = Math.floor(Math.random() * 500000) + 50000; // 50k to 550k
    const currentBalance = Math.floor(Math.random() * creditLimit * 0.8); // Up to 80% utilization
    
    creditCards.push({
      cardNumber: `****-****-****-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      bankName: INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)],
      cardType: CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)],
      creditLimit,
      currentBalance,
      dueDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      minAmountDue: Math.floor(currentBalance * 0.05) // 5% minimum
    });
  }

  const loans = [];
  for (let i = 0; i < numLoans; i++) {
    const loanAmount = Math.floor(Math.random() * 2000000) + 100000; // 1L to 21L
    const outstandingAmount = Math.floor(loanAmount * (0.2 + Math.random() * 0.8)); // 20-100% remaining
    
    loans.push({
      loanType: LOAN_TYPES[Math.floor(Math.random() * LOAN_TYPES.length)],
      loanAmount,
      outstandingAmount,
      emi: Math.floor(outstandingAmount / (12 + Math.random() * 60)), // 1-5 year EMI
      lender: INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)],
      startDate: new Date(Date.now() - Math.floor(Math.random() * 365 * 5) * 24 * 60 * 60 * 1000), // Started within last 5 years
      tenure: Math.floor(Math.random() * 60) + 12 // 12-72 months
    });
  }

  return { creditScore, creditCards, loans };
};

const generateCibilInfo = () => {
  const score = Math.floor(Math.random() * 600) + 300; // 300-900
  const totalPayments = Math.floor(Math.random() * 100) + 20;
  const latePayments = Math.floor(Math.random() * totalPayments * 0.3);
  const missedPayments = Math.floor(Math.random() * latePayments * 0.5);
  
  return {
    score,
    reportDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Within last 90 days
    paymentHistory: {
      onTimePayments: totalPayments - latePayments,
      latePayments,
      missedPayments
    },
    creditUtilization: Math.floor(Math.random() * 70) + 10, // 10-80%
    creditAge: Math.floor(Math.random() * 120) + 6, // 6-126 months
    totalAccounts: Math.floor(Math.random() * 10) + 2, // 2-12 accounts
    recentEnquiries: Math.floor(Math.random() * 5) // 0-4 enquiries
  };
};

const generateInvestmentInfo = () => {
  const numMutualFunds = Math.floor(Math.random() * 5);
  const numStocks = Math.floor(Math.random() * 8);
  const numFDs = Math.floor(Math.random() * 3);
  
  const mutualFunds = [];
  const stocks = [];
  const fixedDeposits = [];
  let totalInvestmentValue = 0;

  // Mutual Funds
  for (let i = 0; i < numMutualFunds; i++) {
    const investedAmount = Math.floor(Math.random() * 100000) + 5000;
    const currentValue = investedAmount * (0.8 + Math.random() * 0.6); // -20% to +40% returns
    totalInvestmentValue += currentValue;
    
    mutualFunds.push({
      fundName: `${['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak'][Math.floor(Math.random() * 5)]} ${['Equity', 'Debt', 'Hybrid'][Math.floor(Math.random() * 3)]} Fund`,
      units: Math.floor(Math.random() * 1000) + 10,
      currentValue: Math.floor(currentValue),
      investedAmount
    });
  }

  // Stocks
  const stockSymbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'ITC', 'HINDUNILVR'];
  for (let i = 0; i < numStocks; i++) {
    const quantity = Math.floor(Math.random() * 100) + 1;
    const avgPrice = Math.floor(Math.random() * 2000) + 100;
    const currentPrice = avgPrice * (0.8 + Math.random() * 0.6);
    const investedAmount = quantity * avgPrice;
    const currentValue = quantity * currentPrice;
    totalInvestmentValue += currentValue;
    
    stocks.push({
      symbol: stockSymbols[Math.floor(Math.random() * stockSymbols.length)],
      companyName: `${stockSymbols[Math.floor(Math.random() * stockSymbols.length)]} Ltd`,
      quantity,
      currentPrice: Math.floor(currentPrice),
      investedAmount
    });
  }

  // Fixed Deposits
  for (let i = 0; i < numFDs; i++) {
    const amount = Math.floor(Math.random() * 200000) + 25000;
    totalInvestmentValue += amount;
    
    fixedDeposits.push({
      bankName: INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)],
      amount,
      interestRate: 5.5 + Math.random() * 3, // 5.5% to 8.5%
      maturityDate: new Date(Date.now() + (365 + Math.floor(Math.random() * 1095)) * 24 * 60 * 60 * 1000) // 1-4 years
    });
  }

  return {
    mutualFunds,
    stocks,
    fixedDeposits,
    totalInvestmentValue: Math.floor(totalInvestmentValue)
  };
};

const generateRiskProfile = () => {
  const monthlyIncome = Math.floor(Math.random() * 200000) + 30000; // 30k to 230k
  const monthlyExpenses = Math.floor(monthlyIncome * (0.4 + Math.random() * 0.4)); // 40-80% of income
  
  return {
    riskTolerance: RISK_TOLERANCES[Math.floor(Math.random() * RISK_TOLERANCES.length)],
    investmentHorizon: `${Math.floor(Math.random() * 10) + 1} years`,
    monthlyIncome,
    monthlyExpenses
  };
};

const generateCompleteUserProfile = (username) => {
  const name = generateRandomName();
  const dob = generateRandomDate(1970, 2000);
  const gender = Math.random() > 0.5 ? 'Male' : 'Female';
  const pan = generatePAN();
  const aadhaar = generateAadhaar();

  // Generate ONLY the flat structure matching sample JSON
  const addressHistory = generateAddressHistory();
  const contactDetails = generateContactDetails(name);
  const employmentDetails = generateEmploymentDetails();
  const incomeTaxDetails = generateIncomeTaxDetails();
  const bankAccounts = generateBankAccounts();
  const creditAccounts = generateCreditAccounts();
  const enquiries = generateEnquiries();
  const publicRecords = generatePublicRecords(true); // Force generation
  const guaranteeDetails = generateGuaranteeDetails(true); // Force generation
  const disputes = generateDisputes(true); // Force generation
  const cibilScoreHistory = generateCibilScoreHistory();

  return {
    user_id: username || generateUserId(),
    full_name: `${name.firstName} ${name.lastName}`,
    dob: dob.toISOString().split('T')[0],
    gender,
    pan,
    aadhaar,
    address_history: addressHistory,
    contact_details: contactDetails,
    employment_details: employmentDetails,
    income_tax_details: incomeTaxDetails,
    bank_accounts: bankAccounts,
    credit_accounts: creditAccounts,
    enquiries,
    public_records: publicRecords,
    guarantee_details: guaranteeDetails,
    disputes,
    cibil_score_history: cibilScoreHistory,
    fraud_alerts: [] // Usually empty for clean profiles
  };
};

const generateUserId = () => {
  return Math.random().toString(36).substring(2, 8) + Math.floor(Math.random() * 1000);
};

const generateRandomDate = (startYear = 1970, endYear = 2020) => {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generatePAN = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  return Array.from({length: 5}, () => letters[Math.floor(Math.random() * 26)]).join('') +
         Array.from({length: 4}, () => digits[Math.floor(Math.random() * 10)]).join('') +
         letters[Math.floor(Math.random() * 26)];
};

const generateAadhaar = () => {
  return Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
};

const generateAddressHistory = () => {
  const RESIDENCE_TYPES = ['Owned', 'Rented', 'Family Owned', 'Company Provided'];
  const numAddresses = Math.floor(Math.random() * 3) + 1; // 1-3 addresses
  const addresses = [];
  
  for (let i = 0; i < numAddresses; i++) {
    addresses.push({
      address_line1: `${['Flat No.', 'House No.', 'Plot No.'][Math.floor(Math.random() * 3)]} ${Math.floor(Math.random() * 999) + 1}, ${['Green Apartments', 'Silver Enclave', 'Golden Heights', 'Royal Residency'][Math.floor(Math.random() * 4)]}`,
      address_line2: ['MG Road', 'Brigade Road', 'Park Street', 'Commercial Street', 'Airport Road'][Math.floor(Math.random() * 5)],
      city: INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)],
      state: INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)],
      pincode: String(Math.floor(Math.random() * 900000) + 100000),
      residence_type: RESIDENCE_TYPES[Math.floor(Math.random() * RESIDENCE_TYPES.length)],
      duration_months: Math.floor(Math.random() * 120) + 6 // 6 months to 10 years
    });
  }
  
  return addresses;
};

const generateContactDetails = (name) => {
  return {
    mobile: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@example.com`
  };
};

const generateEmploymentDetails = () => {
  const EMPLOYMENT_TYPES = ['Salaried', 'Self-Employed', 'Business', 'Professional'];
  const DESIGNATIONS = ['Software Engineer', 'Manager', 'Senior Analyst', 'Consultant', 'Director', 'Team Lead', 'Developer'];
  const monthlyIncome = Math.floor(Math.random() * 150000) + 25000; // 25k to 175k
  
  return {
    employer_name: `${['TCS Ltd', 'Infosys', 'Wipro', 'HCL Technologies', 'Accenture', 'IBM India'][Math.floor(Math.random() * 6)]}`,
    employment_type: EMPLOYMENT_TYPES[Math.floor(Math.random() * EMPLOYMENT_TYPES.length)],
    designation: DESIGNATIONS[Math.floor(Math.random() * DESIGNATIONS.length)],
    years_of_experience: Math.floor(Math.random() * 15) + 1,
    monthly_income: monthlyIncome,
    income_frequency: 'Monthly',
    income_verified: Math.random() > 0.3 // 70% verified
  };
};

const generateIncomeTaxDetails = () => {
  return {
    filing_status: Math.random() > 0.2 ? 'Filed' : 'Not Filed', // 80% filed
    latest_itr_acknowledgement_number: `ITRACK${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    last_filed_assessment_year: `${2023 + Math.floor(Math.random() * 2)}-${2024 + Math.floor(Math.random() * 2)}`
  };
};

const generateBankAccounts = () => {
  const numAccounts = Math.floor(Math.random() * 3) + 1; // 1-3 accounts
  const accounts = [];

  for (let i = 0; i < numAccounts; i++) {
    const balance = Math.floor(Math.random() * 500000) + 10000; // 10k to 510k
    const openingDate = generateRandomDate(2010, 2022);
    
    accounts.push({
      bank_name: INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)],
      account_type: ['Savings', 'Current', 'Salary'][Math.floor(Math.random() * 3)],
      account_number_masked: `XXXXXX${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      opening_date: openingDate.toISOString().split('T')[0],
      current_balance: balance,
      last_updated: new Date().toISOString().split('T')[0],
      transactions_summary: {
        avg_monthly_debit: Math.floor(balance * 0.4),
        avg_monthly_credit: Math.floor(balance * 0.6),
        number_of_bounces_last_12_months: Math.floor(Math.random() * 3) // 0-2 bounces
      }
    });
  }

  return accounts;
};

const generateCreditAccounts = () => {
  const numAccounts = Math.floor(Math.random() * 4) + 1; // 1-4 accounts
  const accounts = [];
  
  for (let i = 0; i < numAccounts; i++) {
    const accountType = ['Auto Loan', 'Credit Card', 'Personal Loan', 'Home Loan'][Math.floor(Math.random() * 4)];
    const lender = INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)];
    
    if (accountType === 'Credit Card') {
      const creditLimit = Math.floor(Math.random() * 300000) + 50000;
      const outstanding = Math.floor(creditLimit * Math.random() * 0.8);
      
      accounts.push({
        account_id: `CRD${Math.floor(Math.random() * 900000) + 100000}`,
        account_type: accountType,
        lender_name: lender,
        account_status: Math.random() > 0.1 ? 'Active' : 'Closed',
        ownership_type: 'Individual',
        credit_limit: creditLimit,
        current_outstanding_balance: outstanding,
        cash_limit: Math.floor(creditLimit * 0.2),
        last_billed_amount: outstanding,
        minimum_due_amount: Math.floor(outstanding * 0.05),
        due_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_history_last_12_months: Array.from({length: 3}, (_, idx) => ({
          month: new Date(Date.now() - (idx + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
          payment_status: ['Paid in Full', 'Paid Minimum Due', 'Late Payment'][Math.floor(Math.random() * 3)]
        })),
        utilisation_rate: parseFloat((outstanding / creditLimit * 100).toFixed(1)),
        date_opened: generateRandomDate(2018, 2023).toISOString().split('T')[0],
        date_closed: null,
        number_of_times_over_limit: Math.floor(Math.random() * 2)
      });
    } else {
      const loanAmount = Math.floor(Math.random() * 1000000) + 100000;
      const outstanding = Math.floor(loanAmount * (0.2 + Math.random() * 0.8));
      const emi = Math.floor(outstanding / (12 + Math.random() * 60));
      const tenure = Math.floor(Math.random() * 60) + 12;
      
      accounts.push({
        account_id: `CRD${Math.floor(Math.random() * 900000) + 100000}`,
        account_type: accountType,
        lender_name: lender,
        account_status: Math.random() > 0.2 ? 'Active' : 'Closed',
        ownership_type: 'Individual',
        loan_amount: loanAmount,
        sanctioned_date: generateRandomDate(2020, 2024).toISOString().split('T')[0],
        disbursed_date: generateRandomDate(2020, 2024).toISOString().split('T')[0],
        emi_amount: emi,
        tenure_months: tenure,
        repayment_frequency: 'Monthly',
        current_outstanding_balance: outstanding,
        last_payment_date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        last_payment_amount: emi,
        dpd_history_last_24_months: Array.from({length: 6}, (_, idx) => ({
          month: new Date(Date.now() - (idx + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
          dpd: Math.floor(Math.random() * 3) // 0-2 days past due
        })),
        number_of_emis_paid: Math.floor(Math.random() * tenure * 0.7),
        number_of_emis_due: tenure - Math.floor(Math.random() * tenure * 0.7),
        write_off_status: false,
        settlement_status: false,
        collateral_type: accountType === 'Auto Loan' ? 'Vehicle' : accountType === 'Home Loan' ? 'Property' : null,
        is_guarantor: false
      });
    }
  }
  
  return accounts;
};

const generateEnquiries = () => {
  const numEnquiries = Math.floor(Math.random() * 5); // 0-4 enquiries
  const enquiries = [];
  
  for (let i = 0; i < numEnquiries; i++) {
    enquiries.push({
      enquiry_date: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lender_name: INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)],
      product_type: ['Personal Loan', 'Home Loan', 'Credit Card', 'Auto Loan'][Math.floor(Math.random() * 4)],
      enquiry_type: Math.random() > 0.3 ? 'Hard Pull' : 'Soft Pull'
    });
  }
  
  return enquiries;
};

const generatePublicRecords = (force = false) => {
  if (force || Math.random() > 0.9) { // Always generate when forced, otherwise 10% chance
    return [{
      record_type: ['Suit Filed', 'Bankruptcy', 'Tax Lien'][Math.floor(Math.random() * 3)],
      date_filed: generateRandomDate(2018, 2023).toISOString().split('T')[0],
      status: ['Dismissed', 'Pending', 'Resolved'][Math.floor(Math.random() * 3)],
      details: 'Legal proceeding details redacted for privacy.'
    }];
  }
  return [];
};

const generateGuaranteeDetails = (force = false) => {
  if (force || Math.random() > 0.8) { // Always generate when forced, otherwise 20% chance
    const name = generateRandomName();
    return [{
      guaranteed_account_id: `CRD${Math.floor(Math.random() * 900000) + 100000}`,
      guaranteed_party_name: `${name.firstName} ${name.lastName}`,
      guaranteed_account_type: ['Home Loan', 'Personal Loan', 'Business Loan'][Math.floor(Math.random() * 3)],
      guaranteed_lender: INDIAN_BANKS[Math.floor(Math.random() * INDIAN_BANKS.length)],
      guarantee_amount: Math.floor(Math.random() * 1000000) + 100000
    }];
  }
  return [];
};

const generateDisputes = (force = false) => {
  if (force || Math.random() > 0.8) { // Always generate when forced, otherwise 20% chance
    return [{
      dispute_id: `DISP${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      account_id: `CRD${Math.floor(Math.random() * 900000) + 100000}`,
      dispute_date: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: ['In Progress', 'Resolved', 'Rejected'][Math.floor(Math.random() * 3)],
      description: 'Disputed transaction or account information.'
    }];
  }
  return [];
};

const generateCibilScoreHistory = () => {
  const scores = [];
  for (let i = 0; i < 3; i++) {
    scores.push({
      date: new Date(Date.now() - i * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: Math.floor(Math.random() * 600) + 300 // 300-900
    });
  }
  return scores.sort((a, b) => new Date(b.date) - new Date(a.date));
};

module.exports = {
  generatePersonalInfo,
  generateBankingInfo,
  generateCreditInfo,
  generateCibilInfo,
  generateInvestmentInfo,
  generateRiskProfile,
  generateCompleteUserProfile
};
