import React, { useState } from 'react';
import {
  X,
  Upload,
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  CivicCategory,
  SeverityLevel,
  User,
  AIAnalysisResult,
  DuplicateMatch,
  Complaint,
} from '../types/index.ts';
import { SUPPORTED_CATEGORIES } from '../../server/ai.ts';
import { PUNE_LANDMARKS, PUNE_WARDS, DEMO_PRESET_IMAGES } from '../utils/puneData.ts';
import { InteractiveMap } from './InteractiveMap.tsx';

interface ReportComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onComplaintSubmitted: (complaint: Complaint) => void;
}

export const ReportComplaintModal: React.FC<ReportComplaintModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onComplaintSubmitted,
}) => {
  // Step state: 1: Image & AI Analysis, 2: Location & Details, 3: Duplicate Check & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  // Category and severity can be confirmed / adjusted by user
  const [category, setCategory] = useState<CivicCategory>('Potholes & Roads');
  const [severity, setSeverity] = useState<SeverityLevel>('Medium');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Location state
  const [lat, setLat] = useState<number>(18.5284);
  const [lng, setLng] = useState<number>(73.8425);
  const [address, setAddress] = useState<string>('Near Fergusson College Main Gate, FC Road');
  const [ward, setWard] = useState<string>('Shivajinagar - Ward 14');
  const [landmark, setLandmark] = useState<string>('Opposite Goodluck Cafe');
  const [pincode, setPincode] = useState<string>('411004');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Duplicate Check State
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState<boolean>(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [duplicateStepActive, setDuplicateStepActive] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<Complaint | null>(null);

  if (!isOpen) return null;

  // AI Analysis Trigger
  const runAiAnalysis = async (imageBase64: string, note?: string) => {
    setIsAnalyzingAI(true);
    try {
      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          userNote: note,
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
        setCategory(data.analysis.category);
        setSeverity(data.analysis.severity);
        if (!description) {
          setDescription(data.analysis.description);
        }
        if (!title) {
          setTitle(`${data.analysis.category} near ${landmark || 'pune street'}`);
        }
      }
    } catch (err) {
      console.error('Failed AI analysis:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      runAiAnalysis(base64, userNote);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset: (typeof DEMO_PRESET_IMAGES)[0]) => {
    setSelectedImage(preset.url);
    // Convert URL to image or analyze
    runAiAnalysis(preset.url, preset.title);
  };

  // Location Handlers
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAddress(`GPS Coords: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed or denied, using Pune center:', err.message);
        // Fallback gracefully to Pune center
        setLat(18.5204);
        setLng(73.8567);
        setAddress('Pune Central Urban Area');
        setIsLocating(false);
      },
      { timeout: 7000 }
    );
  };

  const handleLandmarkPreset = (landmarkObj: (typeof PUNE_LANDMARKS)[0]) => {
    setLat(landmarkObj.lat);
    setLng(landmarkObj.lng);
    setAddress(landmarkObj.name);
    setWard(landmarkObj.ward);
    setLandmark(landmarkObj.name);
    setPincode(landmarkObj.pincode);
  };

  // Duplicate Check Handler
  const checkForDuplicates = async () => {
    setIsCheckingDuplicates(true);
    try {
      const res = await fetch('/api/duplicates/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          lat,
          lng,
        }),
      });
      const data = await res.json();
      const duplicates: DuplicateMatch[] = data.possibleDuplicates || [];

      if (duplicates.length > 0) {
        setDuplicateMatches(duplicates);
        setDuplicateStepActive(true);
      } else {
        // No duplicates, proceed directly to submit
        executeSubmitComplaint();
      }
    } catch (err) {
      console.error('Error checking duplicates:', err);
      executeSubmitComplaint();
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Linking to existing duplicate
  const handleLinkToDuplicate = async (existingId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${existingId}/link-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          citizenNotes: description || 'Citizen co-affirmed this location issue.',
        }),
      });

      const data = await res.json();
      if (data.complaint) {
        setSubmissionSuccess(data.complaint);
        onComplaintSubmitted(data.complaint);
      }
    } catch (err) {
      console.error('Error linking duplicate:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Submit
  const executeSubmitComplaint = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `${category} issue near ${landmark || address}`,
          category,
          description: description || 'Civic infrastructure report submitted via NagarSetu.',
          imageUrl: selectedImage || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
          location: {
            lat,
            lng,
            address,
            ward,
            pincode,
            landmark,
          },
          severity,
          submittedBy: {
            userId: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
          },
          aiAnalysis: aiAnalysis || undefined,
        }),
      });

      const data = await res.json();
      if (data.complaint) {
        setSubmissionSuccess(data.complaint);
        onComplaintSubmitted(data.complaint);
      }
    } catch (err) {
      console.error('Failed submitting complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetModal = () => {
    setCurrentStep(1);
    setSelectedImage('');
    setAiAnalysis(null);
    setDuplicateMatches([]);
    setDuplicateStepActive(false);
    setSubmissionSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Report Civic Infrastructure Issue
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pune Municipal Corporation Smart Civic Grid • AI-Assisted Assessment
            </p>
          </div>
          <button
            onClick={handleResetModal}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* SUCCESS SCREEN */}
          {submissionSuccess ? (
            <div className="text-center py-8 px-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Grievance Registered Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Your report has been analyzed by NagarSetu AI, geo-tagged, and queued in the civic operations pipeline.
              </p>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Tracking Token</span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {submissionSuccess.id}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Classified Category</span>
                  <span className="font-semibold text-slate-800">{submissionSuccess.category}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">AI Severity</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      submissionSuccess.severity === 'Critical'
                        ? 'bg-red-100 text-red-800'
                        : submissionSuccess.severity === 'High'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {submissionSuccess.severity}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Computed Priority Score</span>
                  <span className="font-bold text-indigo-700">
                    {submissionSuccess.priorityScore}/100 ({submissionSuccess.priorityLevel})
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Assigned Department</span>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">
                    {submissionSuccess.assignedDepartment || 'Municipal Operations'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleResetModal}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : duplicateStepActive && duplicateMatches.length > 0 ? (
            /* DUPLICATE DETECTION WARNING SCREEN */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Possible Existing Complaint Detected Near This Location
                  </h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Found {duplicateMatches.length} recent unresolved {category} report(s) within 100 metres registered in the last 7 days.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                To prevent duplicate tickets and accelerate municipal response, you can <strong>affirm and link your voice</strong> to this existing issue. This boosts the municipal priority score and ensures you receive instant status updates!
              </p>

              <div className="space-y-3">
                {duplicateMatches.map((match) => (
                  <div
                    key={match.existingComplaint.id}
                    className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm hover:border-blue-400 transition flex flex-col sm:flex-row gap-4 items-start justify-between"
                  >
                    <div className="flex gap-3 items-start flex-1">
                      <img
                        src={match.existingComplaint.imageUrl}
                        alt="Existing Complaint"
                        className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-blue-700">
                            {match.existingComplaint.id}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            ~{match.distanceMeters}m away
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                            {match.timeDifferenceDays}d ago
                          </span>
                        </div>
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                          {match.existingComplaint.title}
                        </h5>
                        <p className="text-xs text-slate-500">
                          📍 {match.existingComplaint.location.address}
                        </p>
                        <div className="text-[11px] text-slate-600 flex items-center space-x-2 pt-1">
                          <span>Reports: <strong>{match.existingComplaint.reportCount}</strong></span>
                          <span>•</span>
                          <span>Priority: <strong className="text-indigo-600">{match.existingComplaint.priorityScore}/100</strong></span>
                          <span>•</span>
                          <span>Status: <strong className="text-amber-600">{match.existingComplaint.status}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => handleLinkToDuplicate(match.existingComplaint.id)}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Support / Link to This Issue</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setDuplicateStepActive(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Back to Details
                </button>
                <button
                  type="button"
                  onClick={executeSubmitComplaint}
                  disabled={isSubmitting}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-xs font-semibold transition"
                >
                  {isSubmitting ? 'Submitting...' : 'Proceed as Separate Complaint'}
                </button>
              </div>
            </div>
          ) : (
            /* NORMAL MULTI-STEP FLOW */
            <div>
              {/* Stepper Progress */}
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    1
                  </div>
                  <span className={`text-xs font-semibold ${currentStep === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                    Image & AI Analysis
                  </span>
                </div>
                <div className="h-0.5 w-8 bg-slate-200"></div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 2
                        ? 'bg-blue-600 text-white'
                        : currentStep > 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    2
                  </div>
                  <span className={`text-xs font-semibold ${currentStep === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                    Location & Description
                  </span>
                </div>
              </div>

              {/* STEP 1: PHOTO & AI ANALYSIS */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Upload Incident Photo (Required for AI Diagnosis)
                    </label>

                    {/* Upload Box */}
                    <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center transition bg-slate-50/50">
                      {selectedImage ? (
                        <div className="relative group max-w-md mx-auto">
                          <img
                            src={selectedImage}
                            alt="Complaint Preview"
                            className="w-full h-48 object-cover rounded-xl shadow-md border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage('');
                              setAiAnalysis(null);
                            }}
                            className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1 rounded-full shadow"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition">
                              <Camera className="w-4 h-4" />
                              <span>Select Photo from Device</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                              />
                            </label>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                              JPEG, PNG up to 15MB • Captures road, garbage, leakages, or broken lights
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Demo Photos Quick Picker */}
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                        <span>Or select a realistic Pune civic sample photo:</span>
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {DEMO_PRESET_IMAGES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handlePresetSelect(preset)}
                            className="text-left border border-slate-200 hover:border-blue-500 rounded-lg p-1.5 bg-white transition hover:shadow-sm"
                          >
                            <img
                              src={preset.url}
                              alt={preset.title}
                              className="w-full h-16 object-cover rounded mb-1"
                            />
                            <div className="text-[10px] font-bold text-slate-800 truncate">
                              {preset.title}
                            </div>
                            <div className="text-[9px] text-slate-500 truncate">
                              {preset.category}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Diagnosis Result Card */}
                  {isAnalyzingAI && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center space-x-3 animate-pulse">
                      <Sparkles className="w-6 h-6 text-blue-600 animate-spin" />
                      <div>
                        <div className="text-xs font-bold text-blue-900">
                          Gemini 3.8 Flash Analyzing Image...
                        </div>
                        <p className="text-[11px] text-blue-700">
                          Detecting civic defect type, evaluating pavement/infrastructure hazard, and estimating severity.
                        </p>
                      </div>
                    </div>
                  )}

                  {aiAnalysis && !isAnalyzingAI && (
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-md space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-900">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            NagarSetu AI Diagnostic
                          </span>
                        </div>
                        <span className="text-[11px] bg-blue-900/60 border border-blue-600/50 text-blue-200 px-2 py-0.5 rounded font-mono">
                          Confidence: {Math.round(aiAnalysis.confidence * 100)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Detected Category:</span>
                          <span className="font-bold text-white text-sm">{aiAnalysis.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Estimated Severity:</span>
                          <span
                            className={`inline-block font-extrabold px-2 py-0.5 rounded text-xs mt-0.5 ${
                              aiAnalysis.severity === 'Critical'
                                ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                                : aiAnalysis.severity === 'High'
                                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40'
                                : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {aiAnalysis.severity}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="font-semibold text-slate-200">Factual Finding: </span>
                        {aiAnalysis.description}
                      </div>

                      {aiAnalysis.flagForReview && (
                        <div className="bg-amber-900/40 border border-amber-600/50 p-2 rounded text-[11px] text-amber-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Image flagged for manual review: Unclear or borderline civic defect.</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Target Dept: {aiAnalysis.suggestedDepartment}</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> AI Verified
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Manual Override Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category (AI Classified)
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as CivicCategory)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        {SUPPORTED_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Severity (AI Estimated)
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Low">Low (Minor cosmetic / low urgency)</option>
                        <option value="Medium">Medium (Moderate defect)</option>
                        <option value="High">High (Significant hazard)</option>
                        <option value="Critical">Critical (Immediate danger)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      disabled={!selectedImage || isAnalyzingAI}
                      onClick={() => setCurrentStep(2)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow transition"
                    >
                      <span>Proceed to Location & Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION & DETAILS */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {/* Title and Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Issue Summary Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Deep pothole causing skids near FC College gate"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Detailed Citizen Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what happened, depth/size, hazard to traffic or pedestrians..."
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Location Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Incident Location (Pune)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGPSDetect}
                        disabled={isLocating}
                        className="text-[11px] text-blue-700 hover:text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition"
                      >
                        {isLocating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                        <span>Detect GPS</span>
                      </button>
                    </div>

                    {/* Pune Landmark Presets */}
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1">Quick Select Pune Landmark:</p>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
                        {PUNE_LANDMARKS.map((lm, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleLandmarkPreset(lm)}
                            className={`text-[10px] px-2 py-1 rounded transition text-left ${
                              landmark === lm.name
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {lm.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500">Address / Street Name</span>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Administrative Ward</span>
                        <select
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                        >
                          {PUNE_WARDS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Interactive Pin-Drop Leaflet Map */}
                    <div className="pt-1">
                      <p className="text-[11px] text-slate-500 mb-1">
                        Pinpoint on Map (Drag marker or click exact road position):
                      </p>
                      <InteractiveMap
                        mode="pick"
                        height="200px"
                        center={[lat, lng]}
                        selectedLocation={{ lat, lng }}
                        onLocationSelect={(newLat, newLng) => {
                          setLat(newLat);
                          setLng(newLng);
                        }}
                      />
                      <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                        <span>Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}</span>
                        <span>Ward: {ward}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      disabled={isCheckingDuplicates || isSubmitting}
                      onClick={checkForDuplicates}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-md transition"
                    >
                      {isCheckingDuplicates ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Scanning for Duplicates...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Submit Complaint</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
