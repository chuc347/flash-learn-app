import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../utils/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State quản lý hiển thị Modal thành công
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // ĐĂNG NHẬP
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/'); // Đăng nhập thành công thì về trang chủ
      } else {
        // ĐĂNG KÝ
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Hiện Modal xịn xò thay vì alert
        setShowSuccessModal(true);
        setIsLogin(true); // Tự động chuyển form sang đăng nhập
        setPassword(''); // Xóa mật khẩu đi cho an toàn
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center p-6 relative overflow-hidden">
      {/* Vòng tròn trang trí */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full mx-auto relative z-10">
        
        {/* --- KHU VỰC LOGO MỚI --- */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            {/* Stylized Logo Icon: Silhouette Não & Tia Sét Spark */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg shadow-purple-100">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Silhouette Bộ Não (Tím solid) */}
                <path d="M11.9961 4.50293C15.2411 4.50293 17.8721 7.13393 17.8721 10.3789C17.8721 13.6239 15.2411 16.2549 11.9961 16.2549C8.75109 16.2549 6.12009 13.6239 6.12009 10.3789C6.12009 7.13393 8.75109 4.50293 11.9961 4.50293Z" fill="#A78BFA" fillOpacity="0.8"/>
                {/* Tia sét Spark (Gradient tím-to-xanh) */}
                <path d="M10.9751 7.6416L8.13623 11.5303H10.9751L10.3276 13.1216L13.1665 9.23291H10.3276L10.9751 7.6416Z" fill="url(#paint0_linear_logo)"/>
                <defs>
                  <linearGradient id="paint0_linear_logo" x1="10.6514" y1="7.6416" x2="10.6514" y2="13.1216" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7C3AED"/>
                    <stop offset="1" stopColor="#60A5FA"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">FlashLearn</h1>
            <p className="text-gray-500 mt-2">Welcome back, learner!</p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 shadow-2xl shadow-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{isLogin ? 'Sign In' : 'Create Account'}</h2>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              {/* SỬA LỖI Ở ĐÂY: Dùng Flexbox để đưa link Quên mật khẩu sang góc phải */}
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-500">Password</label>
                {/* Chỉ hiện chữ Quên mật khẩu khi đang ở chế độ Đăng nhập */}
                {isLogin && (
                  <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot password?
                  </Link>
                )}
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl text-gray-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl py-4 font-medium shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null); // Tự động xóa lỗi cũ khi người dùng chuyển qua lại
                }} 
                className="text-blue-600 font-semibold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* --- GIAO DIỆN MODAL ĐĂNG KÝ THÀNH CÔNG --- */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để bắt đầu học nhé!
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3.5 bg-green-500 text-white rounded-2xl font-medium hover:bg-green-600 shadow-lg shadow-green-200 transition-colors active:scale-95"
              >
                Tuyệt vời
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}