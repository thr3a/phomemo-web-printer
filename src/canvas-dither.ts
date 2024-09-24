export class CanvasDither {
  grayscale(image: ImageData): ImageData {
    for (let i = 0; i < image.data.length; i += 4) {
      const luminance: number = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
      image.data.fill(luminance, i, i + 3);
    }
    return image;
  }

  threshold(image: ImageData, threshold: number): ImageData {
    for (let i = 0; i < image.data.length; i += 4) {
      const luminance: number = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
      const value: number = luminance < threshold ? 0 : 255;
      image.data.fill(value, i, i + 3);
    }
    return image;
  }

  bayer(image: ImageData, threshold: number): ImageData {
    const thresholdMap: number[][] = [
      [15, 135, 45, 165],
      [195, 75, 225, 105],
      [60, 180, 30, 150],
      [240, 120, 210, 90]
    ];

    for (let i = 0; i < image.data.length; i += 4) {
      const luminance: number = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
      const x: number = (i / 4) % image.width;
      const y: number = Math.floor(i / 4 / image.width);
      const map: number = Math.floor((luminance + thresholdMap[x % 4][y % 4]) / 2);
      const value: number = map < threshold ? 0 : 255;
      image.data.fill(value, i, i + 3);
    }
    return image;
  }

  floydsteinberg(image: ImageData): ImageData {
    const width: number = image.width;
    const luminance: Uint8ClampedArray = new Uint8ClampedArray(image.width * image.height);

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value: number = luminance[l] < 129 ? 0 : 255;
      const error: number = Math.floor((luminance[l] - value) / 16);
      image.data.fill(value, i, i + 3);
      luminance[l + 1] += error * 7;
      luminance[l + width - 1] += error * 3;
      luminance[l + width] += error * 5;
      luminance[l + width + 1] += error * 1;
    }
    return image;
  }

  atkinson(image: ImageData): ImageData {
    const width: number = image.width;
    const luminance: Uint8ClampedArray = new Uint8ClampedArray(image.width * image.height);

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] = image.data[i] * 0.299 + image.data[i + 1] * 0.587 + image.data[i + 2] * 0.114;
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value: number = luminance[l] < 129 ? 0 : 255;
      const error: number = Math.floor((luminance[l] - value) / 8);
      image.data.fill(value, i, i + 3);
      luminance[l + 1] += error;
      luminance[l + 2] += error;
      luminance[l + width - 1] += error;
      luminance[l + width] += error;
      luminance[l + width + 1] += error;
      luminance[l + 2 * width] += error;
    }
    return image;
  }
}
