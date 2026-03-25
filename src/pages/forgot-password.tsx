import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Link } from 'react-router';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Gọi API gửi link khôi phục, chỉ định rõ nơi sẽ chuyển về sau khi bấm link
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Đã gửi link khôi phục! Vui lòng kiểm tra email (cả mục Spam).'
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Quay lại
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quên mật khẩu?</h1>
        <p className="text-gray-500 mb-8">Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 className="shrink-0" /> : <AlertCircle className="shrink-0" />}
            <p className="text-sm font-medium leading-relaxed">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email của bạn</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ví dụ: hello@flashlearn.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="animate-spin" size={20} /> Đang gửi...</> : 'Gửi link khôi phục'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}