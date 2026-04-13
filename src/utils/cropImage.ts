// File: src/utils/cropImage.ts

// Hàm phụ trợ: Chuyển đổi URL ảnh thành HTMLImageElement để Canvas có thể đọc
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Tránh lỗi CORS khi tải ảnh từ domain khác
    image.src = url;
  });

// Hàm chính: Nhận vào link ảnh tạm và tọa độ vùng cắt, trả về một Blob (File ảnh) đã được cắt
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Đặt kích thước cho Canvas bằng đúng vùng người dùng muốn cắt
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // "Vẽ" phần ảnh được cắt lên Canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Xuất Canvas ra dạng Blob (định dạng ảnh JPEG, chất lượng 90%)
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg', 0.9);
  });
}