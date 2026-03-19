import { Trophy, Home, RotateCcw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [confetti, setConfetti] = useState(false);

  const { score, total } = location.state as { 
    score: { correct: number; incorrect: number }; 
    total: number 
  } || { score: { correct: 0, incorrect: 0 }, total: 0 };

  const percentage = total > 0 ? Math.round((score.correct / total) * 100) : 0;
  const isPerfect = percentage === 100;
  const isGood = percentage >= 70;

  useEffect(() => {
    if (!location.state) {
      navigate('/');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (isPerfect) {
      setConfetti(true);
    }
  }, [isPerfect]);

  if (!location.state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
              isPerfect 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-400' 
                : isGood 
                ? 'bg-gradient-to-br from-green-400 to-teal-400'
                : 'bg-gradient-to-br from-blue-400 to-purple-400'
            } shadow-lg`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl text-gray-800 mb-2">
              {isPerfect ? 'Perfect Score! 🎉' : isGood ? 'Great Job! 🌟' : 'Keep Practicing! 💪'}
            </h1>
            <p className="text-gray-500">
              {isPerfect 
                ? 'You nailed every single card!' 
                : isGood 
                ? 'You\'re doing really well!'
                : 'Every mistake is a step forward!'}
            </p>
          </motion.div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-lg mb-6"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-2 text-gray-800">{percentage}%</div>
              <p className="text-gray-500">Accuracy</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl text-gray-800 mb-1">{total}</div>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-green-600 mb-1">{score.correct}</div>
                <p className="text-sm text-gray-500">Correct</p>
              </div>
              <div className="text-center">
                <div className="text-2xl text-red-500 mb-1">{score.incorrect}</div>
                <p className="text-sm text-gray-500">Wrong</p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Link to="/learn/random">
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl py-5 shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />
                <span className="text-lg">Practice Again</span>
              </button>
            </Link>

            <Link to="/">
              <button className="w-full bg-white text-gray-700 rounded-2xl py-5 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                <span className="text-lg">Back to Home</span>
              </button>
            </Link>
          </motion.div>

          {/* Encouragement Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-400">
              {isPerfect 
                ? '✨ You\'re a star learner!' 
                : isGood 
                ? '🚀 Keep up the great work!'
                : '🌱 Practice makes perfect!'}
            </p>
          </motion.div>
        </motion.div>

        {/* Confetti effect for perfect score */}
        {confetti && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10%',
                  backgroundColor: ['#60A5FA', '#A78BFA', '#F472B6', '#FBBF24'][Math.floor(Math.random() * 4)],
                }}
                initial={{ y: 0, opacity: 1 }}
                animate={{
                  y: '110vh',
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}