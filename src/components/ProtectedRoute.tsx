import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../utils/supabase';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Hàm kiểm tra xem người dùng có thẻ ra vào (session) không
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login'); // Không có thẻ -> Đuổi ra trang Login
      } else {
        setIsAuthenticated(true); // Có thẻ -> Cho phép vào
      }
      setLoading(false);
    };

    checkAuth();

    // Lắng nghe sự thay đổi: Lỡ người ta đang dùng mà bấm Đăng xuất thì đuổi ra luôn
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Trong lúc đang soi thẻ thì hiện vòng xoay Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Nếu hợp lệ thì cho phép hiển thị nội dung bên trong (children)
  return isAuthenticated ? <>{children}</> : null;
}