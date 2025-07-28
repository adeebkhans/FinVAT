import React, { useEffect, useState } from 'react';
import { adminAPI, steganographyAPI, downloadFile } from '../api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [leakCompany, setLeakCompany] = useState('');
    const [leakLoading, setLeakLoading] = useState(false);
    const [leakError, setLeakError] = useState('');
    const [detectResult, setDetectResult] = useState(null);
    const [detectLoading, setDetectLoading] = useState(false);
    const [detectError, setDetectError] = useState('');
    
    // New state for image steganography detection
    const [imageDownloading, setImageDownloading] = useState(false);
    const [imageDetectResult, setImageDetectResult] = useState(null);
    const [imageDetectLoading, setImageDetectLoading] = useState(false);
    const [imageDetectError, setImageDetectError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await adminAPI.getDashboardStats();
                setStats(res.data.data);
            } catch (err) {
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleLeakDownload = async () => {
        if (!leakCompany) return;
        setLeakLoading(true);
        setLeakError('');
        try {
            const res = await adminAPI.leakData(leakCompany);
            downloadFile(res.data, `${leakCompany}_leaked_data.json`);
        } catch (err) {
            setLeakError('Failed to download leaked data.');
        } finally {
            setLeakLoading(false);
        }
    };

    const handleDetectUpload = async (e) => {
        setDetectResult(null);
        setDetectError('');
        const file = e.target.files[0];
        if (!file) return;
        setDetectLoading(true);
        try {
            const text = await file.text();
            const suspectData = JSON.parse(text);
            const res = await steganographyAPI.detectFingerprint(suspectData);
            setDetectResult(res.data);
        } catch (err) {
            setDetectError('Failed to detect fingerprint in uploaded file.');
        } finally {
            setDetectLoading(false);
        }
    };

    // Handle downloading latest steganographic image
    const handleDownloadImage = async () => {
        setImageDownloading(true);
        try {
            const response = await steganographyAPI.getLatestImage();
            
            // Create blob from response
            const blob = new Blob([response.data], { type: 'image/png' });
            const url = window.URL.createObjectURL(blob);
            
            // Get filename from headers or use default
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'latest_steganographic_image.png';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
        } catch (err) {
            console.error('Failed to download image:', err);
        } finally {
            setImageDownloading(false);
        }
    };

    // Handle image upload for steganography detection
    const handleImageDetectUpload = async (e) => {
        setImageDetectResult(null);
        setImageDetectError('');
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            setImageDetectError('Please upload an image file.');
            return;
        }
        
        setImageDetectLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const res = await steganographyAPI.detectImageSteganography(formData);
            setImageDetectResult(res.data);
        } catch (err) {
            setImageDetectError('Failed to detect steganography in uploaded image.');
        } finally {
            setImageDetectLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans antialiased relative overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
            <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>

            <div className="relative z-10 max-w-5xl mx-auto">
                <header className="mb-10 mt-8">
                    <h1 className="text-3xl font-bold text-cyan-400">Admin Dashboard</h1>
                    <p className="text-gray-400 mt-2">Monitor platform activity, leak and analyze data for unbiased leak detection.</p>
                </header>

                {/* Dashboard Stats */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-white mb-4">Platform Statistics</h2>
                    {loading ? (
                        <div className="text-cyan-400">Loading stats...</div>
                    ) : stats ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                                <div className="text-2xl font-bold text-cyan-400">{stats.total_users_with_profiles}</div>
                                <div className="text-gray-300 mt-2">Users with Profiles</div>
                            </div>
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                                <div className="text-2xl font-bold text-purple-400">{stats.total_bait_records}</div>
                                <div className="text-gray-300 mt-2">Total Bait Records</div>
                            </div>
                            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                                <div className="text-2xl font-bold text-green-400">{stats.available_companies.length}</div>
                                <div className="text-gray-300 mt-2">Companies</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-400">Failed to load statistics.</div>
                    )}

                    {/* Company Table */}
                    {stats && (
                        <div className="overflow-x-auto mt-4">
                            <table className="min-w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-gray-700/50 text-cyan-300">
                                        <th className="py-2 px-4">Company</th>
                                        <th className="py-2 px-4">Bait Count</th>
                                        <th className="py-2 px-4">Latest Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(stats.company_statistics).map(([company, info]) => (
                                        <tr key={company} className="border-b border-gray-700/40">
                                            <td className="py-2 px-4">{company}</td>
                                            <td className="py-2 px-4">{info.bait_count}</td>
                                            <td className="py-2 px-4">{info.latest_activity ? new Date(info.latest_activity).toLocaleString() : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-xs text-gray-500 mt-2">
                                Last updated: {stats.last_updated ? new Date(stats.last_updated).toLocaleString() : '—'}
                            </div>
                        </div>
                    )}
                </section>

                {/* Image Steganography Testing Section */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-white mb-4">Image Steganography Testing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Download Latest Image */}
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                            <h3 className="text-lg font-semibold text-cyan-300 mb-3">📥 Download Test Image</h3>
                            <p className="text-gray-400 mb-4">
                                Download the latest steganographic image from the database for testing purposes.
                            </p>
                            <button
                                onClick={handleDownloadImage}
                                disabled={imageDownloading}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                            >
                                {imageDownloading ? 'Downloading...' : 'Download Latest Image'}
                            </button>
                        </div>

                        {/* Upload Image for Detection */}
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                            <h3 className="text-lg font-semibold text-green-300 mb-3">🔍 Detect Steganography</h3>
                            <p className="text-gray-400 mb-4">
                                Upload an image to detect hidden steganographic watermarks and identify the source company.
                            </p>
                            <label
                                htmlFor="image-detect-upload"
                                className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition-all duration-200 inline-block"
                            >
                                {imageDetectLoading ? 'Analyzing...' : 'Upload Image'}
                                <input
                                    id="image-detect-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageDetectUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Image Detection Error */}
                    {imageDetectError && (
                        <div className="mt-4 text-red-400">{imageDetectError}</div>
                    )}

                    {/* Image Detection Result */}
                    {imageDetectResult && (
                        <div className="mt-6 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                            <h3 className="text-lg font-bold text-green-300 mb-4">🔍 Steganography Detection Results</h3>
                            
                            {/* Detection Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className={`rounded-lg p-4 flex flex-col items-center ${
                                    imageDetectResult.detection_result?.has_steganography 
                                        ? 'bg-red-900/40 border border-red-500/50' 
                                        : 'bg-green-900/40 border border-green-500/50'
                                }`}>
                                    <span className="text-2xl font-bold">
                                        {imageDetectResult.detection_result?.has_steganography ? '⚠️' : '✅'}
                                    </span>
                                    <span className="text-sm mt-1 text-center">
                                        {imageDetectResult.detection_result?.has_steganography ? 'Steganography Detected' : 'Clean Image'}
                                    </span>
                                </div>
                                
                                {imageDetectResult.detection_result?.extracted_company && (
                                    <div className="bg-cyan-900/40 rounded-lg p-4 flex flex-col items-center">
                                        <span className="text-xl font-bold text-cyan-400">
                                            {imageDetectResult.detection_result.extracted_company}
                                        </span>
                                        <span className="text-gray-300 text-sm mt-1">Source Company</span>
                                    </div>
                                )}
                                
                                {imageDetectResult.detection_result?.confidence && (
                                    <div className="bg-yellow-900/40 rounded-lg p-4 flex flex-col items-center">
                                        <span className="text-xl font-bold text-yellow-400">
                                            {imageDetectResult.detection_result.confidence}
                                        </span>
                                        <span className="text-gray-300 text-sm mt-1">Confidence</span>
                                    </div>
                                )}
                                
                                {imageDetectResult.detection_result?.image_analysis && (
                                    <div className="bg-purple-900/40 rounded-lg p-4 flex flex-col items-center">
                                        <span className="text-xl font-bold text-purple-400">
                                            {imageDetectResult.detection_result.image_analysis.total_pixels?.toLocaleString()}
                                        </span>
                                        <span className="text-gray-300 text-sm mt-1">Total Pixels</span>
                                    </div>
                                )}
                            </div>

                            {/* Image Analysis Details */}
                            {imageDetectResult.detection_result?.image_analysis && (
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-white mb-2">Image Analysis</h4>
                                    <div className="bg-gray-900/60 rounded-lg p-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">Width:</span>
                                                <span className="text-white ml-2">{imageDetectResult.detection_result.image_analysis.width}px</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Height:</span>
                                                <span className="text-white ml-2">{imageDetectResult.detection_result.image_analysis.height}px</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Total Pixels:</span>
                                                <span className="text-white ml-2">{imageDetectResult.detection_result.image_analysis.total_pixels?.toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Max Capacity:</span>
                                                <span className="text-white ml-2">{imageDetectResult.detection_result.image_analysis.max_capacity?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bait Information */}
                            {imageDetectResult.bait_info && imageDetectResult.bait_info.found_in_database && (
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-white mb-2">🎣 Bait Information</h4>
                                    <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-300">Original User:</span>
                                                <span className="text-red-300 ml-2 font-mono">{imageDetectResult.bait_info.original_user}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-300">Shared With:</span>
                                                <span className="text-red-300 ml-2 font-semibold">{imageDetectResult.bait_info.shared_with_company}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-300">Created Date:</span>
                                                <span className="text-red-300 ml-2">{new Date(imageDetectResult.bait_info.created_date).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-300">Bait ID:</span>
                                                <span className="text-red-300 ml-2 font-mono">{imageDetectResult.bait_info.bait_id}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-red-800/30 rounded border-l-4 border-red-500">
                                            <p className="text-red-200 font-semibold">⚠️ LEAK DETECTED</p>
                                            <p className="text-red-300 text-sm mt-1">
                                                This image was originally shared with <strong>{imageDetectResult.bait_info.shared_with_company}</strong> 
                                                and contains embedded watermarks. Its presence elsewhere indicates a potential data leak.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Leak Data Section */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-white mb-4">Leak & Download Data</h2>
                    <p className="text-gray-400 mb-3">
                        <span className="font-semibold text-yellow-400">Disclaimer:</span> The leaked data does <span className="underline">not</span> contain any information about the company it originated from. This ensures that leak detection is performed without any bias or prior knowledge of the source.
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <select
                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none"
                            value={leakCompany}
                            onChange={e => setLeakCompany(e.target.value)}
                        >
                            <option value="">Select Company</option>
                            {stats?.available_companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleLeakDownload}
                            disabled={!leakCompany || leakLoading}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {leakLoading ? 'Downloading...' : 'Leak & Download Data'}
                        </button>
                    </div>
                    {leakError && <div className="text-red-400 mt-2">{leakError}</div>}
                </section>

                {/* Detect Fingerprint Section */}
                <section className="mb-10">
                    <h2 className="text-xl font-semibold text-white mb-4">Detect Fingerprint in Leaked Data</h2>
                    <p className="text-gray-400 mb-3">
                        Upload a leaked JSON data file to analyze and detect any embedded fingerprint or watermark.
                    </p>
                    <div className="flex items-center gap-4 mb-3">
                        <label
                            htmlFor="detect-upload"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-lg cursor-pointer transition-all duration-200"
                        >
                            <span>Upload JSON File</span>
                            <input
                                id="detect-upload"
                                type="file"
                                accept=".json,application/json"
                                onChange={handleDetectUpload}
                                className="hidden"
                            />
                        </label>
                        {detectLoading && <span className="text-cyan-400">Detecting fingerprint...</span>}
                    </div>
                    {detectError && <div className="text-red-400">{detectError}</div>}
                    {detectResult && (
                        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 mt-4">
                            <h3 className="text-lg font-bold text-cyan-300 mb-4">Detection Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-cyan-900/40 rounded-lg p-4 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-cyan-400">{detectResult.TotalSuspectsAnalyzed}</span>
                                    <span className="text-gray-300 text-sm mt-1">Suspects Analyzed</span>
                                </div>
                                <div className="bg-green-900/40 rounded-lg p-4 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-green-400">{detectResult.MatchedCompaniesCount}</span>
                                    <span className="text-gray-300 text-sm mt-1">Companies Matched</span>
                                </div>
                                <div className="bg-yellow-900/40 rounded-lg p-4 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-yellow-400">{detectResult.TotalManipulations}</span>
                                    <span className="text-gray-300 text-sm mt-1">Total Manipulations</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-md font-semibold text-white mb-2">Best Match</h4>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-cyan-400">{detectResult.BestMatchCompanyId || '—'}</span>
                                    <span className="bg-green-700/40 text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                                        {detectResult.BestMatchConfidence || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Company Ranking */}
                            {detectResult.QualifyingCompaniesRanking && detectResult.QualifyingCompaniesRanking.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-white mb-2">Company Ranking</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm text-left">
                                            <thead>
                                                <tr className="bg-gray-700/50 text-cyan-300">
                                                    <th className="py-2 px-4">Rank</th>
                                                    <th className="py-2 px-4">Company</th>
                                                    <th className="py-2 px-4">Confidence</th>
                                                    <th className="py-2 px-4">Total Matches</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detectResult.QualifyingCompaniesRanking.map((row) => (
                                                    <tr key={row.companyId} className="border-b border-gray-700/40">
                                                        <td className="py-2 px-4">{row.rank}</td>
                                                        <td className="py-2 px-4">{row.companyId}</td>
                                                        <td className="py-2 px-4">
                                                            <span className={`font-bold ${row.confidence >= '90%' ? 'text-green-400' : row.confidence >= '60%' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {row.confidence}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-4">{row.totalMatches}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Per-Suspect Analysis */}
                            <div>
                                <h4 className="text-md font-semibold text-white mb-2">Detailed Suspect Analysis</h4>
                                <div className="space-y-4">
                                    {(detectResult.DetailedAnalysis && Array.isArray(detectResult.DetailedAnalysis)) ? (
                                        detectResult.DetailedAnalysis.map((suspect, idx) => {
                                            const match = suspect.companyMatches[detectResult.BestMatchCompanyId];
                                            return (
                                                <div key={idx} className="bg-gray-900/60 rounded-lg p-4 border border-gray-700/40">
                                                    <div className="flex flex-wrap items-center gap-4 mb-2">
                                                        <span className="font-bold text-cyan-300">Suspect #{suspect.suspectIndex + 1}</span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${match && match.confidence === "100.00%" ? 'bg-green-700/40 text-green-300' : match && match.confidence > "0.00%" ? 'bg-yellow-700/40 text-yellow-300' : 'bg-gray-700/40 text-gray-300'}`}>
                                                            Confidence: {match ? match.confidence : "0.00%"}
                                                        </span>
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-700/40 text-cyan-200">
                                                            Score: {match ? match.score : 0}
                                                        </span>
                                                        {suspect.bestMatch && (
                                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-700/40 text-purple-200">
                                                                Best Match: {suspect.bestMatch}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {match && match.matchedFields && match.matchedFields.length > 0 ? (
                                                        <div className="mt-2">
                                                            <span className="text-sm text-gray-300">Matched Fields:</span>
                                                            <ul className="list-disc list-inside text-sm text-green-300 mt-1">
                                                                {match.matchedFields.map((field, i) => (
                                                                    <li key={i}>{field}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-400 mt-2">No significant matches for this suspect.</div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-gray-400">No detailed analysis available.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* How This Works Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-semibold text-white mb-4">How Our Watermarking Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Steganographic Addressing */}
                        <div className="bg-gray-800/60 rounded-xl p-6 border border-cyan-700/30 flex flex-col items-center">
                            <span className="text-3xl mb-2">🏠</span>
                            <h4 className="font-bold text-cyan-300 mb-2">Steganographic Addressing</h4>
                            <p className="text-gray-300 text-sm text-center">
                                We embed company-specific location identifiers within address fields using geographically plausible block, sector, and unit codes. These appear as natural address components (e.g., <span className="text-cyan-200 font-mono">Block CR01</span>, <span className="text-cyan-200 font-mono">Sector PF03</span>) but serve as cryptographic breadcrumbs for source attribution.
                            </p>
                            <div className="mt-3 text-xs bg-gray-900/60 rounded p-2 text-cyan-400 font-mono">
                                {'"address_line2": "Near Central Park, Block CR01"'}
                            </div>
                        </div>
                        {/* String Steganography */}
                        <div className="bg-gray-800/60 rounded-xl p-6 border border-purple-700/30 flex flex-col items-center">
                            <span className="text-3xl mb-2">🪄</span>
                            <h4 className="font-bold text-purple-300 mb-2">String Steganography</h4>
                            <p className="text-gray-300 text-sm text-center">
                                We hide information using zero-width characters, strategic hyphens, and underscores in text fields. For example, <span className="text-purple-200 font-mono">TCS_Ltd_</span>, <span className="text-purple-200 font-mono">HDFC-Bank</span>, or even invisible Unicode markers. These micro-modifications are normalization-resistant and survive most data processing.
                            </p>
                            <div className="mt-3 text-xs bg-gray-900/60 rounded p-2 text-purple-400 font-mono">
                                {'"company": "TCS_Ltd_", "bank": "HDFC-Bank"'}
                            </div>
                        </div>
                        {/* Float & Date Tweaks */}
                        <div className="bg-gray-800/60 rounded-xl p-6 border border-yellow-700/30 flex flex-col items-center">
                            <span className="text-3xl mb-2">🧮</span>
                            <h4 className="font-bold text-yellow-300 mb-2">Subtle Numeric & Date Tweaks</h4>
                            <p className="text-gray-300 text-sm text-center">
                                We inject sub-decimal signatures at the 5th decimal place in numerical fields (e.g. <span className="text-yellow-200 font-mono">1234.56001</span>) and apply temporal format manipulation to dates (e.g. <span className="text-yellow-200 font-mono">YYYY-DD-MM</span> vs <span className="text-yellow-200 font-mono">YYYY-MM-DD</span>). These micro-perturbations are statistically undetectable yet forensically recoverable.
                            </p>
                            <div className="mt-3 text-xs bg-gray-900/60 rounded p-2 text-yellow-400 font-mono">
                                {'"balance": 1234.56001, "date": "2025-28-07"'}
                            </div>
                        </div>
                        {/* Normalization-Proofing */}
                        <div className="bg-gray-800/60 rounded-xl p-6 border border-green-700/30 flex flex-col items-center">
                            <span className="text-3xl mb-2">🛡️</span>
                            <h4 className="font-bold text-green-300 mb-2">Resilient Watermarking</h4>
                            <p className="text-gray-300 text-sm text-center">
                                Our multi-layer approach ensures watermark persistence through data cleaning, reformatting, and partial modifications. Each technique is engineered to withstand common data transformation pipelines while maintaining attribution integrity.
                            </p>
                        <div className="mt-3 text-xs bg-gray-900/60 rounded p-2 text-green-400 font-mono">
                            {'"salary": 50000.00003, "location": "MG-Road, Unit TC01"'}<br />
                            <span className="text-gray-500">// survives normalization</span>
                        </div>
                    </div>
                    {/* Cryptographic Fingerprinting */}
                    <div className="bg-gray-800/60 rounded-xl p-6 border border-blue-700/30 flex flex-col items-center">
                        <span className="text-3xl mb-2">🔑</span>
                        <h4 className="font-bold text-blue-300 mb-2">Cryptographic Fingerprinting</h4>
                        <p className="text-gray-300 text-sm text-center">
                            We generate unique <span className="text-blue-200 font-mono">watermarkSeeds</span> using SHA-256 entropy and embed deterministic <span className="text-blue-200 font-mono">fingerprintCodes</span> throughout the dataset. This creates an immutable provenance chain that enables precise leak source identification and tamper detection.
                        </p>
                        <div className="mt-3 text-xs bg-gray-900/60 rounded p-2 text-blue-400 font-mono">
                            {'"watermarkSeed": "168f4ba4-f940-4e54-9c53-5555bab28aac"'}<br />
                            {'"fingerprintCode": "111101001000101010001101000001011010"'
}
                        </div>
                    </div>

                    {/* Image Steganography */}
                    <div className="bg-gray-800/60 rounded-xl p-6 border border-pink-700/30 flex flex-col items-center">
                        <span className="text-3xl mb-2">🖼️</span>
                        <h4 className="font-bold text-pink-300 mb-2">Image Steganography</h4>
                        <p className="text-gray-300 text-sm text-center">
                            We embed company identifiers directly into image pixels using LSB (Least Significant Bit) manipulation. The watermarks are invisible to the human eye but can be extracted to identify the source. This technique survives image compression and format conversion.
                        </p>
                        <div className="mt-3 text-xs bg-gray-900/60 rounded p-2 text-pink-400 font-mono">
                            {'RGB(255,254,253) → RGB(255,254,252)'}<br />
                            <span className="text-gray-500">// company: "creder"</span>
                        </div>
                    </div>
            </div>
            <div className="mt-8 text-center text-gray-400 text-base">
                <span className="font-semibold text-cyan-400">We embed intelligence in plain sight—</span>
                using steganographic addressing, linguistic manipulation, precision fingerprinting, image watermarking, and cryptographic attribution. Even when data is copied, normalized, or leaked across multiple vectors, our multi-modal watermarking system can <span className="text-green-400 font-semibold">precisely identify the source</span>—no matter the transformation.
            </div>
        </section>

            </div >
        </div >
    );
};

export default AdminDashboard;