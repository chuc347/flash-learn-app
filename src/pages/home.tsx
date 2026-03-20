import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { getCustomFlashcards } from '../utils/storage';
import { getCustomCardsCount, getFlashcardsFromCloud } from '../data/vocabulary';
import { BookOpen, Plus, Shuffle, Trophy, Search } from 'lucide-react';

export default function Home() {
  // 1. Khai báo State
  const [customCount, setCustomCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Dùng useEffect để lấy dữ liệu
  useEffect(() => {
    const fetchCount = async () => {
      // Gọi hàm đếm riêng cho thẻ custom
      const count = await getCustomCardsCount();
      setCustomCount(count);
      // Khi đã có kết quả (dù là 0 hay 100), tắt trạng thái Loading
      setIsLoading(false);
    };

    fetchCount();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-md mx-auto pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl mb-2 text-gray-800">FlashLearn</h1>
          <p className="text-gray-500">Master English with ease</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-8 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Flashcards</p>
              <div className="text-2xl text-gray-800 font-semibold h-8 flex items-center">
                 {/* Nếu đang tải thì hiện vòng xoay nhỏ, tải xong thì hiện con số */}
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                ) : (
                  customCount
                )}
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
             // Khi đang tải: Hiển thị một vòng xoay lớn ở giữa khu vực nút bấm
            <div className="absolute inset-0 flex justify-center items-center">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            // Khi tải xong: Render toàn bộ các nút bấm. Lúc này hiệu ứng Motion mới được kích hoạt đồng loạt.
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link to="/learn/random">
                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-300 active:scale-95">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-lg mb-1">Start Learning</h3>
                        <p className="text-sm text-blue-100">Random vocabulary set</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Shuffle className="w-6 h-6" />
                      </div>
                    </div>
                  </button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link to="/create">
                  <button className="w-full bg-white text-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h3 className="text-lg mb-1">Create Flashcard</h3>
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
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link to="/learn/custom">
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg shadow-purple-200 hover:shadow-xl transition-all duration-300 active:scale-95">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <h3 className="text-lg mb-1">Practice Your Cards</h3>
                          <p className="text-sm text-purple-100">{customCount} custom flashcards</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      </div>
                    </button>
                  </Link>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
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

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-400">💡 Practice daily for best results</p>
        </motion.div>
      </div>
    </div>
  );
}