// File: src/data/vocabulary.ts
import { supabase } from '../utils/supabase'; // Import đường ống kết nối
import { coreWords } from './core-vocabulary';

export interface Flashcard {
  id: string;
  english: string;
  vietnamese: string;
  type?: string;
  category?: string;
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

// Hàm xóa thẻ dựa trên ID
export const deleteFlashcardFromCloud = async (id: string) => {
  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('id', id); // Chỉ xóa đúng cái thẻ có id trùng khớp

  if (error) {
    throw new Error(error.message);
  }
};

// Hàm tạo 1 thẻ (Có thêm tham số category)
export const addFlashcardToCloud = async (english: string, vietnamese: string, category: string = 'Chung') => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập để lưu thẻ!");

  const { error } = await supabase
    .from('vocabulary')
    .insert([{
      english: english.trim().toLowerCase(),
      vietnamese: vietnamese.trim().toLowerCase(),
      type: 'custom',
      user_id: session.user.id,
      category: category.trim() || 'Chung' // Đẩy tên bộ từ vựng lên Cloud
    }]);

  if (error) throw new Error(error.message);
};

// Hàm nhập Excel (Cũng được gắn category cho toàn bộ file Excel)
export const addMultipleFlashcardsToCloud = async (cards: {english: string, vietnamese: string}[], category: string = 'Chung') => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập để lưu thẻ!");

  const { data: existingCards, error: fetchError } = await supabase
    .from('vocabulary')
    .select('english')
    .eq('user_id', session.user.id);

  if (fetchError) throw new Error("Lỗi kiểm tra trùng lặp: " + fetchError.message);

  const existingWords = new Set(existingCards?.map(card => card.english.toLowerCase()) || []);
  const uniqueNewCards = [];
  const seenInExcel = new Set();

  for (const card of cards) {
    const eng = String(card.english).trim().toLowerCase();
    const vie = String(card.vietnamese).trim().toLowerCase();

    if (!existingWords.has(eng) && !seenInExcel.has(eng)) {
      uniqueNewCards.push({
        english: eng,
        vietnamese: vie,
        type: 'custom',
        user_id: session.user.id,
        category: category.trim() || 'Chung' // Gắn nhãn cho hàng loạt từ
      });
      seenInExcel.add(eng);
    }
  }

  if (uniqueNewCards.length === 0) return 0;

  const { error: insertError } = await supabase.from('vocabulary').insert(uniqueNewCards);
  if (insertError) throw new Error(insertError.message);

  return uniqueNewCards.length;
};

// Hàm MỚI: Lấy danh sách các Bộ từ vựng và đếm số lượng thẻ trong từng bộ
export const getCategoriesWithCount = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  // Lấy toàn bộ thẻ custom của người dùng
  const { data, error } = await supabase
    .from('vocabulary')
    .select('category')
    .eq('user_id', session.user.id)
    .eq('type', 'custom');

  if (error) throw error;

  // Gom nhóm và đếm
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const cat = item.category || 'Chung';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  // Chuyển thành mảng cho dễ dùng ở giao diện
  return Object.keys(counts).map(key => ({
    name: key,
    count: counts[key]
  }));
};

// Hàm MỚI: Xóa 1 thẻ cụ thể trong 1 thư mục cụ thể
export const deleteCustomCardFromCloud = async (englishWord: string, category: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập!");

  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('user_id', session.user.id)
    .eq('english', englishWord.toLowerCase())
    .eq('category', category)
    .eq('type', 'custom');

  if (error) throw new Error(error.message);
};