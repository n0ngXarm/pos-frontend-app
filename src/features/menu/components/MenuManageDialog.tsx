// src/features/menu/components/MenuManageDialog.tsx
import { useEffect, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Upload, Image as ImageIcon } from 'lucide-react';
import type { Menu } from '../../shop/types';

interface MenuManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Menu>) => void;
  initialData?: Menu | null;
}

export const MenuManageDialog = ({ isOpen, onClose, onSubmit, initialData }: MenuManageDialogProps) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Menu>>();

  // ดูค่าปัจจุบันในฟอร์ม (เพื่อโชว์ Preview)
  const currentImage = watch('image_url');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({ menu_name: '', price: 0, description: '', image_url: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  // ฟังก์ชันแปลงไฟล์เป็น Base64
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setValue('image_url', base64String); // ยัดใส่ฟอร์มเตรียมส่ง Backend
      };
      reader.readAsDataURL(file); // เริ่มแปลงร่าง
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {initialData ? '✏️ แก้ไขเมนู' : '✨ เพิ่มเมนูใหม่'}
          </h2>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6">
          <form id="menu-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* 📸 ส่วนอัปโหลดรูปภาพ (ไฮไลท์ของเรา) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">รูปภาพเมนู</label>
              
              <div className="flex flex-col items-center gap-4">
                {/* กล่อง Preview */}
                <div className="w-full h-48 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                  {currentImage ? (
                    <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">ยังไม่มีรูปภาพ</p>
                    </div>
                  )}
                  
                  {/* ปุ่มเลือกไฟล์ซ่อนอยู่ข้างหลัง แต่คลิกได้ทั่วกล่อง */}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white font-medium">
                    <Upload className="w-5 h-5 mr-2" />
                    เปลี่ยนรูปภาพ
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </label>
                </div>

                {/* ช่องกรอก URL สำรอง (เผื่ออยากก๊อปวางเหมือนเดิม) */}
                <div className="w-full relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-xs">URL</span>
                  <input 
                    {...register('image_url')}
                    placeholder="หรือวางลิงก์รูปภาพที่นี่..."
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลอื่นๆ */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อเมนู</label>
                <input 
                  {...register('menu_name', { required: true })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="เช่น สปาเก็ตตี้ขี้เมาทะเล"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท)</label>
                <input 
                  type="number"
                  {...register('price', { required: true, min: 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">คำอธิบาย</label>
                <textarea 
                  {...register('description')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="รายละเอียดความอร่อย..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-slate-700 hover:bg-white font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit"
            form="menu-form" // สั่งให้ปุ่มนี้นอกฟอร์ม ไปกด Submit ฟอร์มข้างบน
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            บันทึก
          </button>
        </div>

      </div>
    </div>
  );
};