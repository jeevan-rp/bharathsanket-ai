import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { submitReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../config/firebase';

/**
 * CitizenReport Component (BharatSanket AI)
 * ============================================
 * Modern Dark Theme & Glassmorphism UI for ingesting unstructured
 * multilingual infrastructure complaints (voice/text) with Multimodal Image Evidence.
 * 
 * Features:
 * - Multilingual text submission (Hindi, Tamil, English, etc.)
 * - Multimodal Camera / Image Evidence Upload to Firebase Storage
 * - Web Speech API Voice Dictation
 * - One-click sample complaints for instant testing
 * - Real-time AI Structured Breakdown display with Visual Verification badge
 */

const SAMPLE_COMPLAINTS = [
  {
    lang: 'English',
    flag: '🇮🇳',
    text: 'The road in T Nagar is completely flooded and dangerous open potholes are causing accidents.',
  },
  {
    lang: 'हिन्दी (Hindi)',
    flag: '🇮🇳',
    text: 'वाराणसी के गोदौलिया चौराहे पर सीवर लाइन टूटने से गंदा पानी भर गया है और भीषण जाम लगा है।',
  },
  {
    lang: 'தமிழ் (Tamil)',
    flag: '🇮🇳',
    text: 'தி நகரில் சாலை முழுவதும் மழைநீரால் வெள்ளத்தில் மூழ்கியுள்ளது, உடனடியாக வடிகால் சரிசெய்ய வேண்டும்.',
  },
  {
    lang: 'मराठी (Marathi)',
    flag: '🇮🇳',
    text: 'पुण्यातील शिवाजी नगर मुख्य रस्त्यावर पथदिवे बंद आहेत आणि खड्ड्यांमुळे अपघात होत आहेत.',
  }
];

export default function CitizenReport({ onReportSubmitted }) {
  const { currentUser, userProfile } = useAuth();
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle Image Selection & Validation
  const handleImageChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Selected image exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload image to Firebase Storage
  const uploadImageToStorage = async (file) => {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `evidence/${currentUser?.uid || 'guest'}/${timestamp}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Storage upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  // Toggle Voice Recognition (Web Speech API)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please type your complaint.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Default to Indian multilingual recognition
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setError(`Voice input error (${event.error}). Please type your message.`);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setParsedResult(null);

    if (text.trim().length < 5) {
      setError('Please provide at least 5 characters describing the issue.');
      return;
    }

    setLoading(true);
    let uploadedImageUrl = null;
    const toastId = toast.loading('Analyzing complaint with Gemini Multimodal AI...');

    try {
      // 1. Upload photo to Firebase Storage if selected
      if (selectedImage) {
        setStatusMessage('Uploading visual evidence to Firebase Storage...');
        uploadedImageUrl = await uploadImageToStorage(selectedImage);
      }

      // 2. Submit to backend Gemini Multimodal Verification
      setStatusMessage('Gemini Multimodal AI analyzing complaint and visual ground truth...');
      const response = await submitReport({
        text: text.trim(),
        imageUrl: uploadedImageUrl,
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        userName: userProfile?.displayName || currentUser?.displayName || null
      });

      if (response.success) {
        setParsedResult(response.data);
        toast.success(
          `Grievance categorized as "${response.data.intentCategory}" in ${response.data.extractedLocation?.cityOrDistrict || 'India'}!`,
          { id: toastId }
        );
        if (onReportSubmitted) {
          onReportSubmitted(response.data);
        }
      }
    } catch (err) {
      console.error('Submission failed:', err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to analyze and record complaint.';
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const getSeverityBadge = (level) => {
    const config = {
      5: { color: 'bg-red-500/20 text-red-400 border-red-500/40', label: 'Critical (5/5)' },
      4: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', label: 'Severe (4/5)' },
      3: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', label: 'Moderate (3/5)' },
      2: { color: 'bg-lime-500/20 text-lime-400 border-lime-500/40', label: 'Minor (2/5)' },
      1: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', label: 'Low (1/5)' },
    };
    return config[level] || config[3];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ─── Hero Header with Dark Glassmorphism ─── */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Multilingual Gemini 2.5 Geospatial Intelligence
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Samvaad <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400">Infra-AI</span>
        </h2>
        <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">
          Voice or type infrastructure grievances in your regional language. Our AI converts unstructured complaints into structured geospatial records and alerts policymakers in real time.
        </p>
      </div>

      {/* ─── Main Ingestion Card ─── */}
      <div className="relative rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Citizen Complaint</span>
                <span className="text-xs font-normal text-slate-400">(Voice or Text • Any Indian Language)</span>
              </label>

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span>{isRecording ? '🔴 Listening...' : '🎙️ Speak'}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe the problem, e.g. 'The main road in T Nagar is completely flooded with wastewater and open gutters' or 'वाराणसी के गोदौलिया चौराहे पर सीवर लाइन टूट गई है'..."
                rows={4}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition resize-none custom-scrollbar"
                disabled={loading}
              />
              <div className="absolute right-3 bottom-3 text-[11px] text-slate-500">
                {text.length} characters
              </div>
            </div>
          </div>

          {/* ─── Multimodal Visual Evidence Upload ─── */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span>📸 Visual Evidence (Multimodal AI Verification)</span>
                <span className="text-[10px] text-amber-400 font-normal">Optional • Max 5MB</span>
              </label>
              {selectedImage && (
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                >
                  ✕ Remove Photo
                </button>
              )}
            </div>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-5 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04] group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📷</div>
                <p className="text-xs font-semibold text-slate-300">
                  Click to capture or upload photo evidence
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Gemini 1.5/2.5 Flash Vision will inspect image ground-truth and calibrate severity level
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 bg-slate-900/90 p-3 rounded-xl border border-slate-700/60">
                <img
                  src={imagePreview}
                  alt="Complaint Preview"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-700 shrink-0 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {selectedImage?.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <span>✨</span>
                    <span>Ready for Gemini Multimodal Analysis</span>
                  </p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Samples */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <span>⚡ Try one-click quick samples:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_COMPLAINTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(item.text)}
                  className="text-left p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all text-xs text-slate-300 group flex items-start gap-2"
                >
                  <span className="text-sm shrink-0">{item.flag}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-amber-400 block mb-0.5">{item.lang}</span>
                    <span className="truncate block text-slate-400 group-hover:text-slate-200">{item.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action & Status message */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-amber-400 font-medium flex items-center gap-2">
              {loading && statusMessage && (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{statusMessage}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {(text || selectedImage) && (
                <button
                  type="button"
                  onClick={() => { setText(''); removeSelectedImage(); setParsedResult(null); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Clear
                </button>
              )}

              <button
                type="submit"
                disabled={loading || text.trim().length < 5}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white font-semibold text-xs transition shadow-lg shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Multimodal Ingestion...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Ingest & Verify Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ─── AI Extracted Results Breakdown (Glassmorphic Result Card with Motion) ─── */}
        <AnimatePresence>
          {parsedResult && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mt-8 pt-6 border-t border-slate-800/80 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="text-emerald-400 text-base">✨</span>
                  Gemini Multimodal AI Extraction & Firestore Record
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Doc ID: {parsedResult._id || parsedResult.id}
                </span>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Category & Severity Card */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">Intent Category</div>
                <div className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <span>🏗️</span>
                  <span>{parsedResult.intentCategory}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Severity:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getSeverityBadge(parsedResult.severityLevel).color}`}>
                    {getSeverityBadge(parsedResult.severityLevel).label}
                  </span>
                </div>
              </div>

              {/* Geospatial Coordinates Card */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-1">Extracted Geospatial Point</div>
                <div className="text-sm font-semibold text-slate-200 truncate">
                  📍 {parsedResult.extractedLocation?.rawLocationText || parsedResult.extractedLocation?.cityOrDistrict}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {parsedResult.extractedLocation?.cityOrDistrict}, {parsedResult.extractedLocation?.state}
                </div>
                <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                  GeoPoint({parsedResult.estimatedCoordinates?.lat?.toFixed(4)}, {parsedResult.estimatedCoordinates?.lng?.toFixed(4)})
                </div>
              </div>

              {/* Language & English Summary */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400">English Summary</span>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {parsedResult.detectedLanguage || 'Multilingual'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{parsedResult.summary}"
                </p>
              </div>
            </div>

            {/* Multimodal Verification Feedback Card */}
            {parsedResult.visualVerification && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                parsedResult.visualVerification.matchesComplaint
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}>
                {parsedResult.imageUrl && (
                  <img
                    src={parsedResult.imageUrl}
                    alt="Evidence"
                    className="w-16 h-16 object-cover rounded-lg border border-white/20 shrink-0 shadow-md"
                  />
                )}
                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {parsedResult.visualVerification.matchesComplaint
                        ? '✅ Visual Ground Truth Confirmed by Gemini Vision'
                        : '⚠️ Image Inconclusive / Unverified'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono">
                      Confidence: {Math.round(parsedResult.visualVerification.confidenceScore * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {parsedResult.visualVerification.aiReasoning}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>✅</span>
                <span>Stored in Firestore with native <code>GeoPoint</code> & visual verification metadata.</span>
              </span>
              <a
                href="/citizen/dashboard"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
              >
                View in My Complaints ↓
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

