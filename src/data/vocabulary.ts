// File: src/data/vocabulary.ts
import { supabase } from '../utils/supabase'; // Import đường ống kết nối
import { coreWords } from './core-vocabulary';

export interface Flashcard {
  id: string;
  english: string;
  vietnamese: string;
  type?: string;
}

// HÀM MỚI: Lấy dữ liệu thật từ Supabase
export const getFlashcardsFromCloud = async (limit: number = 10): Promise<Flashcard[]> => {
  // Lệnh truy vấn: "Lấy tất cả cột từ bảng 'vocabulary', giới hạn số lượng"
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Lỗi khi lấy dữ liệu từ Supabase:', error.message);
    return []; // Trả về mảng rỗng nếu lỗi
  }

  return data as Flashcard[];
};

export const addFlashcardToCloud = async (english: string, vietnamese: string) => {
  // Chỉ dùng duy nhất lệnh .insert để thêm mới dữ liệu
  const { data, error } = await supabase
    .from('vocabulary')
    .insert([
      { 
        english: english.toLowerCase(), 
        vietnamese: vietnamese.toLowerCase(),
        type: 'custom' 
      }
    ]);

  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// Hàm cũ (tạm thời giữ lại để không lỗi các màn hình khác)
export const getRandomFlashcards = (count: number): Flashcard[] => {
  const shuffled = [...coreWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((word, index) => ({
    ...word,
    id: `core_${index}_${Date.now()}`
  }));
};

// Lấy riêng những từ do người dùng tự tạo (type = 'custom')
export const getCustomCardsFromCloud = async (): Promise<Flashcard[]> => {
  const { data, error } = await supabase
    .from('vocabulary')
    .select('*')
    .eq('type', 'custom'); // Lọc: chỉ lấy những dòng có cột type là 'custom'

  if (error) {
    console.error(error);
    return [];
  }
  return data as Flashcard[];
};

export const getCustomCardsCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('vocabulary')
    .select('*', { count: 'exact', head: true }) // Chỉ lấy số lượng (count), không lấy dữ liệu
    .eq('type', 'custom'); // CHỈ LỌC NHỮNG THẺ CUSTOM

  if (error) {
    console.error('Lỗi khi đếm thẻ:', error.message);
    return 0;
  }

  return count || 0;
};