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

// Hàm nhập Excel & AI (Đã nâng cấp: Lọc trùng theo Thư mục & Cắt số lượng thông minh)
export const addMultipleFlashcardsToCloud = async (
  cards: {english: string, vietnamese: string}[], 
  category: string = 'Chung',
  targetCount?: number // Tham số mới: Chỉ định số lượng tối đa muốn thêm (Dành cho AI)
) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập để lưu thẻ!");

  // 👉 CẢI TIẾN 1: Tách biệt phạm vi (Scope). Chỉ tìm các từ đã tồn tại trong CÙNG 1 CATEGORY
  const { data: existingCards, error: fetchError } = await supabase
    .from('vocabulary')
    .select('english')
    .eq('user_id', session.user.id)
    .eq('category', category.trim()); // <-- THÊM DÒNG NÀY ĐỂ KO BỊ CHẶN BỞI THƯ MỤC KHÁC

  if (fetchError) throw new Error("Lỗi kiểm tra trùng lặp: " + fetchError.message);

  const existingWords = new Set(existingCards?.map(card => card.english.toLowerCase()) || []);
  const uniqueNewCards = [];
  const seenInList = new Set();

  for (const card of cards) {
    const eng = String(card.english).trim().toLowerCase();
    const vie = String(card.vietnamese).trim().toLowerCase();

    // Lọc bỏ từ đã có trong Bộ này, VÀ lọc bỏ từ bị AI/Excel sinh trùng lặp trong cùng 1 mảng
    if (!existingWords.has(eng) && !seenInList.has(eng)) {
      uniqueNewCards.push({
        english: eng,
        vietnamese: vie,
        type: 'custom',
        user_id: session.user.id,
        category: category.trim() || 'Chung' 
      });
      seenInList.add(eng);
    }
  }

  if (uniqueNewCards.length === 0) return 0;

  // 👉 CẢI TIẾN 2: Kỹ thuật Fallback. Nếu có targetCount (AI), chỉ lấy đúng số lượng yêu cầu từ mảng đã lọc
  // Nếu không có targetCount (Import Excel), thì lấy toàn bộ
  const finalCardsToInsert = targetCount ? uniqueNewCards.slice(0, targetCount) : uniqueNewCards;

  const { error: insertError } = await supabase.from('vocabulary').insert(finalCardsToInsert);
  if (insertError) throw new Error(insertError.message);

  return finalCardsToInsert.length;
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

// Hàm MỚI: Xóa TOÀN BỘ thẻ trong 1 thư mục cụ thể
export const deleteCategoryFromCloud = async (categoryName: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập!");

  const { error } = await supabase
    .from('vocabulary')
    .delete()
    .eq('user_id', session.user.id)
    .eq('category', categoryName)
    .eq('type', 'custom');

  if (error) throw new Error(error.message);
};

// --- CÁC HÀM XỬ LÝ AVATAR/METADATA ---

// 1. Hàm lưu hoặc cập nhật Avatar cho thư mục
export const upsertCategoryMetadata = async (categoryName: string, avatarUrl: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập!");

  const { error } = await supabase
    .from('category_metadata')
    .upsert({ 
      user_id: session.user.id, 
      category_name: categoryName, 
      avatar_url: avatarUrl 
    }, { onConflict: 'user_id, category_name' }); // Nếu trùng user và tên bộ thì ghi đè

  if (error) throw new Error(error.message);
};

// 2. Hàm lấy toàn bộ Avatar của người dùng
export const getAllCategoryMetadata = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};

  const { data, error } = await supabase
    .from('category_metadata')
    .select('category_name, avatar_url')
    .eq('user_id', session.user.id);

  if (error) {
    console.error("Lỗi lấy metadata:", error);
    return {};
  }

  // Biến mảng thành Object cho dễ tra cứu: { "Tên bộ": "url_ảnh" }
  return data.reduce((acc, item) => {
    acc[item.category_name] = item.avatar_url;
    return acc;
  }, {} as Record<string, string>);
};

// 👉 HÀM MỚI CHÍNH THỨC XUẤT HIỆN Ở ĐÂY: Upload file ảnh (Blob) lên Supabase Storage
// 👉 HÀM ĐÃ FIX LỖI TIẾNG VIỆT: Upload file ảnh (Blob) lên Supabase Storage
export const uploadCategoryAvatarToCloud = async (file: Blob, categoryName: string): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Vui lòng đăng nhập!");

  // 🛠️ KỸ THUẬT SANITIZE: Loại bỏ dấu tiếng Việt và ký tự đặc biệt
  const safeCategoryName = categoryName
    .normalize('NFD') // Tách dấu ra khỏi chữ
    .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu
    .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Xử lý chữ Đ
    .replace(/[^a-zA-Z0-9]/g, '_') // Biến mọi thứ không phải chữ và số thành dấu gạch dưới
    .toLowerCase(); // Viết thường hết cho an toàn

  const fileExt = 'jpeg';
  // Tên file bây giờ sẽ là: id_trai_cay_123456789.jpeg -> An toàn tuyệt đối!
  const fileName = `${session.user.id}_${safeCategoryName}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('category_avatars')
    .upload(filePath, file, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) throw new Error("Lỗi upload ảnh: " + uploadError.message);

  const { data } = supabase.storage.from('category_avatars').getPublicUrl(filePath);
  return data.publicUrl;
};

// ==========================================
// CÁC HÀM DÀNH CHO ADMIN
// ==========================================

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

// Lấy danh sách tất cả người dùng (Chỉ Admin mới gọi được hàm này thành công do RLS bảo vệ)
export const fetchAllProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false }); // Sắp xếp user mới nhất lên đầu

  if (error) {
    throw new Error(error.message);
  }
  
  return data as UserProfile[];
};