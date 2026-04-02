import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { getRandomFlashcards, Flashcard, getCustomCardsFromCloud, getFlashcardsFromCloud } from '../data/vocabulary';
import FlashcardComponent from '../components/flashcard';

// --- HÀM GỌI AI CHẤM ĐIỂM (Phiên bản Thần tốc: Groq + Llama 3.1) ---
const checkAnswerWithAI = async (englishWord: string, userAnswer: string): Promise<boolean> => {
  // Đọc Key của Groq từ file .env
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  
  if (!apiKey) {
    console.warn("Chưa có API Key Groq, bỏ qua bước check AI.");
    return false;
  }

  // Khai báo câu hỏi
  const prompt = `Eng:"${englishWord}". Vie:"${userAnswer}". Is this acceptable?`;

  try {
    // 🚀 GỌI API CỦA GROQ
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // 🌟 Nâng cấp lên mã Llama 3.1 Instant mới nhất của Groq
        model: "llama-3.1-8b-instant", 
        messages: [
          {
            role: "system",
            content: "You are a lenient language teacher. Accept synonyms, related meanings, or minor part-of-speech differences. Reply ONLY TRUE or FALSE."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0,
        max_tokens: 5 
      })
    });
    
    // Logic phòng thủ
    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("❌ Lỗi từ máy chủ Groq:", errorDetails);
      return false; 
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim().toUpperCase();
    
    return aiResponse.includes('TRUE'); 
    
  } catch (error) {
    console.error("❌ Lỗi kết nối mạng hoặc code:", error);
    return false; 
  }
};
// -------------------------------------------------------------

export default function Learning() {
  const { mode } = useParams<{ mode: 'random' | 'custom' }>();
  const navigate = useNavigate();
  
  // 1. Khai báo Hook useLocation BÊN TRONG component
  const location = useLocation(); 
  
  // 2. Lấy cờ isChallengeMode từ Routing State một cách an toàn
  const isChallengeMode = (location.state as any)?.isChallengeMode || false;
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [showEnglish, setShowEnglish] = useState(true);

  const [incorrectCards, setIncorrectCards] = useState<Flashcard[]>([]);
  
  // STATE: Quản lý trạng thái đang chờ AI suy nghĩ
  const [isCheckingAI, setIsCheckingAI] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const config = location.state as any;

      if (config?.reviewCards && config.reviewCards.length > 0) {
         setFlashcards(config.reviewCards.sort(() => Math.random() - 0.5));
         return; 
      }

      if (mode === 'custom') {
          const cloudCustomData = await getCustomCardsFromCloud(); 
          if (cloudCustomData.length === 0) {
            navigate('/');
            return;
          }

          const targetCategory = config?.category || 'all';
          const targetLimit = config?.limit || 9999;

          let filteredData = cloudCustomData;
          if (targetCategory !== 'all') {
            filteredData = cloudCustomData.filter((card: any) => card.category === targetCategory);
          }

          if (filteredData.length === 0) {
            alert(`Không tìm thấy từ vựng nào trong bộ "${targetCategory}"!`);
            navigate('/');
            return;
          }

          const shuffledData = filteredData.sort(() => Math.random() - 0.5);
          setFlashcards(shuffledData.slice(0, targetLimit));

      } else {
        try {
          const targetLimit = config?.limit || 10;
          const targetCategory = config?.category || 'all'; 

          const cloudData = await getFlashcardsFromCloud(targetLimit, targetCategory);
          
          if (cloudData && cloudData.length > 0) {
            setFlashcards(cloudData.sort(() => Math.random() - 0.5));
          } else {
            alert(`Không tìm thấy từ vựng hệ thống nào cho chủ đề "${targetCategory}"!`);
            navigate('/');
          }
        } catch (error) {
          console.error("Lỗi tải dữ liệu Core:", error);
        }
      }
    };

    loadData();
  }, [mode, navigate, location.state]);

  useEffect(() => {
    setShowEnglish(Math.random() > 0.5);
  }, [currentIndex]);

  if (flashcards.length === 0) {
    return null;
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  
  const isLastCard = currentIndex === flashcards.length - 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || isCheckingAI) return; // Chặn spam click

    const correctAnswer = showEnglish ? currentCard.vietnamese : currentCard.english;
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = correctAnswer.toLowerCase();

    const possibleAnswers = normalizedCorrectAnswer
      .split(/[,;]+/) 
      .map(ans => ans.trim())
      .filter(ans => ans.length > 0);

    // 1. Chấm điểm siêu tốc bằng thuật toán thông thường
    let isCorrect = 
      normalizedUserAnswer === normalizedCorrectAnswer || 
      possibleAnswers.includes(normalizedUserAnswer);

    // 2. LOGIC AI: Bypass (Bỏ qua) gọi API nếu đang ở chế độ Challenge Mode
    if (!isCorrect && showEnglish && !isChallengeMode) {
      setIsCheckingAI(true);
      const aiApproved = await checkAnswerWithAI(currentCard.english, normalizedUserAnswer);
      
      if (aiApproved) {
        isCorrect = true; // Quay xe, tính là ĐÚNG
        console.log("🤖 AI đã cứu câu này!");
      }
      setIsCheckingAI(false);
    }

    try {
      const audioUrl = isCorrect ? '/correct.mp3' : '/incorrect.mp3';
      const audio = new Audio(audioUrl);
      audio.volume = 0.5;
      audio.play();
    } catch (error) {
      console.log("Lỗi phát âm thanh:", error);
    }

    const newScore = {
      correct: isCorrect ? score.correct + 1 : score.correct,
      incorrect: !isCorrect ? score.incorrect + 1 : score.incorrect
    };

    let updatedIncorrect = [...incorrectCards];
    if (!isCorrect && !updatedIncorrect.some(c => c.english === currentCard.english)) {
      updatedIncorrect.push(currentCard);
    }
    setIncorrectCards(updatedIncorrect);
    setScore(newScore);

    if (isCorrect) {
      setShowFeedback('correct');
      setTimeout(() => {
        moveToNext(newScore, updatedIncorrect); 
      }, 1500);
    } else {
      setShowFeedback('incorrect');
      setIsFlipped(true); 
    }
  };

  const moveToNext = (latestScore?: any, latestIncorrect?: Flashcard[]) => {
    const finalScore = (latestScore && typeof latestScore.correct === 'number') ? latestScore : score;
    const finalIncorrect = latestIncorrect || incorrectCards;

    if (!isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setIsFlipped(false);
      setShowFeedback(null);
      setShowAnswer(false);
    } else {
      navigate('/results', { 
        state: { 
          score: finalScore,
          total: flashcards.length,
          incorrectCards: finalIncorrect,
          allCards: flashcards
        } 
      });
    }
  };

  const handleViewAnswer = () => {
    setShowAnswer(true);
    setIsFlipped(true);
  };

  const handleCardTap = () => {
    if (showAnswer) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <button className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </Link>
          <div className="text-center flex flex-col items-center">
            <p className="text-sm text-gray-500 font-medium">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
            
            {/* Hiển thị các Badge dựa trên State */}
            <div className="flex gap-2 justify-center mt-1">
              {(location.state as any)?.category && (location.state as any)?.category !== 'all' && (
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full inline-block">
                  {(location.state as any).category}
                </span>
              )}
              {(location.state as any)?.reviewCards && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full inline-block">
                  Chế độ Ôn tập
                </span>
              )}
              {/* Badge Báo hiệu chế độ Thử thách */}
              {isChallengeMode && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full inline-block font-bold animate-pulse">
                  🔥 NO AI
                </span>
              )}
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-3 bg-white rounded-full shadow-sm overflow-hidden border border-gray-100">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm font-medium">
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg">✓ {score.correct}</span>
            <span className="text-red-500 bg-red-50 px-2 py-1 rounded-lg">✗ {score.incorrect}</span>
          </div>
        </div>

        {/* Flashcard */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
          onClick={handleCardTap}
        >
          <FlashcardComponent
            word={showEnglish ? currentCard.english : currentCard.vietnamese}
            translation={showEnglish ? currentCard.vietnamese : currentCard.english}
            isFlipped={isFlipped}
            showFront={showEnglish}
            phonetic={currentCard.phonetic}
          />
          {showAnswer && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-gray-500 mt-4">
              Tap card to flip
            </motion.p>
          )}
        </motion.div>

        {/* Input Section */}
        <AnimatePresence mode="wait">
          {!showFeedback && (
            <motion.form key="input-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                <label className="block text-sm text-gray-500 mb-3 font-medium">
                  Type the {showEnglish ? 'Vietnamese' : 'English'} translation
                </label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Your answer..."
                  className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300 disabled:opacity-50"
                  disabled={showAnswer || isCheckingAI} 
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                {!showAnswer ? (
                  <>
                    <button 
                      type="submit" 
                      disabled={!userAnswer.trim() || isCheckingAI} 
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl py-4 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all font-medium"
                    >
                      {isCheckingAI ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Chờ AI duyệt...</>
                      ) : (
                        'Submit'
                      )}
                    </button>
                    <button type="button" onClick={handleViewAnswer} className="px-6 bg-white text-gray-700 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center border border-gray-100 hover:bg-gray-50">
                      <Eye className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => moveToNext()} className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl py-4 shadow-lg active:scale-95 transition-all font-medium">
                    {isLastCard ? 'Xem kết quả' : 'Continue'}
                  </button>
                )}
              </div>
            </motion.form>
          )}

          {/* Feedback */}
          {showFeedback === 'correct' && (
            <motion.div key="correct-feedback" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl p-8 shadow-lg text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                <Check className="w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl mb-2 font-bold">Correct! 🎉</h3>
              <p className="text-green-100">
                {isLastCard ? 'Đang tổng hợp điểm số...' : 'Great job! Moving to next card...'}
              </p>
            </motion.div>
          )}

          {showFeedback === 'incorrect' && (
            <motion.div key="incorrect-feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-4">
              
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl p-4 shadow-lg flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full shrink-0">
                  <X className="w-8 h-8" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-bold mb-1">Not quite!</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-red-100 text-sm">Bạn nhập:</span>
                    <span className="text-xl font-medium line-through decoration-red-300 opacity-90">
                      {userAnswer}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => moveToNext()}
                autoFocus 
                className="w-full bg-white text-gray-800 font-bold rounded-2xl py-4 shadow-sm hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
              >
                {isLastCard ? 'Xem kết quả' : 'Continue (Nhấn Enter)'}
              </button>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}