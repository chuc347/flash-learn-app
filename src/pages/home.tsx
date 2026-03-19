// Thêm { useState, useEffect } vào dòng import đầu tiên
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Shuffle, Trophy } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { getCustomFlashcards } from '../utils/storage';
import { getCustomCardsCount, getFlashcardsFromCloud } from '../data/vocabulary';

export default function Home() {
  // 1. Khai báo State để lưu trữ con số (mặc định là 0)
  const [customCount, setCustomCount] = useState(0);

  // 2. Dùng useEffect để lấy dữ liệu ĐÚNG 1 LẦN khi trang Home vừa mở
  // File: src/pages/home.tsx
// Nhớ import thêm getFlashcardsFromCloud từ ../data/vocabulary nhé

  useEffect(() => {
  const fetchCount = async () => {
    // Gọi hàm đếm riêng cho thẻ custom
    const count = await getCustomCardsCount();
    setCustomCount(count);
  };

  fetchCount();
}, []); // Cặp ngoặc vuông [] ở cuối rất quan trọng: Nó bảo React "Chỉ chạy hàm này 1 lần duy nhất lúc mới load thôi nhé!"
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
              <p className="text-2xl text-gray-800">{customCount}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-blue-500" />
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
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
            transition={{ delay: 0.3 }}
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
              transition={{ delay: 0.4 }}
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
