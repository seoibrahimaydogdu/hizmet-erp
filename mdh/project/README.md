# 🚀 Müşteri Destek Hattı ERP Sistemi

## 🔧 Feedback Constraint Düzeltmesi

Foreign key constraint hatası için:

```bash
# Environment variables'ları ayarlayın
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Otomatik düzeltme
npm run fix-feedback-constraint

# Veya manuel olarak Supabase Dashboard > SQL Editor'de:
ALTER TABLE feedback_requests DROP CONSTRAINT IF EXISTS feedback_requests_user_id_fkey;
ALTER TABLE feedback_requests ALTER COLUMN user_id DROP NOT NULL;
```

## 📚 Detaylı Bilgi

- [Feedback Constraint Fix README](./FEEDBACK_CONSTRAINT_FIX_README.md)
- [Feedback System README](./FEEDBACK_SYSTEM_README.md)
- [Feedback Analytics README](./FEEDBACK_ANALYTICS_README.md)
