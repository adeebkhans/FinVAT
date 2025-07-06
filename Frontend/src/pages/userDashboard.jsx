import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import CibilScore from './cibilScore';
import { 
  CreditCardIcon, 
  BanknotesIcon as CashIcon, 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  ShieldCheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  GiftIcon,
  BellIcon,
  ArrowRightIcon,
  UserIcon,
  HomeIcon,
  CreditCardIcon as CreditIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCibilScore, setShowCibilScore] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data.data.user);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (showCibilScore) {
    return <CibilScore />;
  }

  // Extract user data
  const profile = user?.profile;
  const employment = profile?.employment_details;
  const latestCibilScore = profile?.cibil_score_history?.[0];
  const contactDetails = profile?.contact_details;
  const currentAddress = profile?.address_history?.[0];

  // --- Bank account aggregation ---
  const allBankAccounts = profile?.bank_accounts || [];
  const totalBalance = allBankAccounts.reduce((sum, b) => sum + (b.current_balance || 0), 0);
  const totalAvgDebit = allBankAccounts.reduce((sum, b) => sum + (b.transactions_summary?.avg_monthly_debit || 0), 0);
  const totalBounces = allBankAccounts.reduce((sum, b) => sum + (b.transactions_summary?.number_of_bounces_last_12_months || 0), 0);
  // Pick the bank account with the highest balance as primary
  const primaryBankAccount = allBankAccounts.reduce(
    (prev, curr) => (curr.current_balance > (prev?.current_balance || 0) ? curr : prev),
    allBankAccounts[0]
  );

  // --- Credit account aggregation ---
  const allCreditAccounts = profile?.credit_accounts || [];
  const totalOutstandingBalance = allCreditAccounts.reduce((sum, c) => sum + (c.current_outstanding_balance || 0), 0);
  // Pick active credit account first; if none is active, pick the first
  const primaryCreditAccount = allCreditAccounts.find(c => c.account_status === 'Active') || allCreditAccounts[0];

  // Build mock transactions based on primary accounts
  const mockTransactions = [
    {
      id: 1,
      type: 'credit',
      amount: employment?.monthly_income || 0,
      description: `Salary Credit - ${employment?.employer_name || 'Company'}`,
      date: '2025-07-05',
      category: 'Income'
    },
    {
      id: 2,
      type: 'debit',
      amount: primaryCreditAccount?.emi_amount || 0,
      description: `${primaryCreditAccount?.account_type || 'Loan'} EMI - ${primaryCreditAccount?.lender_name || 'Lender'}`,
      date: '2025-07-01',
      category: 'Loan'
    },
    { id: 3, type: 'debit', amount: 2850, description: 'Electricity Bill Payment', date: '2025-07-03', category: 'Utilities' },
    { id: 4, type: 'debit', amount: 1200, description: 'Grocery Shopping', date: '2025-07-02', category: 'Food' }
  ];

  // Build spending categories based on totalAvgDebit
  const mockSpendingCategories = [
    {
      category: 'Loan EMI',
      amount: primaryCreditAccount?.emi_amount || 0,
      percentage: totalAvgDebit ? Math.round(((primaryCreditAccount?.emi_amount || 0) / totalAvgDebit) * 100) : 0,
      color: 'bg-red-400'
    },
    { category: 'Food & Dining', amount: Math.round(totalAvgDebit * 0.25), percentage: 25, color: 'bg-blue-400' },
    { category: 'Utilities', amount: Math.round(totalAvgDebit * 0.15), percentage: 15, color: 'bg-green-400' },
    { category: 'Transportation', amount: Math.round(totalAvgDebit * 0.12), percentage: 12, color: 'bg-purple-400' },
    { category: 'Others', amount: Math.round(totalAvgDebit * 0.14), percentage: 14, color: 'bg-gray-400' }
  ];

  const QuickActionCard = ({ icon, title, subtitle, onClick, color = "bg-cyan-500" }) => (
    <div 
      onClick={onClick}
      className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-all duration-200 group"
    >
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg">{title}</h3>
      <p className="text-gray-400 text-sm">{subtitle}</p>
    </div>
  );

  const StatCard = ({ title, value, change, icon, color = "text-cyan-400" }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 bg-gray-700/60 rounded-lg ${color}`}>
          {icon}
        </div>
        {change && (
          <span
            className={`text-sm font-medium flex items-center ${
              change.includes('Verified') || change.includes('Good')
                ? 'text-green-400'
                : change.includes('bounce')
                ? 'text-red-400'
                : 'text-yellow-400'
            }`}
          >
            {change.includes('Verified') || change.includes('Good') ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-gray-400 text-sm">{title}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased relative overflow-hidden">
      {/* Blobs and grid background */}
      <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
      <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mt-10 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back, {profile?.full_name || user?.username || 'User'}!</h1>
            <p className="text-gray-400 mt-1">Here's what's happening with your money</p>
            <p className="text-gray-500 text-sm">{contactDetails?.email} • {contactDetails?.mobile}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
              <BellIcon className="w-6 h-6 text-gray-300" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">{(profile?.full_name || user?.username)?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 p-6 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-cyan-100 text-sm">Total Balance ({allBankAccounts.length} accounts)</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-white">
                    {balanceVisible ? `₹${totalBalance.toLocaleString()}` : '₹••••••'}
                  </h2>
                  <button
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <EyeIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-cyan-100 text-sm">Primary Account</p>
                <p className="text-white font-medium">{primaryBankAccount?.account_number_masked || '****0000'}</p>
                <p className="text-cyan-100 text-xs">{primaryBankAccount?.bank_name || 'Bank Name'}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Add Money
              </button>
              <button className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                Send Money
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard
              icon={<ShieldCheckIcon className="w-6 h-6 text-white" />}
              title="CIBIL Score"
              subtitle={`Current: ${latestCibilScore?.score || 'N/A'}`}
              onClick={() => navigate('/cibil-score')}
              color="bg-green-500 animate-pulse" 
            />
            <QuickActionCard
              icon={<CreditCardIcon className="w-6 h-6 text-white" />}
              title="Apply Loan"
              subtitle="Personal & business loans"
              color="bg-blue-500"
            />
            <QuickActionCard
              icon={<TrendingUpIcon className="w-6 h-6 text-white" />}
              title="Investments"
              subtitle="Mutual funds & stocks"
              color="bg-purple-500"
            />
            <QuickActionCard
              icon={<GiftIcon className="w-6 h-6 text-white" />}
              title="Rewards"
              subtitle="Cashback & offers"
              color="bg-orange-500"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Monthly Income"
            value={`₹${employment?.monthly_income?.toLocaleString() || '0'}`}
            change={employment?.income_verified ? '✓ Verified' : 'Unverified'}
            icon={<CashIcon className="w-6 h-6" />}
            color="text-green-400"
          />
          <StatCard
            title="Monthly Expenses"
            value={`₹${totalAvgDebit.toLocaleString()}`}
            change={`${totalBounces} bounces/year`}
            icon={<ArrowDownIcon className="w-6 h-6" />}
            color="text-red-400"
          />
          <StatCard
            title="Total Outstanding Loan"
            value={`₹${totalOutstandingBalance.toLocaleString()}`}
            change={primaryCreditAccount?.account_status || 'No loans'}
            icon={<CreditCardIcon className="w-6 h-6" />}
            color="text-purple-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
              <button className="text-cyan-400 text-sm font-medium hover:text-cyan-300 flex items-center gap-1">
                View All
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}
                    >
                      {transaction.type === 'credit' ? (
                        <ArrowUpIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowDownIcon className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{transaction.description}</p>
                      <p className="text-gray-400 text-sm">
                        {transaction.category} • {transaction.date}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold ${
                      transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Spending */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-6">Monthly Spending Breakdown</h3>
            <div className="space-y-4">
              {mockSpendingCategories.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{cat.category}</span>
                    <span className="text-gray-400">₹{cat.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${cat.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserIcon className="w-6 h-6" />
              Employment Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Company</span>
                <span className="text-white font-medium">{employment?.employer_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Designation</span>
                <span className="text-white font-medium">{employment?.designation || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Experience</span>
                <span className="text-white font-medium">{employment?.years_of_experience || 0} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Employment Type</span>
                <span className="text-white font-medium">{employment?.employment_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Income Frequency</span>
                <span className="text-white font-medium">{employment?.income_frequency || 'Monthly'}</span>
              </div>
            </div>
          </div>

          {/* Credit Summary */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CreditIcon className="w-6 h-6" />
              Credit Summary
            </h3>
            {primaryCreditAccount ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Loan Type</span>
                  <span className="text-white font-medium">{primaryCreditAccount.account_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lender</span>
                  <span className="text-white font-medium">{primaryCreditAccount.lender_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EMI Amount</span>
                  <span className="text-white font-medium">₹{primaryCreditAccount.emi_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Outstanding</span>
                  <span className="text-white font-medium">₹{primaryCreditAccount.current_outstanding_balance?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EMIs Paid/Due</span>
                  <span className="text-white font-medium">{primaryCreditAccount.number_of_emis_paid || 0}/{primaryCreditAccount.number_of_emis_due || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${primaryCreditAccount.account_status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                    {primaryCreditAccount.account_status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No active credit accounts</p>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Date of Birth</span>
                <span className="text-white font-medium">{new Date(profile?.dob).toLocaleDateString() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gender</span>
                <span className="text-white font-medium">{profile?.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">PAN</span>
                <span className="text-white font-medium">{profile?.pan || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Address</span>
                <span className="text-white font-medium text-right text-sm">
                  {currentAddress ? `${currentAddress.city}, ${currentAddress.state}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Health */}
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6" />
              Financial Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">CIBIL Score</span>
                <span className={`font-medium ${latestCibilScore?.score >= 700 ? 'text-green-400' : latestCibilScore?.score >= 600 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {latestCibilScore?.score || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Income vs Expenses</span>
                <span className="text-white font-medium">
                  {employment?.monthly_income && totalAvgDebit ? 
                    `${Math.round((employment.monthly_income - totalAvgDebit) / employment.monthly_income * 100)}% savings` : 
                    'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Credit Utilization</span>
                <span className="text-white font-medium">
                  {primaryCreditAccount ? `${Math.round((primaryCreditAccount.current_outstanding_balance / primaryCreditAccount.loan_amount) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recent Enquiries</span>
                <span className="text-white font-medium">{profile?.enquiries?.length || 0} in last year</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;