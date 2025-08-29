# ✅ Approval Workflows: Onay Süreçleri Sistemi

Bu dokümantasyon, Hizmet ERP sistemi için geliştirilen onay süreçleri yönetim sistemi hakkında detaylı bilgi içermektedir.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Özellikler](#özellikler)
3. [Kurulum](#kurulum)
4. [Kullanım](#kullanım)
5. [Teknik Detaylar](#teknik-detaylar)
6. [API Referansı](#api-referansı)
7. [Örnekler](#örnekler)

---

## 🎯 Genel Bakış

Approval Workflows sistemi, organizasyonlarda onay gerektiren süreçleri dijitalleştirmek ve otomatikleştirmek için tasarlanmış kapsamlı bir çözümdür. Masraf onayları, satın alma talepleri, izin talepleri ve diğer onay süreçlerini yönetmek için kullanılır.

### 🎨 Arayüz Özellikleri

- **Görsel Süreç Yönetimi**: Onay süreçlerini görsel olarak tasarlama
- **Çoklu Onay Tipleri**: Sıralı, paralel ve koşullu onay süreçleri
- **Gerçek Zamanlı Takip**: Onay durumlarını anlık takip etme
- **Bildirim Sistemi**: Otomatik e-posta ve sistem bildirimleri
- **Vekalet Sistemi**: Onay yetkisini başkasına devretme
- **Timeout Yönetimi**: Otomatik onay/red süreleri

---

## 🚀 Özellikler

### 📊 Onay Süreç Tipleri

#### **1. Sıralı Onay (Sequential)**
- **Tanım**: Onayların belirli bir sırayla gerçekleşmesi
- **Kullanım**: Masraf onayları, satın alma talepleri
- **Özellikler**: 
  - Her adım bir önceki adımın onayından sonra başlar
  - Tek onaylayıcı reddederse süreç durur
  - Tüm adımlar tamamlanmalı

#### **2. Paralel Onay (Parallel)**
- **Tanım**: Birden fazla onaylayıcının aynı anda onay vermesi
- **Kullanım**: Acil durumlar, büyük bütçeli projeler
- **Özellikler**:
  - Tüm onaylayıcılar aynı anda bilgilendirilir
  - Belirlenen sayıda onay yeterli olabilir
  - Hızlı karar verme süreci

#### **3. Koşullu Onay (Conditional)**
- **Tanım**: Belirli koşullara göre farklı onay yolları
- **Kullanım**: Tutara göre farklı onay seviyeleri
- **Özellikler**:
  - Dinamik onay yolları
  - Koşul bazlı atlama
  - Esnek süreç tasarımı

### 🔧 Gelişmiş Özellikler

#### **Vekalet Sistemi**
- **Yetki Devretme**: Onay yetkisini başkasına devretme
- **Vekalet Seviyeleri**: Maksimum vekalet seviyesi kontrolü
- **Otomatik Vekalet**: Belirli durumlarda otomatik vekalet
- **Vekalet Geçmişi**: Vekalet verilen kişilerin takibi

#### **Timeout Yönetimi**
- **Adım Timeout'u**: Her adım için ayrı timeout süresi
- **Otomatik Onay**: Timeout sonrası otomatik onay
- **Otomatik Red**: Timeout sonrası otomatik red
- **Hatırlatma Bildirimleri**: Timeout yaklaşırken uyarılar

#### **Bildirim Sistemi**
- **E-posta Bildirimleri**: Otomatik e-posta gönderimi
- **Sistem Bildirimleri**: Uygulama içi bildirimler
- **SMS Bildirimleri**: Acil durumlar için SMS
- **Slack/Teams Entegrasyonu**: Kurumsal mesajlaşma

---

## 🛠️ Kurulum

### 1. Veritabanı Migration'ı

#### Yöntem 1: Node.js Script
```bash
# Environment variables'ları ayarlayın
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Migration'ı çalıştırın
npm run approval-migration
```

#### Yöntem 2: Supabase Dashboard
1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ü açın
3. `supabase/migrations/20241201_approval_workflows.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'de çalıştırın

### 2. Uygulamayı Başlatma
```bash
npm run dev
```

### 3. Erişim
- Sidebar'dan "Onay Süreçleri" seçin
- Veya `/approval-workflows` URL'ine gidin

---

## 📖 Kullanım

### 🎨 Onay Süreci Oluşturma

#### 1. Yeni Süreç
```typescript
// Yeni onay süreci oluştur
const newWorkflow: ApprovalWorkflow = {
  name: 'Masraf Onay Süreci',
  description: 'Masraf raporları için onay süreci',
  workflow_type: 'sequential',
  status: 'active',
  workflow_config: {},
  trigger_conditions: {
    request_type: 'expense',
    amount_threshold: 1000
  },
  auto_approve_timeout: 48,
  require_all_approvers: false,
  allow_delegate: true,
  max_delegation_level: 1
};
```

#### 2. Onay Adımları Ekleme
```typescript
// Onay adımı ekle
const approvalStep: ApprovalStep = {
  step_order: 1,
  step_name: 'Yönetici Onayı',
  step_type: 'approval',
  approver_type: 'role',
  approver_config: {
    role: 'manager',
    department: 'IT'
  },
  timeout_hours: 24,
  is_required: true,
  can_skip: false
};
```

#### 3. Onay Talebi Oluşturma
```typescript
// Onay talebi oluştur
const approvalRequest: ApprovalRequest = {
  approval_workflow_id: 'workflow-id',
  request_type: 'expense',
  request_data: {
    amount: 1500,
    description: 'Yazılım lisansı',
    category: 'software'
  },
  requester_id: 'user-id',
  priority: 'normal',
  total_steps: 2,
  completed_steps: 0
};
```

### 🔄 Onay Süreci Yönetimi

#### 1. Onay Verme
```typescript
// Onay kararı ver
const approveRequest = async (requestId: string, stepId: string, decision: 'approved' | 'rejected', comments?: string) => {
  const { data, error } = await supabase
    .from('approval_step_status')
    .update({
      status: decision,
      decision: comments,
      decision_date: new Date().toISOString()
    })
    .eq('approval_request_id', requestId)
    .eq('step_id', stepId);
};
```

#### 2. Vekalet Verme
```typescript
// Vekalet ver
const delegateApproval = async (requestId: string, stepId: string, delegateTo: string, reason: string) => {
  const { data, error } = await supabase
    .from('approval_step_status')
    .update({
      status: 'delegated',
      delegated_to: delegateTo,
      delegation_reason: reason,
      decision_date: new Date().toISOString()
    })
    .eq('approval_request_id', requestId)
    .eq('step_id', stepId);
};
```

#### 3. Timeout Kontrolü
```typescript
// Timeout kontrolü
const checkTimeouts = async () => {
  const { data, error } = await supabase
    .from('approval_step_status')
    .select('*')
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  // Timeout olan adımları işle
  for (const step of data || []) {
    await handleTimeout(step);
  }
};
```

---

## 🗄️ Teknik Detaylar

### Veritabanı Yapısı

#### **approval_workflows Tablosu**
```sql
CREATE TABLE approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workflow_type text NOT NULL DEFAULT 'sequential',
  status text DEFAULT 'active',
  version integer DEFAULT 1,
  workflow_config jsonb NOT NULL DEFAULT '{}',
  trigger_conditions jsonb DEFAULT '{}',
  auto_approve_timeout integer DEFAULT 0,
  require_all_approvers boolean DEFAULT false,
  allow_delegate boolean DEFAULT true,
  max_delegation_level integer DEFAULT 1,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### **approval_requests Tablosu**
```sql
CREATE TABLE approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_workflow_id uuid REFERENCES approval_workflows(id),
  request_type text NOT NULL,
  request_data jsonb NOT NULL DEFAULT '{}',
  requester_id uuid NOT NULL,
  current_step_id uuid REFERENCES approval_steps(id),
  status text DEFAULT 'pending',
  priority text DEFAULT 'normal',
  due_date timestamptz,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  total_steps integer DEFAULT 0,
  completed_steps integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Bileşen Yapısı

#### **Ana Bileşenler**
- `ApprovalWorkflows`: Ana bileşen
- `WorkflowDetails`: Süreç detayları
- `RequestDetails`: Talep detayları
- `ApprovalStepEditor`: Adım düzenleyici
- `ApprovalDashboard`: Onay paneli

#### **Hook'lar**
- `useApprovalWorkflows`: Süreç yönetimi
- `useApprovalRequests`: Talep yönetimi
- `useApprovalNotifications`: Bildirim yönetimi

---

## 🔌 API Referansı

### Onay Süreçleri CRUD İşlemleri

#### **Süreç Oluşturma**
```typescript
const createApprovalWorkflow = async (workflow: ApprovalWorkflow) => {
  const { data, error } = await supabase
    .from('approval_workflows')
    .insert([workflow]);
  return { data, error };
};
```

#### **Süreç Güncelleme**
```typescript
const updateApprovalWorkflow = async (id: string, updates: Partial<ApprovalWorkflow>) => {
  const { data, error } = await supabase
    .from('approval_workflows')
    .update(updates)
    .eq('id', id);
  return { data, error };
};
```

#### **Süreç Silme**
```typescript
const deleteApprovalWorkflow = async (id: string) => {
  const { error } = await supabase
    .from('approval_workflows')
    .delete()
    .eq('id', id);
  return { error };
};
```

### Onay Talepleri Yönetimi

#### **Talep Oluşturma**
```typescript
const createApprovalRequest = async (request: ApprovalRequest) => {
  const { data, error } = await supabase
    .from('approval_requests')
    .insert([request]);
  return { data, error };
};
```

#### **Talep Durumu Kontrolü**
```typescript
const getApprovalRequestStatus = async (requestId: string) => {
  const { data, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  return { data, error };
};
```

#### **Onay Kararı Verme**
```typescript
const submitApprovalDecision = async (stepStatusId: string, decision: string, comments?: string) => {
  const { data, error } = await supabase
    .from('approval_step_status')
    .update({
      status: decision,
      decision: comments,
      decision_date: new Date().toISOString()
    })
    .eq('id', stepStatusId);
  return { data, error };
};
```

---

## 📝 Örnekler

### Örnek 1: Masraf Onay Süreci

```json
{
  "name": "Masraf Onay Süreci",
  "description": "Masraf raporları için standart onay süreci",
  "workflow_type": "sequential",
  "workflow_config": {
    "auto_approve_timeout": 48,
    "require_all_approvers": false,
    "allow_delegate": true
  },
  "trigger_conditions": {
    "request_type": "expense",
    "amount_threshold": 1000
  },
  "steps": [
    {
      "step_order": 1,
      "step_name": "Yönetici Onayı",
      "approver_type": "role",
      "approver_config": {
        "role": "manager",
        "department": "dynamic"
      },
      "timeout_hours": 24
    },
    {
      "step_order": 2,
      "step_name": "Finans Onayı",
      "approver_type": "role",
      "approver_config": {
        "role": "finance_manager"
      },
      "timeout_hours": 24
    }
  ]
}
```

### Örnek 2: Satın Alma Onay Süreci

```json
{
  "name": "Satın Alma Onay Süreci",
  "description": "Satın alma talepleri için onay süreci",
  "workflow_type": "conditional",
  "workflow_config": {
    "auto_approve_timeout": 72,
    "require_all_approvers": true,
    "allow_delegate": false
  },
  "trigger_conditions": {
    "request_type": "purchase",
    "amount_threshold": 5000
  },
  "steps": [
    {
      "step_order": 1,
      "step_name": "Departman Onayı",
      "approver_type": "role",
      "approver_config": {
        "role": "department_head"
      },
      "timeout_hours": 48
    },
    {
      "step_order": 2,
      "step_name": "Satın Alma Onayı",
      "approver_type": "role",
      "approver_config": {
        "role": "procurement_manager"
      },
      "timeout_hours": 48,
      "conditions": {
        "amount_greater_than": 10000
      }
    },
    {
      "step_order": 3,
      "step_name": "Genel Müdür Onayı",
      "approver_type": "role",
      "approver_config": {
        "role": "general_manager"
      },
      "timeout_hours": 72,
      "conditions": {
        "amount_greater_than": 50000
      }
    }
  ]
}
```

---

## 🔧 Geliştirme

### Yeni Onay Tipi Ekleme

#### 1. Onay Tipi Tanımlama
```typescript
// Yeni onay tipi ekle
const newApprovalType = {
  name: 'Proje Onayı',
  type: 'project_approval',
  description: 'Proje başlatma onayı',
  config_schema: {
    properties: {
      project_budget: { type: 'number' },
      project_duration: { type: 'number' }
    }
  }
};
```

#### 2. Bileşen Oluşturma
```typescript
// ProjectApprovalComponent.tsx
const ProjectApprovalComponent: React.FC<ProjectApprovalProps> = ({ request, onApprove, onReject }) => {
  return (
    <div className="project-approval">
      <div className="approval-header">
        <h3>Proje Onayı</h3>
        <div className="project-details">
          <span>Bütçe: {request.data.project_budget} TL</span>
          <span>Süre: {request.data.project_duration} ay</span>
        </div>
      </div>
      <div className="approval-actions">
        <button onClick={() => onApprove()}>Onayla</button>
        <button onClick={() => onReject()}>Reddet</button>
      </div>
    </div>
  );
};
```

#### 3. İşleyici Ekleme
```typescript
// Approval handler'a ekle
const handleProjectApproval = async (requestId: string, decision: string) => {
  // Proje onayı özel mantığı
  if (decision === 'approved') {
    await createProject(requestId);
    await notifyProjectTeam(requestId);
  }
};
```

---

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. Migration Hatası
```bash
# Hata: Table already exists
# Çözüm: Migration'ı tekrar çalıştırın
npm run approval-migration
```

#### 2. Onay Adımı Hatası
```typescript
# Hata: Step validation failed
# Çözüm: Adım konfigürasyonunu kontrol edin
const validateStep = (step: ApprovalStep) => {
  if (!step.approver_config || !step.step_name) {
    throw new Error('Adım konfigürasyonu eksik');
  }
};
```

#### 3. Timeout Hatası
```typescript
# Hata: Timeout processing failed
# Çözüm: Timeout işleyicisini kontrol edin
const processTimeout = async (stepStatus: ApprovalStepStatus) => {
  try {
    await updateStepStatus(stepStatus.id, 'expired');
    await sendTimeoutNotification(stepStatus.approver_id);
  } catch (error) {
    console.error('Timeout işleme hatası:', error);
  }
};
```

---

## 📞 Destek

### Yardım Alma
- **GitHub Issues**: Proje repository'sinde issue açın
- **Dokümantasyon**: Bu README dosyasını güncelleyin
- **Code Review**: Pull request ile katkıda bulunun

### Katkıda Bulunma
1. Fork yapın
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Pull request gönderin

---

## 🎉 Sonuç

Approval Workflows sistemi, organizasyonlarda onay süreçlerini dijitalleştirerek verimliliği artırır ve süreç takibini kolaylaştırır. Esnek yapısı sayesinde farklı iş süreçlerine uyarlanabilir.

**🎯 Ana Faydalar:**
- ⚡ Hızlı onay süreçleri
- 🔄 Otomatik süreç yönetimi
- 📊 Görsel süreç takibi
- 🎨 Kullanıcı dostu arayüz
- 🔧 Esnek özelleştirme
- 📈 Performans artışı
- 🔔 Otomatik bildirimler
- ⏰ Timeout yönetimi
