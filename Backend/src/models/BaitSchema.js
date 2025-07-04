const mongoose = require('mongoose');

const baitSchema = new mongoose.Schema({
  company: {
    type: String,
    enum: ['creder', 'PayFriend', 'LoanIt'],
    required: true
  },
  user_id: String,
  full_name: String,
  dob: String,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  pan: String,
  aadhaar: String,

  // Address history
  address_history: [{
    address_line1: String,
    address_line2: String,
    city: String,
    state: String,
    pincode: String,
    residence_type: { type: String, enum: ['Owned', 'Rented', 'Family Owned', 'Company Provided'] },
    duration_months: Number
  }],

  // Contact details
  contact_details: {
    mobile: String,
    email: String
  },

  // Employment details
  employment_details: {
    employer_name: String,
    employment_type: { type: String, enum: ['Salaried', 'Self-Employed', 'Business', 'Professional'] },
    designation: String,
    years_of_experience: Number,
    monthly_income: Number,
    income_frequency: { type: String, default: 'Monthly' },
    income_verified: { type: Boolean, default: false }
  },

  // Income tax details
  income_tax_details: {
    filing_status: { type: String, enum: ['Filed', 'Not Filed'] },
    latest_itr_acknowledgement_number: String,
    last_filed_assessment_year: String
  },

  // Bank accounts
  bank_accounts: [{
    bank_name: String,
    account_type: { type: String, enum: ['Savings', 'Current', 'Salary'] },
    account_number_masked: String,
    opening_date: String,
    current_balance: Number,
    last_updated: String,
    transactions_summary: {
      avg_monthly_debit: Number,
      avg_monthly_credit: Number,
      number_of_bounces_last_12_months: Number
    }
  }],

  // Credit accounts
  credit_accounts: [{
    account_id: String,
    account_type: { type: String, enum: ['Auto Loan', 'Credit Card', 'Personal Loan', 'Home Loan', 'Education Loan'] },
    lender_name: String,
    account_status: { type: String, enum: ['Active', 'Closed', 'Suspended'] },
    ownership_type: { type: String, default: 'Individual' },
    
    // For loans
    loan_amount: Number,
    sanctioned_date: String,
    disbursed_date: String,
    emi_amount: Number,
    tenure_months: Number,
    repayment_frequency: { type: String, default: 'Monthly' },
    current_outstanding_balance: Number,
    last_payment_date: String,
    last_payment_amount: Number,
    dpd_history_last_24_months: [{
      month: String,
      dpd: Number
    }],
    number_of_emis_paid: Number,
    number_of_emis_due: Number,
    write_off_status: { type: Boolean, default: false },
    settlement_status: { type: Boolean, default: false },
    collateral_type: String,
    is_guarantor: { type: Boolean, default: false },
    closure_date: String,

    // For credit cards
    credit_limit: Number,
    cash_limit: Number,
    last_billed_amount: Number,
    minimum_due_amount: Number,
    due_date: String,
    payment_history_last_12_months: [{
      month: String,
      payment_status: String
    }],
    utilisation_rate: Number,
    date_opened: String,
    date_closed: String,
    number_of_times_over_limit: Number
  }],

  // Enquiries
  enquiries: [{
    enquiry_date: String,
    lender_name: String,
    product_type: String,
    enquiry_type: { type: String, enum: ['Hard Pull', 'Soft Pull'] }
  }],

  // Public records
  public_records: [{
    record_type: String,
    date_filed: String,
    status: String,
    details: String
  }],

  // Guarantee details
  guarantee_details: [{
    guaranteed_account_id: String,
    guaranteed_party_name: String,
    guaranteed_account_type: String,
    guaranteed_lender: String,
    guarantee_amount: Number
  }],

  // Disputes
  disputes: [{
    dispute_id: String,
    account_id: String,
    dispute_date: String,
    status: String,
    description: String
  }],

  // CIBIL score history
  cibil_score_history: [{
    date: String,
    score: Number
  }],

  // Fraud alerts
  fraud_alerts: [String]
});

module.exports = mongoose.model('Bait', baitSchema);
