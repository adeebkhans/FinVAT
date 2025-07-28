import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { steganographyAPI, authAPI } from '../api';

const OnfidoPage = () => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    
    const [step, setStep] = useState('intro'); // intro, camera, upload, processing, result
    const [capturedImage, setCapturedImage] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [documentType, setDocumentType] = useState('PAN Card');
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState(null);

    const companies = ['creder', 'PayFriend', 'LoanIt'];
    const documentTypes = ['PAN Card', 'Aadhaar Card', 'Passport', 'Driving License', 'Voter ID'];

    React.useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await authAPI.getProfile();
                const userData = response.data.data.user;
                setUserProfile(userData);
            } catch (error) {
                navigate('/login');
            }
        };
        fetchUserProfile();
    }, [navigate]);

    // Camera configuration
    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    // Capture photo from webcam
    const capturePhoto = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
        setStep('upload');
    }, [webcamRef]);

    // Convert base64 to PNG file
    const base64ToPngFile = (base64String, filename) => {
        const base64Data = base64String.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new File([bytes], filename, { type: 'image/png' });
    };

    // Handle document verification
    const handleVerification = async () => {
        if (!capturedImage || !selectedCompany || !userProfile) {
            if (!capturedImage) {
                setError('Please capture an image or upload a file');
                return;
            }
            if (!selectedCompany) {
                setError('Please select a company to share with');
                return;
            }
            if (!userProfile) {
                setError('User profile not loaded');
                return;
            }
        }

        setLoading(true);
        setError('');
        setStep('processing');

        try {
            const imageFile = base64ToPngFile(capturedImage, `document_${Date.now()}.png`);
            
            const formData = new FormData();
            formData.append('document', imageFile);
            formData.append('user_id', userProfile._id);
            formData.append('company', selectedCompany);
            formData.append('document_type', documentType);

            const response = await steganographyAPI.onfidoVerification(formData);
            
            setVerificationResult(response.data);
            setStep('result');
        } catch (error) {
            setError('Verification failed. Please try again.');
            setStep('upload');
        } finally {
            setLoading(false);
        }
    };

    // Handle file upload (alternative to camera)
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'image/png') {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target.result);
                setStep('upload');
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please select a PNG image file');
        }
    };

    // Reset process
    const resetProcess = () => {
        setCapturedImage(null);
        setSelectedCompany('');
        setDocumentType('PAN Card');
        setVerificationResult(null);
        setError('');
        setStep('intro');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans antialiased relative overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-700/[0.2] z-0"></div>
            <div className="absolute inset-0 pointer-events-none bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-green-500/20 rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-8 mt-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-green-400 hover:text-green-300 mb-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-green-400">Document Verification</h1>
                    <p className="text-gray-400 mt-2">Secure identity verification for financial services</p>
                </header>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center space-x-4">
                        {['intro', 'camera', 'upload', 'processing', 'result'].map((stepName, index) => (
                            <div key={stepName} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                                    ${step === stepName ? 'bg-green-500 text-white' : 
                                      ['intro', 'camera', 'upload', 'processing', 'result'].indexOf(step) > index ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                    {index + 1}
                                </div>
                                {index < 4 && (
                                    <div className={`w-12 h-1 mx-2 ${['intro', 'camera', 'upload', 'processing', 'result'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-700'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-900/50 border border-red-500/50 rounded-lg p-4">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    {/* Intro Step */}
                    {step === 'intro' && (
                        <div className="text-center space-y-6">
                            <div className="text-6xl mb-4">🔐</div>
                            <h2 className="text-2xl font-bold text-white">Welcome to Document Verification</h2>
                            <p className="text-gray-300 max-w-2xl mx-auto">
                                We'll help you verify your identity document securely. Upload your document to share with the selected financial institution for verification purposes.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Document Type</label>
                                    <select
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                        className="w-full max-w-xs mx-auto bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                    >
                                        {documentTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Company to Share With</label>
                                    <select
                                        value={selectedCompany}
                                        onChange={(e) => setSelectedCompany(e.target.value)}
                                        className="w-full max-w-xs mx-auto bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                    >
                                        <option value="">Choose a company</option>
                                        {companies.map(company => (
                                            <option key={company} value={company}>{company}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => setStep('camera')}
                                    disabled={!selectedCompany}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    📷 Use Camera
                                </button>
                                
                                <label className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 cursor-pointer">
                                    📁 Upload File
                                    <input
                                        type="file"
                                        accept="image/png"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={!selectedCompany}
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Camera Step */}
                    {step === 'camera' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white text-center">Capture Your Document</h2>
                            <p className="text-gray-300 text-center">
                                Position your {documentType} clearly in the camera frame and click capture
                            </p>
                            
                            <div className="flex flex-col items-center space-y-4">
                                <div className="border-2 border-green-500/50 rounded-lg overflow-hidden">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/png"
                                        videoConstraints={videoConstraints}
                                        className="w-full max-w-lg"
                                    />
                                </div>
                                
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('intro')}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={capturePhoto}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
                                    >
                                        📷 Capture
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Confirmation Step */}
                    {step === 'upload' && capturedImage && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white text-center">Confirm Your Document</h2>
                            
                            <div className="flex flex-col items-center space-y-4">
                                <img 
                                    src={capturedImage} 
                                    alt="Captured document" 
                                    className="max-w-md w-full border-2 border-green-500/50 rounded-lg"
                                />
                                
                                {!selectedCompany && (
                                    <div className="w-full max-w-md">
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Select Company to Share With</label>
                                        <select
                                            value={selectedCompany}
                                            onChange={(e) => setSelectedCompany(e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                        >
                                            <option value="">Choose a company</option>
                                            {companies.map(company => (
                                                <option key={company} value={company}>{company}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <div className="text-center space-y-2">
                                    <p className="text-gray-300">Document Type: <span className="text-green-400 font-semibold">{documentType}</span></p>
                                    {selectedCompany && (
                                        <p className="text-gray-300">Sharing with: <span className="text-green-400 font-semibold">{selectedCompany}</span></p>
                                    )}
                                </div>
                                
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('camera')}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                                    >
                                        Retake
                                    </button>
                                    <button
                                        onClick={handleVerification}
                                        disabled={loading || !selectedCompany}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Verify Document'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Processing Step */}
                    {step === 'processing' && (
                        <div className="text-center space-y-6">
                            <div className="text-6xl mb-4">⚡</div>
                            <h2 className="text-2xl font-bold text-white">Processing Your Document</h2>
                            <p className="text-gray-300">
                                We're verifying your document and preparing it for secure sharing...
                            </p>
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                            </div>
                        </div>
                    )}

                    {/* Result Step */}
                    {step === 'result' && verificationResult && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="text-6xl mb-4">
                                    {verificationResult.verification_result?.status === 'verified' ? '✅' : 
                                     verificationResult.verification_result?.status === 'pending' ? '⏳' : '✅'}
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Verification Complete</h2>
                                <p className="text-lg font-semibold text-green-400">
                                    Status: VERIFIED
                                </p>
                            </div>

                            <div className="bg-gray-700/50 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">Verification Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-400">Verification ID:</span>
                                        <span className="text-white ml-2 font-mono">{verificationResult.verification_result?.id || `VER${Date.now()}`}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Document Type:</span>
                                        <span className="text-white ml-2">{documentType}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Company:</span>
                                        <span className="text-white ml-2">{selectedCompany}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Processed:</span>
                                        <span className="text-white ml-2">{new Date().toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-green-300">🔐 Document Securely Shared</h3>
                                <div className="text-sm space-y-2">
                                    <p className="text-green-200">✓ Document has been securely processed and shared with {selectedCompany}</p>
                                    <p className="text-green-200">✓ Your document is now available for verification purposes</p>
                                    <p className="text-gray-300">The verification process is complete and your document is ready for use</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={resetProcess}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
                                >
                                    Verify Another Document
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnfidoPage;