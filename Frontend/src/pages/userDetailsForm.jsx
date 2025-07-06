import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const UserDetailsForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await authAPI.generateProfile();
        setUserDetails(response.data.data);
      } catch (err) {
        setError('Failed to fetch user details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans antialiased relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
        <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        
        <div className="min-h-screen flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans antialiased relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
        <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        
        <div className="min-h-screen flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAddress = userDetails?.address_history?.[0] || {};
  const employment = userDetails?.employment_details || {};
  const itrDetails = userDetails?.income_tax_details || {};
  const primaryBankAccount = userDetails?.bank_accounts?.[0] || {};

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Background Elements - Same as Login Page */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
      <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center absolute top-0 left-0 z-10">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="ml-3 text-2xl font-bold tracking-wider">FinVat</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center w-full px-4 sm:px-6 lg:px-8 z-10 py-20">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cyan-400">Your Profile Details</h1>
            <p className="text-gray-400 mt-2">Review your auto-populated information</p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 p-8">
            <form className="space-y-8">
              
              {/* Personal Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-cyan-300 mb-6 border-b border-gray-600 pb-2">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={userDetails?.full_name || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                    <input
                      type="text"
                      value={userDetails?.dob ? new Date(userDetails.dob).toLocaleDateString('en-IN') : ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
                    <input
                      type="text"
                      value={userDetails?.gender || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">PAN Number</label>
                    <input
                      type="text"
                      value={userDetails?.pan || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Aadhaar Number</label>
                    <input
                      type="text"
                      value={userDetails?.aadhaar || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-cyan-300 mb-6 border-b border-gray-600 pb-2">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mobile Number</label>
                    <input
                      type="text"
                      value={userDetails?.contact_details?.mobile || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={userDetails?.contact_details?.email || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-cyan-300 mb-6 border-b border-gray-600 pb-2">
                  Current Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Address Line 1</label>
                    <input
                      type="text"
                      value={currentAddress?.address_line1 || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Address Line 2</label>
                    <input
                      type="text"
                      value={currentAddress?.address_line2 || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                    <input
                      type="text"
                      value={currentAddress?.city || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
                    <input
                      type="text"
                      value={currentAddress?.state || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">PIN Code</label>
                    <input
                      type="text"
                      value={currentAddress?.pincode || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Residence Type</label>
                    <input
                      type="text"
                      value={currentAddress?.residence_type || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-cyan-300 mb-6 border-b border-gray-600 pb-2">
                  Employment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Employer Name</label>
                    <input
                      type="text"
                      value={employment?.employer_name || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Employment Type</label>
                    <input
                      type="text"
                      value={employment?.employment_type || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Designation</label>
                    <input
                      type="text"
                      value={employment?.designation || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Years of Experience</label>
                    <input
                      type="text"
                      value={employment?.years_of_experience ? `${employment.years_of_experience} years` : ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Monthly Income</label>
                    <input
                      type="text"
                      value={employment?.monthly_income ? `₹${employment.monthly_income.toLocaleString('en-IN')}` : ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Income Frequency</label>
                    <input
                      type="text"
                      value={employment?.income_frequency || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Income Tax Details Section */}
              <div>
                <h2 className="text-xl font-semibold text-cyan-300 mb-6 border-b border-gray-600 pb-2">
                  Income Tax Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Filing Status</label>
                    <input
                      type="text"
                      value={itrDetails?.filing_status || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Latest ITR Acknowledgement Number</label>
                    <input
                      type="text"
                      value={itrDetails?.latest_itr_acknowledgement_number || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Last Filed Assessment Year</label>
                    <input
                      type="text"
                      value={itrDetails?.last_filed_assessment_year || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Account Details Section */}
              <div>
                <h2 className="text-xl font-semibold text-cyan-300 mb-6 border-b border-gray-600 pb-2">
                  Primary Bank Account
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={primaryBankAccount?.bank_name || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Account Type</label>
                    <input
                      type="text"
                      value={primaryBankAccount?.account_type || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={primaryBankAccount?.account_number_masked || ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Account Opening Date</label>
                    <input
                      type="text"
                      value={primaryBankAccount?.opening_date ? new Date(primaryBankAccount.opening_date).toLocaleDateString('en-IN') : ''}
                      readOnly
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Continue to Dashboard</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center text-xs text-gray-500 relative z-10">
        <p>&copy; 2025 FinVat. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#privacy" className="hover:text-cyan-400">Privacy Policy</a>
          <a href="#terms" className="hover:text-cyan-400">Terms of Service</a>
          <a href="#support" className="hover:text-cyan-400">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default UserDetailsForm;