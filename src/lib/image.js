const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/**
 * Valida e reduz a imagem no navegador antes do upload: economiza banda,
 * armazenamento e remove metadados EXIF (como localização).
 */
export async function prepareImage(file, { maxSide = 1600, quality = 0.85 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('A imagem passa de 15 MB.');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNGs transparentes não viram preto no JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('Não foi possível processar a imagem.');
  return { blob, width, height };
}

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
