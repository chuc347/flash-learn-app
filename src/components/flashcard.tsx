// File: src/components/flashcard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react'; // <-- THÊM ICON LOA
import { FlashcardProps } from '../types';

export default function Flashcard({ word, translation, isFlipped, showFront, phonetic }: FlashcardProps) {
  
  // 1. Logic tìm ra từ Tiếng Anh (dù thẻ đang ở mặt nào)
  const englishText = showFront ? word : translation;

  // 2. Hàm phát âm sử dụng Web Speech API của trình duyệt
  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation(); // QUAN TRỌNG: Ngăn không cho click truyền ra ngoài làm lật thẻ

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Tắt âm thanh cũ nếu đang đọc dở
      const utterance = new SpeechSynthesisUtterance(englishText);
      utterance.lang = 'en-US'; // Set giọng đọc Tiếng Anh Mỹ
      utterance.rate = 0.9; // Tốc độ đọc: 0.9 (hơi chậm lại 1 xíu để dễ nghe)
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm.');
    }
  };

  return (
    <div className="relative w-full h-72 perspective">
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* --- MẶT TRƯỚC CỦA THẺ --- */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Thêm relative vào đây để làm mốc cho nút loa */}
          <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl shadow-2xl flex items-center justify-center p-8">
            
            {/* NÚT LOA Ở GÓC TRÊN PHẢI */}
            <button 
              onClick={playAudio} 
              className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white z-10"
              title="Nghe phát âm"
            >
              <Volume2 size={24} />
            </button>

            <div className="text-center">
              <p className="text-sm text-white/70 mb-4 font-medium uppercase tracking-wider">
                {showFront ? 'English' : 'Vietnamese'}
              </p>
              <p className="text-4xl text-white font-bold break-words drop-shadow-sm">
                {word}
              </p>
            </div>
          </div>
        </div>

        {/* --- MẶT SAU CỦA THẺ --- */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Thêm relative vào đây để làm mốc cho nút loa */}
          <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8">
            
            {/* NÚT LOA Ở GÓC TRÊN PHẢI */}
            <button 
              onClick={playAudio} 
              className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white z-10"
              title="Nghe phát âm"
            >
              <Volume2 size={24} />
            </button>

            <div className="text-center">
              <p className="text-sm text-white/70 mb-2 font-medium uppercase tracking-wider">Answer</p>
              <p className="text-xl text-green-100/90 mb-2 font-medium drop-shadow-sm">
                {word}
              </p>
              <p className="text-4xl text-white font-bold break-words drop-shadow-sm">
                {translation}
              </p>
              {phonetic && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 text-xl text-green-100 font-mono italic tracking-wide"
                >
                  {phonetic}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}