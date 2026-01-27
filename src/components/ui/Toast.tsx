import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast = ({ message, type = 'success', isVisible, onClose }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // ปิดอัตโนมัติใน 3 วินาที
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-all duration-300 ${
      type === 'success' 
        ? 'bg-white border-green-100 text-green-800' 
        : 'bg-white border-red-100 text-red-800'
    }`}>
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      )}
      <p className="font-medium text-sm">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
        <X className="w-4 h-4 opacity-50" />
      </button>
    </div>
  );
};