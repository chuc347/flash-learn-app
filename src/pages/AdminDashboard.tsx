import { useState, useEffect } from 'react';
import { Users, ShieldAlert, Loader2, ArrowLeft, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { Link } from 'react-router';
import { fetchAllProfiles, UserProfile } from '../data/vocabulary';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchAllProfiles();
        setUsers(data);
      } catch (err: any) {
        // 👉 THÊM DÒNG NÀY VÀO ĐỂ DEBUG
        console.error("Chi tiết lỗi Supabase:", err);
        
        setError("Bạn không có quyền truy cập trang này hoặc phiên đăng nhập đã hết hạn.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Format ngày tháng cho đẹp
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // --- MÀN HÌNH LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  // --- MÀN HÌNH LỖI (BỊ TỪ CHỐI TRUY CẬP) ---
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 p-6 rounded-full text-red-500 mb-6 shadow-sm">
          <ShieldAlert size={64} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">403 - Cấm truy cập</h1>
        <p className="text-gray-600 mb-8 max-w-md">{error}</p>
        <Link to="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg">
          Quay về Trang chủ
        </Link>
      </div>
    );
  }

  // --- MÀN HÌNH ADMIN THÀNH CÔNG ---
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" /> System Admin
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Quản lý người dùng hệ thống</p>
            </div>
          </div>

          <div className="bg-white px-5 py-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Users className="text-indigo-500" size={20} />
            <span className="font-bold text-gray-800">{users.length}</span>
            <span className="text-sm text-gray-500 font-medium">người dùng</span>
          </div>
        </header>

        {/* Bảng dữ liệu */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="px-6 py-4 font-semibold">Tài khoản (Email)</th>
                  <th className="px-6 py-4 font-semibold">Vai trò (Role)</th>
                  <th className="px-6 py-4 font-semibold">Ngày đăng ký</th>
                  <th className="px-6 py-4 font-semibold text-right">ID Hệ thống</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <Mail size={16} />
                        </div>
                        <span className="font-medium text-gray-800">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono text-right truncate max-w-[150px]">
                      {user.id.split('-')[0]}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Không có dữ liệu người dùng.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}