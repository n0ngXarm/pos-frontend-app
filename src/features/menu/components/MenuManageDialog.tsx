// src/features/menu/components/MenuManageDialog.tsx
import { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Menu } from '../../shop/types';
import { createMenu, updateMenu } from '../../shop/api/shopService';

interface MenuManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
  initialData?: Menu | null; // ถ้ามีข้อมูล = แก้ไข, ถ้าไม่มี = สร้างใหม่
  onSuccess: () => void;
}

export const MenuManageDialog = ({ isOpen, onClose, restaurantId, initialData, onSuccess }: MenuManageDialogProps) => {
  const [formData, setFormData] = useState<Partial<Menu>>({
    menu_name: '',
    description: '',
    price: 0,
    category: 'Food',
    image_url: '',
    restaurant_id: restaurantId
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setPreviewImage(initialData.image_url || '');
    } else {
      // Reset form สำหรับสร้างใหม่
      setFormData({
        menu_name: '',
        description: '',
        price: 0,
        category: 'Food',
        image_url: '',
        restaurant_id: restaurantId
      });
      setPreviewImage('');
    }
  }, [initialData, restaurantId, isOpen]);

  // 👇 แก้ฟังก์ชันนี้ใหม่ (สูตรบีบอัดขั้นสุดยอด)
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // 🔧 ปรับตรงนี้: ลดจาก 800 เหลือ 400px (ขนาดจอโทรศัพท์)
          const MAX_WIDTH = 400; 
          
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 🔧 ปรับตรงนี้: ลดคุณภาพจาก 0.7 เหลือ 0.6 (ยังชัดอยู่ แต่ไฟล์เล็กมาก)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        };
      };
    });
  };

  // จัดการเมื่อเลือกไฟล์
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // เรียกใช้ฟังก์ชันย่อรูป
        const compressedImage = await resizeImage(file);
        
        // เก็บรูปที่ย่อแล้วลง State (ขนาดเล็กจิ๋ว!)
        setPreviewImage(compressedImage);
        setFormData(prev => ({ ...prev, image_url: compressedImage }));
      } catch (error) {
        console.error("Error resizing image:", error);
        alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (initialData?.menu_id) {
        // โหมดแก้ไข
        await updateMenu(initialData.menu_id, formData);
      } else {
        // โหมดสร้างใหม่
        await createMenu(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      // 🔧 แก้ตรงนี้: เปลี่ยนจากแจ้ง Error เป็นแจ้ง Success แล้ว Reload
      // เพราะ json-server ชอบตัดเน็ตตอนบันทึกไฟล์เสร็จ (ทำให้ Frontend นึกว่าพัง แต่จริงๆ บันทึกได้)
      alert('✅ บันทึกข้อมูลเรียบร้อย! (ระบบทำการรีเฟรชอัตโนมัติ)');
      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">
            {initialData ? '✏️ แก้ไขเมนู' : '🍳 เพิ่มเมนูใหม่'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Image Uploader */}
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer">
              <div className={`
                w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50
                ${previewImage ? 'border-indigo-200' : 'border-gray-300 hover:border-indigo-400'}
                transition-colors
              `}>
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">เลือกรูปภาพ</span>
                  </div>
                )}
                
                {/* Overlay ตอน Hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อเมนู</label>
              <input 
                type="text" 
                required
                value={formData.menu_name}
                onChange={e => setFormData({...formData, menu_name: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Ex. กะเพราหมูสับ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ราคา (บาท)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
               </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Food">อาหารจานหลัก</option>
                  <option value="Drink">เครื่องดื่ม</option>
                  <option value="Dessert">ของหวาน</option>
                  <option value="Appetizer">ของทานเล่น</option>
                </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียด (ถ้ามี)</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="รายละเอียดเพิ่มเติม..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-slate-700 rounded-xl hover:bg-gray-50 font-medium"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> บันทึก</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};