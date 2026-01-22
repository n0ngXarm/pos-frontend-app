// src/features/admin/pages/AdminMenuManagePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { 
  getRestaurantById, 
  getMenusByRestaurantId,
  createMenu,
  updateMenu,
  deleteMenu
} from '../../shop/api/shopService';
import type { Restaurant, Menu } from '../../shop/types';
import { MenuManageDialog } from '../../menu/components/MenuManageDialog';

export const AdminMenuManagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

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

  // เปิด Modal เพื่อ "เพิ่มใหม่"
  const handleAddNew = () => {
    setEditingMenu(null);
    setIsModalOpen(true);
  };

  // เปิด Modal เพื่อ "แก้ไข"
  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setIsModalOpen(true);
  };

  // ลบเมนู (Real API)
  const handleDelete = async (menuId: number) => {
    if (!confirm('ยืนยันการลบเมนูนี้? (ลบแล้วกู้คืนไม่ได้)')) return;

    try {
      await deleteMenu(menuId); // ยิง API ลบ
      setMenus(prev => prev.filter(m => m.menu_id !== menuId)); // ลบในหน้าจอ
      alert("ลบเรียบร้อย!");
    } catch (error) {
      console.error(error);
      alert("ลบไม่สำเร็จ (Backend อาจขัดข้อง)");
    }
  };

  // บันทึกข้อมูลจาก Modal (Real API)
  const handleSave = async (formData: Partial<Menu>) => {
    if (!id) return;

    try {
      // ตรวจสอบว่ารูปภาพใหญ่เกินไปไหม (Base64 ยาวมากบางที Database รับไม่ไหว)
      if (formData.image_url && formData.image_url.length > 2000000) {
        alert("รูปภาพมีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กลง");
        return;
      }

      if (editingMenu) {
        // กรณีแก้ไข (Update)
        const updated = await updateMenu(editingMenu.menu_id, formData);
        setMenus(prev => prev.map(m => m.menu_id === editingMenu.menu_id ? updated : m));
        alert("✅ บันทึกการแก้ไขแล้ว");
      } else {
        // กรณีสร้างใหม่ (Create)
        const payload = {
          ...formData,
          restaurant_id: Number(id), // แนบ ID ร้านไปด้วย
          price: Number(formData.price) // แปลงให้ชัวร์ว่าเป็นตัวเลข
        };
        const created = await createMenu(payload);
        setMenus(prev => [...prev, created]);
        alert("✅ เพิ่มเมนูใหม่เรียบร้อย");
      }
      setIsModalOpen(false); // ปิด Dialog
    } catch (error) {
      console.error("Save Error:", error);
      alert("บันทึกไม่สำเร็จ! ลองเช็ค Console ดู Error");
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
            <h1 className="text-2xl font-bold text-slate-900">จัดการเมนูอาหาร</h1>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">รูปภาพ</th>
              <th className="p-4 font-semibold text-slate-700">ชื่อเมนู</th>
              <th className="p-4 font-semibold text-slate-700">ราคา</th>
              <th className="p-4 font-semibold text-slate-700 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {menus.map((menu) => (
              <tr key={menu.menu_id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 w-24">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                    <img src={menu.image_url || "https://placehold.co/100"} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="p-4 font-medium text-slate-900">
                    <div>{menu.menu_name}</div>
                    <div className="text-xs text-slate-400 font-normal line-clamp-1">{menu.description}</div>
                </td>
                <td className="p-4 text-slate-600 font-bold">{Number(menu.price).toLocaleString()} ฿</td>
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
            {menus.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีเมนูในร้านนี้</td></tr>}
          </tbody>
        </table>
      </div>

      {/* เรียกใช้ Dialog ตัวเดิมที่เราทำไว้ (คุ้มมาก!) */}
      <MenuManageDialog 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={editingMenu}
      />
    </div>
  );
};