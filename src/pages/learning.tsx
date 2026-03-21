import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye } from 'lucide-react';
import { Link, useNavigate, useParams, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { getRandomFlashcards, Flashcard, getCustomCardsFromCloud, getFlashcardsFromCloud } from '../data/vocabulary';
import FlashcardComponent from '../components/flashcard';

export default function Learning() {
  const { mode } = useParams<{ mode: 'random' | 'custom' }>();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [showEnglish, setShowEnglish] = useState(true);

  const [incorrectCards, setIncorrectCards] = useState<Flashcard[]>([]);

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
          const cloudData = await getFlashcardsFromCloud(10);
          if (cloudData && cloudData.length > 0) {
            setFlashcards(cloudData.sort(() => Math.random() - 0.5));
          } else {
            setFlashcards(getRandomFlashcards(10));
          }
        } catch (error) {
          setFlashcards(getRandomFlashcards(10));
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
  
  // KIỂM TRA XEM ĐÂY CÓ PHẢI LÀ CÂU CUỐI CÙNG KHÔNG
  const isLastCard = currentIndex === flashcards.length - 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const correctAnswer = showEnglish ? currentCard.vietnamese : currentCard.english;
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();

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
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
            {(location.state as any)?.category && (location.state as any)?.category !== 'all' && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                {(location.state as any).category}
              </span>
            )}
            {(location.state as any)?.reviewCards && (
              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                Chế độ Ôn tập
              </span>
            )}
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
                  className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300"
                  disabled={showAnswer}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                {!showAnswer ? (
                  <>
                    <button type="submit" disabled={!userAnswer.trim()} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl py-4 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all font-medium">
                      Submit
                    </button>
                    <button type="button" onClick={handleViewAnswer} className="px-6 bg-white text-gray-700 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center border border-gray-100 hover:bg-gray-50">
                      <Eye className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => moveToNext()} className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl py-4 shadow-lg active:scale-95 transition-all font-medium">
                    {/* ĐỔI CHỮ NÚT BẤM KHI BẤM XEM ĐÁP ÁN Ở CÂU CUỐI */}
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
                {/* ĐỔI THÔNG BÁO Ở CÂU CUỐI */}
                {isLastCard ? 'Đang tổng hợp điểm số...' : 'Great job! Moving to next card...'}
              </p>
            </motion.div>
          )}

          {showFeedback === 'incorrect' && (
            <motion.div key="incorrect-feedback" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="space-y-4">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl p-8 shadow-lg text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                  <X className="w-16 h-16 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl mb-2 font-bold">Not quite</h3>
                <p className="text-red-100 mb-4">The correct answer is:</p>
                <p className="text-3xl font-medium">
                  {showEnglish ? currentCard.vietnamese : currentCard.english}
                </p>
              </div>
              <button
                onClick={() => moveToNext()}
                className="w-full bg-white text-gray-700 font-medium rounded-2xl py-4 shadow-sm active:scale-95 transition-all border border-gray-100"
              >
                {/* ĐỔI CHỮ NÚT BẤM KHI TRẢ LỜI SAI Ở CÂU CUỐI */}
                {isLastCard ? 'Xem kết quả' : 'Continue'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}