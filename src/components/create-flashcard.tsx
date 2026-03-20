import { useState } from 'react';
import { ArrowLeft, Check, Plus, Loader2, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { addFlashcardToCloud, addMultipleFlashcardsToCloud } from '../data/vocabulary';

export default function CreateFlashcard() {
  const navigate = useNavigate();
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // --- STATE CHO MODAL THÔNG BÁO XỊN XÒ ---
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success' // 'success' | 'warning' | 'error'
  });

  // Hàm mở Modal
  const showModal = (title: string, message: string, type: 'success' | 'warning' | 'error') => {
    setModalConfig({ isOpen: true, title, message, type });
  };

  const translateWord = async () => {
    if (!english.trim() || vietnamese.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(english.trim())}&langpair=en|vi`
      );
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        setVietnamese(data.responseData.translatedText.toLowerCase());
      }
    } catch (error) {
      console.error("Lỗi khi gọi API dịch:", error);
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
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const cardsToImport = [];
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const englishWord = row[0] ? String(row[0]).trim() : '';
          const vietnameseWord = row[1] ? String(row[1]).trim() : '';

          if (englishWord && vietnameseWord && englishWord.toLowerCase() !== 'english') {
            cardsToImport.push({
              english: englishWord,
              vietnamese: vietnameseWord
            });
          }
        }

        if (cardsToImport.length === 0) {
          showModal("Dữ liệu trống!", "Không tìm thấy dữ liệu hợp lệ trong file Excel. (Cột A: Tiếng Anh, Cột B: Tiếng Việt)", "error");
          setIsImporting(false);
          return;
        }

        const addedCount = await addMultipleFlashcardsToCloud(cardsToImport);
        
        // --- GỌI MODAL THAY CHO ALERT ---
        if (addedCount === 0) {
          showModal("Đã tồn tại!", "Tất cả các từ trong file Excel này đã có trong kho của bạn. Không có từ mới nào được thêm.", "warning");
        } else if (addedCount < cardsToImport.length) {
          showModal("Hoàn tất!", `Đã thêm thành công ${addedCount} từ vựng mới!\n(Đã tự động bỏ qua ${cardsToImport.length - addedCount} từ trùng lặp)`, "success");
        } else {
          showModal("Tuyệt vời!", `Đã thêm thành công toàn bộ ${addedCount} từ vựng!`, "success");
        }
        
      } catch (error: any) {
        console.error("Lỗi chi tiết:", error);
        showModal("Có lỗi xảy ra", error.message || "Không thể đọc file hoặc lưu dữ liệu.", "error");
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !vietnamese.trim()) return;

    try {
      setIsTranslating(true);
      await addFlashcardToCloud(english.trim(), vietnamese.trim());
      setShowSuccess(true);
      setTimeout(() => {
        setEnglish('');
        setVietnamese('');
        setShowSuccess(false);
      }, 1000);
    } catch (error: any) {
      showModal("Lỗi lưu dữ liệu", error.message || "Không thể lưu thẻ này.", "error");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 relative">
      <div className="max-w-md mx-auto pt-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <button className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </Link>
          <h1 className="text-xl text-gray-800 font-medium">Create Flashcard</h1>
          <div className="w-12" />
        </div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm relative border border-gray-50">
              <label className="block text-sm font-medium text-gray-500 mb-3">English Word</label>
              <input
                type="text"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                onBlur={translateWord}
                placeholder="e.g., universe"
                className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300 pr-10"
                autoFocus
              />
              {isTranslating && (
                 <div className="absolute right-6 top-1/2 translate-y-2">
                   <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                 </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
              <label className="block text-sm font-medium text-gray-500 mb-3">Vietnamese Translation</label>
              <input
                type="text"
                value={vietnamese}
                onChange={(e) => setVietnamese(e.target.value)}
                placeholder="e.g., vũ trụ"
                className="w-full text-lg text-gray-800 bg-transparent border-none outline-none placeholder-gray-300"
              />
            </div>

            <motion.button
              type="submit"
              disabled={!english.trim() || !vietnamese.trim() || isTranslating}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-5 shadow-lg shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2 font-medium">
                {showSuccess ? (
                  <>
                    <Check className="w-6 h-6" />
                    <span className="text-lg">Added Successfully!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    <span className="text-lg">Add Flashcard</span>
                  </>
                )}
              </div>
            </motion.button>
          </form>

          {/* Import Excel */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-gray-600">Hoặc thêm hàng loạt từ Excel</p>
              <p className="text-xs text-gray-400 mt-1">Cột A: Tiếng Anh - Cột B: Tiếng Việt</p>
            </div>
            
            <label className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isImporting ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <FileSpreadsheet size={20} />
              )}
              <span className="font-medium">
                {isImporting ? 'Đang phân tích dữ liệu...' : 'Chọn file Excel (.xlsx)'}
              </span>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={isImporting}
              />
            </label>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white text-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 font-medium border border-gray-100"
            >
              Done & Go Home
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* --- GIAO DIỆN MODAL XỊN XÒ --- */}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="flex justify-center mb-4">
                {modalConfig.type === 'success' && <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center"><CheckCircle size={32} /></div>}
                {modalConfig.type === 'warning' && <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center"><AlertTriangle size={32} /></div>}
                {modalConfig.type === 'error' && <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center"><XCircle size={32} /></div>}
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2">{modalConfig.title}</h2>
              <p className="text-gray-600 mb-6 whitespace-pre-line leading-relaxed">
                {modalConfig.message}
              </p>

              <button
                onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                className={`w-full py-3 text-white rounded-xl font-medium transition-colors shadow-lg active:scale-95 ${
                  modalConfig.type === 'success' ? 'bg-green-500 hover:bg-green-600 shadow-green-200' :
                  modalConfig.type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' :
                  'bg-red-500 hover:bg-red-600 shadow-red-200'
                }`}
              >
                Đã hiểu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}