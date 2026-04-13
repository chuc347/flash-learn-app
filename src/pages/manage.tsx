import { useState, useEffect, useMemo } from 'react';
import { Trash2, ArrowLeft, AlertCircle, Search, Loader2, FolderOpen, ChevronDown, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCustomCardsFromCloud, 
  deleteCustomCardFromCloud, 
  deleteCategoryFromCloud, 
  upsertCategoryMetadata, 
  getAllCategoryMetadata,
  uploadCategoryAvatarToCloud,
  Flashcard 
} from '../data/vocabulary';

import AvatarModal from '../components/AvatarModal';

export default function ManageCards() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryAvatars, setCategoryAvatars] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<{english: string, category: string} | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null); 
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingAvatarCategory, setEditingAvatarCategory] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cardsData, avatarsData] = await Promise.all([
        getCustomCardsFromCloud(),
        getAllCategoryMetadata()
      ]);
      setCards(cardsData);
      setCategoryAvatars(avatarsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSelectSystemAvatar = async (emoji: string) => {
    if (!editingAvatarCategory) return;
    setIsSavingAvatar(true);
    try {
      await upsertCategoryMetadata(editingAvatarCategory, emoji);
      setCategoryAvatars(prev => ({ ...prev, [editingAvatarCategory]: emoji }));
      setEditingAvatarCategory(null); 
    } catch (error: any) {
      alert("Lỗi khi lưu ảnh: " + error.message);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // 👉 HÀM MỚI: Xử lý file ảnh tự upload (Blob) từ Modal
  const handleUploadCustomAvatar = async (blob: Blob) => {
    if (!editingAvatarCategory) return;
    setIsSavingAvatar(true);
    
    try {
      // 1. Đẩy lên Storage lấy URL
      const publicUrl = await uploadCategoryAvatarToCloud(blob, editingAvatarCategory);
      
      // 2. Lưu URL vào Database
      await upsertCategoryMetadata(editingAvatarCategory, publicUrl);
      
      // 3. Cập nhật giao diện
      setCategoryAvatars(prev => ({ ...prev, [editingAvatarCategory]: publicUrl }));
      setEditingAvatarCategory(null); // Đóng modal
    } catch (error: any) {
      alert("Lỗi khi tải ảnh lên: " + error.message);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const requestDelete = (englishWord: string, categoryName: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const skipExpiry = localStorage.getItem('skipDeleteConfirmExpiry');
    if (skipExpiry && parseInt(skipExpiry) > Date.now()) executeDelete(englishWord, categoryName);
    else {
      setCardToDelete({ english: englishWord, category: categoryName });
      setCategoryToDelete(null); 
      setIsModalOpen(true);
    }
  };

  const executeDelete = async (englishWord: string, categoryName: string) => {
    setIsDeleting(true);
    try {
      await deleteCustomCardFromCloud(englishWord, categoryName);
      setCards(prev => prev.filter(card => !(card.english === englishWord && card.category === categoryName)));
      closeModal();
    } catch (error) { console.error(error); } finally { setIsDeleting(false); }
  };

  const requestCategoryDelete = (categoryName: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setCategoryToDelete(categoryName);
    setCardToDelete(null); 
    setIsModalOpen(true);
  };

  const executeCategoryDelete = async (categoryName: string) => {
    setIsDeleting(true);
    try {
      await deleteCategoryFromCloud(categoryName);
      setCards(prev => prev.filter(card => card.category !== categoryName));
      closeModal();
    } catch (error) { console.error(error); } finally { setIsDeleting(false); }
  };

  const confirmDelete = () => {
    if (dontAskAgain && cardToDelete) localStorage.setItem('skipDeleteConfirmExpiry', (Date.now() + 86400000).toString());
    if (cardToDelete) executeDelete(cardToDelete.english, cardToDelete.category);
    else if (categoryToDelete) executeCategoryDelete(categoryToDelete);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCardToDelete(null);
    setCategoryToDelete(null);
    setDontAskAgain(false); 
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(prev => prev === categoryName ? null : categoryName);
  };

  // 👉 ĐÃ TỐI ƯU VỚI useMemo
  const filteredCards = useMemo(() => {
    return cards.filter(card => 
      card.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
      card.vietnamese.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cards, searchTerm]);

  const groupedCards = useMemo(() => {
    return filteredCards.reduce((acc, card) => {
      const cat = card.category || 'Chung';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(card);
      return acc;
    }, {} as Record<string, Flashcard[]>);
  }, [filteredCards]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <div className="max-w-md mx-auto pb-20">
        <header className="flex items-center justify-between mb-8">
          <Link to="/" className="p-2 hover:bg-white rounded-full transition-colors bg-white shadow-sm"><ArrowLeft /></Link>
          <h1 className="text-xl font-bold text-gray-800">Manage Cards</h1>
          <div className="w-10"></div>
        </header>

        <div className="mb-8 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm từ vựng..." className="w-full pl-11 pr-4 py-4 bg-white border-transparent rounded-2xl shadow-sm text-gray-800 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" />
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedCards).map(([categoryName, categoryCards]) => {
              const isExpanded = expandedCategory === categoryName;
              const avatar = categoryAvatars[categoryName]; 

              return (
                <div key={categoryName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div onClick={() => toggleCategory(categoryName)} className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors select-none group/row">
                    <div className="flex items-center gap-4">
                      {/* 👉 Đã bỏ overflow-hidden khỏi thẻ div này */}
                      <div 
                        onClick={(e) => { e.stopPropagation(); setEditingAvatarCategory(categoryName); }}
                        className={`relative w-14 h-14 flex items-center justify-center rounded-2xl cursor-pointer transition-transform hover:scale-105 shadow-sm ${
                          isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {/* 👉 CẬP NHẬT UI: Thêm rounded-2xl thẳng vào thẻ img */}
                        {avatar ? (
                          avatar.startsWith('http') ? (
                            <img src={avatar} alt={categoryName} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <span className="text-3xl">{avatar}</span>
                          )
                        ) : (
                          <FolderOpen size={24} />
                        )}
                        {/* 👉 Dấu cộng được làm to ra, dời vị trí và thêm z-10 */}
                        <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white rounded-full p-1.5 border-2 border-white shadow-sm opacity-0 group-hover/row:opacity-100 transition-opacity z-10">
                          <Plus size={12} strokeWidth={4} />
                        </div>
                      </div>

                      <div>
                        <h3 className={`font-bold text-lg ${isExpanded ? 'text-indigo-700' : 'text-gray-800'}`}>{categoryName}</h3>
                        <p className="text-sm text-gray-500 font-medium">{categoryCards.length} từ vựng</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => requestCategoryDelete(categoryName, e)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"><Trash2 size={20} /></button>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-gray-400"><ChevronDown size={20} /></motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-gray-50/50 border-t border-gray-100">
                        <div className="p-4 space-y-3">
                          {categoryCards.map((card, index) => (
                            <motion.div key={`${card.english}-${index}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-indigo-100 transition-colors">
                              <div>
                                <p className="font-bold text-blue-600 text-lg">{card.english}</p>
                                <p className="text-gray-500 text-sm">{card.vietnamese}</p>
                              </div>
                              <button onClick={(e) => requestDelete(card.english, categoryName, e)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"><Trash2 size={20} /></button>
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

      {/* 👉 ĐÃ BỔ SUNG PROPS TRUYỀN HÀM XỬ LÝ UPLOAD XUỐNG MODAL */}
      <AvatarModal 
        isOpen={!!editingAvatarCategory} 
        categoryName={editingAvatarCategory} 
        isSaving={isSavingAvatar}
        onClose={() => setEditingAvatarCategory(null)}
        onSelectSystemAvatar={handleSelectSystemAvatar}
        onUploadCustomAvatar={handleUploadCustomAvatar}
      />

      {/* MODAL XÓA */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className={`flex items-center gap-3 mb-2 ${categoryToDelete === 'Chung' ? 'text-orange-500' : 'text-red-500'}`}><AlertCircle size={28} /><h2 className="text-xl font-bold text-gray-800">{categoryToDelete ? (categoryToDelete === 'Chung' ? 'Làm trống bộ mặc định?' : 'Xóa toàn bộ thư mục?') : 'Xóa thẻ này?'}</h2></div>
              <p className="text-gray-600 mb-6 mt-2">{categoryToDelete ? (categoryToDelete === 'Chung' ? <>Đây là bộ mặc định của hệ thống. Hành động này sẽ <span className="font-bold text-orange-500">làm trống toàn bộ từ vựng</span> bên trong.</> : <>Bạn có chắc chắn muốn xóa toàn bộ từ vựng trong thư mục <span className="font-bold text-red-500">"{categoryToDelete}"</span> không? Hành động này không thể hoàn tác.</>) : <>Bạn có chắc chắn muốn xóa từ <span className="font-bold text-red-500">"{cardToDelete?.english}"</span> khỏi bộ "{cardToDelete?.category}" không? Hành động này không thể hoàn tác.</>}</p>
              {!categoryToDelete && (
                <label className="flex items-center gap-3 mb-6 cursor-pointer group"><div className="relative flex items-center"><input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500 cursor-pointer" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} /></div><span className="text-sm text-gray-600">Không hỏi lại trong 1 ngày</span></label>
              )}
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">Hủy</button>
                <button onClick={confirmDelete} className={`flex-1 py-3 text-white rounded-xl font-medium ${isDeleting ? 'bg-gray-400' : (categoryToDelete === 'Chung' ? 'bg-orange-500' : 'bg-red-500')}`}>{isDeleting ? 'Đang xử lý...' : (categoryToDelete === 'Chung' ? 'Làm trống' : 'Xóa luôn')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}