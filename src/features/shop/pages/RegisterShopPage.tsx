import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Image as ImageIcon, Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { createRestaurant } from '../api/shopService';
import { useAuthStore } from '../../../stores/use-auth-store';

export const RegisterShopPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    restaurant_name: '',
    address: '',
    phone: '',
    image_url: '',
    category: 'อาหารตามสั่ง'
  });

  const categories = ["อาหารตามสั่ง", "ก๋วยเตี๋ยว", "เครื่องดื่ม", "ของหวาน", "Fast Food", "Bakery"];

  // ✅ ฟังก์ชันย่อรูปและแปลงเป็น Base64
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // กำหนดความกว้างสูงสุด
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // คืนค่าเป็น Base64 (JPEG 80%)
        };
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      setFormData({...formData, image_url: resized});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      await createRestaurant({
        ...formData,
        owner_id: Number(user.id),
        rating: 0
      });
      
      // สร้างเสร็จแล้ว ให้ Redirect ไปที่ My Shop (ซึ่งจะพาไปหน้า Manage เอง)
      navigate('/my-shop');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการสร้างร้านค้า');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-10 px-4">
        <button onClick={() => navigate(-1)} className="mb-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden relative">
            <div className="h-32 bg-gradient-to-r from-blue-900 to-blue-800 relative">
                <div className="absolute -bottom-10 left-8 p-4 bg-white rounded-2xl shadow-lg">
                    <Store className="w-10 h-10 text-blue-900" />
                </div>
            </div>
            
            <div className="pt-16 px-8 pb-8">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">ลงทะเบียนร้านค้า</h1>
                <p className="text-gray-500 mb-8">กรอกข้อมูลเพื่อเปิดร้านค้าของคุณบนแพลตฟอร์ม</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">ชื่อร้านอาหาร</label>
                        <input 
                            required
                            type="text" 
                            value={formData.restaurant_name}
                            onChange={e => setFormData({...formData, restaurant_name: e.target.value})}
                            className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                            placeholder="เช่น ครัวคุณต๋อย"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">หมวดหมู่</label>
                            <select 
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all appearance-none"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">เบอร์โทรศัพท์</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    required
                                    type="tel" 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                                    placeholder="08x-xxx-xxxx"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">ที่อยู่ร้าน</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                            <textarea 
                                required
                                rows={3}
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all resize-none"
                                placeholder="ที่อยู่ร้านค้า..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">รูปภาพร้าน</label>
                        
                        {/* 🖼️ แสดงตัวอย่างรูปภาพ */}
                        {formData.image_url && (
                            <div className="mb-4 relative group">
                                <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-xl shadow-sm border border-gray-100" />
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, image_url: ''})}
                                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm hover:bg-red-500 hover:text-white text-gray-600 rounded-full shadow-sm transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={formData.image_url.startsWith('data:') ? 'รูปภาพที่อัปโหลด...' : formData.image_url}
                                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                                    placeholder="วางลิงก์รูปภาพ (https://...)"
                                    disabled={formData.image_url.startsWith('data:')}
                                />
                            </div>
                            <label className="flex items-center justify-center px-5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl cursor-pointer transition-colors border border-blue-100 font-bold text-sm whitespace-nowrap">
                                <Upload className="w-5 h-5 mr-2" />
                                อัปโหลด
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 ml-1">รองรับ URL หรืออัปโหลดไฟล์จากเครื่อง (JPG, PNG)</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold text-lg hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'สร้างร้านค้า'}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};