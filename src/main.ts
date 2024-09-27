import { CanvasDither } from './canvas-dither';

const WIDTH = 576;

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('imgFile') as HTMLInputElement;
  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  fileInput.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    // 画像をロード
    const image = await loadImage(file);

    // アスペクト比を維持したまま幅をWIDTHにリサイズ
    const aspectRatio = image.height / image.width;
    const height = Math.round(WIDTH * aspectRatio);
    // キャンバスのサイズをM02Sの解像度に合わせる
    canvas.width = WIDTH;
    canvas.height = height;

    // 画像をキャンバスに描画
    ctx.drawImage(image, 0, 0, WIDTH, height);
    // グレースケールに変換
    const originImageData = ctx.getImageData(0, 0, WIDTH, height);
    const monoImageData = toGrayscale(originImageData);
    ctx.putImageData(monoImageData, 0, 0);
    // 2値化
    const NichiImageData = new CanvasDither().floydsteinberg(monoImageData);
    ctx.putImageData(NichiImageData, 0, 0);
  });

  // 画像をITU-R Rec BT.601標準に基づいてグレイスケール化
  function toGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // 輝度の計算 (加重平均法)
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    return imageData;
  }

  // 画像をロードする関数
  function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
});
