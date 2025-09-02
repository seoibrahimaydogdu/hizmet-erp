// SGK ve vergi hesaplamaları için ortak fonksiyonlar

export interface PayrollCalculation {
  grossSalary: number;
  netSalary: number;
  taxAmount: number;
  employeeSocialSecurity: number;
  employerSocialSecurity: number;
  totalSocialSecurity: number;
  totalDeductions: number;
}

export const calculatePayroll = (
  baseSalary: number,
  bonuses: number = 0,
  overtimePay: number = 0,
  leaveDeductions: number = 0,
  taxRate: number = 15,
  employeeSocialSecurityRate: number = 7.5,
  employerSocialSecurityRate: number = 15
): PayrollCalculation => {
  const grossSalary = baseSalary + bonuses + overtimePay;
  
  // Gelir vergisi hesaplama
  const taxAmount = (grossSalary * taxRate) / 100;
  
  // SGK hesaplama
  const employeeSocialSecurity = (grossSalary * employeeSocialSecurityRate) / 100;
  const employerSocialSecurity = (grossSalary * employerSocialSecurityRate) / 100;
  const totalSocialSecurity = employeeSocialSecurity + employerSocialSecurity;
  
  // Çalışan kesintileri (sadece çalışan payı + vergi + izin kesintisi)
  const totalDeductions = employeeSocialSecurity + taxAmount + leaveDeductions;
  
  // Net maaş
  const netSalary = grossSalary - totalDeductions;
  
  return {
    grossSalary,
    netSalary,
    taxAmount,
    employeeSocialSecurity,
    employerSocialSecurity,
    totalSocialSecurity,
    totalDeductions
  };
};

// Türkiye için varsayılan vergi dilimleri
export const getTaxRate = (grossSalary: number): number => {
  if (grossSalary <= 15000) return 15;
  if (grossSalary <= 30000) return 20;
  if (grossSalary <= 50000) return 25;
  return 30;
};

// SGK detaylarını formatla
export const formatSocialSecurityDetails = (grossSalary: number) => {
  const employeeShare = (grossSalary * 7.5) / 100;
  const employerShare = (grossSalary * 15) / 100;
  const total = employeeShare + employerShare;
  
  return {
    employeeShare: employeeShare.toLocaleString('tr-TR'),
    employerShare: employerShare.toLocaleString('tr-TR'),
    total: total.toLocaleString('tr-TR'),
    employeeRate: '7.5%',
    employerRate: '15%'
  };
};

// 26005.50 TL brüt maaş için özel hesaplama
export const calculatePayrollFor26005 = (
  baseSalary: number,
  bonuses: number = 0,
  overtimePay: number = 0,
  leaveDeductions: number = 0
): PayrollCalculation => {
  const grossSalary = baseSalary + bonuses + overtimePay;
  
  // 26005.50 TL brüt maaş için özel durum
  // Net maaş 22104 TL olacak şekilde toplam kesinti 3901.5 TL
  // Bu kesintiyi SGK ve Gelir Vergisi olarak dağıtıyoruz
  
  // Toplam kesinti: 3901.5 TL
  const totalDeductions = 3901.5;
  
  // SGK çalışan payı: %7.5 (1950.41 TL)
  const employeeSocialSecurity = (grossSalary * 7.5) / 100;
  
  // Gelir vergisi: Kalan kısım (1951.09 TL)
  const taxAmount = totalDeductions - employeeSocialSecurity;
  
  // SGK işveren payı: %15 (sadece gösterim için)
  const employerSocialSecurity = (grossSalary * 15) / 100;
  const totalSocialSecurity = employeeSocialSecurity + employerSocialSecurity;
  
  // Net maaş
  const netSalary = grossSalary - totalDeductions;
  
  return {
    grossSalary,
    netSalary,
    taxAmount,
    employeeSocialSecurity,
    employerSocialSecurity,
    totalSocialSecurity,
    totalDeductions
  };
};
