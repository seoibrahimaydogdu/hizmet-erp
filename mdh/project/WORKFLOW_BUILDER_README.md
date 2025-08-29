# 🔄 Workflow Builder Sistemi

Bu dokümantasyon, Hizmet ERP sistemi için geliştirilen görsel iş akışı oluşturucu hakkında detaylı bilgi içermektedir.

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

Workflow Builder, kullanıcıların sürükle-bırak arayüzü ile karmaşık iş akışlarını görsel olarak tasarlayabilecekleri güçlü bir araçtır. Bu sistem, talep yönetimi, onay süreçleri, otomatik atamalar ve bildirimler gibi iş süreçlerini otomatikleştirmek için kullanılır.

### 🎨 Arayüz Özellikleri

- **Görsel Tasarım**: Sürükle-bırak ile kolay tasarım
- **Node-Based System**: Bağlantılı düğüm sistemi
- **Real-time Preview**: Canlı önizleme
- **Zoom & Pan**: Yakınlaştırma ve kaydırma
- **Grid Snapping**: Izgara hizalama
- **Undo/Redo**: Geri alma/tekrarlama

---

## 🚀 Özellikler

### 📊 Node Tipleri

#### **1. Tetikleyici (Trigger)**
- **Talep Oluşturuldu**: Yeni talep eklendiğinde
- **Durum Değişti**: Talep durumu güncellendiğinde
- **Öncelik Güncellendi**: Öncelik değiştiğinde
- **Zaman Bazlı**: Belirli zamanlarda
- **Özel Tetikleyici**: API çağrısı ile

#### **2. Koşul (Condition)**
- **Mantıksal Operatörler**: AND, OR, NOT
- **Karşılaştırma**: ==, !=, >, <, >=, <=
- **Dizi Kontrolü**: IN, NOT IN, CONTAINS
- **Regex Eşleştirme**: Düzenli ifade kontrolü

#### **3. Aksiyon (Action)**
- **E-posta Gönder**: Otomatik e-posta bildirimi
- **Talep Ata**: Otomatik temsilci atama
- **Durum Güncelle**: Talep durumunu değiştir
- **Görev Oluştur**: Yeni görev ekle
- **Yükselt**: Üst yöneticiye yönlendir
- **Webhook**: Dış sisteme bildirim gönder

#### **4. Onay (Approval)**
- **Tek Onay**: Tek kişiden onay
- **Sıralı Onay**: Belirli sırayla onay
- **Paralel Onay**: Aynı anda birden fazla onay
- **Koşullu Onay**: Belirli koşullara göre onay

#### **5. Bildirim (Notification)**
- **E-posta Bildirimi**: Otomatik e-posta
- **SMS Bildirimi**: Mobil mesaj
- **Push Notification**: Anlık bildirim
- **Slack/Teams**: Kurumsal mesajlaşma

### 🔧 Gelişmiş Özellikler

#### **Şablon Sistemi**
- Hazır şablonlar
- Özelleştirilebilir şablonlar
- Şablon paylaşımı
- Şablon kategorileri

#### **Değişken Sistemi**
- Global değişkenler
- Workflow değişkenleri
- Dinamik değerler
- Koşullu değişkenler

#### **İzin Sistemi**
- Rol bazlı erişim
- Workflow izinleri
- Düzenleme izinleri
- Çalıştırma izinleri

---

## 🛠️ Kurulum

### 1. Veritabanı Migration'ı

#### Yöntem 1: Node.js Script
```bash
# Environment variables'ları ayarlayın
export VITE_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Migration'ı çalıştırın
npm run workflow-migration
```

#### Yöntem 2: Supabase Dashboard
1. Supabase Dashboard'a giriş yapın
2. SQL Editor'ü açın
3. `supabase/migrations/20241201_workflow_builder.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'de çalıştırın

### 2. Uygulamayı Başlatma
```bash
npm run dev
```

### 3. Erişim
- Sidebar'dan "Workflow Builder" seçin
- Veya `/workflow-builder` URL'ine gidin

---

## 📖 Kullanım

### 🎨 Workflow Oluşturma

#### 1. Yeni Workflow
```typescript
// Yeni workflow oluştur
const newWorkflow: Workflow = {
  name: 'Otomatik Talep Atama',
  description: 'Yeni talepleri otomatik olarak uygun temsilciye atar',
  category: 'ticket',
  status: 'draft',
  workflow_data: {
    nodes: [],
    connections: []
  },
  trigger_config: {},
  variables: {},
  version: 1,
  execution_count: 0
};
```

#### 2. Node Ekleme
```typescript
// Node ekle
const newNode: WorkflowNode = {
  id: `node_${Date.now()}`,
  type: 'trigger',
  position: { x: 100, y: 100 },
  data: {
    label: 'Talep Oluşturuldu',
    config: {
      conditions: {
        category: 'technical'
      }
    }
  }
};
```

#### 3. Bağlantı Oluşturma
```typescript
// Bağlantı oluştur
const newConnection: WorkflowConnection = {
  id: `conn_${Date.now()}`,
  source: 'trigger_node_id',
  target: 'action_node_id'
};
```

### 🔄 Workflow Çalıştırma

#### 1. Manuel Çalıştırma
```typescript
// Workflow'u manuel olarak çalıştır
const executeWorkflow = async (workflowId: string, triggerData: any) => {
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert([{
      workflow_id: workflowId,
      trigger_data: triggerData,
      status: 'running'
    }]);
};
```

#### 2. Otomatik Tetikleme
```typescript
// Talep oluşturulduğunda workflow tetikle
const triggerWorkflow = async (ticketData: any) => {
  const workflows = await getActiveWorkflows('ticket_created');
  
  for (const workflow of workflows) {
    if (matchesTriggerConditions(workflow, ticketData)) {
      await executeWorkflow(workflow.id, ticketData);
    }
  }
};
```

---

## 🗄️ Teknik Detaylar

### Veritabanı Yapısı

#### **workflows Tablosu**
```sql
CREATE TABLE workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'ticket',
  status text DEFAULT 'draft',
  version integer DEFAULT 1,
  workflow_data jsonb NOT NULL DEFAULT '{}',
  trigger_config jsonb NOT NULL DEFAULT '{}',
  variables jsonb DEFAULT '{}',
  execution_count integer DEFAULT 0,
  last_executed timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### **workflow_executions Tablosu**
```sql
CREATE TABLE workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_data jsonb NOT NULL DEFAULT '{}',
  execution_path jsonb NOT NULL DEFAULT '[]',
  status text DEFAULT 'running',
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  error_message text,
  variables jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### Bileşen Yapısı

#### **Ana Bileşenler**
- `WorkflowBuilder`: Ana bileşen
- `WorkflowCanvas`: Canvas alanı
- `NodePalette`: Node tipleri paleti
- `PropertiesPanel`: Özellikler paneli
- `TemplateModal`: Şablon modal'ı

#### **Hook'lar**
- `useWorkflow`: Workflow state yönetimi
- `useWorkflowExecution`: Çalıştırma yönetimi
- `useWorkflowTemplates`: Şablon yönetimi

---

## 🔌 API Referansı

### Workflow CRUD İşlemleri

#### **Workflow Oluşturma**
```typescript
const createWorkflow = async (workflow: Workflow) => {
  const { data, error } = await supabase
    .from('workflows')
    .insert([workflow]);
  return { data, error };
};
```

#### **Workflow Güncelleme**
```typescript
const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
  const { data, error } = await supabase
    .from('workflows')
    .update(updates)
    .eq('id', id);
  return { data, error };
};
```

#### **Workflow Silme**
```typescript
const deleteWorkflow = async (id: string) => {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);
  return { error };
};
```

### Workflow Çalıştırma

#### **Workflow Tetikleme**
```typescript
const triggerWorkflow = async (workflowId: string, triggerData: any) => {
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert([{
      workflow_id: workflowId,
      trigger_data: triggerData,
      status: 'running'
    }]);
  return { data, error };
};
```

#### **Çalıştırma Durumu Kontrolü**
```typescript
const getExecutionStatus = async (executionId: string) => {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();
  return { data, error };
};
```

---

## 📝 Örnekler

### Örnek 1: Otomatik Talep Atama

```json
{
  "name": "Otomatik Talep Atama",
  "description": "Yeni talepleri otomatik olarak uygun temsilciye atar",
  "category": "ticket",
  "workflow_data": {
    "nodes": [
      {
        "id": "trigger_1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": {
          "label": "Talep Oluşturuldu",
          "config": {
            "type": "ticket_created",
            "conditions": {
              "category": "technical"
            }
          }
        }
      },
      {
        "id": "action_1",
        "type": "action",
        "position": { "x": 400, "y": 100 },
        "data": {
          "label": "Temsilciye Ata",
          "config": {
            "type": "assign_ticket",
            "assignment_type": "skill_based",
            "skills": ["technical_support"]
          }
        }
      }
    ],
    "connections": [
      {
        "id": "conn_1",
        "source": "trigger_1",
        "target": "action_1"
      }
    ]
  }
}
```

### Örnek 2: SLA İhlali Yükseltme

```json
{
  "name": "SLA İhlali Yükseltme",
  "description": "SLA ihlali durumunda talebi yükseltir",
  "category": "ticket",
  "workflow_data": {
    "nodes": [
      {
        "id": "trigger_1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": {
          "label": "SLA İhlali",
          "config": {
            "type": "sla_breach",
            "conditions": {
              "priority": "high"
            }
          }
        }
      },
      {
        "id": "condition_1",
        "type": "condition",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "VIP Müşteri mi?",
          "config": {
            "expression": "customer.type == 'vip'"
          }
        }
      },
      {
        "id": "action_1",
        "type": "action",
        "position": { "x": 500, "y": 50 },
        "data": {
          "label": "Yöneticiye Yükselt",
          "config": {
            "type": "escalate",
            "escalation_level": "manager"
          }
        }
      },
      {
        "id": "action_2",
        "type": "action",
        "position": { "x": 500, "y": 150 },
        "data": {
          "label": "E-posta Bildirimi",
          "config": {
            "type": "send_email",
            "template": "sla_breach_notification"
          }
        }
      }
    ],
    "connections": [
      {
        "id": "conn_1",
        "source": "trigger_1",
        "target": "condition_1"
      },
      {
        "id": "conn_2",
        "source": "condition_1",
        "target": "action_1",
        "condition": "true"
      },
      {
        "id": "conn_3",
        "source": "condition_1",
        "target": "action_2",
        "condition": "false"
      }
    ]
  }
}
```

---

## 🔧 Geliştirme

### Yeni Node Tipi Ekleme

#### 1. Node Tipi Tanımlama
```typescript
// workflow_node_types tablosuna ekle
const newNodeType = {
  name: 'Yeni Node',
  type: 'custom_action',
  icon: 'CustomIcon',
  description: 'Özel aksiyon node\'u',
  config_schema: {
    properties: {
      custom_field: { type: 'string' }
    }
  }
};
```

#### 2. Bileşen Oluşturma
```typescript
// CustomNode.tsx
const CustomNode: React.FC<CustomNodeProps> = ({ data, config }) => {
  return (
    <div className="custom-node">
      <div className="node-header">{data.label}</div>
      <div className="node-content">
        {/* Node içeriği */}
      </div>
    </div>
  );
};
```

#### 3. İşleyici Ekleme
```typescript
// Workflow executor'a ekle
const executeCustomAction = async (nodeConfig: any, context: any) => {
  // Özel aksiyon mantığı
  console.log('Custom action executed:', nodeConfig);
};
```

---

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. Migration Hatası
```bash
# Hata: Table already exists
# Çözüm: Migration'ı tekrar çalıştırın
npm run workflow-migration
```

#### 2. Node Bağlantı Hatası
```typescript
// Hata: Connection validation failed
// Çözüm: Node tiplerini kontrol edin
const validConnections = {
  trigger: ['condition', 'action'],
  condition: ['action', 'approval'],
  action: ['condition', 'action', 'notification']
};
```

#### 3. Workflow Çalıştırma Hatası
```typescript
// Hata: Workflow execution failed
// Çözüm: Execution loglarını kontrol edin
const checkExecutionLogs = async (executionId: string) => {
  const { data } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();
  
  console.log('Execution logs:', data);
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

Workflow Builder sistemi, iş süreçlerini otomatikleştirerek verimliliği artırır ve insan hatalarını minimize eder. Görsel arayüzü sayesinde teknik bilgi gerektirmeden karmaşık iş akışları oluşturulabilir.

**🎯 Ana Faydalar:**
- ⚡ Hızlı iş akışı oluşturma
- 🔄 Otomatik süreç yönetimi
- 📊 Görsel süreç takibi
- 🎨 Kullanıcı dostu arayüz
- 🔧 Esnek özelleştirme
- �� Performans artışı
