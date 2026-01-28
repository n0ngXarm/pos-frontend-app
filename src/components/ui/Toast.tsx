import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast = ({ message, type = 'success', isVisible, onClose }: ToastProps) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const startTime = Date.now();
      const duration = 3000;

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
          onClose();
        }
      }, 10);

      return () => clearInterval(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`
      fixed top-6 right-6 z-[9999] overflow-hidden
      flex items-start gap-3 p-4 min-w-[300px] max-w-sm
      rounded-xl shadow-lg backdrop-blur-xl border
      animate-slide-up
      ${isSuccess 
        ? 'bg-white/95 border-green-100 dark:bg-slate-800 dark:border-green-900' 
        : 'bg-white/95 border-red-100 dark:bg-slate-800 dark:border-red-900'}
    `}>
      {/* Icon Wrapper with Glow */}
      <div className={`
        relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full
        ${isSuccess 
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}
      `}>
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      </div>

      <div className="flex-1 pt-0.5">
        <h4 className={`font-bold text-sm ${isSuccess ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-white'}`}>
          {isSuccess ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
          {message}
        </p>
      </div>

      <button 
        onClick={onClose} 
        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Premium Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-slate-100 dark:bg-white/5 w-full">
        <div 
          style={{ width: `${progress}%` }} 
          className={`h-full transition-all duration-75 ease-linear ${isSuccess ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
        />
      </div>
    </div>
  );
};