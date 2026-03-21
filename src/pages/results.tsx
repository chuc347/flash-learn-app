import { useLocation, useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, XCircle, Home, CheckCircle2 } from 'lucide-react';
// Import Flashcard type để TypeScript không báo lỗi
import { Flashcard } from '../data/vocabulary';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hứng dữ liệu từ trang Learning truyền sang
  const { score, total, incorrectCards, allCards } = location.state as {
    score: { correct: number; incorrect: number };
    total: number;
    incorrectCards: Flashcard[];
    allCards: Flashcard[];
  } || {
    score: { correct: 0, incorrect: 0 },
    total: 0,
    incorrectCards: [],
    allCards: []
  };

  const percentage = total > 0 ? Math.round((score.correct / total) * 100) : 0;

  // 1. Hàm Ôn tập lại NHỮNG TỪ ĐÃ LÀM SAI
  const handleReviewIncorrect = () => {
    navigate('/learn/custom', { state: { reviewCards: incorrectCards } });
  };

  // 2. Hàm Ôn tập lại TOÀN BỘ BÀI VỪA HỌC
  const handleReviewAll = () => {
    navigate('/learn/custom', { state: { reviewCards: allCards } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl shadow-purple-200/50 text-center mb-6"
        >
          {/* Biểu tượng theo điểm số */}
          <div className="flex justify-center mb-6">
            {percentage === 100 ? (
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            ) : percentage >= 50 ? (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200">
                <XCircle className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {percentage === 100 ? "Tuyệt đối!" : percentage >= 50 ? "Làm tốt lắm!" : "Cần cố gắng hơn"}
          </h1>
          <p className="text-gray-500 mb-8">Bạn đã hoàn thành bài học hôm nay.</p>

          {/* Bảng điểm chi tiết */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <p className="text-sm text-green-600 font-semibold mb-1">Đúng</p>
              <p className="text-3xl font-bold text-green-500">{score.correct}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-sm text-red-600 font-semibold mb-1">Sai</p>
              <p className="text-3xl font-bold text-red-500">{score.incorrect}</p>
            </div>
          </div>
          
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full ${percentage === 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-purple-500' : 'bg-orange-500'}`}
            />
          </div>
          <p className="text-sm text-gray-400 font-medium text-right mb-2">{percentage}% Chính xác</p>
        </motion.div>

        {/* CÁC NÚT ĐIỀU HƯỚNG ÔN TẬP */}
        <div className="space-y-3">
          {incorrectCards.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleReviewIncorrect}
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-2xl p-4 font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <XCircle size={20} />
              Ôn lại {incorrectCards.length} từ sai
            </motion.button>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleReviewAll}
            className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl p-4 font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <RotateCcw size={20} />
            Luyện lại toàn bộ ({total} từ)
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Link to="/">
              <button className="w-full bg-white hover:bg-gray-50 text-gray-600 rounded-2xl p-4 font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm border border-gray-100">
                <Home size={20} />
                Về trang chủ
              </button>
            </Link>
          </motion.div>
        </div>

      </div>
    </div>
  );
}