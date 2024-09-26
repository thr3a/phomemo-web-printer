const FF = 0x0c;
const NAK = 0x15;
const CAN = 0x18;
const ESC = 0x1b;
const GS = 0x1d;
const US = 0x1f;

const WIDTH = 576;

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('imgFile') as HTMLInputElement;
  fileInput.addEventListener('change', async (event) => {
    loadImage();
    print();
  });

  // 画像ファイルを読み込んでcanvasに描画
  function loadImage() {
    const files = document.getElementById('imgFile').files;
    const reader = new FileReader();
    reader.addEventListener('load', (evt) => {
      const _src = evt.target.result;
      const cvs = document.querySelector('canvas');
      const ctx = cvs.getContext('2d');
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      const gImage = new Image();
      gImage.src = _src;
      gImage.addEventListener(
        'load',
        () => {
          cvs.width = WIDTH; // M02Sの解像度に合わせる
          cvs.height = (WIDTH * gImage.height) / gImage.width;
          ctx.drawImage(gImage, 0, 0, cvs.width, cvs.height);
        },
        false
      );
    });
    reader.readAsDataURL(files[0]);
  }

  // 画像をグレイスケール化
  function toGrayscale(array, width, height) {
    const outputArray = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        for (let dy = 0; dy < 4; ++dy) {
          for (let dx = 0; dx < 4; ++dx) {
            const r = array[((y + dy) * width + (x + dx)) * 4 + 0];
            const g = array[((y + dy) * width + (x + dx)) * 4 + 1];
            const b = array[((y + dy) * width + (x + dx)) * 4 + 2];
            const gray = ((r + g + b) / 3) | 0;
            outputArray[(y + dy) * width + (x + dx)] = gray;
          }
        }
      }
    }
    return outputArray;
  }

  // 画像を誤差拡散で2値化
  function errorDiffusion1CH(u8array, width, height) {
    const errorDiffusionBuffer = new Int16Array(width * height); // 誤差拡散法で元画像+処理誤差を一旦保持するバッファ Uint8だとオーバーフローする
    const outputData = new Uint8Array(width * height);
    for (let i = 0; i < width * height; ++i) errorDiffusionBuffer[i] = u8array[i];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let outputValue;
        let errorValue;
        const currentPositionValue = errorDiffusionBuffer[y * width + x];
        if (currentPositionValue >= 128) {
          outputValue = 255;
          errorValue = currentPositionValue - 255;
        } else {
          outputValue = 0;
          errorValue = currentPositionValue;
        }

        if (x < width - 1) {
          errorDiffusionBuffer[y * width + x + 1] += ((5 * errorValue) / 16) | 0;
        }
        if (0 < x && y < height - 1) {
          errorDiffusionBuffer[(y + 1) * width + x - 1] += ((3 * errorValue) / 16) | 0;
        }
        if (y < height - 1) {
          errorDiffusionBuffer[(y + 1) * width + x] += ((5 * errorValue) / 16) | 0;
        }
        if (x < width - 1 && y < height - 1) {
          errorDiffusionBuffer[(y + 1) * width + x + 1] += ((3 * errorValue) / 16) | 0;
        }
        outputData[y * width + x] = outputValue;
      }
    }
    return outputData;
  }

  // canvas画像をグレイスケール→誤差拡散で2値化
  function getErrorDiffusionImage(cvs) {
    const ctx = cvs.getContext('2d');
    const inputData = ctx.getImageData(0, 0, cvs.width, cvs.height).data;

    const output = ctx.createImageData(cvs.width, cvs.height);
    const outputData = output.data;

    const grayArray = toGrayscale(inputData, cvs.width, cvs.height);
    const funcOutput = errorDiffusion1CH(grayArray, cvs.width, cvs.height);
    for (let y = 0; y < cvs.height; y += 1) {
      for (let x = 0; x < cvs.width; x += 1) {
        const value = funcOutput[y * cvs.width + x];

        outputData[(y * cvs.width + x) * 4 + 0] = value;
        outputData[(y * cvs.width + x) * 4 + 1] = value;
        outputData[(y * cvs.width + x) * 4 + 2] = value;
        outputData[(y * cvs.width + x) * 4 + 3] = 0xff;
      }
    }
    return outputData;
  }

  // canvasの画像データからラスターイメージデータ取得
  function getPrintImage(cvs, start_y) {
    const inputData = getErrorDiffusionImage(cvs);

    if (start_y > cvs.height) return null;

    const height = start_y + 255 < cvs.height ? start_y + 255 : cvs.height;
    const outputArray = new Uint8Array((cvs.width * (height - start_y)) / 8);
    let bytes = 0;
    for (let y = start_y; y < height; y++) {
      for (let x = 0; x < cvs.width; x += 8) {
        let bit8 = 0;
        for (let i = 0; i < 8; i++) {
          const r = inputData[(x + i + y * cvs.width) * 4];
          bit8 |= (r & 0x01) << (7 - i);
        }
        outputArray[bytes] = ~bit8;
        bytes++;
      }
    }

    return outputArray;
  }

  // 印刷処理
  async function print() {
    let port = null;
    let writer = null;
    let reader = null;

    const cvs = document.querySelector('canvas');

    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });

      writer = port.writable.getWriter();

      await writer.write(new Uint8Array([ESC, 0x40, 0x02])); // reset
      await writer.write(new Uint8Array([ESC, 0x40]).buffer); // initialize
      await writer.write(new Uint8Array([ESC, 0x61, 0x01]).buffer); // align center
      await writer.write(new Uint8Array([US, 0x11, 0x37, 0x96]).buffer); // concentration coefficiennt
      await writer.write(new Uint8Array([US, 0x11, 0x02, 0x01]).buffer); // concentration

      // 画像出力
      let start_y = 0;
      while (true) {
        const bit_image = getPrintImage(cvs, start_y); // 255ラインのラスターデータを取得
        if (!bit_image) break;

        const width = cvs.width / 8;
        await writer.write(new Uint8Array([GS, 0x76, 0x30, 0x00])); // image
        await writer.write(new Uint8Array([width & 0x00ff, (width >> 8) & 0x00ff])); // width
        const height = bit_image.length / width;
        await writer.write(new Uint8Array([height & 0x00ff, (height >> 8) & 0x00ff])); // height
        await writer.write(bit_image); // raster bit image

        start_y += height + 1;
      }

      await writer.write(new Uint8Array([ESC, 0x64, 0x03]).buffer); // feed line

      // 印字完了まで待つ
      await writer.write(new Uint8Array([US, 0x11, 0x0e]).buffer); // get device timer
      reader = port.readable.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        console.log('device timer:', value[2]);
        if (value[2] === 0) break;
      }
      reader.releaseLock();
      reader = null;

      await writer.write(new Uint8Array([ESC, 0x40, 0x02])); // reset

      writer.releaseLock();
      writer = null;
      await port.close();
      port = null;

      alert('印刷が完了しました！');
    } catch (error) {
      alert(error);
      if (writer) {
        writer.releaseLock();
      }
      if (reader) {
        reader.releaseLock();
      }
      if (port) {
        await port.close();
      }
    }
  }
});
