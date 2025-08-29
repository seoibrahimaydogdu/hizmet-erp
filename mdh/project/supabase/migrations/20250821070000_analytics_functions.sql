/*
  # Analitik Raporlar için SQL Fonksiyonları

  1. exec_sql - Manuel SQL sorguları çalıştırmak için
  2. get_ticket_analytics - Talep analitikleri
  3. get_agent_performance - Temsilci performansı
  4. get_customer_analytics - Müşteri analitikleri
  5. get_financial_analytics - Finansal analitikler
  6. get_sla_analytics - SLA analitikleri
*/

-- Manuel SQL sorguları çalıştırmak için fonksiyon
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Güvenlik kontrolü - sadece SELECT sorgularına izin ver
  IF NOT (sql_query ILIKE 'SELECT%' OR sql_query ILIKE 'WITH%') THEN
    RAISE EXCEPTION 'Sadece SELECT sorgularına izin verilir';
  END IF;
  
  -- Sorguyu çalıştır
  EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Talep analitikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_ticket_analytics(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'open', COUNT(CASE WHEN status = 'open' THEN 1 END),
    'in_progress', COUNT(CASE WHEN status = 'in_progress' THEN 1 END),
    'resolved', COUNT(CASE WHEN status = 'resolved' THEN 1 END),
    'closed', COUNT(CASE WHEN status = 'closed' THEN 1 END),
    'high_priority', COUNT(CASE WHEN priority = 'high' THEN 1 END),
    'overdue', COUNT(CASE WHEN 
      status NOT IN ('resolved', 'closed') AND 
      created_at < NOW() - INTERVAL '24 hours' 
    THEN 1 END),
    'avg_resolution_time', AVG(CASE WHEN resolved_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
    END),
    'new_today', COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END),
    'new_this_week', COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END),
    'new_this_month', COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END)
  ) INTO result
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date;
  
  RETURN result;
END;
$$;

-- Temsilci performans analizi fonksiyonu
CREATE OR REPLACE FUNCTION get_agent_performance(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'resolved', COUNT(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 END),
      'avg_resolution_time', AVG(CASE WHEN t.resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600 
      END),
      'satisfaction_score', AVG(t.satisfaction_rating),
      'active_tickets', COUNT(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 END),
      'success_rate', CASE 
        WHEN COUNT(t.id) > 0 
        THEN (COUNT(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 END)::float / COUNT(t.id)::float) * 100
        ELSE 0 
      END
    )
  ) INTO result
  FROM agents a
  LEFT JOIN tickets t ON a.id = t.agent_id AND t.created_at BETWEEN start_date AND end_date
  GROUP BY a.id, a.name
  ORDER BY COUNT(CASE WHEN t.status IN ('resolved', 'closed') THEN 1 END) DESC;
  
  RETURN result;
END;
$$;

-- Müşteri analitikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_customer_analytics(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_customers', COUNT(DISTINCT c.id),
    'new_customers', COUNT(CASE WHEN c.created_at >= start_date THEN 1 END),
    'avg_satisfaction', AVG(c.satisfaction_score),
    'top_customers', (
      SELECT json_agg(
        json_build_object(
          'id', c2.id,
          'name', c2.name,
          'total_tickets', COUNT(t.id),
          'avg_satisfaction', AVG(t.satisfaction_rating),
          'total_spent', COALESCE(SUM(p.amount), 0)
        )
      )
      FROM customers c2
      LEFT JOIN tickets t ON c2.id = t.customer_id AND t.created_at BETWEEN start_date AND end_date
      LEFT JOIN payments p ON c2.id = p.customer_id AND p.payment_date BETWEEN start_date AND end_date
      GROUP BY c2.id, c2.name
      ORDER BY COUNT(t.id) DESC
      LIMIT 10
    )
  ) INTO result
  FROM customers c
  WHERE c.created_at <= end_date;
  
  RETURN result;
END;
$$;

-- Finansal analitikler fonksiyonu
CREATE OR REPLACE FUNCTION get_financial_analytics(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  total_revenue numeric;
  total_expenses numeric;
  paying_customers integer;
BEGIN
  -- Toplam gelir
  SELECT COALESCE(SUM(amount), 0) INTO total_revenue
  FROM payments
  WHERE payment_date BETWEEN start_date AND end_date 
    AND status = 'completed';
  
  -- Toplam gider
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM expenses
  WHERE expense_date BETWEEN start_date AND end_date;
  
  -- Ödeme yapan müşteri sayısı
  SELECT COUNT(DISTINCT customer_id) INTO paying_customers
  FROM payments
  WHERE payment_date BETWEEN start_date AND end_date 
    AND status = 'completed';
  
  SELECT json_build_object(
    'total_revenue', total_revenue,
    'total_expenses', total_expenses,
    'net_profit', total_revenue - total_expenses,
    'paying_customers', paying_customers,
    'arpu', CASE WHEN paying_customers > 0 THEN total_revenue / paying_customers ELSE 0 END,
    'mrr', (
      SELECT COALESCE(SUM(sp.price), 0)
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.status = 'active'
    ),
    'revenue_by_plan', (
      SELECT json_agg(
        json_build_object(
          'plan', sp.name,
          'revenue', COALESCE(SUM(p.amount), 0),
          'customers', COUNT(DISTINCT p.customer_id)
        )
      )
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE p.payment_date BETWEEN start_date AND end_date 
        AND p.status = 'completed'
      GROUP BY sp.name
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- SLA analitikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_sla_analytics(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  total_tickets integer;
  sla_breaches integer;
  sla_compliant integer;
BEGIN
  -- Toplam talep sayısı
  SELECT COUNT(*) INTO total_tickets
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date;
  
  -- SLA ihlalleri
  SELECT COUNT(*) INTO sla_breaches
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date
    AND status NOT IN ('resolved', 'closed')
    AND created_at < NOW() - INTERVAL '24 hours';
  
  -- SLA uyumlu talepler
  SELECT COUNT(*) INTO sla_compliant
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date
    AND status IN ('resolved', 'closed')
    AND resolved_at <= created_at + INTERVAL '24 hours';
  
  SELECT json_build_object(
    'sla_breaches', sla_breaches,
    'sla_compliant', sla_compliant,
    'sla_compliance_rate', CASE WHEN total_tickets > 0 THEN (sla_compliant::float / total_tickets::float) * 100 ELSE 0 END,
    'avg_resolution_time', AVG(CASE WHEN resolved_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
    END),
    'sla_by_priority', (
      SELECT json_agg(
        json_build_object(
          'priority', priority,
          'breaches', COUNT(CASE WHEN 
            status NOT IN ('resolved', 'closed') AND 
            created_at < NOW() - INTERVAL '24 hours' 
          THEN 1 END),
          'compliant', COUNT(CASE WHEN 
            status IN ('resolved', 'closed') AND 
            resolved_at <= created_at + INTERVAL '24 hours'
          THEN 1 END)
        )
      )
      FROM tickets
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY priority
    )
  ) INTO result
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date;
  
  RETURN result;
END;
$$;

-- Günlük trendler fonksiyonu
CREATE OR REPLACE FUNCTION get_daily_trends(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'date', DATE(created_at),
      'tickets', COUNT(*),
      'resolved', COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END),
      'revenue', COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        WHERE DATE(p.payment_date) = DATE(tickets.created_at)
          AND p.status = 'completed'
      ), 0)
    )
  ) INTO result
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at);
  
  RETURN result;
END;
$$;

-- Kategori analitikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_category_analytics(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  total_tickets integer;
BEGIN
  -- Toplam talep sayısı
  SELECT COUNT(*) INTO total_tickets
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date;
  
  SELECT json_agg(
    json_build_object(
      'category', category,
      'count', COUNT(*),
      'avg_resolution_time', AVG(CASE WHEN resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
      END),
      'satisfaction_score', AVG(satisfaction_rating),
      'percentage', (COUNT(*)::float / total_tickets::float) * 100
    )
  ) INTO result
  FROM tickets
  WHERE created_at BETWEEN start_date AND end_date
  GROUP BY category
  ORDER BY COUNT(*) DESC;
  
  RETURN result;
END;
$$;

-- Churn analizi fonksiyonu
CREATE OR REPLACE FUNCTION get_churn_analytics(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  total_customers integer;
  churned_customers integer;
  churn_rate numeric;
BEGIN
  -- Toplam müşteri sayısı
  SELECT COUNT(*) INTO total_customers
  FROM customers
  WHERE created_at <= end_date;
  
  -- Ayrılan müşteri sayısı (subscription status = 'cancelled' olanlar)
  SELECT COUNT(DISTINCT s.customer_id) INTO churned_customers
  FROM subscriptions s
  WHERE s.status = 'cancelled' 
    AND s.updated_at BETWEEN start_date AND end_date;
  
  -- Churn oranı hesaplama
  churn_rate := CASE 
    WHEN total_customers > 0 THEN (churned_customers::numeric / total_customers::numeric) * 100
    ELSE 0 
  END;
  
  SELECT json_build_object(
    'churn_rate', ROUND(churn_rate, 2),
    'total_customers', total_customers,
    'churned_customers', churned_customers,
    'avg_subscription_duration', (
      SELECT AVG(EXTRACT(EPOCH FROM (s.updated_at - s.start_date))/86400)
      FROM subscriptions s
      WHERE s.status = 'cancelled' 
        AND s.updated_at BETWEEN start_date AND end_date
    ),
    'churned_users', (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'plan', s.plan_name,
          'churn_date', s.updated_at,
          'subscription_duration', EXTRACT(EPOCH FROM (s.updated_at - s.start_date))/86400,
          'total_tickets', c.total_tickets,
          'satisfaction_score', c.satisfaction_score,
          'last_payment', (
            SELECT MAX(p.payment_date)
            FROM payments p
            WHERE p.customer_id = c.id
          )
        )
      )
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status = 'cancelled' 
        AND s.updated_at BETWEEN start_date AND end_date
    ),
    'churn_by_plan', (
      SELECT json_agg(
        json_build_object(
          'plan', s.plan_name,
          'count', COUNT(*),
          'percentage', (COUNT(*)::numeric / churned_customers::numeric) * 100
        )
      )
      FROM subscriptions s
      WHERE s.status = 'cancelled' 
        AND s.updated_at BETWEEN start_date AND end_date
      GROUP BY s.plan_name
      ORDER BY COUNT(*) DESC
    ),
    'risk_customers', (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'plan', s.plan_name,
          'last_login', (
            SELECT MAX(tm.created_at)
            FROM ticket_messages tm
            JOIN tickets t ON tm.ticket_id = t.id
            WHERE t.customer_id = c.id
          ),
          'days_since_last_activity', EXTRACT(EPOCH FROM (NOW() - (
            SELECT MAX(tm.created_at)
            FROM ticket_messages tm
            JOIN tickets t ON tm.ticket_id = t.id
            WHERE t.customer_id = c.id
          )))/86400,
          'satisfaction_score', c.satisfaction_score
        )
      )
      FROM customers c
      JOIN subscriptions s ON c.id = s.customer_id
      WHERE s.status = 'active'
        AND s.next_billing_date < NOW() + INTERVAL '7 days'
        AND c.satisfaction_score < 7
      LIMIT 10
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Churn nedenleri analizi fonksiyonu
CREATE OR REPLACE FUNCTION get_churn_reasons(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'reason', 
      CASE 
        WHEN c.satisfaction_score < 5 THEN 'Düşük Memnuniyet'
        WHEN c.total_tickets = 0 THEN 'Kullanım Yok'
        WHEN s.plan_name = 'Basic' THEN 'Özellik Eksikliği'
        WHEN EXISTS (
          SELECT 1 FROM payments p 
          WHERE p.customer_id = c.id 
            AND p.status = 'failed'
            AND p.payment_date > NOW() - INTERVAL '30 days'
        ) THEN 'Ödeme Sorunu'
        ELSE 'Diğer'
      END,
      'count', COUNT(*),
      'percentage', (COUNT(*)::numeric / (
        SELECT COUNT(DISTINCT s.customer_id)
        FROM subscriptions s
        WHERE s.status = 'cancelled' 
          AND s.updated_at BETWEEN start_date AND end_date
      )::numeric) * 100
    )
  ) INTO result
  FROM subscriptions s
  JOIN customers c ON s.customer_id = c.id
  WHERE s.status = 'cancelled' 
    AND s.updated_at BETWEEN start_date AND end_date
  GROUP BY 
    CASE 
      WHEN c.satisfaction_score < 5 THEN 'Düşük Memnuniyet'
      WHEN c.total_tickets = 0 THEN 'Kullanım Yok'
      WHEN s.plan_name = 'Basic' THEN 'Özellik Eksikliği'
      WHEN EXISTS (
        SELECT 1 FROM payments p 
        WHERE p.customer_id = c.id 
          AND p.status = 'failed'
          AND p.payment_date > NOW() - INTERVAL '30 days'
      ) THEN 'Ödeme Sorunu'
      ELSE 'Diğer'
    END
  ORDER BY COUNT(*) DESC;
  
  RETURN result;
END;
$$;

-- Müşteri aktivite analizi fonksiyonu
CREATE OR REPLACE FUNCTION get_customer_activity_analysis(
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'customer_id', c.id,
      'name', c.name,
      'email', c.email,
      'plan', s.plan_name,
      'last_activity', (
        SELECT MAX(tm.created_at)
        FROM ticket_messages tm
        JOIN tickets t ON tm.ticket_id = t.id
        WHERE t.customer_id = c.id
      ),
      'days_since_last_activity', EXTRACT(EPOCH FROM (NOW() - (
        SELECT MAX(tm.created_at)
        FROM ticket_messages tm
        JOIN tickets t ON tm.ticket_id = t.id
        WHERE t.customer_id = c.id
      )))/86400,
      'total_tickets', c.total_tickets,
      'satisfaction_score', c.satisfaction_score,
      'subscription_start', s.start_date,
      'subscription_duration', EXTRACT(EPOCH FROM (NOW() - s.start_date))/86400,
      'risk_level', 
        CASE 
          WHEN c.satisfaction_score < 5 THEN 'Yüksek'
          WHEN c.total_tickets = 0 THEN 'Orta'
          WHEN s.next_billing_date < NOW() + INTERVAL '7 days' THEN 'Orta'
          ELSE 'Düşük'
        END
    )
  ) INTO result
  FROM customers c
  JOIN subscriptions s ON c.id = s.customer_id
  WHERE s.status = 'active'
    AND c.created_at <= end_date
  ORDER BY 
    CASE 
      WHEN c.satisfaction_score < 5 THEN 1
      WHEN c.total_tickets = 0 THEN 2
      WHEN s.next_billing_date < NOW() + INTERVAL '7 days' THEN 3
      ELSE 4
    END,
    c.satisfaction_score ASC;
  
  RETURN result;
END;
$$;

-- Güvenlik politikaları
GRANT EXECUTE ON FUNCTION exec_sql(text) TO public;
GRANT EXECUTE ON FUNCTION get_ticket_analytics(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_agent_performance(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_customer_analytics(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_financial_analytics(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_sla_analytics(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_daily_trends(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_category_analytics(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_churn_analytics(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_churn_reasons(timestamptz, timestamptz) TO public;
GRANT EXECUTE ON FUNCTION get_customer_activity_analysis(timestamptz, timestamptz) TO public;
