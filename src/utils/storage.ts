import { Flashcard } from '../data/vocabulary';

// Định nghĩa chìa khóa (key) để tìm đúng ngăn kéo trong bộ nhớ trình duyệt
const STORAGE_KEY = 'flashlearn_custom_cards';

// 1. Hàm lấy danh sách thẻ tự tạo (Đọc dữ liệu)
export const getCustomFlashcards = (): Flashcard[] => {
  const storedCards = localStorage.getItem(STORAGE_KEY);
  // Nếu có dữ liệu thì ép kiểu từ chuỗi (string) về mảng (Array), nếu không thì trả về mảng rỗng
  return storedCards ? JSON.parse(storedCards) : [];
};

// 2. Hàm thêm thẻ mới (Ghi dữ liệu)
// Dùng Omit để nói với TypeScript: "Dữ liệu truyền vào giống Flashcard, nhưng KHÔNG CẦN gửi 'id' lên"
export const addCustomFlashcard = (newCard: Omit<Flashcard, 'id'>) => {
  const currentCards = getCustomFlashcards();
  
  // Tạo thẻ mới, tự động sinh ID bằng thời gian hiện tại (Date.now)
  const cardWithId: Flashcard = {
    ...newCard,
    id: Date.now().toString(), 
  };
  
  // Nối thẻ mới vào mảng cũ
  const updatedCards = [...currentCards, cardWithId];
  
  // Ép kiểu mảng thành chuỗi và lưu vào kho của trình duyệt
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
};