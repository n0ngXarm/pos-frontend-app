import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../../stores/useCartStore';

export const FloatingCart = () => {
  const navigate = useNavigate();
  const totalItems = useCartStore(state => state.getTotalItems());

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-300 hover:bg-indigo-700 transition-all hover:scale-110 z-50 flex items-center justify-center animate-bounce-in"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-indigo-600">
          {totalItems}
        </span>
      </div>
    </button>
  );
};