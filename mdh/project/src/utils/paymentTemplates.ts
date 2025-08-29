// Ödeme Takibi Otomatik Hatırlatma Template'leri

export interface PaymentTemplate {
  id: string;
  title: string;
  template: string;
  variables: string[];
  category: 'reminder' | 'warning' | 'urgent' | 'final';
  daysAfterDue: number;
}

export const paymentTemplates: PaymentTemplate[] = [
  // İlk Hatırlatma (Vade tarihinden 3 gün sonra)
  {
    id: 'first_reminder',
    title: 'İlk Hatırlatma - Nazik Uyarı',
    template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Ödemenizi en kısa sürede yapmanızı rica ederiz. Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.

Teşekkürler,
{şirket_adı}`,
    variables: ['müşteri_adı', 'ödeme_tutari', 'fatura_no', 'vade_tarihi', 'şirket_adı'],
    category: 'reminder',
    daysAfterDue: 3
  },

  // İkinci Hatırlatma (Vade tarihinden 7 gün sonra)
  {
    id: 'second_reminder',
    title: 'İkinci Hatırlatma - Önemli Uyarı',
    template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Bu durumun devam etmesi durumunda gecikme faizi uygulanabilir. Lütfen ödemenizi acilen yapınız.

Ödeme seçenekleri:
- Banka havalesi: {banka_hesap_bilgileri}
- Online ödeme: {ödeme_linki}

Sorularınız için: {iletişim_bilgileri}

Saygılarımızla,
{şirket_adı}`,
    variables: ['müşteri_adı', 'ödeme_tutari', 'fatura_no', 'vade_tarihi', 'banka_hesap_bilgileri', 'ödeme_linki', 'iletişim_bilgileri', 'şirket_adı'],
    category: 'warning',
    daysAfterDue: 7
  },

  // Acil Hatırlatma (Vade tarihinden 15 gün sonra)
  {
    id: 'urgent_reminder',
    title: 'Acil Hatırlatma - Son Uyarı',
    template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Bu durum ciddi bir ödeme gecikmesi oluşturmaktadır. Gecikme faizi uygulanmaya başlanmıştır.

Güncel tutar: {güncel_tutar} TL (Gecikme faizi dahil)

Lütfen ödemenizi 48 saat içinde yapınız. Aksi takdirde yasal işlem başlatılacaktır.

Ödeme seçenekleri:
- Banka havalesi: {banka_hesap_bilgileri}
- Online ödeme: {ödeme_linki}

Acil iletişim: {acil_iletişim}

Saygılarımızla,
{şirket_adı}`,
    variables: ['müşteri_adı', 'ödeme_tutari', 'fatura_no', 'vade_tarihi', 'güncel_tutar', 'banka_hesap_bilgileri', 'ödeme_linki', 'acil_iletişim', 'şirket_adı'],
    category: 'urgent',
    daysAfterDue: 15
  },

  // Son Uyarı (Vade tarihinden 30 gün sonra)
  {
    id: 'final_warning',
    title: 'Son Uyarı - Yasal İşlem',
    template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın vade tarihi {vade_tarihi} olup, ödemeniz henüz alınamamıştır.

Bu durum 30 gündür devam etmektedir ve ciddi bir ödeme gecikmesi oluşturmaktadır.

Güncel tutar: {güncel_tutar} TL (Gecikme faizi ve yasal masraflar dahil)

Bu son uyarıdır. Ödemenizi 24 saat içinde yapmamanız durumunda:
- Yasal işlem başlatılacaktır
- Avukatlık masrafları eklenebilir
- Kredi notunuz etkilenebilir

Ödeme seçenekleri:
- Banka havalesi: {banka_hesap_bilgileri}
- Online ödeme: {ödeme_linki}

Son fırsat için: {acil_iletişim}

Saygılarımızla,
{şirket_adı}
Hukuk Departmanı`,
    variables: ['müşteri_adı', 'ödeme_tutari', 'fatura_no', 'vade_tarihi', 'güncel_tutar', 'banka_hesap_bilgileri', 'ödeme_linki', 'acil_iletişim', 'şirket_adı'],
    category: 'final',
    daysAfterDue: 30
  },

  // Ödeme Planı Teklifi
  {
    id: 'payment_plan_offer',
    title: 'Ödeme Planı Teklifi',
    template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın ödenmesinde yaşadığınız zorlukları anlıyoruz.

Size özel ödeme planı teklifimiz:
- Toplam tutar: {güncel_tutar} TL
- Taksit sayısı: {taksit_sayısı}
- Aylık taksit: {aylık_taksit} TL
- İlk ödeme: {ilk_ödeme_tarihi}

Bu teklifi kabul etmeniz durumunda gecikme faizi durdurulacak ve yasal işlem başlatılmayacaktır.

Ödeme planını kabul etmek için: {ödeme_planı_linki}

Sorularınız için: {iletişim_bilgileri}

Saygılarımızla,
{şirket_adı}`,
    variables: ['müşteri_adı', 'ödeme_tutari', 'fatura_no', 'güncel_tutar', 'taksit_sayısı', 'aylık_taksit', 'ilk_ödeme_tarihi', 'ödeme_planı_linki', 'iletişim_bilgileri', 'şirket_adı'],
    category: 'reminder',
    daysAfterDue: 10
  },

  // Ödeme Alındı Bildirimi
  {
    id: 'payment_received',
    title: 'Ödeme Alındı Bildirimi',
    template: `Sayın {müşteri_adı},

{ödeme_tutari} TL tutarındaki {fatura_no} numaralı faturanızın ödemesi başarıyla alınmıştır.

Ödeme detayları:
- Ödeme tarihi: {ödeme_tarihi}
- Ödeme tutarı: {ödeme_tutari} TL
- Ödeme yöntemi: {ödeme_yöntemi}
- Makbuz no: {makbuz_no}

Teşekkür ederiz. Gelecekte de hizmetinizde olmaktan mutluluk duyarız.

Saygılarımızla,
{şirket_adı}`,
    variables: ['müşteri_adı', 'ödeme_tutari', 'fatura_no', 'ödeme_tarihi', 'ödeme_yöntemi', 'makbuz_no', 'şirket_adı'],
    category: 'reminder',
    daysAfterDue: 0
  }
];

// Template değişkenlerini doldurma fonksiyonu
export function fillTemplate(template: string, variables: Record<string, string>): string {
  let filledTemplate = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return filledTemplate;
}

// Gecikme gününe göre uygun template seçme
export function getTemplateByDaysOverdue(daysOverdue: number): PaymentTemplate | null {
  const templates = paymentTemplates
    .filter(t => t.category !== 'final') // Ödeme alındı template'ini hariç tut
    .sort((a, b) => a.daysAfterDue - b.daysAfterDue);
  
  // En uygun template'i bul
  for (let i = templates.length - 1; i >= 0; i--) {
    if (daysOverdue >= templates[i].daysAfterDue) {
      return templates[i];
    }
  }
  
  return null;
}

// Template kategorilerine göre filtreleme
export function getTemplatesByCategory(category: PaymentTemplate['category']): PaymentTemplate[] {
  return paymentTemplates.filter(t => t.category === category);
}

// Varsayılan değişken değerleri
export const defaultVariables = {
  şirket_adı: 'WorkExe',
  banka_hesap_bilgileri: 'TR12 3456 7890 1234 5678 9012 34\nBanka: Örnek Bank\nIBAN: TR12 3456 7890 1234 5678 9012 34',
  ödeme_linki: 'https://workexe.co/odeme',
  iletişim_bilgileri: 'Tel: +90 212 123 45 67\nE-posta: info@workexe.co',
  acil_iletişim: 'Tel: +90 212 123 45 67 (Acil)\nE-posta: odeme@workexe.co',
  ödeme_planı_linki: 'https://workexe.co/odeme-plani',
  taksit_sayısı: '3',
  aylık_taksit: '0',
  ilk_ödeme_tarihi: '15 gün sonra',
  ödeme_yöntemi: 'Banka Havalesi',
  makbuz_no: 'MB-2024-001'
};
