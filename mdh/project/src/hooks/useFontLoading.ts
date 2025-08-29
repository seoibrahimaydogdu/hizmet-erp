import { useState, useEffect } from 'react';

export const useFontLoading = () => {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    // Inter font'unun yüklenip yüklenmediğini kontrol et
    const checkFont = () => {
      if ('fonts' in document) {
        document.fonts.load('400 16px Inter').then(() => {
          setFontsReady(true);
          document.body.classList.add('fonts-ready');
        }).catch(() => {
          // Font yüklenemezse varsayılan fontları kullan
          setFontsReady(true);
        });
      } else {
        // Fallback: 1 saniye sonra fontların hazır olduğunu varsay
        setTimeout(() => {
          setFontsReady(true);
          document.body.classList.add('fonts-ready');
        }, 1000);
      }
    };

    checkFont();
  }, []);

  return fontsReady;
};
