import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  // Bảo mật: Nếu truy cập trang này mà không phải qua link từ email thì đuổi về trang chủ
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/');
    });
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Supabase API để đổi mật khẩu
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Cập nhật thành công! Đang chuyển hướng...' });
      
      // Đổi pass xong đợi 2s rồi đẩy về trang chủ
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi cập nhật mật khẩu.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
          <Lock size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Tạo mật khẩu mới</h1>
        <p className="text-gray-500 mb-8">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' && <CheckCircle2 className="shrink-0" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || password.length < 6}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <><Loader2 className="animate-spin" size={20} /> Đang cập nhật...</> : 'Lưu mật khẩu'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}