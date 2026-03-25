// File: src/pages/results.tsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, XCircle, Home, CheckCircle2, Save, CheckSquare, Square, Loader2, Check } from 'lucide-react';
import { Flashcard, addMultipleFlashcardsToCloud } from '../data/vocabulary';

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
  
  useEffect(() => {
    try {
      // Nếu em muốn 100% điểm sẽ có âm thanh xịn hơn thì có thể dùng điều kiện if
      // Ở đây anh dùng chung 1 file finish.mp3
      const audio = new Audio('/finish.mp3');
      audio.volume = 0.6;
      audio.play();
    } catch (error) {
      console.log("Lỗi phát âm thanh:", error);
    }
  }, []);

  // --- SPRINT 3: STATE CHO TÍNH NĂNG LƯU TỪ SAI ---
  // Mặc định tick chọn tất cả các từ trong mảng incorrectCards
  const [selectedToSave, setSelectedToSave] = useState<string[]>(
    incorrectCards.map(card => card.english)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Hàm xử lý khi người dùng tick/bỏ tick 1 từ
  const toggleSelect = (english: string) => {
    setSelectedToSave(prev => 
      prev.includes(english) 
        ? prev.filter(w => w !== english) // Đã có -> bỏ ra
        : [...prev, english]              // Chưa có -> thêm vào
    );
  };

  // Hàm gọi API lưu từ vào Custom DB
  const handleSaveToCustom = async () => {
    if (selectedToSave.length === 0) return;
    setIsSaving(true);
    try {
      // 1. Lọc ra danh sách thẻ hoàn chỉnh dựa trên những từ đã tick
      const cardsToSave = incorrectCards
        .filter(card => selectedToSave.includes(card.english))
        .map(card => ({ english: card.english, vietnamese: card.vietnamese }));

      // 2. Gọi API tái sử dụng từ vocabulary.ts, gắn category là "Từ vựng cần ôn"
      await addMultipleFlashcardsToCloud(cardsToSave, "Từ vựng cần ôn");
      
      setSaveSuccess(true);
    } catch (error: any) {
      alert("Lỗi khi lưu từ: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOGIC CŨ GIỮ NGUYÊN ---
  const handleReviewIncorrect = () => {
    navigate('/learn/custom', { state: { reviewCards: incorrectCards } });
  };

  const handleReviewAll = () => {
    navigate('/learn/custom', { state: { reviewCards: allCards } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex flex-col items-center py-12">
      <div className="max-w-md w-full">
        
        {/* --- PHẦN 1: THẺ TỔNG KẾT ĐIỂM SỐ (Giữ nguyên) --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl shadow-purple-200/50 text-center mb-6"
        >
          {/* Biểu tượng theo điểm số */}
          <div className="flex justify-center mb-6">
            {percentage === 100 ? (
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200"><Trophy className="w-12 h-12 text-white" /></div>
            ) : percentage >= 50 ? (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-200"><CheckCircle2 className="w-12 h-12 text-white" /></div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-200"><XCircle className="w-12 h-12 text-white" /></div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {percentage === 100 ? "Tuyệt đối!" : percentage >= 50 ? "Làm tốt lắm!" : "Cần cố gắng hơn"}
          </h1>
          <p className="text-gray-500 mb-8">Bạn đã hoàn thành bài học hôm nay.</p>

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
            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, delay: 0.5 }} className={`h-full ${percentage === 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-purple-500' : 'bg-orange-500'}`} />
          </div>
          <p className="text-sm text-gray-400 font-medium text-right mb-2">{percentage}% Chính xác</p>
        </motion.div>

        {/* --- PHẦN 2 (MỚI): DANH SÁCH TỪ LÀM SAI VÀ LƯU VÀO CUSTOM --- */}
        <AnimatePresence>
          {incorrectCards.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 shadow-xl shadow-red-100/50 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <XCircle className="text-red-500" size={20} /> Cần ôn lại
                </h3>
                <span className="text-sm text-gray-500">{selectedToSave.length}/{incorrectCards.length} được chọn</span>
              </div>
              
              {/* Danh sách cuộn được (Scrollable List) */}
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {incorrectCards.map((card, idx) => (
                  <div key={idx} onClick={() => toggleSelect(card.english)} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors border border-gray-100">
                    <div className="flex items-center gap-3">
                      <button className={`${selectedToSave.includes(card.english) ? 'text-purple-500' : 'text-gray-300'}`}>
                        {selectedToSave.includes(card.english) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                      <div>
                        <p className="font-bold text-gray-800">{card.english}</p>
                        <p className="text-sm text-gray-500">{card.vietnamese}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút Gọi API Lưu */}
              <button
                onClick={handleSaveToCustom}
                disabled={selectedToSave.length === 0 || isSaving || saveSuccess}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  saveSuccess ? 'bg-green-100 text-green-700' : 
                  selectedToSave.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                  'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg active:scale-95'
                }`}
              >
                {isSaving ? (
                  <><Loader2 size={20} className="animate-spin" /> Đang lưu...</>
                ) : saveSuccess ? (
                  <><Check size={20} /> Đã lưu vào "Từ vựng cần ôn"</>
                ) : (
                  <><Save size={20} /> Lưu các từ đã chọn</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PHẦN 3: CÁC NÚT ĐIỀU HƯỚNG ÔN TẬP (Giữ nguyên) --- */}
        <div className="space-y-3">
          {incorrectCards.length > 0 && (
            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onClick={handleReviewIncorrect} className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-2xl p-4 font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
              <XCircle size={20} /> Ôn lại {incorrectCards.length} từ sai ngay
            </motion.button>
          )}

          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onClick={handleReviewAll} className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl p-4 font-bold flex items-center justify-center gap-2 transition-colors active:scale-95">
            <RotateCcw size={20} /> Luyện lại toàn bộ ({total} từ)
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Link to="/">
              <button className="w-full bg-white hover:bg-gray-50 text-gray-600 rounded-2xl p-4 font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm border border-gray-100">
                <Home size={20} /> Về trang chủ
              </button>
            </Link>
          </motion.div>
        </div>

      </div>
    </div>
  );
}