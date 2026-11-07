import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, X, AlertTriangle, Image as ImageIcon, MapPin, Clock } from 'lucide-react';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onConfirm,
  actionType = 'Clock In',
  isException = false,
  remainingExceptions = 3,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workMode, setWorkMode] = useState('Office'); // 'Office' | 'WFH' | 'On-site'
  const [note, setNote] = useState('');
  const [punchType, setPunchType] = useState('Late Check-In');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start webcam stream when modal opens
  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser or upload a photo below.'
          : 'Unable to access camera. You can still upload a photo to proceed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Capture current webcam frame
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror the image horizontally if front facing camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedPhoto(event.target.result);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSubmit = async () => {
    if (!capturedPhoto) return;
    setIsSubmitting(true);
    try {
      await onConfirm({
        photo: capturedPhoto,
        location: workMode,
        note,
        punchType: isException
          ? punchType
          : actionType.includes('Forgot')
          ? 'Forgot Check-Out'
          : 'Regular',
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const showExceptionSelector = isException || actionType.includes('Late') || actionType.includes('Forgot');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[94vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              {actionType} Photo Verification
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">Capture selfie & verify work details</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div className="p-4 sm:p-6 flex flex-col items-center overflow-y-auto space-y-4">
          
          {/* Exception Selector if filing late or forgot punch */}
          {showExceptionSelector && (
            <div className="w-full p-3.5 bg-amber-50 border border-amber-300/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Select Exception Category
                </span>
                <span className="text-[10px] font-black bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {remainingExceptions} of 3 allowances left
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPunchType('Late Check-In')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    punchType === 'Late Check-In'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🕒 Late Check-In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPunchType('Forgot Check-In')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    punchType === 'Forgot Check-In'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📝 Forgot Check-In</span>
                </button>
              </div>
              <p className="text-[10px] text-amber-900/80">
                Uses 1 of your 3 monthly exceptions. All 3 allowances refresh automatically on the 1st of every month.
              </p>
            </div>
          )}

          <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-amber-400/30">
            {capturedPhoto ? (
              // Captured preview
              <img
                src={capturedPhoto}
                alt="Captured selfie"
                className="w-full h-full object-cover"
              />
            ) : cameraError ? (
              // Error state with upload option
              <div className="p-6 text-center text-slate-300 flex flex-col items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                <label className="cursor-pointer bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-500/25">
                  <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                  Upload Photo From Device
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            ) : (
              // Live camera feed
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {loading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    Starting Camera...
                  </div>
                )}
                {/* Visual reticle */}
                <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">
                    Face Camera Directly
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Controls: Capture / Retake */}
          <div className="flex items-center gap-3">
            {!capturedPhoto ? (
              <button
                type="button"
                onClick={handleCapture}
                disabled={Boolean(cameraError) || loading}
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/25 hover:shadow-lg flex items-center gap-2 transition-all uppercase tracking-wider text-xs"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                Snap Photo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRetake}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake Photo
              </button>
            )}
          </div>

          {/* Work Mode Dropdown & Note / Reason */}
          <div className="w-full space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                Work Mode / Location
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800 cursor-pointer"
              >
                <option value="Office">🏢 Office</option>
                <option value="WFH">🏠 WFH (Work From Home)</option>
                <option value="On-site">📍 On-site (Field / Client Location)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {showExceptionSelector ? 'Reason / Explanation (Required for Exception)' : 'Remarks / Note (Optional)'}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={showExceptionSelector ? 'e.g. Traffic jam on highway, forgot to punch at 9:30 AM...' : 'Add a remark...'}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={!capturedPhoto || isSubmitting}
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/25 transition-all uppercase tracking-wider"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            )}
            Confirm & {showExceptionSelector ? `${punchType}` : actionType}
          </button>
        </div>

      </div>
    </div>
  );
}
