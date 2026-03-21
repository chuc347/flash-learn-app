import { useState, useEffect } from 'react';
import { Trash2, ArrowLeft, AlertCircle, Search, Loader2, FolderOpen, ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
// 1. Nhớ import thêm hàm deleteCustomCardFromCloud mà mình vừa tạo ở Bước 1 nhé
import { getCustomCardsFromCloud, deleteCustomCardFromCloud, Flashcard } from '../data/vocabulary';

export default function ManageCards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // --- CÁC STATE CHO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Cập nhật state để lưu được cả tên từ tiếng Anh và tên thư mục cần xóa
  const [cardToDelete, setCardToDelete] = useState<{english: string, category: string} | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATE TÌM KIẾM VÀ THƯ MỤC ---
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const loadCards = async () => {
    try {
      const data = await getCustomCardsFromCloud();
      setCards(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCards(); }, []);

  // --- LOGIC XÓA THẺ ---
  const requestDelete = (englishWord: string, categoryName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn click lan ra ngoài
    const skipExpiry = localStorage.getItem('skipDeleteConfirmExpiry');
    
    if (skipExpiry && parseInt(skipExpiry) > Date.now()) {
      executeDelete(englishWord, categoryName);
    } else {
      setCardToDelete({ english: englishWord, category: categoryName });
      setIsModalOpen(true);
    }
  };

  const executeDelete = async (englishWord: string, categoryName: string) => {
    setIsDeleting(true);
    try {
      await deleteCustomCardFromCloud(englishWord, categoryName);
      
      // Xóa thẻ khỏi danh sách hiện tại
      setCards(prev => prev.filter(card => !(card.english === englishWord && card.category === categoryName)));
      
      setIsModalOpen(false);
      setCardToDelete(null);
    } catch (error: any) {
      alert('Không thể xóa thẻ: ' + (error.message || "Lỗi không xác định")); 
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (dontAskAgain) {
      localStorage.setItem('skipDeleteConfirmExpiry', (Date.now() + 86400000).toString());
    }
    if (cardToDelete) {
      executeDelete(cardToDelete.english, cardToDelete.category);
    }
  };

  // --- LOGIC GOM NHÓM & TÌM KIẾM ---
  const filteredCards = cards.filter(card => 
    card.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
    card.vietnamese.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedCards = filteredCards.reduce((acc, card) => {
    const cat = card.category || 'Chung';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(card);
    return acc;
  }, {} as Record<string, Flashcard[]>);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(prev => prev === categoryName ? null : categoryName);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <div className="max-w-md mx-auto pb-20">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="p-2 hover:bg-white rounded-full transition-colors bg-white shadow-sm">
            <ArrowLeft />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Manage Cards</h1>
          <div className="w-10"></div>
        </header>

        {/* Thanh tìm kiếm */}
        <div className="mb-8 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ vựng..."
            className="w-full pl-11 pr-4 py-4 bg-white border-transparent rounded-2xl shadow-sm text-gray-800 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
          />
        </div>

        {/* Nội dung chính */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin rounded-full h-8 w-8 text-blue-500" />
          </div>
        ) : Object.keys(groupedCards).length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {searchTerm ? 'Không tìm thấy từ nào phù hợp.' : 'Bạn chưa có thẻ nào. Hãy đi tạo mới nhé!'}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedCards).map(([categoryName, categoryCards]) => {
              const isExpanded = expandedCategory === categoryName;

              return (
                <div key={categoryName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  
                  {/* Thanh Tiêu đề Thư Mục */}
                  <div 
                    onClick={() => toggleCategory(categoryName)}
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isExpanded ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                        <FolderOpen size={20} />
                      </div>
                      <div>
                        <h3 className={`font-bold ${isExpanded ? 'text-purple-700' : 'text-gray-700'}`}>
                          {categoryName}
                        </h3>
                        <p className="text-xs text-gray-500">{categoryCards.length} từ vựng</p>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-gray-400">
                      <ChevronDown size={20} />
                    </motion.div>
                  </div>

                  {/* Danh sách thẻ bên trong */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50/50 border-t border-gray-100"
                      >
                        <div className="p-4 space-y-3">
                          {categoryCards.map((card, index) => (
                            <motion.div
                              key={`${card.english}-${index}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-purple-200 transition-colors"
                            >
                              <div>
                                <p className="font-bold text-blue-600 text-lg">{card.english}</p>
                                <p className="text-gray-500 text-sm">{card.vietnamese}</p>
                              </div>
                              <button 
                                onClick={(e) => requestDelete(card.english, categoryName, e)}
                                className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                              >
                                <Trash2 size={20} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL HỎI XÓA (Giữ nguyên của em) --- */}
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
                Bạn có chắc chắn muốn xóa từ <span className="font-bold text-red-500">"{cardToDelete?.english}"</span> khỏi bộ "{cardToDelete?.category}" không? Hành động này không thể hoàn tác.
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