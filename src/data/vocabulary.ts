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
export const addMultipleFlashcardsToCloud = async (cards: {english: string, vietnamese: string}[]) => {
  // 1. Tải danh sách TẤT CẢ các từ tiếng Anh đang có trên hệ thống về để đối chiếu
  const { data: existingCards, error: fetchError } = await supabase
    .from('vocabulary')
    .select('english');

  if (fetchError) throw new Error("Lỗi khi kiểm tra từ trùng lặp: " + fetchError.message);

  // Tạo một bộ lọc (Set) chứa các từ đã có. Dùng Set giúp việc tìm kiếm nhanh gấp 100 lần!
  const existingWords = new Set(existingCards?.map(card => card.english.toLowerCase()) || []);

  // 2. Lọc danh sách từ Excel: Bỏ qua từ ĐÃ CÓ TRÊN MÂY, và bỏ qua cả TỪ TRÙNG NHAU TRONG EXCEL
  const uniqueNewCards = [];
  const seenInExcel = new Set();

  for (const card of cards) {
    // Đảm bảo dữ liệu luôn là chữ (tránh lỗi file Excel chứa số) và viết thường
    const eng = String(card.english).trim().toLowerCase();
    const vie = String(card.vietnamese).trim().toLowerCase();

    // Nếu từ này CHƯA có trên đám mây VÀ CHƯA xuất hiện trong quá trình đọc file này
    if (!existingWords.has(eng) && !seenInExcel.has(eng)) {
      uniqueNewCards.push({
        english: eng,
        vietnamese: vie,
        type: 'custom'
      });
      seenInExcel.add(eng); // Ghi nhớ là đã lấy từ này rồi
    }
  }

  // 3. Nếu tất cả các từ trong Excel đều đã có sẵn trong máy -> Trả về số 0
  if (uniqueNewCards.length === 0) {
    return 0; 
  }

  // 4. Nếu có từ mới -> Đẩy phần từ mới đó lên Supabase
  const { error: insertError } = await supabase
    .from('vocabulary')
    .insert(uniqueNewCards);

  if (insertError) throw new Error(insertError.message);

  // Trả về số lượng từ VỪA ĐƯỢC THÊM THÀNH CÔNG
  return uniqueNewCards.length; 
};