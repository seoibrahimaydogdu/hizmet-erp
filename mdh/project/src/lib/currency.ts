// Para birimi seçenekleri
export const CURRENCIES = {
  TRY: { code: 'TRY', symbol: '₺', name: 'Türk Lirası', locale: 'tr-TR' },
  USD: { code: 'USD', symbol: '$', name: 'Amerikan Doları', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' }
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// Para birimi formatlama fonksiyonu - Tutarlı sembol kullanımı
export const formatCurrency = (amount: number, currencyCode: CurrencyCode = 'TRY'): string => {
  const currency = CURRENCIES[currencyCode];
  
  // Kuruş kontrolü - eğer tam sayı ise kuruş gösterme
  const isWholeNumber = amount % 1 === 0;
  
  if (isWholeNumber) {
    // Tam sayı için format: "₺1.000" şeklinde
    const formattedNumber = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    
    return `${currency.symbol}${formattedNumber}`;
  } else {
    // Kuruşlu sayı için format: "₺1.000,00" şeklinde
    const formattedNumber = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return `${currency.symbol}${formattedNumber}`;
  }
};

// Promosyon için özel formatlama fonksiyonu (sembol olmadan)
export const formatCurrencyForPromotion = (amount: number, currencyCode: CurrencyCode = 'TRY'): string => {
  const currency = CURRENCIES[currencyCode];
  
  // Kuruş kontrolü - eğer tam sayı ise kuruş gösterme
  const isWholeNumber = amount % 1 === 0;
  
  if (isWholeNumber) {
    // Tam sayı için format: "1.000" şeklinde (sembol olmadan)
    const formattedNumber = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    
    return formattedNumber;
  } else {
    // Kuruşlu sayı için format: "1.000,00" şeklinde (sembol olmadan)
    const formattedNumber = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return formattedNumber;
  }
};

// Para birimi sembolü alma fonksiyonu
export const getCurrencySymbol = (currencyCode: CurrencyCode = 'TRY'): string => {
  return CURRENCIES[currencyCode].symbol;
};

// Para birimi adı alma fonksiyonu
export const getCurrencyName = (currencyCode: CurrencyCode = 'TRY'): string => {
  return CURRENCIES[currencyCode].name;
};

// Para birimi seçenekleri listesi
export const getCurrencyOptions = () => {
  return Object.entries(CURRENCIES).map(([code, currency]) => ({
    code,
    symbol: currency.symbol,
    name: currency.name
  }));
};
