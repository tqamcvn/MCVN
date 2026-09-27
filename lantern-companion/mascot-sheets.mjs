// Detect occupied pixels per cell; never publish clipped, empty or opaque sheets.
export function measureFrames(data, width, height) {
  if (width !== 1024 || height !== 1536 || data.length !== width * height * 4) throw new Error('Ảnh không đúng kích thước bộ mascot.');
  const frames = [];
  for (let row = 0; row < 6; row++) for (let col = 0; col < 3; col++) {
    const left = Math.round(col * width / 3), right = Math.round((col + 1) * width / 3), top = row * 256, bottom = top + 256;
    let x0 = right, y0 = bottom, x1 = left, y1 = top, count = 0;
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      if (data[(y * width + x) * 4 + 3] > 32) { x0 = Math.min(x0,x); x1 = Math.max(x1,x); y0 = Math.min(y0,y); y1 = Math.max(y1,y); count++; }
    }
    if (count < 100 || x0 <= left + 1 || x1 >= right - 2 || y0 <= top + 1 || y1 >= bottom - 2) throw new Error('Một số khung hình bị thiếu, cắt mép hoặc chưa trong suốt. Hãy tạo lại với mô tả đơn giản hơn.');
    frames.push({ x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  }
  const heights = frames.map(f => f.height).sort((a,b) => a-b);
  if (heights[17] / heights[0] > 1.5) throw new Error('Các khung hình lệch kích thước quá nhiều. Hãy tạo lại mascot.');
  return frames;
}

export async function buildSheets(blob) {
  const bitmap = await createImageBitmap(blob);
  try {
    if (bitmap.width !== 1024 || bitmap.height !== 1536) throw new Error('Ảnh không đúng kích thước bộ mascot.');
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bitmap,0,0);
    const frames = measureFrames(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
    const scale = Math.min(204 / Math.max(...frames.map(f => f.width)), 204 / Math.max(...frames.map(f => f.height)));
    const sheets = [];
    for (let sheet = 0; sheet < 2; sheet++) {
      const out = document.createElement('canvas'); out.width = out.height = 768;
      const target = out.getContext('2d');
      frames.slice(sheet*9,sheet*9+9).forEach((f,i) => {
        const w = Math.round(f.width*scale), h = Math.round(f.height*scale);
        target.drawImage(bitmap, f.x,f.y,f.width,f.height, (i%3)*256 + Math.round((256-w)/2), Math.floor(i/3)*256+230-h, w,h);
      });
      const output = await new Promise(resolve => out.toBlob(resolve,'image/png'));
      if (!output) throw new Error('Trình duyệt chưa xử lý được ảnh.');
      sheets.push(output);
    }
    return { directions: sheets[0], reactions: sheets[1] };
  } finally { bitmap.close(); }
}
