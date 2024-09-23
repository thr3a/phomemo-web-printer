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
    if (file) {
      try {
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
        // TODO: グレースケールにする
        // グレースケールに変換
        const imageData = ctx.getImageData(0, 0, WIDTH, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg; // 赤
          data[i + 1] = avg; // 緑
          data[i + 2] = avg; // 青
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.error('画像の読み込みに失敗しました', error);
      }
    }
  });

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
