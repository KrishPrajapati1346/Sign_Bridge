'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Upload, FileText, Loader2, Download, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { jsPDF } from 'jspdf';
import { reconstructGrammar } from '@/lib/grammar-api';
import { getHandLandmarker, detect } from '@/lib/sign/hand-landmarker';
import { extractFeatures } from '@/lib/sign/landmark-features';
import { loadClassifier, predict } from '@/lib/sign/classifier';
import { useSettings } from '@/lib/settings-context';

export default function DocumentUploadPage() {
  const { authFetch } = useAuth();
  const { settings } = useSettings();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<'idle' | 'analyzing' | 'correcting' | 'complete' | 'error'>(
    'idle',
  );
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [rawTranscript, setRawTranscript] = useState<string[]>([]);
  const [finalDocument, setFinalDocument] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<any>(null);
  const frameRef = useRef<number>(0);
  const lastSignRef = useRef<{ label: string; time: number } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        landmarkerRef.current = await getHandLandmarker();
        await loadClassifier();
      } catch (e) {
        console.error('Failed to init models', e);
        setErrorMsg('Failed to initialize AI models.');
      }
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setStatus('idle');
      setProgress(0);
      setRawTranscript([]);
      setFinalDocument(null);
      setErrorMsg(null);
    }
  };

  const processVideo = async () => {
    if (!videoRef.current || !landmarkerRef.current) return;

    setStatus('analyzing');
    setProgress(0);
    setRawTranscript([]);
    lastSignRef.current = null;

    const video = videoRef.current;
    video.currentTime = 0;

    // Play video to process frame by frame
    try {
      await video.play();
    } catch {
      setStatus('error');
      setErrorMsg('Failed to play video. Ensure the format is supported.');
      return;
    }

    const processFrame = async () => {
      if (video.paused || video.ended) {
        handleVideoEnd();
        return;
      }

      const nowInMs = performance.now();
      const hands = detect(landmarkerRef.current, video, nowInMs);
      const { features, handCount } = extractFeatures(hands);

      setProgress(Math.round((video.currentTime / video.duration) * 100) || 0);

      if (handCount > 0) {
        const prediction = await predict(features);
        if (prediction && prediction.confidence >= 0.85) {
          const last = lastSignRef.current;
          // Only push if it's different from the last sign, or enough time has passed (debounce)
          if (!last || (last.label !== prediction.label && nowInMs - last.time > 1000)) {
            setRawTranscript((prev) => [...prev, prediction.label]);
            lastSignRef.current = { label: prediction.label, time: nowInMs };
          }
        }
      }

      frameRef.current = requestAnimationFrame(() => void processFrame());
    };

    frameRef.current = requestAnimationFrame(() => void processFrame());
  };

  const handleVideoEnd = useCallback(async () => {
    setStatus('correcting');

    try {
      if (rawTranscript.length === 0) {
        throw new Error('No signs detected in the video.');
      }

      const rawText = rawTranscript.join(' ');
      const corrected = await reconstructGrammar(authFetch, rawTranscript, 'en');
      setFinalDocument(corrected);
      setStatus('complete');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to correct grammar.');
    }
  }, [authFetch, rawTranscript]);

  const generatePDF = () => {
    if (!finalDocument) return;

    const doc = new jsPDF();
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(47, 109, 246); // Signal blue
    doc.text('SignBridge Document Translation', 20, 30);

    // Meta
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
    doc.line(20, 45, 190, 45);

    // Body
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(finalDocument, 170);
    doc.text(lines, 20, 60);

    doc.save(`SignBridge_Translation_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Sign-to-Document"
        context="Upload a video of yourself signing, and our AI will transcribe and generate a beautifully formatted PDF document."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Upload Area */}
          <div className="card overflow-hidden">
            <div className="p-6">
              <h3 className="font-display text-lg font-semibold text-ink">1. Upload Video</h3>
              <p className="mt-1 text-sm text-muted">Select an MP4 or WebM video file.</p>

              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-canvas p-8 hover:bg-line/50 transition">
                <Upload className="mb-3 h-8 w-8 text-muted" />
                <span className="font-medium text-ink">Click to upload video</span>
                <span className="mt-1 text-xs text-muted">MP4, WebM (Max 50MB)</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {videoUrl && (
                <div className="mt-4 rounded-xl overflow-hidden bg-black aspect-video relative">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls={status === 'idle' || status === 'complete'}
                    className="w-full h-full object-contain"
                    onEnded={handleVideoEnd}
                  />
                  {status === 'analyzing' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin mb-4" />
                      <p className="font-medium">Analyzing Signs... {progress}%</p>
                    </div>
                  )}
                </div>
              )}

              {videoFile && status === 'idle' && (
                <button onClick={processVideo} className="btn-primary mt-4 w-full min-h-12">
                  Extract Signs & Generate Document
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex flex-col gap-6">
          <div className="card flex-1 p-6 flex flex-col">
            <h3 className="font-display text-lg font-semibold text-ink">2. Document Output</h3>
            <p className="mt-1 text-sm text-muted mb-4">Your grammar-corrected translation.</p>

            {status === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center text-muted border-2 border-dashed border-line rounded-xl bg-canvas p-8">
                <FileText className="mb-3 h-12 w-12 opacity-20" />
                <p>Upload and process a video to see results.</p>
              </div>
            )}

            {status === 'analyzing' && (
              <div className="flex-1 rounded-xl bg-canvas p-4 font-mono text-sm text-muted break-words overflow-y-auto">
                {rawTranscript.length > 0 ? rawTranscript.join(' ') + ' ...' : 'Detecting signs...'}
              </div>
            )}

            {status === 'correcting' && (
              <div className="flex-1 flex flex-col items-center justify-center text-ink border border-line rounded-xl bg-canvas p-8">
                <RefreshCcw className="mb-4 h-8 w-8 animate-spin text-signal" />
                <p className="font-medium">Applying AI Grammar Correction...</p>
                <p className="mt-2 text-xs text-muted text-center max-w-xs">
                  Converting literal sign translation into natural spoken English using Google
                  Gemini.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center text-beacon bg-beacon/10 border border-beacon/20 rounded-xl p-8 text-center">
                <p className="font-bold">Processing Failed</p>
                <p className="mt-2 text-sm">{errorMsg}</p>
              </div>
            )}

            {status === 'complete' && finalDocument && (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 rounded-xl border border-line bg-surface p-6 shadow-sm mb-4">
                  <div className="prose prose-sm text-ink max-w-none">{finalDocument}</div>
                </div>

                <button
                  onClick={generatePDF}
                  className="btn-primary min-h-12 w-full flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
