export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_WIDTH = 2000;
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // Safety net: if still >4.5MB, re-compress at lower quality
          if (blob.size > 4.5 * 1024 * 1024) {
            const canvas2 = document.createElement("canvas");
            const MAX_WIDTH2 = 1500;
            let w2 = width, h2 = height;
            if (w2 > MAX_WIDTH2) {
              h2 = Math.round((h2 * MAX_WIDTH2) / w2);
              w2 = MAX_WIDTH2;
            }
            canvas2.width = w2;
            canvas2.height = h2;
            const ctx2 = canvas2.getContext("2d")!;
            ctx2.drawImage(img, 0, 0, w2, h2);
            canvas2.toBlob(
              (blob2) => {
                if (!blob2) { resolve(file); return; }
                const newName = file.name.replace(/\.[^.]+$/, ".jpg");
                resolve(new File([blob2], newName, { type: "image/jpeg" }));
              },
              "image/jpeg",
              0.65
            );
          } else {
            const newName = file.name.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([blob], newName, { type: "image/jpeg" }));
          }
        },
        "image/jpeg",
        0.82
      );
    };
    img.src = url;
  });
}
