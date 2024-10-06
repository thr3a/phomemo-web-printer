// import { CanvasDither } from './canvas-dither';
// import './style.css';
// import html2canvas from 'html2canvas';

// const WIDTH = 576;
// const ESC = 0x1b;
// const GS = 0x1d;
// const US = 0x1f;

// document.addEventListener('DOMContentLoaded', () => {
//   const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
//   const printBtn = document.getElementById('printBtn') as HTMLButtonElement;
//   const recipt = document.querySelector('.recipt') as HTMLDivElement;
//   const ctx = canvas.getContext('2d');
//   if (!ctx) return;

//   const src = document.querySelector('#src');
//   html2canvas(recipt, {
//     windowWidth: WIDTH,
//     width: WIDTH,
//     // height: recipt.height,
//     scale: 1,
//     useCORS: true
//   }).then((renderedCanvas: HTMLCanvasElement) => {
//     canvas.width = renderedCanvas.width;
//     canvas.height = renderedCanvas.height;
//     ctx.drawImage(renderedCanvas, 0, 0);
//   });

//   printBtn.addEventListener('click', async () => {
//     let port: SerialPort | null = null;
//     let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
//     let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

//     if (!navigator.serial) {
//       alert('Web Serial APIがサポートされていません。');
//       return;
//     }

//     try {
//       port = await navigator.serial.requestPort();
//       await port.open({ baudRate: 115200 });

//       writer = port.writable.getWriter();
//       if (!writer) return;
//       // await writer.write(new Uint8Array([ESC, 0x40, 0x02])); // 不明
//       await writer.write(new Uint8Array([ESC, 0x40])); // initialize
//       await writer.write(new Uint8Array([ESC, 0x61, 0x01])); // align center
//       await writer.write(new Uint8Array([US, 0x11, 0x37, 0x96])); // concentration coefficiennt
//       // 濃度 末尾が1=薄い 3=普通 4=濃い
//       await writer.write(new Uint8Array([US, 0x11, 0x02, 0x01])); // concentration

//       // 画像データを出力
//       let startY = 0;
//       while (true) {
//         const image = ctx.getImageData(0, 0, WIDTH, canvas.height);
//         const bitImage = getPrintImage(image, startY); // 255ライン分のラスターデータを取得
//         if (!bitImage) break;

//         const width = WIDTH / 8;
//         const height = bitImage.length / width;

//         await writer.write(new Uint8Array([GS, 0x76, 0x30, 0x00])); // image command
//         await writer.write(new Uint8Array([width & 0x00ff, (width >> 8) & 0x00ff])); // width
//         await writer.write(new Uint8Array([height & 0x00ff, (height >> 8) & 0x00ff])); // height
//         await writer.write(bitImage); // raster bit image

//         startY += height + 1;
//       }
//       // 改行して印刷
//       await writer.write(new Uint8Array([ESC, 0x64, 0x03])); // 0.3mm(0x03)紙送りする

//       // Get Device Timer
//       await writer.write(new Uint8Array([US, 0x11, 0x0e]));

//       reader = port.readable.getReader();
//       let timerValue = -1; // タイマー値を初期化
//       while (timerValue !== 0) {
//         const { value, done } = await reader.read();

//         if (done) {
//           console.warn('プリンターからの読み取りが完了しました。印字完了を確認できませんでした。');
//           break;
//         }

//         // 受信データからタイマー値を取得
//         timerValue = value[2];
//         console.log('device timer:', timerValue);
//       }

//       // await writer.write(new Uint8Array([ESC, 0x40, 0x02])); // 不明
//       console.log('印刷が完了しました！');
//     } catch (error) {
//       console.error('Error:', error);
//     } finally {
//       if (writer) {
//         writer.releaseLock();
//       }
//       if (reader) {
//         reader.releaseLock();
//       }
//       if (port) {
//         await port.close();
//       }
//     }
//   });
// });

// // 画像をITU-R Rec BT.601標準に基づいてグレイスケール化
// function toGrayscale(imageData: ImageData): ImageData {
//   const data = imageData.data;
//   for (let i = 0; i < data.length; i += 4) {
//     const r = data[i];
//     const g = data[i + 1];
//     const b = data[i + 2];
//     // 輝度の計算 (加重平均法)
//     const gray = 0.299 * r + 0.587 * g + 0.114 * b;
//     data[i] = data[i + 1] = data[i + 2] = gray;
//   }
//   return imageData;
// }

// function loadImage(file: File): Promise<HTMLImageElement> {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.onload = () => resolve(img);
//     img.onerror = reject;
//     img.src = URL.createObjectURL(file);
//   });
// }

// // ImageDataから2値化したラスターデータを取得する関数
// function getPrintImage(imageData: ImageData, startY: number): Uint8Array | null {
//   const width = imageData.width;
//   const height = Math.min(255, imageData.height - startY); // 最大255ライン

//   if (height <= 0) {
//     return null; // 出力するデータがない
//   }

//   const data = imageData.data;
//   const printData = new Uint8Array((width * height) / 8);

//   for (let y = 0; y < height; y++) {
//     for (let x = 0; x < width; x++) {
//       const i = ((startY + y) * width + x) * 4;
//       const pixelIndex = y * width + x;
//       const byteIndex = Math.floor(pixelIndex / 8);
//       const bitIndex = pixelIndex % 8;

//       if (data[i] < 128) {
//         // 閾値を128として2値化
//         printData[byteIndex] |= 1 << (7 - bitIndex); // ビット反転 (黒を1にする)
//       }
//     }
//   }

//   return printData;
// }
