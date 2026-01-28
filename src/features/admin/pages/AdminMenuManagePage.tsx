// src/features/admin/pages/AdminMenuManagePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, X, Save, Image as ImageIcon, Upload, Loader2, AlertCircle } from 'lucide-react';
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
          <button onClick={() => navigate('/admin/shops')} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Menu Management</h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {shop?.restaurant_name}
            </p>
          </div>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-900/20 font-bold text-sm transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      {/* Table View */}
      <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="p-4 font-bold text-slate-400 text-xs uppercase">Image</th>
              <th className="p-4 font-bold text-slate-400 text-xs uppercase">Menu Name</th>
              <th className="p-4 font-bold text-slate-400 text-xs uppercase">Category</th>
              <th className="p-4 font-bold text-slate-400 text-xs uppercase">Price</th>
              <th className="p-4 font-bold text-slate-400 text-xs uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {menus.map((menu) => (
              <tr key={menu.menu_id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="p-4 w-24">
                  <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                    <img src={menu.image_url || "https://placehold.co/100"} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="p-4">
                    <div className="text-base font-bold text-slate-200">{menu.menu_name}</div>
                    <div className="text-xs text-slate-500 font-normal line-clamp-1 mt-0.5">{menu.description}</div>
                </td>
                <td className="p-4">
                    <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-300 font-medium">
                        {menu.category || 'General'}
                    </span>
                </td>
                <td className="p-4 text-emerald-400 font-mono font-bold text-base">฿{Number(menu.price).toLocaleString()}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(menu)} className="text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 p-2 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(menu.menu_id)} className="text-slate-400 hover:text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {menus.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-800 m-4 rounded-xl">
                        <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="w-8 h-8 opacity-50" />
                            <span>No menu items found. Start by adding one.</span>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form (Admin Grade) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-2xl">
                    <h3 className="font-black text-xl text-white tracking-tight">{editingMenu ? 'Edit Menu Item' : 'New Menu Item'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="menu-form" onSubmit={handleSave} className="space-y-5">
                        {/* Image Upload */}
                        <div className="flex justify-center mb-6">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden group-hover:border-slate-500 transition-colors">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-slate-500">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                            <span className="text-xs">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-500 shadow-lg transition-transform hover:scale-110">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Menu Name <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="text" 
                                value={formData.menu_name}
                                onChange={e => setFormData({...formData, menu_name: e.target.value})}
                                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-white placeholder:text-slate-600 transition-all"
                                placeholder="e.g. Pad Thai"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Price (THB) <span className="text-red-500">*</span></label>
                                <input 
                                    required
                                    type="number" 
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: e.target.value})}
                                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-white font-mono text-lg placeholder:text-slate-600 transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Category</label>
                                <select 
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-white transition-all appearance-none"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Description</label>
                            <textarea 
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-white resize-none placeholder:text-slate-600 transition-all"
                                placeholder="Ingredients, taste, etc."
                            />
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2.5 text-slate-400 font-bold hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        form="menu-form"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};