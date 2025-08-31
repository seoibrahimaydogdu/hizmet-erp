import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Plus,
  TrendingUp,
  Calendar,
  User,
  Building,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  Target,
  Zap,
  Globe,
  Shield,
  FileSpreadsheet,
  Settings,
  Trash2,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  period: string; // YYYY-MM formatında
  base_salary: number;
  gross_salary: number;
  net_salary: number;
  tax_amount: number;
  social_security: number;
  other_deductions: number;
  bonuses: number;
  overtime_pay: number;
  leave_deductions: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

interface TaxRate {
  id: string;
  country: string;
  tax_bracket: string;
  min_amount: number;
  max_amount: number;
  rate: number;
  effective_date: string;
}

interface SocialSecurityRate {
  id: string;
  country: string;
  employee_rate: number;
  employer_rate: number;
  max_base: number;
  effective_date: string;
}

interface PayrollSettings {
  id: string;
  company_id: string;
  default_currency: string;
  pay_frequency: 'monthly' | 'bi-weekly' | 'weekly';
  tax_year_start: string;
  auto_calculate: boolean;
  approval_required: boolean;
  notification_enabled: boolean;
}

const PayrollManagement: React.FC = () => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [socialSecurityRates, setSocialSecurityRates] = useState<SocialSecurityRate[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  // Modal states
  const [showAddPayroll, setShowAddPayroll] = useState(false);
  const [showEditPayroll, setShowEditPayroll] = useState(false);
  const [showViewPayroll, setShowViewPayroll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTaxRates, setShowTaxRates] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCalculationEngine, setShowCalculationEngine] = useState(false);
  
  // Calculation engine states
  const [calculationInput, setCalculationInput] = useState({
    baseSalary: 0,
    bonuses: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    leaveDays: 0,
    dailyRate: 0,
    allowances: 0,
    deductions: 0
  });
  
  const [calculationResult, setCalculationResult] = useState({
    grossSalary: 0,
    netSalary: 0,
    taxAmount: 0,
    socialSecurity: 0,
    otherDeductions: 0,
    totalDeductions: 0
  });

  // Tax rate editing states
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);
  const [newTaxRate, setNewTaxRate] = useState({
    country: 'TR',
    tax_bracket: '',
    min_amount: 0,
    max_amount: 0,
    rate: 0,
    effective_date: format(new Date(), 'yyyy-MM-dd')
  });

  // Social security editing states
  const [editingSocialSecurity, setEditingSocialSecurity] = useState<SocialSecurityRate | null>(null);
  const [newSocialSecurity, setNewSocialSecurity] = useState({
    country: 'TR',
    employee_rate: 7.5,
    employer_rate: 15,
    max_base: 50000,
    effective_date: format(new Date(), 'yyyy-MM-dd')
  });

  // Selected items
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);

  // Form data
  const [payrollFormData, setPayrollFormData] = useState({
    employee_id: '',
    employee_name: '',
    period: format(new Date(), 'yyyy-MM'),
    base_salary: 0,
    bonuses: 0,
    overtime_pay: 0,
    leave_deductions: 0
  });

  // Filtered payroll records
  const filteredPayrollRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = periodFilter === 'all' || record.period === periodFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesCurrency = currencyFilter === 'all' || record.currency === currencyFilter;
    return matchesSearch && matchesPeriod && matchesStatus && matchesCurrency;
  });

  // Load mock data on component mount
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPayrollRecords([
        {
          id: '1',
          employee_id: 'HR001',
          employee_name: 'Ahmet Yılmaz',
          period: '2025-01',
          base_salary: 15000,
          gross_salary: 16500,
          net_salary: 12850,
          tax_amount: 2475,
          social_security: 1155,
          other_deductions: 0,
          bonuses: 1500,
          overtime_pay: 0,
          leave_deductions: 0,
          currency: 'TRY',
          status: 'paid',
          payment_date: '2025-01-31',
          created_at: '2025-01-01',
          updated_at: '2025-01-01'
        },
        {
          id: '2',
          employee_id: 'FN001',
          employee_name: 'Fatma Demir',
          period: '2025-01',
          base_salary: 12000,
          gross_salary: 13200,
          net_salary: 10200,
          tax_amount: 1980,
          social_security: 990,
          other_deductions: 0,
          bonuses: 1200,
          overtime_pay: 0,
          leave_deductions: 0,
          currency: 'TRY',
          status: 'approved',
          payment_date: undefined,
          created_at: '2025-01-01',
          updated_at: '2025-01-01'
        },
        {
          id: '3',
          employee_id: 'IT001',
          employee_name: 'Mehmet Kaya',
          period: '2025-01',
          base_salary: 18000,
          gross_salary: 19800,
          net_salary: 15400,
          tax_amount: 2970,
          social_security: 1485,
          other_deductions: 0,
          bonuses: 1800,
          overtime_pay: 0,
          leave_deductions: 0,
          currency: 'TRY',
          status: 'pending',
          payment_date: undefined,
          created_at: '2025-01-01',
          updated_at: '2025-01-01'
        }
      ]);
      
      setTaxRates([
        { id: '1', country: 'TR', tax_bracket: '0-15000', min_amount: 0, max_amount: 15000, rate: 15, effective_date: '2025-01-01' },
        { id: '2', country: 'TR', tax_bracket: '15000-30000', min_amount: 15000, max_amount: 30000, rate: 20, effective_date: '2025-01-01' },
        { id: '3', country: 'TR', tax_bracket: '30000+', min_amount: 30000, max_amount: 999999, rate: 25, effective_date: '2025-01-01' }
      ]);
      
      setSocialSecurityRates([
        { id: '1', country: 'TR', employee_rate: 7.5, employer_rate: 15, max_base: 50000, effective_date: '2025-01-01' }
      ]);
      
      setPayrollSettings({
        id: '1',
        company_id: 'company1',
        default_currency: 'TRY',
        pay_frequency: 'monthly',
        tax_year_start: '2025-01-01',
        auto_calculate: true,
        approval_required: true,
        notification_enabled: true
      });
      
      setLoading(false);
    }, 1000);
  }, []);


  // Mock function for payroll calculation
  const calculatePayroll = async (employeeId: string, period: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  };

  // Calculation engine functions
  const calculateSalary = () => {
    const {
      baseSalary,
      bonuses,
      overtimeHours,
      overtimeRate,
      leaveDays,
      dailyRate,
      allowances,
      deductions
    } = calculationInput;

    // Hesaplamalar
    const overtimePay = overtimeHours * overtimeRate;
    const leaveDeduction = leaveDays * dailyRate;
    const grossSalary = baseSalary + bonuses + overtimePay + allowances;
    
    // Vergi hesaplama (basit oran)
    let taxRate = 0.15; // Varsayılan %15
    if (grossSalary > 50000) taxRate = 0.20;
    if (grossSalary > 100000) taxRate = 0.25;
    
    const taxAmount = grossSalary * taxRate;
    const socialSecurity = grossSalary * 0.14; // %14 SGK
    const totalDeductions = taxAmount + socialSecurity + leaveDeduction + deductions;
    const netSalary = grossSalary - totalDeductions;

    setCalculationResult({
      grossSalary,
      netSalary,
      taxAmount,
      socialSecurity,
      otherDeductions: leaveDeduction + deductions,
      totalDeductions
    });
  };

  const resetCalculation = () => {
    setCalculationInput({
      baseSalary: 0,
      bonuses: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      leaveDays: 0,
      dailyRate: 0,
      allowances: 0,
      deductions: 0
    });
    setCalculationResult({
      grossSalary: 0,
      netSalary: 0,
      taxAmount: 0,
      socialSecurity: 0,
      otherDeductions: 0,
      totalDeductions: 0
    });
  };

  // Tax rate management functions
  const handleAddTaxRate = () => {
    if (newTaxRate.tax_bracket && newTaxRate.min_amount >= 0 && newTaxRate.max_amount > newTaxRate.min_amount && newTaxRate.rate >= 0) {
      const taxRate: TaxRate = {
        id: Date.now().toString(),
        ...newTaxRate
      };
      setTaxRates(prev => [...prev, taxRate]);
      setNewTaxRate({
        country: 'TR',
        tax_bracket: '',
        min_amount: 0,
        max_amount: 0,
        rate: 0,
        effective_date: format(new Date(), 'yyyy-MM-dd')
      });
    } else {
      alert('Lütfen tüm alanları doğru şekilde doldurun.');
    }
  };

  const handleEditTaxRate = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate);
    setNewTaxRate({
      country: taxRate.country,
      tax_bracket: taxRate.tax_bracket,
      min_amount: taxRate.min_amount,
      max_amount: taxRate.max_amount,
      rate: taxRate.rate,
      effective_date: taxRate.effective_date
    });
  };

  const handleUpdateTaxRate = () => {
    if (editingTaxRate && newTaxRate.tax_bracket && newTaxRate.min_amount >= 0 && newTaxRate.max_amount > newTaxRate.min_amount && newTaxRate.rate >= 0) {
      setTaxRates(prev => prev.map(tr => 
        tr.id === editingTaxRate.id 
          ? { ...tr, ...newTaxRate, updated_at: new Date().toISOString() }
          : tr
      ));
      setEditingTaxRate(null);
      setNewTaxRate({
        country: 'TR',
        tax_bracket: '',
        min_amount: 0,
        max_amount: 0,
        rate: 0,
        effective_date: format(new Date(), 'yyyy-MM-dd')
      });
    } else {
      alert('Lütfen tüm alanları doğru şekilde doldurun.');
    }
  };

  const handleDeleteTaxRate = (id: string) => {
    if (window.confirm('Bu vergi oranını silmek istediğinizden emin misiniz?')) {
      setTaxRates(prev => prev.filter(tr => tr.id !== id));
    }
  };

  // Social security management functions
  const handleAddSocialSecurity = () => {
    if (newSocialSecurity.employee_rate >= 0 && newSocialSecurity.employer_rate >= 0 && newSocialSecurity.max_base > 0) {
      const socialSecurity: SocialSecurityRate = {
        id: Date.now().toString(),
        ...newSocialSecurity
      };
      setSocialSecurityRates(prev => [...prev, socialSecurity]);
      setNewSocialSecurity({
        country: 'TR',
        employee_rate: 7.5,
        employer_rate: 15,
        max_base: 50000,
        effective_date: format(new Date(), 'yyyy-MM-dd')
      });
    } else {
      alert('Lütfen tüm alanları doğru şekilde doldurun.');
    }
  };

  const handleEditSocialSecurity = (socialSecurity: SocialSecurityRate) => {
    setEditingSocialSecurity(socialSecurity);
    setNewSocialSecurity({
      country: socialSecurity.country,
      employee_rate: socialSecurity.employee_rate,
      employer_rate: socialSecurity.employer_rate,
      max_base: socialSecurity.max_base,
      effective_date: socialSecurity.effective_date
    });
  };

  const handleUpdateSocialSecurity = () => {
    if (editingSocialSecurity && newSocialSecurity.employee_rate >= 0 && newSocialSecurity.employer_rate >= 0 && newSocialSecurity.max_base > 0) {
      setSocialSecurityRates(prev => prev.map(ss => 
        ss.id === editingSocialSecurity.id 
          ? { ...ss, ...newSocialSecurity, updated_at: new Date().toISOString() }
          : ss
      ));
      setEditingSocialSecurity(null);
      setNewSocialSecurity({
        country: 'TR',
        employee_rate: 7.5,
        employer_rate: 15,
        max_base: 50000,
        effective_date: format(new Date(), 'yyyy-MM-dd')
      });
    } else {
      alert('Lütfen tüm alanları doğru şekilde doldurun.');
    }
  };

  const handleDeleteSocialSecurity = (id: string) => {
    if (window.confirm('Bu sosyal güvenlik oranını silmek istediğinizden emin misiniz?')) {
      setSocialSecurityRates(prev => prev.filter(ss => ss.id !== id));
    }
  };

  // Handle functions
  const handleAddPayroll = () => {
    setSelectedPayroll(null);
    setPayrollFormData({
      employee_id: '',
      employee_name: '',
      period: format(new Date(), 'yyyy-MM'),
      base_salary: 0,
      bonuses: 0,
      overtime_pay: 0,
      leave_deductions: 0
    });
    setShowAddPayroll(true);
  };

  const handleEditPayroll = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setPayrollFormData({
      employee_id: payroll.employee_id,
      employee_name: payroll.employee_name,
      period: payroll.period,
      base_salary: payroll.base_salary,
      bonuses: payroll.bonuses,
      overtime_pay: payroll.overtime_pay,
      leave_deductions: payroll.leave_deductions
    });
    setShowEditPayroll(true);
  };

  const handleViewPayroll = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setShowViewPayroll(true);
  };

  const handleDeletePayroll = (id: string) => {
    if (window.confirm('Bu bordro kaydını silmek istediğinizden emin misiniz?')) {
      setPayrollRecords(prev => prev.filter(record => record.id !== id));
      setSelectedPayrolls(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleSelectPayroll = (id: string) => {
    setSelectedPayrolls(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPayrolls(filteredPayrollRecords.map(record => record.id));
    } else {
      setSelectedPayrolls([]);
    }
  };

  const handleGeneratePDF = () => {
    alert('PDF raporu oluşturuluyor...');
  };

  const handleGenerateExcel = () => {
    alert('Excel raporu oluşturuluyor...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBulkApprove = () => {
    setPayrollRecords(prev => prev.map(record => 
      selectedPayrolls.includes(record.id) ? { ...record, status: 'approved' as const } : record
    ));
    setSelectedPayrolls([]);
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`${selectedPayrolls.length} bordro kaydını silmek istediğinizden emin misiniz?`)) {
      setPayrollRecords(prev => prev.filter(record => !selectedPayrolls.includes(record.id)));
      setSelectedPayrolls([]);
      setShowBulkActions(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Ödendi';
      case 'approved':
        return 'Onaylandı';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
      default:
        return 'İptal';
    }
  };

  const handleSavePayroll = async () => {
    if (selectedPayroll) {
      // Edit existing
      const updatedPayroll = {
        ...selectedPayroll,
        ...payrollFormData,
        updated_at: new Date().toISOString()
      };

      // Mock hesaplama
      const calculationResult = await calculatePayroll(updatedPayroll.employee_id, updatedPayroll.period);
      if (calculationResult.success) {
        updatedPayroll.gross_salary = updatedPayroll.base_salary + updatedPayroll.bonuses + updatedPayroll.overtime_pay;
        updatedPayroll.tax_amount = updatedPayroll.gross_salary * 0.20; // Mock vergi oranı
        updatedPayroll.social_security = updatedPayroll.gross_salary * 0.14; // Mock SGK oranı
        updatedPayroll.net_salary = updatedPayroll.gross_salary - updatedPayroll.tax_amount - updatedPayroll.social_security - updatedPayroll.leave_deductions;
        updatedPayroll.status = 'approved'; // Düzenlenen bordro otomatik onaylanır
        updatedPayroll.updated_at = new Date().toISOString();

        setPayrollRecords(prev => prev.map(record => record.id === updatedPayroll.id ? updatedPayroll : record));
        setSelectedPayroll(null);
        setShowEditPayroll(false);
        setPayrollFormData({ employee_id: '', employee_name: '', period: '', base_salary: 0, bonuses: 0, overtime_pay: 0, leave_deductions: 0 });
      } else {
        alert('Bordro hesaplanırken hata oluştu.');
      }
    } else {
      // Add new
      const newPayroll: PayrollRecord = {
        id: `payroll-${Date.now()}`,
        employee_id: payrollFormData.employee_id,
        employee_name: payrollFormData.employee_name,
        period: payrollFormData.period,
        base_salary: payrollFormData.base_salary,
        gross_salary: 0,
        net_salary: 0,
        tax_amount: 0,
        social_security: 0,
        other_deductions: 0,
        bonuses: payrollFormData.bonuses,
        overtime_pay: payrollFormData.overtime_pay,
        leave_deductions: payrollFormData.leave_deductions,
        currency: 'TRY',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock hesaplama
      const calculationResult = await calculatePayroll(newPayroll.employee_id, newPayroll.period);
      if (calculationResult.success) {
        newPayroll.gross_salary = newPayroll.base_salary + newPayroll.bonuses + newPayroll.overtime_pay;
        newPayroll.tax_amount = newPayroll.gross_salary * 0.20; // Mock vergi oranı
        newPayroll.social_security = newPayroll.gross_salary * 0.14; // Mock SGK oranı
        newPayroll.net_salary = newPayroll.gross_salary - newPayroll.tax_amount - newPayroll.social_security - newPayroll.leave_deductions;
        newPayroll.status = 'approved'; // Yeni bordro otomatik onaylanır
        newPayroll.updated_at = new Date().toISOString();

        setPayrollRecords(prev => [...prev, newPayroll]);
        setShowAddPayroll(false);
        setPayrollFormData({ employee_id: '', employee_name: '', period: '', base_salary: 0, bonuses: 0, overtime_pay: 0, leave_deductions: 0 });
      } else {
        alert('Bordro hesaplanırken hata oluştu.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <DollarSign className="w-8 h-8 mr-3 text-green-500" />
            Bordro ve Maaş Yönetimi
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Çalışan bordrolarını yönetin, maaş hesaplamalarını yapın ve raporları görüntüleyin
          </p>
        </div>
          
                      <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCalculationEngine(true)}
                className="w-40 h-12 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-300 dark:border-gray-600"
              >
                <Calculator className="w-4 h-4" />
                <span>Hesaplama Motoru</span>
              </button>
              
              <button
                onClick={() => setShowTaxRates(true)}
                className="w-40 h-12 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-300 dark:border-gray-600"
              >
                <Shield className="w-4 h-4" />
                <span>Vergi Oranları</span>
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="w-40 h-12 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-300 dark:border-gray-600"
              >
                <Settings className="w-4 h-4" />
                <span>Ayarlar</span>
              </button>
              
              <button
                onClick={handleAddPayroll}
                className="w-40 h-12 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-300 dark:border-gray-600"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Bordro</span>
              </button>
            </div>
              </div>
              
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                <div className="flex items-center">
              <DollarSign className="w-6 h-6 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Toplam Bordro</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-200">
                  {payrollRecords.length}
                    </p>
                  </div>
                </div>
              </div>
              
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Ödenen</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                      {payrollRecords.filter(r => r.status === 'paid').length}
                    </p>
                  </div>
                </div>
              </div>
              
          <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                <div className="flex items-center">
              <Clock className="w-6 h-6 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Bekleyen</p>
                <p className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                      {payrollRecords.filter(r => r.status === 'pending').length}
                    </p>
                </div>
              </div>
            </div>

          <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Toplam Maaş</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                  {payrollRecords.reduce((sum, r) => sum + r.gross_salary, 0).toLocaleString('tr-TR')} ₺
                </p>
              </div>
                          </div>
                          </div>
                          </div>
                          </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                placeholder="Çalışan adı, ID veya dönem ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Dönemler</option>
                    <option value="2025-01">Ocak 2025</option>
                    <option value="2024-12">Aralık 2024</option>
                    <option value="2024-11">Kasım 2024</option>
                  </select>
                
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="pending">Beklemede</option>
                    <option value="approved">Onaylandı</option>
                    <option value="paid">Ödendi</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </div>
                
          <div className="flex items-center space-x-3">
            {selectedPayrolls.length > 0 && (
              <button
                onClick={() => setShowBulkActions(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                {selectedPayrolls.length} seçili
              </button>
            )}
            
            <button
              onClick={handleGeneratePDF}
              className="w-24 h-10 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-300 dark:border-gray-500"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            
            <button
              onClick={handleGenerateExcel}
              className="w-24 h-10 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-300 dark:border-gray-500"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="w-24 h-10 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 transition-all duration-300 border border-gray-300 dark:text-gray-600"
            >
              <FileText className="w-4 h-4" />
              <span>Yazdır</span>
            </button>
              </div>
            </div>

        {/* Payroll Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPayrolls.length === filteredPayrollRecords.length && filteredPayrollRecords.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                         Çalışan
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                         Dönem
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                         Brüt Maaş
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                         Toplam Kesinti
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                         Net Maaş
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                         Durum
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                         İşlemler
                       </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPayrollRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPayrolls.includes(record.id)}
                      onChange={() => handleSelectPayroll(record.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.employee_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {format(new Date(record.period + '-01'), 'MMMM yyyy', { locale: tr })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {record.gross_salary.toLocaleString('tr-TR')} ₺
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative group">
                              <div className="flex items-center space-x-1">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {(record.tax_amount + record.social_security).toLocaleString('tr-TR')} ₺
                                </span>
                                <div className="cursor-help -ml-1 -mt-1">
                                  <Info className="w-3 h-3 text-blue-500" />
                                </div>
                              </div>
                              
                              {/* Tax Details Tooltip */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 min-w-[200px] border border-gray-700 dark:border-gray-600">
                                <div className="text-center mb-2">
                                  <div className="text-sm font-bold text-yellow-300 mb-1">
                                    💰 Ödenen Vergiler
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {record.employee_name} - {format(new Date(record.period + '-01'), 'MMMM yyyy', { locale: tr })}
                                  </div>
                                </div>
                                
                                <div className="space-y-1 text-left">
                                  <div className="flex justify-between items-center py-1 border-b border-gray-600">
                                    <span className="text-gray-300">Gelir Vergisi:</span>
                                    <span className="font-semibold text-white">
                                      {record.tax_amount.toLocaleString('tr-TR')} ₺ 
                                      <span className="text-xs text-gray-400 ml-1">
                                        ({record.gross_salary <= 15000 ? '15%' : 
                                          record.gross_salary <= 30000 ? '20%' : '25%'})
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-gray-600">
                                    <span className="text-gray-300">SGK Kesintisi:</span>
                                    <span className="font-semibold text-white">
                                      {record.social_security.toLocaleString('tr-TR')} ₺
                                      <span className="text-xs text-gray-400 ml-1">(7.5%)</span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 pt-1">
                                    <span className="text-gray-300 font-medium">Toplam Kesinti:</span>
                                    <span className="font-bold text-red-300">{(record.tax_amount + record.social_security).toLocaleString('tr-TR')} ₺</span>
                                  </div>
                                </div>
                                
                                {/* Arrow */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {record.net_salary.toLocaleString('tr-TR')} ₺
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {getStatusText(record.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                        onClick={() => handleViewPayroll(record)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                        onClick={() => handleEditPayroll(record)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                                <button
                        onClick={() => handleDeletePayroll(record.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

      {/* Add/Edit Payroll Modal */}
      {(showAddPayroll || showEditPayroll) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedPayroll ? 'Bordro Düzenle' : 'Yeni Bordro Ekle'}
              </h3>
                <button
                  onClick={() => showAddPayroll ? setShowAddPayroll(false) : setShowEditPayroll(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Çalışan ID
                    </label>
                    <input
                      type="text"
                      value={payrollFormData.employee_id}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Çalışan Adı
                    </label>
                    <input
                      type="text"
                      value={payrollFormData.employee_name}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, employee_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>
                  </div>
                  
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dönem
                    </label>
                    <input
                      type="month"
                      value={payrollFormData.period}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, period: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Temel Maaş (₺)
                    </label>
                    <input
                      type="number"
                      value={payrollFormData.base_salary}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, base_salary: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bonus (₺)
                    </label>
                    <input
                      type="number"
                      value={payrollFormData.bonuses}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, bonuses: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fazla Mesai (₺)
                    </label>
                    <input
                      type="number"
                      value={payrollFormData.overtime_pay}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, overtime_pay: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>
                  </div>
                  
                    <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    İzin Kesintisi (₺)
                  </label>
                  <input
                    type="number"
                    value={payrollFormData.leave_deductions}
                    onChange={(e) => setPayrollFormData({ ...payrollFormData, leave_deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                    </div>
                  </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => showAddPayroll ? setShowAddPayroll(false) : setShowEditPayroll(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  onClick={handleSavePayroll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedPayroll ? 'Güncelle' : 'Kaydet'}
                </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* View Payroll Modal */}
      {showViewPayroll && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Bordro Detayları - {selectedPayroll.employee_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {format(new Date(selectedPayroll.period + '-01'), 'MMMM yyyy', { locale: tr })} Dönemi
                  </p>
                </div>
                <button
                  onClick={() => setShowViewPayroll(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Bordro Bilgileri */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                    <Receipt className="w-5 h-5 mr-2" />
                    Bordro Bilgileri
                </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Bordro No</p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200">#{selectedPayroll.id}</p>
              </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Dönem</p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                        {format(new Date(selectedPayroll.period + '-01'), 'MMMM yyyy', { locale: tr })}
                      </p>
            </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Durum</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayroll.status)}`}>
                        {getStatusText(selectedPayroll.status)}
                      </span>
          </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Ödeme Tarihi</p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                        {selectedPayroll.payment_date ? format(new Date(selectedPayroll.payment_date), 'dd.MM.yyyy') : 'Belirlenmedi'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ana Maaş Kartları */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Temel Maaş</span>
                    </div>
                    <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                      {selectedPayroll.base_salary.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Brüt Maaş</span>
                    </div>
                    <p className="text-xl font-bold text-green-800 dark:text-green-200">
                      {selectedPayroll.gross_salary.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between mb-2">
                      <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Net Maaş</span>
                    </div>
                    <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                      {selectedPayroll.net_salary.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Bonus</span>
                    </div>
                    <p className="text-xl font-bold text-orange-800 dark:text-orange-200">
                      {selectedPayroll.bonuses.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>

                {/* Zaman Bilgileri ve Fazla Mesai */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900 dark:to-teal-900 rounded-xl p-6 border border-emerald-200 dark:border-emerald-700">
                    <h4 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Zaman Bilgileri
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-emerald-200 dark:border-emerald-700">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Çalışma Günleri</span>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">22 gün</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-emerald-200 dark:border-emerald-700">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">İzin Kullanımı</span>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          {selectedPayroll.leave_deductions > 0 ? 'Var' : 'Yok'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-emerald-200 dark:border-emerald-700">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Fazla Mesai Saatleri</span>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          {selectedPayroll.overtime_pay > 0 ? 'Var' : 'Yok'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Oluşturma Tarihi</span>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          {format(new Date(selectedPayroll.created_at), 'dd.MM.yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900 dark:to-yellow-900 rounded-xl p-6 border border-amber-200 dark:border-amber-700">
                    <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Fazla Mesai Detayları
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-amber-200 dark:border-amber-700">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Fazla Mesai Saati</span>
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          {selectedPayroll.overtime_pay > 0 ? '8 saat' : '0 saat'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-amber-200 dark:border-amber-700">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Saat Ücreti</span>
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          {selectedPayroll.overtime_pay > 0 ? '50 ₺/saat' : '0 ₺'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-amber-200 dark:border-amber-700">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Toplam Fazla Mesai</span>
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                          {selectedPayroll.overtime_pay.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Fazla Mesai Oranı</span>
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">%50</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kesinti Detayları */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900 dark:to-pink-900 rounded-xl p-6 border border-red-200 dark:border-red-700">
                  <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Kesinti Detayları
                  </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">Vergi Bilgileri</h5>
                  <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">Gelir Vergisi</span>
                          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {selectedPayroll.tax_amount.toLocaleString('tr-TR')} ₺
                          </span>
                    </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">Vergi Dilimi</span>
                          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {selectedPayroll.gross_salary <= 15000 ? '0-15.000 ₺' : 
                             selectedPayroll.gross_salary <= 30000 ? '15.000-30.000 ₺' : '30.000+ ₺'}
                          </span>
                    </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-red-600 dark:text-red-400">Vergi Oranı</span>
                          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {selectedPayroll.gross_salary <= 15000 ? '%15' : 
                             selectedPayroll.gross_salary <= 30000 ? '%20' : '%25'}
                          </span>
                    </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">Sosyal Güvenlik</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">Çalışan Payı</span>
                          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {selectedPayroll.social_security.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-red-200 dark:border-red-700">
                          <span className="text-sm text-red-600 dark:text-red-400">İşveren Payı</span>
                          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {(selectedPayroll.social_security * 2).toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-red-600 dark:text-red-400">Toplam SGK</span>
                          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {(selectedPayroll.social_security * 3).toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Detaylı Hesaplama */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Detaylı Hesaplama
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Gelirler</h5>
                  <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Temel Maaş</span>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {selectedPayroll.base_salary.toLocaleString('tr-TR')} ₺
                          </span>
                    </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Bonus</span>
                          <span className="text-sm font-semibold text-green-600">+{selectedPayroll.bonuses.toLocaleString('tr-TR')} ₺</span>
                    </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Fazla Mesai</span>
                          <span className="text-sm font-semibold text-green-600">+{selectedPayroll.overtime_pay.toLocaleString('tr-TR')} ₺</span>
                    </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Yan Haklar</span>
                          <span className="text-sm font-semibold text-green-600">+0 ₺</span>
                  </div>
                </div>
              </div>
                    
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Kesintiler</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Gelir Vergisi</span>
                          <span className="text-sm font-semibold text-red-600">-{selectedPayroll.tax_amount.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">SGK Kesintisi</span>
                          <span className="text-sm font-semibold text-red-600">-{selectedPayroll.social_security.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm text-slate-600 dark:text-slate-400">İzin Kesintisi</span>
                          <span className="text-sm font-semibold text-red-600">-{selectedPayroll.leave_deductions.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Diğer Kesintiler</span>
                          <span className="text-sm font-semibold text-red-600">-0 ₺</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Toplam Özet */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Toplam Net Maaş</span>
                      <span className="text-2xl font-bold text-green-600">
                        {selectedPayroll.net_salary.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Toplu İşlemler ({selectedPayrolls.length} seçili)
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleBulkApprove}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Toplu Onayla</span>
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Toplu Sil</span>
                </button>
              </div>
                
                <button
                onClick={() => setShowBulkActions(false)}
                className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 mt-4"
                >
                İptal
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Calculation Engine Modal */}
      {showCalculationEngine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Calculator className="w-6 h-6 mr-2 text-blue-500" />
                  Akıllı Bordro Hesaplama Motoru
              </h3>
                <button
                  onClick={() => setShowCalculationEngine(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Maaş Bilgileri</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temel Maaş (₺)
                  </label>
                      <input
                        type="number"
                        value={calculationInput.baseSalary}
                        onChange={(e) => setCalculationInput({ ...calculationInput, baseSalary: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bonus (₺)
                  </label>
                      <input
                        type="number"
                        value={calculationInput.bonuses}
                        onChange={(e) => setCalculationInput({ ...calculationInput, bonuses: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                </div>
                
                  <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fazla Mesai Saati
                  </label>
                  <input
                        type="number"
                        value={calculationInput.overtimeHours}
                        onChange={(e) => setCalculationInput({ ...calculationInput, overtimeHours: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fazla Mesai Ücreti (₺/saat)
                  </label>
                    <input
                        type="number"
                        value={calculationInput.overtimeRate}
                        onChange={(e) => setCalculationInput({ ...calculationInput, overtimeRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        İzin Günü
                      </label>
                      <input
                        type="number"
                        value={calculationInput.leaveDays}
                        onChange={(e) => setCalculationInput({ ...calculationInput, leaveDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
              </div>
              
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Günlük Ücret (₺)
                      </label>
                      <input
                        type="number"
                        value={calculationInput.dailyRate}
                        onChange={(e) => setCalculationInput({ ...calculationInput, dailyRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ek Ödemeler (₺)
                      </label>
                      <input
                        type="number"
                        value={calculationInput.allowances}
                        onChange={(e) => setCalculationInput({ ...calculationInput, allowances: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Diğer Kesintiler (₺)
                      </label>
                      <input
                        type="number"
                        value={calculationInput.deductions}
                        onChange={(e) => setCalculationInput({ ...calculationInput, deductions: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={calculateSalary}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Hesapla</span>
                    </button>
                    
                    <button
                      onClick={resetCalculation}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Sıfırla</span>
                </button>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Hesaplama Sonuçları</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                      <p className="text-sm text-green-600 dark:text-green-400 mb-1">Brüt Maaş</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                        {calculationResult.grossSalary.toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Net Maaş</p>
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        {calculationResult.netSalary.toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
                      <p className="text-sm text-red-600 dark:text-red-400 mb-1">Toplam Kesintiler</p>
                      <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                        {calculationResult.totalDeductions.toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Detaylı Kesintiler</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Vergi:</span>
                        <span className="font-medium text-red-600">{calculationResult.taxAmount.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">SGK:</span>
                        <span className="font-medium text-red-600">{calculationResult.socialSecurity.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Diğer Kesintiler:</span>
                        <span className="font-medium text-red-600">{calculationResult.otherDeductions.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-blue-500" />
                  Bordro ve Maaş Ayarları
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Settings */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Şirket Ayarları</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Varsayılan Para Birimi
                    </label>
                    <select
                      value={payrollSettings.default_currency}
                      onChange={(e) => setPayrollSettings({ ...payrollSettings, default_currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="USD">Amerikan Doları ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ödeme Sıklığı
                    </label>
                    <select
                      value={payrollSettings.pay_frequency}
                      onChange={(e) => setPayrollSettings({ ...payrollSettings, pay_frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="monthly">Aylık</option>
                      <option value="weekly">Haftalık</option>
                      <option value="biweekly">İki Haftalık</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vergi Yılı Başlangıcı
                    </label>
                    <input
                      type="date"
                      value={payrollSettings.tax_year_start}
                      onChange={(e) => setPayrollSettings({ ...payrollSettings, tax_year_start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* System Settings */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Sistem Ayarları</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Otomatik Hesaplama
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bordro oluştururken otomatik hesaplama yapılsın
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={payrollSettings.auto_calculate}
                      onChange={(e) => setPayrollSettings({ ...payrollSettings, auto_calculate: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Onay Gerekli
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bordro ödemesi için onay gerekli olsun
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={payrollSettings.approval_required}
                      onChange={(e) => setPayrollSettings({ ...payrollSettings, approval_required: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bildirimler Aktif
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bordro durumu değişikliklerinde bildirim gönderilsin
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={payrollSettings.notification_enabled}
                      onChange={(e) => setPayrollSettings({ ...payrollSettings, notification_enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    // Burada ayarları kaydetme işlemi yapılabilir
                    setShowSettings(false);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Rates Modal */}
      {showTaxRates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-purple-500" />
                  Vergi Oranları Yönetimi
                </h3>
                <button
                  onClick={() => setShowTaxRates(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
      </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add/Edit Form */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                    {editingTaxRate ? 'Vergi Oranı Düzenle' : 'Yeni Vergi Oranı Ekle'}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vergi Dilimi
                      </label>
                      <input
                        type="text"
                        value={newTaxRate.tax_bracket}
                        onChange={(e) => setNewTaxRate({ ...newTaxRate, tax_bracket: e.target.value })}
                        placeholder="0-15000"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ülke
                      </label>
                      <select
                        value={newTaxRate.country}
                        onChange={(e) => setNewTaxRate({ ...newTaxRate, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="TR">Türkiye</option>
                        <option value="US">Amerika</option>
                        <option value="DE">Almanya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minimum Tutar (₺)
                      </label>
                      <input
                        type="number"
                        value={newTaxRate.min_amount}
                        onChange={(e) => setNewTaxRate({ ...newTaxRate, min_amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maksimum Tutar (₺)
                      </label>
                      <input
                        type="number"
                        value={newTaxRate.max_amount}
                        onChange={(e) => setNewTaxRate({ ...newTaxRate, max_amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vergi Oranı (%)
                      </label>
                      <input
                        type="number"
                        value={newTaxRate.rate}
                        onChange={(e) => setNewTaxRate({ ...newTaxRate, rate: Number(e.target.value) })}
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Geçerlilik Tarihi
                      </label>
                      <input
                        type="date"
                        value={newTaxRate.effective_date}
                        onChange={(e) => setNewTaxRate({ ...newTaxRate, effective_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    {editingTaxRate ? (
                      <>
                        <button
                          onClick={handleUpdateTaxRate}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Güncelle
                        </button>
                        <button
                          onClick={() => {
                            setEditingTaxRate(null);
                            setNewTaxRate({
                              country: 'TR',
                              tax_bracket: '',
                              min_amount: 0,
                              max_amount: 0,
                              rate: 0,
                              effective_date: format(new Date(), 'yyyy-MM-dd')
                            });
                          }}
                          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          İptal
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleAddTaxRate}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Ekle
                      </button>
                    )}
                  </div>
                </div>

                {/* Tax Rates List */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Mevcut Vergi Oranları</h4>
                  
                  <div className="space-y-3">
                    {taxRates.map((taxRate) => (
                      <div key={taxRate.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 dark:text-white">{taxRate.tax_bracket}</h5>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTaxRate(taxRate)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTaxRate(taxRate.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>Tutar: {taxRate.min_amount.toLocaleString('tr-TR')} - {taxRate.max_amount.toLocaleString('tr-TR')} ₺</div>
                          <div>Oran: %{taxRate.rate}</div>
                          <div>Ülke: {taxRate.country}</div>
                          <div>Tarih: {format(new Date(taxRate.effective_date), 'dd.MM.yyyy')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
