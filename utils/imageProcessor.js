// Image processing utilities
class ImageProcessor {
  static async compressImage(dataUrl, maxWidth = 1024, quality = 0.8) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Only resize if image is wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  }

  static getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = dataUrl;
    });
  }

  static async optimizeForAPI(dataUrl, maxWidth = 1024, maxSizeKB = 500) {
    // 1st: Compress only if width is above maxWidth
    const initialDimensions = await this.getImageDimensions(dataUrl);
    let stepDataUrl = dataUrl;

    if (initialDimensions.width > maxWidth) {
      stepDataUrl = await this.compressImage(dataUrl, maxWidth, 0.85);
    }

    // Base64 estimation
    let sizeKB = (stepDataUrl.length * 3) / 4 / 1024;

    // 2nd: Only further compress if really over budget
    if (sizeKB > maxSizeKB) {
      // Shrink more but maintain ratio (choose new width)
      // Calculate smaller maxWidth based on ratio
      const reduceToWidth = Math.max(600, Math.floor(maxWidth * 0.8));
      stepDataUrl = await this.compressImage(stepDataUrl, reduceToWidth, 0.7);

      // Re-estimate size
      sizeKB = (stepDataUrl.length * 3) / 4 / 1024;
    }

    return stepDataUrl;
  }
}

// Make it available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageProcessor;
} else {
  window.ImageProcessor = ImageProcessor;
}