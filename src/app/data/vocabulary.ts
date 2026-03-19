export interface Flashcard {
  id: string;
  english: string;
  vietnamese: string;
}

export const vocabularyDatabase: Flashcard[] = [
  // Common Words
  { id: '1', english: 'hello', vietnamese: 'xin chào' },
  { id: '2', english: 'goodbye', vietnamese: 'tạm biệt' },
  { id: '3', english: 'thank you', vietnamese: 'cảm ơn' },
  { id: '4', english: 'please', vietnamese: 'làm ơn' },
  { id: '5', english: 'sorry', vietnamese: 'xin lỗi' },
  { id: '6', english: 'yes', vietnamese: 'vâng' },
  { id: '7', english: 'no', vietnamese: 'không' },
  { id: '8', english: 'help', vietnamese: 'giúp đỡ' },
  { id: '9', english: 'friend', vietnamese: 'bạn bè' },
  { id: '10', english: 'family', vietnamese: 'gia đình' },
  
  // Food & Drink
  { id: '11', english: 'water', vietnamese: 'nước' },
  { id: '12', english: 'rice', vietnamese: 'cơm' },
  { id: '13', english: 'coffee', vietnamese: 'cà phê' },
  { id: '14', english: 'tea', vietnamese: 'trà' },
  { id: '15', english: 'bread', vietnamese: 'bánh mì' },
  { id: '16', english: 'chicken', vietnamese: 'gà' },
  { id: '17', english: 'fish', vietnamese: 'cá' },
  { id: '18', english: 'vegetable', vietnamese: 'rau' },
  { id: '19', english: 'fruit', vietnamese: 'trái cây' },
  { id: '20', english: 'meat', vietnamese: 'thịt' },
  
  // Numbers
  { id: '21', english: 'one', vietnamese: 'một' },
  { id: '22', english: 'two', vietnamese: 'hai' },
  { id: '23', english: 'three', vietnamese: 'ba' },
  { id: '24', english: 'four', vietnamese: 'bốn' },
  { id: '25', english: 'five', vietnamese: 'năm' },
  { id: '26', english: 'six', vietnamese: 'sáu' },
  { id: '27', english: 'seven', vietnamese: 'bảy' },
  { id: '28', english: 'eight', vietnamese: 'tám' },
  { id: '29', english: 'nine', vietnamese: 'chín' },
  { id: '30', english: 'ten', vietnamese: 'mười' },
  
  // Common Verbs
  { id: '31', english: 'eat', vietnamese: 'ăn' },
  { id: '32', english: 'drink', vietnamese: 'uống' },
  { id: '33', english: 'sleep', vietnamese: 'ngủ' },
  { id: '34', english: 'walk', vietnamese: 'đi bộ' },
  { id: '35', english: 'run', vietnamese: 'chạy' },
  { id: '36', english: 'read', vietnamese: 'đọc' },
  { id: '37', english: 'write', vietnamese: 'viết' },
  { id: '38', english: 'listen', vietnamese: 'nghe' },
  { id: '39', english: 'speak', vietnamese: 'nói' },
  { id: '40', english: 'learn', vietnamese: 'học' },
  
  // Places
  { id: '41', english: 'home', vietnamese: 'nhà' },
  { id: '42', english: 'school', vietnamese: 'trường học' },
  { id: '43', english: 'office', vietnamese: 'văn phòng' },
  { id: '44', english: 'restaurant', vietnamese: 'nhà hàng' },
  { id: '45', english: 'hospital', vietnamese: 'bệnh viện' },
  { id: '46', english: 'market', vietnamese: 'chợ' },
  { id: '47', english: 'park', vietnamese: 'công viên' },
  { id: '48', english: 'street', vietnamese: 'đường phố' },
  { id: '49', english: 'city', vietnamese: 'thành phố' },
  { id: '50', english: 'country', vietnamese: 'quốc gia' },
];

export function getRandomFlashcards(count: number = 10): Flashcard[] {
  const shuffled = [...vocabularyDatabase].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, vocabularyDatabase.length));
}
