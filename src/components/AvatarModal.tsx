import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Upload, XCircle, Loader2, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
// 👉 IMPORT HÀM CẮT ẢNH (Từ file tiện ích ta đã tạo)
import getCroppedImg from '../utils/cropImage';

interface AvatarModalProps {
  isOpen: boolean;
  categoryName: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSelectSystemAvatar: (emoji: string) => void;
  onUploadCustomAvatar?: (blob: Blob) => void; 
}

export default function AvatarModal({ 
  isOpen, 
  categoryName, 
  isSaving, 
  onClose, 
  onSelectSystemAvatar,
  onUploadCustomAvatar // 👉 Nhận ống dẫn dữ liệu từ file manage.tsx
}: AvatarModalProps) {
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const systemAvatars = ["🍎", "🐶", "💻", "✈️", "🏀", "🍔", "🎸", "📚", "🚀", "💡", "🎨", "🌍"];

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onClose();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = URL.createObjectURL(file);
      setImageSrc(imageDataUrl);
    }
    
    e.target.value = ''; 
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 👉 HÀM MỚI: Xử lý cắt ảnh và đẩy lên Component cha
  const handleCropImage = async () => {
    if (!imageSrc || !croppedAreaPixels || !onUploadCustomAvatar) return;
    
    try {
      // 1. Chạy hàm cắt ảnh
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // 2. Nếu cắt thành công, đẩy qua ống nước về manage.tsx
      if (croppedBlob) {
        onUploadCustomAvatar(croppedBlob);
      }
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi xử lý ảnh!");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && categoryName && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center sm:p-4"
        >
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} 
            className={`bg-white rounded-t-3xl sm:rounded-3xl w-full transition-all duration-300 shadow-2xl relative overflow-hidden ${
              imageSrc ? 'max-w-lg p-0' : 'max-w-md p-6'
            }`}
          >
            {isSaving && (
              <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-3xl">
                <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
              </div>
            )}

            {!imageSrc ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><ImageIcon size={24} /></div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">Ảnh đại diện</h2>
                      <p className="text-xs text-gray-500 font-medium">Bộ: <span className="text-indigo-600">{categoryName}</span></p>
                    </div>
                  </div>
                  <button onClick={handleClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <label htmlFor="avatar-upload-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl cursor-pointer transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-indigo-500" /></div>
                      <p className="text-sm font-semibold text-indigo-600">Tải ảnh của bạn lên</p>
                      <p className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG (Tỉ lệ 1:1)</p>
                    </div>
                    <input id="avatar-upload-input" type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                  </label>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Hoặc chọn nhanh Icon:</p>
                  <div className="grid grid-cols-4 gap-3">
                    {systemAvatars.map((emoji, idx) => (
                      <button key={idx} onClick={() => onSelectSystemAvatar(emoji)} className="aspect-square text-3xl bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm">{emoji}</button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col h-[500px]">
                <div className="relative flex-1 bg-gray-900 w-full">
                  <Cropper
                    image={imageSrc} crop={crop} zoom={zoom} aspect={1}
                    onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom}
                  />
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Thu phóng:</span>
                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setImageSrc(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                      Chọn ảnh khác
                    </button>
                    {/* 👉 ĐÃ THAY MOCK ALERT BẰNG HÀM XỬ LÝ THẬT */}
                    <button onClick={handleCropImage} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 shadow-indigo-200 flex items-center justify-center gap-2 transition-colors">
                      <Check size={20} />
                      Cắt & Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}