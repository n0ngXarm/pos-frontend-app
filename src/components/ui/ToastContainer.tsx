import { useToastStore } from '../../stores/useToastStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300 animate-slide-in hover:scale-105 cursor-pointer shadow-lg ${
            toast.type === 'success' ? 'bg-white/95 border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-white/95 border-red-200 text-red-800' :
            toast.type === 'warning' ? 'bg-white/95 border-amber-200 text-amber-800' :
            'bg-white/95 border-blue-200 text-blue-800'
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <div className={`p-2 rounded-full shrink-0 ${
             toast.type === 'success' ? 'bg-green-100' :
             toast.type === 'error' ? 'bg-red-100' :
             toast.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          </div>
          
          <div className="flex-1 min-w-[200px]">
             <p className="font-bold text-sm">{toast.type === 'success' ? 'สำเร็จ' : toast.type === 'error' ? 'เกิดข้อผิดพลาด' : 'แจ้งเตือน'}</p>
             <p className="text-xs opacity-90 font-medium">{toast.message}</p>
          </div>
          
          <button onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>
      ))}
    </div>
  );
};