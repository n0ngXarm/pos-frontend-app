// src/features/admin/pages/AdminMenuManagePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, X, Save, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { 
  getRestaurantById, 
  getMenusByRestaurantId,
  createMenu,
  updateMenu,
  deleteMenu
} from '../../shop/api/shopService';
import type { Restaurant, Menu } from '../../shop/types';

export const AdminMenuManagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State (จัดการเองในนี้เลย เพื่อแก้ปัญหาพิมพ์ราคาไม่ได้)
  const [formData, setFormData] = useState({
    menu_name: '',
    description: '',
    price: '', // ✅ ใช้ String เพื่อให้พิมพ์ง่าย (ลบจนว่างได้)
    image_url: '',
    category: 'อาหารจานเดียว'
  });

  const categories = ["อาหารจานเดียว", "กับข้าว", "เครื่องดื่ม", "ของหวาน", "ทานเล่น"];

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [shopData, menusData] = await Promise.all([
          getRestaurantById(id),
          getMenusByRestaurantId(id)
        ]);
        setShop(shopData);
        setMenus(menusData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ฟังก์ชันย่อรูป (เหมือนหน้า RegisterShop)
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file);
      setFormData(prev => ({ ...prev, image_url: resized }));
    }
  };

  // เปิด Modal เพื่อ "เพิ่มใหม่"
  const handleAddNew = () => {
    setEditingMenu(null);
    setFormData({
        menu_name: '',
        description: '',
        price: '',
        image_url: '',
        category: 'อาหารจานเดียว'
    });
    setIsModalOpen(true);
  };

  // เปิด Modal เพื่อ "แก้ไข"
  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
        menu_name: menu.menu_name,
        description: menu.description || '',
        price: String(menu.price), // ✅ แปลงเป็น String ตอนโหลดเข้าฟอร์ม
        image_url: menu.image_url || '',
        category: menu.category || 'อาหารจานเดียว'
    });
    setIsModalOpen(true);
  };

  // ลบเมนู (Real API)
  const handleDelete = async (menuId: number) => {
    if (!confirm('ยืนยันการลบเมนูนี้? (ลบแล้วกู้คืนไม่ได้)')) return;

    try {
      await deleteMenu(menuId); // ยิง API ลบ
      setMenus(prev => prev.filter(m => m.menu_id !== menuId)); // ลบในหน้าจอ
    } catch (error) {
      console.error(error);
      alert("ลบไม่สำเร็จ (Backend อาจขัดข้อง)");
    }
  };

  // บันทึกข้อมูล
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        restaurant_id: Number(id),
        price: Number(formData.price) || 0 // ✅ แปลงกลับเป็น Number ตอนส่ง
      };

      if (editingMenu) {
        const updated = await updateMenu(editingMenu.menu_id, payload);
        setMenus(prev => prev.map(m => m.menu_id === editingMenu.menu_id ? updated : m));
      } else {
        const created = await createMenu(payload);
        setMenus(prev => [...prev, created]);
      }
      setIsModalOpen(false); // ปิด Dialog
    } catch (error) {
      console.error("Save Error:", error);
      alert("บันทึกไม่สำเร็จ! ลองเช็ค Console ดู Error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/shops')} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">จัดการเมนูอาหาร</h1>
            <p className="text-slate-500">ร้าน: {shop?.restaurant_name}</p>
          </div>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> เพิ่มเมนูใหม่
        </button>
      </div>

      {/* Table View */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">รูปภาพ</th>
              <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">ชื่อเมนู</th>
              <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">หมวดหมู่</th>
              <th className="p-4 font-semibold text-slate-700 dark:text-slate-300">ราคา</th>
              <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {menus.map((menu) => (
              <tr key={menu.menu_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-4 w-24">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                    <img src={menu.image_url || "https://placehold.co/100"} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-900 dark:text-white">
                    <div className="text-lg">{menu.menu_name}</div>
                    <div className="text-xs text-slate-400 font-normal line-clamp-1">{menu.description}</div>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-400">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs dark:text-slate-300">{menu.category || 'ทั่วไป'}</span>
                </td>
                <td className="p-4 text-slate-900 dark:text-white font-bold text-lg">{Number(menu.price).toLocaleString()} ฿</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(menu)} className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(menu.menu_id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {menus.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400">ยังไม่มีเมนูในร้านนี้</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal Form (Inline) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{editingMenu ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form id="menu-form" onSubmit={handleSave} className="space-y-4">
                        {/* Image Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl bg-gray-100 dark:bg-slate-700 border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-transform hover:scale-110">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">ชื่อเมนู</label>
                            <input 
                                required
                                type="text" 
                                value={formData.menu_name}
                                onChange={e => setFormData({...formData, menu_name: e.target.value})}
                                className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="เช่น ข้าวกะเพราไก่ไข่ดาว"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">ราคา (บาท)</label>
                                <input 
                                    required
                                    type="number" 
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">หมวดหมู่</label>
                                <select 
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">รายละเอียด</label>
                            <textarea 
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full p-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="ส่วนประกอบ, รสชาติ..."
                            />
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        type="submit"
                        form="menu-form"
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> บันทึก</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};