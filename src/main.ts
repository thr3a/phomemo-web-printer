document.addEventListener('DOMContentLoaded', () => {
  // HTMLの要素を取得
  const fileInput = document.getElementById('imgFile') as HTMLInputElement;
  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  fileInput.addEventListener('change', async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        // 画像をロード
        const image = await loadImage(file);

        // キャンバスのサイズを画像に合わせる
        canvas.width = image.width;
        canvas.height = image.height;

        // 画像をキャンバスに描画
        ctx?.drawImage(image, 0, 0);
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
