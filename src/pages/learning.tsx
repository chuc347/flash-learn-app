import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Eye } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { getRandomFlashcards, Flashcard, getCustomCardsFromCloud } from '../data/vocabulary';
import { getCustomFlashcards } from '../utils/storage';
import FlashcardComponent from '../components/flashcard';
import { getFlashcardsFromCloud } from '../data/vocabulary';


export default function Learning() {
  const { mode } = useParams<{ mode: 'random' | 'custom' }>();
  const navigate = useNavigate();
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [showEnglish, setShowEnglish] = useState(true);

  // --- 1. useEffect LOAD DỮ LIỆU (Thay cái cũ của em) ---
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'custom') {
          const cloudCustomData = await getCustomCardsFromCloud(); 
          if (cloudCustomData.length === 0) {
            navigate('/');
            return;
          }
          setFlashcards(cloudCustomData.sort(() => Math.random() - 0.5));
      } else {
        // Lấy dữ liệu từ Cloud (Supabase)
        try {
          const cloudData = await getFlashcardsFromCloud(10);
          if (cloudData && cloudData.length > 0) {
            setFlashcards(cloudData.sort(() => Math.random() - 0.5));
          } else {
            setFlashcards(getRandomFlashcards(10));
          }
        } catch (error) {
          console.error("Lỗi kết nối Supabase:", error);
          setFlashcards(getRandomFlashcards(10));
        }
      }
    };

    loadData();
  }, [mode, navigate]);

  useEffect(() => {
    setShowEnglish(Math.random() > 0.5);
  }, [currentIndex]);

  if (flashcards.length === 0) {
    return null;
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAnswer.trim()) return;

    const correctAnswer = showEnglish ? currentCard.vietnamese : currentCard.english;
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      setShowFeedback('correct');
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      
      setTimeout(() => {
        moveToNext();
      }, 1500);
    } else {
      setShowFeedback('incorrect');
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
  };

  const moveToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setIsFlipped(false);
      setShowFeedback(null);
      setShowAnswer(false);
    } else {
      // Navigate to results
      navigate('/results', { 
        state: { 
          score,
          total: flashcards.length 
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
            <p className="text-sm text-gray-500">
              Card {currentIndex + 1} of {flashcards.length}
            </p>
          </div>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-3 bg-white rounded-full shadow-sm overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="text-green-600">✓ {score.correct}</span>
            <span className="text-red-500">✗ {score.incorrect}</span>
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
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-500 mt-4"
            >
              Tap card to flip
            </motion.p>
          )}
        </motion.div>

        {/* Input Section */}
        <AnimatePresence mode="wait">
          {!showFeedback && (
            <motion.form
              key="input-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <label className="block text-sm text-gray-500 mb-3">
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
                    <button
                      type="submit"
                      disabled={!userAnswer.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl py-4 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={handleViewAnswer}
                      className="px-6 bg-white text-gray-700 rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={moveToNext}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl py-4 shadow-lg active:scale-95 transition-all"
                  >
                    Continue
                  </button>
                )}
              </div>
            </motion.form>
          )}

          {/* Feedback */}
          {showFeedback === 'correct' && (
            <motion.div
              key="correct-feedback"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl p-8 shadow-lg text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Check className="w-16 h-16 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl mb-2">Correct! 🎉</h3>
              <p className="text-green-100">Great job! Moving to next card...</p>
            </motion.div>
          )}

          {showFeedback === 'incorrect' && (
            <motion.div
              key="incorrect-feedback"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl p-8 shadow-lg text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <X className="w-16 h-16 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl mb-2">Not quite</h3>
                <p className="text-red-100 mb-4">The correct answer is:</p>
                <p className="text-3xl">
                  {showEnglish ? currentCard.vietnamese : currentCard.english}
                </p>
              </div>
              <button
                onClick={moveToNext}
                className="w-full bg-white text-gray-700 rounded-2xl py-4 shadow-sm active:scale-95 transition-all"
              >
                Continue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
