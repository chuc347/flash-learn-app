import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Plus, Loader2, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, FolderOpen, ChevronDown, FolderPlus, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { addFlashcardToCloud, addMultipleFlashcardsToCloud, getCategoriesWithCount } from '../data/vocabulary';

export default function CreateFlashcard() {
  const navigate = useNavigate();
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  
  // STATE: Quản lý Bộ từ vựng
  const [category, setCategory] = useState('Chung');
  const [categoriesList, setCategoriesList] = useState<{name: string, count: number}[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  // --- TASK 1: STATE CHO TÍNH NĂNG AI GENERATOR ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState<number>(10);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false); // Trạng thái chờ AI

  // Load danh sách thư mục khi mới vào trang
  const loadCategories = async () => {
    try {
      const list = await getCategoriesWithCount();
      setCategoriesList(list);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const showModal = (title: string, message: string, type: 'success' | 'warning' | 'error') => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  const translateWord = async () => {
    if (!english.trim() || vietnamese.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(english.trim())}&langpair=en|vi`);
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setVietnamese(data.responseData.translatedText.toLowerCase());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const translateToEnglish = async () => {
    if (!vietnamese.trim() || english.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(vietnamese.trim())}&langpair=vi|en`);
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setEnglish(data.responseData.translatedText.toLowerCase());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const cardsToImport = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const englishWord = row[0] ? String(row[0]).trim() : '';
          const vietnameseWord = row[1] ? String(row[1]).trim() : '';
          if (englishWord && vietnameseWord && englishWord.toLowerCase() !== 'english') {
            cardsToImport.push({ english: englishWord, vietnamese: vietnameseWord });
          }
        }

        if (cardsToImport.length === 0) {
          showModal("Dữ liệu trống!", "Không tìm thấy dữ liệu hợp lệ trong Excel.", "error");
          return;
        }

        const addedCount = await addMultipleFlashcardsToCloud(cardsToImport, category.trim());
        
        if (addedCount === 0) showModal("Đã tồn tại!", `Tất cả các từ đã có trong bộ "${category}".`, "warning");
        else if (addedCount < cardsToImport.length) showModal("Hoàn tất!", `Thêm ${addedCount} từ vào bộ "${category}" (Bỏ qua ${cardsToImport.length - addedCount} từ trùng)`, "success");
        else showModal("Tuyệt vời!", `Thêm ${addedCount} từ vào bộ "${category}"!`, "success");
        
        loadCategories();

      } catch (error: any) {
        showModal("Lỗi", error.message, "error");
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !vietnamese.trim() || !category.trim()) return;

    try {
      setIsTranslating(true);
      await addFlashcardToCloud(english.trim(), vietnamese.trim(), category.trim());
      
      setShowSuccess(true);
      loadCategories(); 
      
      setTimeout(() => {
        setEnglish('');
        setVietnamese('');
        setShowSuccess(false);
      }, 1000);
    } catch (error: any) {
      showModal("Lỗi", error.message, "error");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCreateNewCategory = () => {
    if (newCategoryInput.trim()) {
      setCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      setShowCategoryModal(false);
    }
  };

// --- TASK 2 & 3: HÀM GỌI API AI & LƯU DATABASE (ĐÃ FIX LỖI URL 404) ---
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      showModal("Thiếu thông tin", "Vui lòng nhập chủ đề bạn muốn học!", "warning");
      return;
    }

    setIsGeneratingAi(true);
    const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();

    if (!apiKey) {
      showModal("Lỗi API", "Chưa cấu hình API Key Groq.", "error");
      setIsGeneratingAi(false);
      return;
    }

    try {
      const systemPrompt = `You are a strict JSON data generator. Output ONLY a valid JSON object. No explanations, no markdown formatting.
REQUIRED SCHEMA:
{
  "categoryName": "Tên chủ đề tiếng Việt ngắn gọn",
  "cards": [
    { "english": "word 1", "vietnamese": "nghĩa tiếng Việt 1" },
    { "english": "word 2", "vietnamese": "nghĩa tiếng Việt 2" }
  ]
}`;
      const userPrompt = `Generate exactly ${aiCount} English vocabulary flashcards about: "${aiTopic}".`;

      // 🚀 SỬA Ở ĐÂY: Đã xóa các dấu ngoặc vuông/tròn thừa, đưa về URL chuẩn xác!
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.4, 
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) throw new Error("Lỗi kết nối đến máy chủ AI");

      const data = await response.json();
      let aiResponseText = data.choices[0].message.content.trim();
      
      console.log("🤖 Raw AI Response:", aiResponseText);

      aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedData = JSON.parse(aiResponseText);
      
      const generatedCategory = parsedData.categoryName || parsedData.topic || `AI: ${aiTopic.substring(0, 15)}...`;
      const generatedCards = parsedData.cards || parsedData.flashcards || parsedData.vocabulary || parsedData.data || [];

      if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
        throw new Error("AI không trả về mảng từ vựng nào hợp lệ.");
      }

      const addedCount = await addMultipleFlashcardsToCloud(generatedCards, generatedCategory);

      setShowAiModal(false);
      setAiTopic(''); 
      loadCategories();

      showModal(
        "Thành công! 🎉", 
        `Trợ lý AI đã tạo bộ "${generatedCategory}" với ${addedCount} từ vựng.`, 
        "success"
      );

    } catch (error: any) {
      console.error("Lỗi Generate AI:", error);
      showModal("Lỗi tạo từ vựng", "AI đang quá tải hoặc trả về sai định dạng. Vui lòng thử lại!\nChi tiết: " + error.message, "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 relative">
      <div className="max-w-md mx-auto pt-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <button className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </Link>
          <h1 className="text-xl text-gray-800 font-medium">Create Flashcard</h1>
          <div className="w-12" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          {/* --- NÚT TRIGGER MỞ MODAL AI --- */}
          <button 
            onClick={() => setShowAiModal(true)}
            className="w-full mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg shadow-indigo-200 hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 font-bold"
          >
            <Sparkles className="w-5 h-5" />
            Tạo bộ từ vựng siêu tốc bằng AI
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div 
              onClick={() => setShowCategoryModal(true)}
              className="bg-purple-100/50 hover:bg-purple-100 transition-colors cursor-pointer rounded-2xl p-5 shadow-sm border border-purple-100 flex items-center gap-4 active:scale-95"
            >
              <div className="bg-purple-200 p-3 rounded-xl text-purple-600">
                <FolderOpen size={24} />
              </div>
              <div className="flex-1 text-left">
                <label className="block text-xs font-semibold text-purple-600 uppercase mb-1 cursor-pointer">Bộ từ vựng (Category)</label>
                <div className="text-base text-gray-800 font-medium">{category}</div>
              </div>
              <ChevronDown className="text-purple-400" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm relative border border-gray-50 mt-2">
              <label className="block text-sm font-medium text-gray-500 mb-3">English Word</label>
              <input
                type="text"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                onBlur={translateWord} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); 
                    translateWord();    
                  }
                }}
                placeholder="e.g., universe"
                className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300 pr-10"
              />
              {isTranslating && <Loader2 className="absolute right-6 top-1/2 translate-y-2 w-5 h-5 text-purple-500 animate-spin" />}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 relative">
              <label className="block text-sm font-medium text-gray-500 mb-3">Vietnamese Translation</label>
              <input
                type="text"
                value={vietnamese}
                onChange={(e) => setVietnamese(e.target.value)}
                onBlur={translateToEnglish}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    translateToEnglish();
                  }
                }}
                placeholder="e.g., vũ trụ"
                className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300 pr-10"
              />
              {isTranslating && !english.trim() && <Loader2 className="absolute right-6 top-1/2 translate-y-2 w-5 h-5 text-purple-500 animate-spin" />}
            </div>

            <motion.button
              type="submit"
              disabled={!english.trim() || !vietnamese.trim() || !category.trim() || isTranslating}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-5 shadow-lg shadow-purple-200 disabled:opacity-40 transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2 font-medium">
                {showSuccess ? <><Check className="w-6 h-6" /><span className="text-lg">Added Successfully!</span></> : <><Plus className="w-6 h-6" /><span className="text-lg">Add Flashcard</span></>}
              </div>
            </motion.button>
          </form>

          {/* Import Excel */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-gray-600">Thêm Excel vào bộ: <span className="text-purple-600 font-bold">"{category}"</span></p>
              <p className="text-xs text-gray-500 mt-2">Lưu ý: File Excel phải có hai cột: 'English' ở cột A và 'Vietnamese' ở cột B</p>
            </div>
            <label className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 cursor-pointer ${isImporting ? 'opacity-50' : ''}`}>
              {isImporting ? <Loader2 className="animate-spin w-5 h-5" /> : <FileSpreadsheet size={20} />}
              <span className="font-medium">{isImporting ? 'Đang phân tích...' : 'Chọn file Excel (.xlsx)'}</span>
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
            </label>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
            <button onClick={() => navigate('/')} className="w-full bg-white text-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-95 font-medium border border-gray-100">
              Done & Go Home
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* --- MODAL CHỌN THƯ MỤC CŨ (Giữ nguyên) --- */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Chọn Bộ từ vựng</h2>
                <button onClick={() => setShowCategoryModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-6">
                {categoriesList.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">Chưa có bộ từ vựng nào. Hãy tạo mới ở dưới nhé!</p>
                ) : (
                  categoriesList.map((cat, idx) => (
                    <div 
                      key={idx}
                      onClick={() => { setCategory(cat.name); setShowCategoryModal(false); }}
                      className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all active:scale-95 border-2 ${category === cat.name ? 'bg-purple-50 border-purple-400' : 'bg-gray-50 hover:bg-gray-100 border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <FolderOpen size={20} className={category === cat.name ? 'text-purple-600' : 'text-gray-400'} />
                        <span className={`font-medium ${category === cat.name ? 'text-purple-700' : 'text-gray-700'}`}>{cat.name}</span>
                      </div>
                      <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full shadow-sm text-gray-500">
                        {cat.count} từ
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Tạo thư mục mới</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Nhập tên bộ mới..."
                    className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-200"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateNewCategory()}
                  />
                  <button 
                    onClick={handleCreateNewCategory}
                    disabled={!newCategoryInput.trim()}
                    className="bg-purple-600 text-white p-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    <FolderPlus size={24} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TASK 1 & 2 & 3: MODAL TẠO FLASHCARD BẰNG AI --- */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <Sparkles size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Trợ lý AI</h2>
                </div>
                <button onClick={() => setShowAiModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Bạn muốn học về chủ đề gì?</label>
                  <textarea
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="VD: Tôi sắp đi du lịch Thái Lan, cần các từ vựng về trả giá ở chợ..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-300 resize-none h-28 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-3">Số lượng từ vựng</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => setAiCount(num)}
                        className={`py-3 rounded-xl font-medium border-2 transition-all active:scale-95 ${
                          aiCount === num 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                            : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* --- CẬP NHẬT NÚT BẤM LOADING --- */}
                <button
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAi}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl py-4 shadow-lg font-bold text-lg active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAi ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> Đang tổng hợp dữ liệu...</>
                  ) : (
                    "🚀 Tạo bộ từ (Generate)"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal báo lỗi/thành công giữ nguyên */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
              <div className="flex justify-center mb-4">
                {modalConfig.type === 'success' && <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center"><CheckCircle size={32} /></div>}
                {modalConfig.type === 'warning' && <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center"><AlertTriangle size={32} /></div>}
                {modalConfig.type === 'error' && <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center"><XCircle size={32} /></div>}
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{modalConfig.title}</h2>
              <p className="text-gray-600 mb-6 whitespace-pre-line">{modalConfig.message}</p>
              <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="w-full py-3 text-white rounded-xl font-medium bg-blue-500 active:scale-95">Đã hiểu</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}