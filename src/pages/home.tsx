import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomCardsCount, getCategoriesWithCount } from '../data/vocabulary';
import { BookOpen, Plus, Shuffle, Trophy, Search, LogOut, XCircle, Settings2, Play } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function Home() {
  const navigate = useNavigate();
  const [customCount, setCustomCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // State quản lý Modal Đăng xuất
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // --- STATE MỚI: QUẢN LÝ MODAL SETUP LUYỆN TẬP ---
  const [showPracticeSetup, setShowPracticeSetup] = useState(false);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLimit, setSelectedLimit] = useState<number>(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const count = await getCustomCardsCount();
        setCustomCount(count);
        
        // Tải danh sách bộ từ vựng để chuẩn bị cho Modal Setup
        const cats = await getCategoriesWithCount();
        setCategories(cats);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const executeLogout = async () => {
    await supabase.auth.signOut();
  };

  // Hàm xử lý khi người dùng bấm "Bắt đầu học" trong Modal Setup
  const handleStartPractice = () => {
    // Navigate sang trang Learning và truyền kèm DỮ LIỆU CÀI ĐẶT (State)
    navigate('/learn/custom', { 
      state: { 
        category: selectedCategory, 
        limit: selectedLimit === -1 ? 9999 : selectedLimit // -1 nghĩa là học tất cả
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 relative">
      <div className="max-w-md mx-auto pt-12 pb-20">
        {/* Header */}
        <div className="relative mb-12">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="absolute right-0 top-0 p-3 bg-white text-gray-400 rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 hover:shadow-md transition-all active:scale-90 z-10"
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl mb-2 text-gray-800 font-bold">FlashLearn</h1>
            <p className="text-gray-500">Master English with ease</p>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Flashcards</p>
              <div className="text-2xl text-gray-800 font-bold h-8 flex items-center">
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div> : customCount}
              </div>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-blue-500" />
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-4 relative min-h-[300px]">
          {isLoading ? (
            <div className="absolute inset-0 flex justify-center items-center">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Link to="/learn/random">
                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-300 active:scale-95">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-lg mb-1 font-medium">Start Learning</h3>
                        <p className="text-sm text-blue-100">Random vocabulary set</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Shuffle className="w-6 h-6" />
                      </div>
                    </div>
                  </button>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Link to="/create">
                  <button className="w-full bg-white text-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-lg mb-1 font-medium">Create Flashcard</h3>
                        <p className="text-sm text-gray-500">Add your own words</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </button>
                </Link>
              </motion.div>

              {customCount > 0 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  {/* Thay Link bằng onClick mở Modal Setup */}
                  <button 
                    onClick={() => setShowPracticeSetup(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg shadow-purple-200 hover:shadow-xl transition-all duration-300 active:scale-95"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-lg mb-1 font-medium">Practice Your Cards</h3>
                        <p className="text-sm text-purple-100">{customCount} custom flashcards</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Settings2 className="w-6 h-6" />
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Link to="/manage">
                  <button className="w-full bg-white text-gray-700 rounded-2xl p-6 shadow-sm border-2 border-dashed border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 active:scale-95">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-lg mb-1 font-medium">Manage Cards</h3>
                        <p className="text-sm text-gray-500">Review and delete your words</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-500" />
                      </div>
                    </div>
                  </button>
                </Link>
              </motion.div>
            </>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
          <p className="text-sm text-gray-400">💡 Practice daily for best results</p>
        </motion.div>
      </div>

      {/* --- MODAL HỎI ĐĂNG XUẤT (Giữ nguyên) --- */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center"><LogOut size={32} /></div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Đăng xuất?</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 active:scale-95">Hủy</button>
                <button onClick={executeLogout} className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 shadow-lg shadow-red-200 active:scale-95">Đăng xuất</button>
              </div>n
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL THIẾT LẬP BÀI HỌC (PRACTICE SETUP) XỊN XÒ --- */}
      <AnimatePresence>
        {showPracticeSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Tùy chỉnh Bài học</h2>
                <button onClick={() => setShowPracticeSetup(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <XCircle size={24} />
                </button>
              </div>

              {/* Tùy chọn 1: Chọn Bộ từ vựng */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-600 mb-3">1. Chọn Bộ từ vựng</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 font-medium"
                >
                  <option value="all">🌍 Trộn tất cả các bộ (Tổng hợp)</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat.name}>📁 Bộ "{cat.name}" ({cat.count} từ)</option>
                  ))}
                </select>
              </div>

              {/* Tùy chọn 2: Chọn Số lượng */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-600 mb-3">2. Số lượng thẻ muốn học</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, -1].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedLimit(num)}
                      className={`py-3 rounded-xl font-medium border-2 transition-all active:scale-95 ${
                        selectedLimit === num 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {num === -1 ? 'Tất cả' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút Bắt đầu */}
              <button
                onClick={handleStartPractice}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-200 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Bắt đầu ngay <Play size={20} className="fill-current" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}