import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Check, Loader2, Upload, FlipHorizontal, FileImage } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { createWorker } from 'tesseract.js';

interface CameraCaptureProps {
  onTextExtracted: (text: string) => void;
  onClose: () => void;
}

export function CameraCapture({ onTextExtracted, onClose }: CameraCaptureProps) {
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [mode, setMode] = useState<'choice' | 'camera' | 'upload'>('choice');

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(language === 'sw' 
        ? 'Haikuweza kufikia kamera. Tafadhali ruhusu ufikiaji wa kamera.'
        : 'Could not access camera. Please allow camera access.'
      );
    }
  }, [facingMode, language]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode]);

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setError(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartCamera = () => {
    setMode('camera');
  };

  const handleUploadMode = () => {
    setMode('upload');
    fileInputRef.current?.click();
  };

  const goBackToChoice = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    setMode('choice');
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProcessingProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(capturedImage);
      await worker.terminate();

      const cleanedText = text.trim();
      
      if (cleanedText.length < 3) {
        setError(language === 'sw'
          ? 'Haikuweza kusoma maandishi. Tafadhali jaribu tena na picha wazi zaidi.'
          : 'Could not read text. Please try again with a clearer image.'
        );
        setIsProcessing(false);
        return;
      }

      onTextExtracted(cleanedText);
    } catch (err) {
      console.error('OCR error:', err);
      setError(language === 'sw'
        ? 'Hitilafu ilitokea. Tafadhali jaribu tena.'
        : 'An error occurred. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            {mode !== 'choice' && (
              <Button variant="ghost" size="icon" onClick={goBackToChoice}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <h3 className="font-bold text-foreground text-lg">
              {mode === 'choice' 
                ? (language === 'sw' ? 'Chagua Njia' : 'Choose Method')
                : (language === 'sw' ? 'Piga Picha ya Kazi' : 'Scan Homework')}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mode Selection */}
        {mode === 'choice' && !capturedImage && (
          <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
            <div className="w-full max-w-sm space-y-4">
              <p className="text-center text-muted-foreground mb-6">
                {language === 'sw' 
                  ? 'Chagua jinsi unavyotaka kupakia kazi yako'
                  : 'Choose how you want to upload your homework'}
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartCamera}
                className="w-full p-6 bg-card rounded-2xl border-2 border-border hover:border-primary transition-colors flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {language === 'sw' ? 'Piga Picha' : 'Take Photo'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sw' ? 'Tumia kamera kupiga picha' : 'Use camera to capture'}
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUploadMode}
                className="w-full p-6 bg-card rounded-2xl border-2 border-border hover:border-primary transition-colors flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {language === 'sw' ? 'Pakia Picha' : 'Upload Photo'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sw' ? 'Chagua picha kutoka kifaa chako' : 'Select from your device'}
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUploadMode}
                className="w-full p-6 bg-card rounded-2xl border-2 border-border hover:border-primary transition-colors flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center">
                  <FileImage className="w-7 h-7 text-secondary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    {language === 'sw' ? 'Pakia Hati' : 'Upload Document'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sw' ? 'PDF, picha au hati nyingine' : 'PDF, images or other files'}
                  </p>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {/* Camera/Image View */}
        {(mode !== 'choice' || capturedImage) && (
          <div className="flex-1 relative bg-black overflow-hidden">
            <AnimatePresence mode="wait">
              {!capturedImage ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center"
                >
                  {error ? (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-destructive" />
                      </div>
                      <p className="text-white mb-4">{error}</p>
                      <div className="flex gap-3 justify-center">
                        <Button variant="bubble" onClick={startCamera}>
                          {language === 'sw' ? 'Jaribu Tena' : 'Try Again'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleUploadClick}
                          className="text-white border-white/30"
                        >
                          {language === 'sw' ? 'Pakia Picha' : 'Upload Image'}
                        </Button>
                      </div>
                    </div>
                  ) : mode === 'camera' ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-white mb-4">
                        {language === 'sw' ? 'Chagua faili...' : 'Selecting file...'}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex items-center justify-center"
                >
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan overlay guide */}
            {!capturedImage && !error && stream && mode === 'camera' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white/40 rounded-2xl">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                </div>
                <div className="absolute bottom-20 left-0 right-0 text-center">
                  <p className="text-white/80 text-sm bg-black/40 mx-auto inline-block px-4 py-2 rounded-full">
                    {language === 'sw' 
                      ? 'Weka swali ndani ya sura' 
                      : 'Position the question within the frame'}
                  </p>
                </div>
              </div>
            )}

            {/* Processing overlay */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center"
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-white font-medium mb-2">
                  {language === 'sw' ? 'Inasoma maandishi...' : 'Reading text...'}
                </p>
                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-white/60 text-sm mt-2">{processingProgress}%</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Controls */}
        {(mode !== 'choice' || capturedImage) && (
          <div className="p-4 bg-card border-t border-border">
            {error && capturedImage && (
              <p className="text-destructive text-center text-sm mb-3">{error}</p>
            )}
            
            {!capturedImage ? (
              <div className="flex items-center justify-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUploadClick}
                  className="w-12 h-12"
                >
                  <Upload className="w-6 h-6" />
                </Button>
                
                {mode === 'camera' && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={capturePhoto}
                      disabled={!stream || !!error}
                      className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-full border-4 border-white" />
                    </motion.button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={switchCamera}
                      className="w-12 h-12"
                    >
                      <FlipHorizontal className="w-6 h-6" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={retake}
                  disabled={isProcessing}
                  className="flex-1 max-w-32"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {language === 'sw' ? 'Rudia' : 'Retake'}
                </Button>
                
                <Button
                  variant="action"
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex-1 max-w-40"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {language === 'sw' ? 'Soma Maandishi' : 'Extract Text'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </motion.div>
  );
}
