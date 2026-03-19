import { useState, useEffect } from 'react';
import { Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomCardsFromCloud, deleteFlashcardFromCloud, Flashcard } from '../data/vocabulary';

export default function ManageCards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // --- CÁC STATE CHO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  
  // STATE MỚI: Hiển thị trạng thái đang xoay xoay tải dữ liệu
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCards = async () => {
    const data = await getCustomCardsFromCloud();
    setCards(data);
    setLoading(false);
  };

  useEffect(() => { loadCards(); }, []);

  const requestDelete = (id: string) => {
    const skipExpiry = localStorage.getItem('skipDeleteConfirmExpiry');
    if (skipExpiry && parseInt(skipExpiry) > Date.now()) {
      executeDelete(id);
    } else {
      setCardToDelete(id);
      setIsModalOpen(true);
    }
  };

  const executeDelete = async (id: string) => {
    setIsDeleting(true); // Bật trạng thái "Đang xóa..."
    try {
      console.log("Đang tiến hành xóa thẻ ID:", id); // In ra console để theo dõi
      await deleteFlashcardFromCloud(id);
      console.log("Xóa thành công trên Supabase!");
      
      setCards(cards.filter(card => card.id !== id));
      setIsModalOpen(false);
      setCardToDelete(null);
    } catch (error: any) {
      console.error("Chi tiết lỗi xóa thẻ:", error);
      alert('Không thể xóa thẻ: ' + (error.message || "Lỗi không xác định")); 
    } finally {
      setIsDeleting(false); // Tắt trạng thái "Đang xóa..."
    }
  };

  const confirmDelete = () => {
    if (dontAskAgain) {
      localStorage.setItem('skipDeleteConfirmExpiry', (Date.now() + 86400000).toString());
    }
    if (cardToDelete) {
      executeDelete(cardToDelete);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <div className="max-w-md mx-auto pb-20">
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="p-2 hover:bg-white rounded-full transition-colors bg-white shadow-sm">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Manage Cards</h1>
          <div className="w-10"></div>
        </header>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-blue-600 text-lg">{card.english}</p>
                    <p className="text-gray-500 text-sm">{card.vietnamese}</p>
                  </div>
                  <button 
                    onClick={() => requestDelete(card.id)}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-2 text-red-500">
                <AlertCircle size={28} />
                <h2 className="text-xl font-bold text-gray-800">Xóa thẻ này?</h2>
              </div>
              <p className="text-gray-600 mb-6 mt-2">
                Bạn có chắc chắn muốn xóa thẻ từ vựng này không? Hành động này không thể hoàn tác.
              </p>

              <label className="flex items-center gap-3 mb-6 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500 cursor-pointer"
                    checked={dontAskAgain}
                    onChange={(e) => setDontAskAgain(e.target.checked)}
                  />
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  Không hỏi lại trong 1 ngày
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Hủy
                </button>
                {/* NÚT XÓA ĐÃ ĐƯỢC NÂNG CẤP */}
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors shadow-lg ${
                    isDeleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                  }`}
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa luôn'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}