// File: src/data/vocabulary.ts
import { supabase } from '../utils/supabase'; // Import đường ống kết nối
import { coreWords } from './core-vocabulary';

export interface Flashcard {
  id: string;
  english: string;
  vietnamese: string;
  phonetic?: string;
  type?: string;
  category?: string;
}

// HÀM MỚI: Lấy dữ liệu thật từ Supabase
// File: src/data/vocabulary.ts
export const getFlashcardsFromCloud = async (limit: number = 10, category: string = 'all'): Promise<Flashcard[]> => {
  let query = supabase.from('vocabulary').select('*').eq('type', 'core');

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  // SỬA LỖI Ở ĐÂY: Chỉ giới hạn nếu limit khác -1
  if (limit !== -1) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Lỗi khi lấy dữ liệu từ Supabase:', error.message);
    return []; 
  }

  console.log("Dữ liệu Core kéo về từ DB:", data); 
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
export const addFlashcardToCloud = async (english: string, vietnamese: string, category: string = 'Chung') => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập để lưu thẻ!");

  // --- 🪄 BƯỚC PHÉP THUẬT: ĐI HỎI TỪ ĐIỂN ---
  const wordToFetch = english.trim().toLowerCase();
  const phonetic = await fetchPhoneticForWord(wordToFetch);
  // -----------------------------------------

  const { error } = await supabase
    .from('vocabulary')
    .insert([{
      english: wordToFetch,
      vietnamese: vietnamese.trim().toLowerCase(),
      type: 'custom',
      user_id: session.user.id,
      category: category.trim() || 'Chung',
      phonetic: phonetic // <-- TRUYỀN PHIÊN ÂM VÀO ĐÂY LÀ XONG!
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

// Hàm MỚI: Lấy danh sách các chủ đề của từ CORE và đếm số lượng
export const getCoreCategoriesWithCount = async () => {
  // Không cần lấy session vì từ Core ai cũng đọc được
  const { data, error } = await supabase
    .from('vocabulary')
    .select('category')
    .eq('type', 'core');

  if (error) {
    console.error("Lỗi lấy danh mục Core:", error);
    return [];
  }

  // Gom nhóm và đếm
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const cat = item.category || 'Chung'; // Nếu lỡ có từ nào null category thì gom vào 'Chung'
    counts[cat] = (counts[cat] || 0) + 1;
  });

  // Chuyển thành mảng cho dễ dùng ở giao diện
  return Object.keys(counts).map(key => ({
    name: key,
    count: counts[key]
  }));
};

// Hàm MỚI: Tự động chạy đi tìm phiên âm cho các từ bị thiếu
export const autoFillPhonetics = async (
  onProgress: (current: number, total: number, currentWord: string) => void
) => {
  // 1. Lấy tất cả từ (cả core và custom) chưa có phiên âm
  const { data: words, error } = await supabase
    .from('vocabulary')
    .select('id, english')
    .is('phonetic', null);

  if (error || !words) throw new Error("Không lấy được danh sách từ lỗi");
  if (words.length === 0) return 0;

  // 2. Lặp qua từng từ để gọi API từ điển
  let successCount = 0;
  for (let i = 0; i < words.length; i++) {
    const wordObj = words[i];
    onProgress(i + 1, words.length, wordObj.english);

    try {
      // Gọi API từ điển miễn phí
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordObj.english}`);
      if (res.ok) {
        const apiData = await res.json();
        
        // Trích xuất phiên âm (Logic của API này hơi lằng nhằng nên phải check kỹ)
        let phonetic = apiData[0]?.phonetic;
        if (!phonetic && apiData[0]?.phonetics) {
          const phoneticObj = apiData[0].phonetics.find((p: any) => p.text);
          if (phoneticObj) phonetic = phoneticObj.text;
        }

        // 3. Nếu tìm thấy phiên âm, cập nhật lên Supabase
        if (phonetic) {
          const { error: updateError } = await supabase
            .from('vocabulary')
            .update({ phonetic })
            .eq('id', wordObj.id);
            
          if (updateError) {
            console.error(`❌ Bị chặn khi lưu từ ${wordObj.english}:`, updateError.message);
          } else {
            console.log(`✅ Đã lưu ${wordObj.english}: ${phonetic}`);
            successCount++;
          }
        }
      }
    } catch (err) {
      console.log("Bỏ qua từ:", wordObj.english);
    }

    // 4. BẮT BUỘC: Nghỉ ngơi 500ms (0.5 giây) để không bị API chặn IP
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return successCount;
};

// Hàm Helper: Tự động lấy phiên âm cho 1 từ vựng mới
export const fetchPhoneticForWord = async (word: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.trim()}`);
    if (!res.ok) return null; // Nếu không tìm thấy từ, trả về null để không làm crash app
    
    const apiData = await res.json();
    let phonetic = apiData[0]?.phonetic;
    
    if (!phonetic && apiData[0]?.phonetics) {
      const phoneticObj = apiData[0].phonetics.find((p: any) => p.text);
      if (phoneticObj) phonetic = phoneticObj.text;
    }
    
    return phonetic || null;
  } catch (error) {
    console.log("Không lấy được phiên âm cho từ:", word);
    return null;
  }
};