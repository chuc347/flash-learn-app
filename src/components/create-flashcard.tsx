import { useState } from 'react';
import { ArrowLeft, Check, Plus, Loader2 } from 'lucide-react'; // Thêm icon Loader2
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { addCustomFlashcard } from '../utils/storage';
import { addFlashcardToCloud } from '../data/vocabulary';

export default function CreateFlashcard() {
  const navigate = useNavigate();
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 1. Thêm state để theo dõi trạng thái đang gọi API
  const [isTranslating, setIsTranslating] = useState(false);

  // 2. Hàm gọi API dịch thuật (Bất đồng bộ - async/await)
  const translateWord = async () => {
    // Nếu ô tiếng Anh trống, hoặc ô tiếng Việt ĐÃ CÓ CHỮ (người dùng tự gõ) thì không dịch nữa
    if (!english.trim() || vietnamese.trim()) return;

    setIsTranslating(true); // Bật trạng thái loading
    
    try {
      // Gọi lên API MyMemory (Dịch từ Tiếng Anh 'en' sang Tiếng Việt 'vi')
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(english.trim())}&langpair=en|vi`
      );
      
      const data = await response.json();
      
      // Kiểm tra xem API có trả về kết quả hợp lệ không
      if (data && data.responseData && data.responseData.translatedText) {
        setVietnamese(data.responseData.translatedText.toLowerCase()); // Điền kết quả vào ô Tiếng Việt
      }
    } catch (error) {
      console.error("Lỗi khi gọi API dịch:", error);
      // Nếu lỗi (mất mạng, API sập...), ta âm thầm bỏ qua để người dùng tự gõ
    } finally {
      setIsTranslating(false); // Tắt trạng thái loading dù thành công hay thất bại
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!english.trim() || !vietnamese.trim()) return;

    try {
      setIsTranslating(true); // Tận dụng loading state có sẵn để chặn bấm nhiều lần

      // GỌI SUPABASE Ở ĐÂY
      await addFlashcardToCloud(english.trim(), vietnamese.trim());

      // Nếu thành công, hiện hiệu ứng Success
      setShowSuccess(true);
      
      // Reset form sau 1 giây
      setTimeout(() => {
        setEnglish('');
        setVietnamese('');
        setShowSuccess(false);
      }, 1000);

    } catch (error) {
      alert("Lỗi khi lưu vào Cloud: " + error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <button className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </Link>
          <h1 className="text-xl text-gray-800">Create Flashcard</h1>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* English Input */}
            <div className="bg-white rounded-2xl p-6 shadow-sm relative">
              <label className="block text-sm text-gray-500 mb-3">English Word</label>
              <input
                type="text"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                onBlur={translateWord} // 3. Gắn sự kiện: Khi rời khỏi ô nhập này thì gọi hàm dịch
                placeholder="e.g., hello"
                className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300 pr-10" // Thêm pr-10 để tránh chữ đè lên icon loading
                autoFocus
              />
              {/* Hiển thị icon xoay xoay khi đang dịch */}
              {isTranslating && (
                 <div className="absolute right-6 top-1/2 translate-y-2">
                   <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                 </div>
              )}
            </div>

            {/* Vietnamese Input */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <label className="block text-sm text-gray-500 mb-3">Vietnamese Translation</label>
              <input
                type="text"
                value={vietnamese}
                onChange={(e) => setVietnamese(e.target.value)}
                placeholder="e.g., xin chào"
                className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300"
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!english.trim() || !vietnamese.trim() || isTranslating} // Vô hiệu hóa nút khi đang dịch
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-5 shadow-lg shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2">
                {showSuccess ? (
                  <>
                    <Check className="w-6 h-6" />
                    <span className="text-lg">Added!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    <span className="text-lg">Add Flashcard</span>
                  </>
                )}
              </div>
            </motion.button>
          </form>

          {/* ... Phần Tips và Nút Done anh giữ nguyên ... */}
          {/* Tips */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-5">
            <h3 className="text-sm text-blue-800 mb-2">💡 Tips for better learning</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Keep translations simple and clear</li>
              <li>• Focus on commonly used words first</li>
              <li>• Practice regularly for best results</li>
            </ul>
          </div>

          {/* Done Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white text-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95"
            >
              Done & Go Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}