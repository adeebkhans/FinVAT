import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { cibilAPI } from '../api';
import { 
  ShieldCheckIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  ShareIcon, 
  MagnifyingGlassIcon as SearchIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const ScoreGauge = ({ score }) => {
    const scorePercentage = Math.max(0, (score - 300) / 6); // CIBIL score is 300-900
    const radius = 90; 
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;

    const getScoreDetails = (s) => {
        if (s >= 750) return { color: 'text-green-400', range: 'Excellent' };
        if (s >= 700) return { color: 'text-cyan-400', range: 'Good' };
        if (s >= 650) return { color: 'text-yellow-400', range: 'Fair' };
        if (s >= 550) return { color: 'text-orange-400', range: 'Poor' };
        return { color: 'text-red-400', range: 'Very Poor' };
    };

    const { color, range } = getScoreDetails(score);

    return (
        <div className="relative flex items-center justify-center">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                <circle
                    stroke="#374151"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1.5s ease-out' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={color}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-4xl font-extrabold ${color}`}>{score}</span>
                <span className="text-xl font-semibold text-gray-300">{range}</span>
            </div>
        </div>
    );
};

// Improved Impact Badge
const ImpactBadge = ({ impact }) => {
    let badgeColor = "bg-green-500/20 m-2 text-green-400 text-center border-green-400";
    if (impact.toLowerCase().includes("medium")) badgeColor = "bg-yellow-500/20 m-2 text-center text-yellow-400 border-yellow-400";
    if (impact.toLowerCase().includes("low")) badgeColor = "bg-gray-500/20 m-2 text-center text-gray-300 border-gray-400";
    if (impact.toLowerCase().includes("very")) badgeColor = "bg-red-500/20 m-2 text-center text-red-400 border-red-400";
    return (
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeColor}`}>
            {impact}
        </span>
    );
};

const AnalysisCard = ({ icon, title, impact, description, progress, color }) => (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 bg-gray-700/60 rounded-lg ${color}`}>{icon}</div>
                <h3 className="font-semibold text-white">{title}</h3>
            </div>
            <ImpactBadge impact={impact} />
        </div>
        <p className="text-sm text-gray-400">{description}</p>
        <div className="w-full bg-gray-700 rounded-full h-2">
            <div className={`h-2 rounded-full ${color === 'text-green-400' ? 'bg-green-400' : color === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-gray-400'}`} style={{ width: `${progress}%` }}></div>
        </div>
    </div>
);

const ConsentPopup = ({ onConsent, onCancel, sampleData }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
    <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-cyan-700/40">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">Consent Required</h2>
      <p className="text-gray-300 mb-4">
        To calculate your CIBIL score, the following details will be securely shared and analyzed:
      </p>
      <ul className="text-sm text-gray-200 mb-4 list-disc list-inside space-y-1">
        <li><span className="text-cyan-300 font-semibold">Personal Info:</span> Name, DOB, PAN, Aadhaar</li>
        <li><span className="text-cyan-300 font-semibold">Address & Contact:</span> Address history, mobile, email</li>
        <li><span className="text-cyan-300 font-semibold">Employment:</span> Employer, designation, income</li>
        <li><span className="text-cyan-300 font-semibold">Bank & Credit:</span> Bank accounts, credit/loan accounts, credit card usage</li>
        <li><span className="text-cyan-300 font-semibold">History:</span> Repayment, EMI, ITR, CIBIL score history</li>
        <li><span className="text-cyan-300 font-semibold">Other:</span> Enquiries, public records, disputes, guarantees</li>
      </ul>
      <details className="mb-4">
        <summary className="cursor-pointer text-cyan-400 underline">See Example Data</summary>
        <pre className="bg-gray-800 rounded p-2 mt-2 text-xs text-gray-300 max-h-40 overflow-auto">
          {JSON.stringify(sampleData, null, 2)}
        </pre>
      </details>
      <div className="flex justify-end gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConsent}
          className="px-6 py-2 rounded-lg bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
        >
          I Consent & Continue
        </button>
      </div>
    </div>
  </div>
);

const sampleData = {
  "full_name": "Aamir Khan",
  "dob": "1992-03-14",
  "pan": "AKP1234B5C",
  "aadhaar": "123456789012",
  "address_history": [
    { "address_line1": "Flat No. 101, Green Apartments", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001" }
  ],
  "contact_details": { "mobile": "9876543210", "email": "aamir.khan@example.com" },
  "employment_details": { "employer_name": "TCS Ltd", "designation": "Software Engineer", "monthly_income": 75000 },
  "bank_accounts": [
    { "bank_name": "HDFC Bank", "current_balance": 87234.45 }
  ],
  "credit_accounts": [
    { "account_type": "Credit Card", "lender_name": "Axis Bank", "credit_limit": 150000, "current_outstanding_balance": 45000 }
  ],
  "cibil_score_history": [
    { "date": "2025-06-01", "score": 780 }
  ]
};

const CibilScore = () => {
    const [cibilData, setCibilData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConsent, setShowConsent] = useState(true);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (!showConsent) {
            const fetchScore = async () => {
                try {
                    setLoading(true);
                    const response = await cibilAPI.simulateScore();
                    setCibilData(response.data);
                } catch (err) {
                    setError(err.response?.data?.message || 'Failed to fetch CIBIL score.');
                } finally {
                    setLoading(false);
                }
            };
            fetchScore();
        }
    }, [showConsent]);

    if (showConsent) {
        return (
            <ConsentPopup
                onConsent={() => setShowConsent(false)}
                onCancel={() => navigate(-1)}
                sampleData={sampleData}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                <p className="ml-4 text-lg">Generating Your Secure Report...</p>
            </div>
        );
    }

    if (error) {
        return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">{error}</div>;
    }

    if (!cibilData) return null;

    const data = cibilData.data;
    const simulation_info = {
      company_shared_with: cibilData.company_used,
      timestamp: cibilData.report_date,
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans antialiased relative overflow-hidden p-4 sm:p-6 lg:p-8">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
            <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

            <main className="max-w-5xl mx-auto mt-10 z-10 relative">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-cyan-400 font-semibold transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Credit Score Analysis</h1>
                    <p className="text-gray-400 mt-1">Hello, {data.full_name}. Here's your detailed CIBIL report.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col items-center justify-center gap-6">
                        <ScoreGauge score={data.cibil_score} />
                        <div className="flex items-center gap-4 w-full">
                            <button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2">
                                <ShareIcon className="h-5 w-5" />
                                <span>Share Now</span>
                            </button>
                            <button className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors">
                                <SearchIcon className="h-5 w-5 text-gray-300" />
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AnalysisCard icon={<TrendingUpIcon className="h-6 w-6" />} title="Payments" impact="High Impact" description="89% on-time payments." progress={89} color="text-green-400" />
                            <AnalysisCard icon={<ShieldCheckIcon className="h-6 w-6" />} title="Limit" impact="High Impact" description="25% credit utilization." progress={75} color="text-green-400" />
                            <AnalysisCard icon={<ClockIcon className="h-6 w-6" />} title="Age" impact="Medium Impact" description="4 years of credit history." progress={60} color="text-yellow-400" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><CheckCircleIcon className="h-5 w-5 text-green-400" />Factors Affecting Score</h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    {data.factors_affecting_score.map((factor, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-400 mt-1">✓</span>{factor}</li>)}
                                </ul>
                            </div>
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />Recommendations for You</h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    {data.recommendations.map((rec, i) => <li key={i} className="flex items-start gap-2"><span className="text-yellow-400 mt-1">→</span>{rec}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-8 text-center text-xs text-gray-500 border-t border-gray-700/50 pt-4">
                  {simulation_info && simulation_info.company_shared_with ? (
                    <>
                      <p>
                        Data watermarked and securely shared with {simulation_info.company_shared_with}
                        {simulation_info.timestamp && (
                          <> on {new Date(simulation_info.timestamp).toLocaleDateString()}.</>
                        )}
                      </p>
                      <p>
                        Report Date: {new Date(data.report_date).toLocaleDateString()} | Next Update: {new Date(data.next_update_date).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p>
                      Report Date: {new Date(data.report_date).toLocaleDateString()} | Next Update: {new Date(data.next_update_date).toLocaleDateString()}
                    </p>
                  )}
                </footer>
            </main>
        </div>
    );
};

export default CibilScore;
