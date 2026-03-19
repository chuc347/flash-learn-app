// File: src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Lấy chìa khóa từ file bảo mật .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Kiểm tra xem đã có key chưa
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Thiếu biến môi trường Supabase! Vui lòng kiểm tra file .env.local');
}

// Tạo "đường ống" kết nối
export const supabase = createClient(supabaseUrl, supabaseAnonKey);