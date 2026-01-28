// src/features/admin/pages/AdminShopListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, Search, Plus, Filter, 
  Trash2, Edit, Eye, CheckSquare, Square, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { getRestaurants } from '../../shop/api/shopService';
import type { Restaurant } from '../../shop/types';

export const AdminShopListPage = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const data = await getRestaurants();
        if (Array.isArray(data)) setShops(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Filter Logic
  const filteredData = shops.filter(shop => 
    (shop.restaurant_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Bulk Selection Logic
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(paginatedData.map(r => r.restaurant_id)));
    }
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleDelete = (id: number) => {
      if(confirm(`⚠️ CONFIRM DELETION\n\nAre you sure you want to delete shop ID: ${id}?\nThis action cannot be undone.`)) {
          // Call API delete here
          alert('Deleted (Mock)');
      }
  };

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Shop Management</h1>
          <p className="text-slate-400 text-sm">Manage all registered restaurants</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                <Plus className="w-4 h-4" /> Add New Shop
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
                type="text" 
                placeholder="Search by name, ID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
        </div>
        <div className="flex gap-2">
            <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-700">
                <Filter className="w-4 h-4" /> Filter
            </button>
            {selectedIds.size > 0 && (
                <button className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in">
                    <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                </button>
            )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
                <th className="p-4 w-12 text-center">
                    <button onClick={handleSelectAll} className="hover:text-white">
                        {selectedIds.size === paginatedData.length && paginatedData.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                </th>
              <th className="p-4 font-bold">ID</th>
              <th className="p-4 font-bold">Shop Info</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold">Rating</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {paginatedData.map((shop) => (
              <tr key={shop.restaurant_id} className={`group hover:bg-slate-800/50 transition-colors ${selectedIds.has(shop.restaurant_id) ? 'bg-blue-900/10' : ''}`}>
                <td className="p-4 text-center">
                    <button onClick={() => handleSelectRow(shop.restaurant_id)} className={`text-slate-600 hover:text-white ${selectedIds.has(shop.restaurant_id) ? 'text-blue-400' : ''}`}>
                        {selectedIds.has(shop.restaurant_id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                </td>
                <td className="p-4 text-slate-500 font-mono text-xs">#{shop.restaurant_id}</td>
                <td className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                            <img src={shop.image_url || "https://placehold.co/100"} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{shop.restaurant_name}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{shop.address}</p>
                        </div>
                    </div>
                </td>
                <td className="p-4">
                    <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300">
                        {(shop as any).category || 'General'}
                    </span>
                </td>
                <td className="p-4 text-amber-500 font-bold text-sm">
                    ⭐ {(shop as any).rating || '0.0'}
                </td>
                <td className="p-4 text-right space-x-2">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/shops/${shop.restaurant_id}`)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="View">
                            <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(`/admin/shops/${shop.restaurant_id}`)} className="p-2 hover:bg-blue-900/30 rounded-lg text-slate-400 hover:text-blue-400" title="Edit">
                            <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(shop.restaurant_id)} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950">
            <span className="text-xs text-slate-500">Showing {paginatedData.length} of {filteredData.length} entries</span>
            <div className="flex gap-1">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-3 py-1 text-sm text-slate-300 font-mono">Page {currentPage}</span>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};