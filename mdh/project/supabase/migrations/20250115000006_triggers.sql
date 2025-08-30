-- Veri bütünlüğü ve otomatik işlemler için trigger'lar
-- Bu dosya veritabanı tutarlılığını sağlamak için gerekli trigger'ları içerir

-- ========================================
-- UPDATED_AT TRIGGER FONKSİYONU
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- CUSTOMERS TABLOSU TRIGGER'LARI
-- ========================================
-- Updated at trigger (eğer yoksa oluştur)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_customers_updated_at') THEN
        CREATE TRIGGER trigger_customers_updated_at
            BEFORE UPDATE ON customers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Customer satisfaction score hesaplama trigger'ı
CREATE OR REPLACE FUNCTION update_customer_satisfaction_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Ticket'ların ortalama satisfaction rating'ini hesapla
    UPDATE customers 
    SET satisfaction_score = (
        SELECT COALESCE(AVG(satisfaction_rating), 0)
        FROM tickets 
        WHERE customer_id = NEW.customer_id 
        AND satisfaction_rating IS NOT NULL
    )
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_customer_satisfaction') THEN
        CREATE TRIGGER trigger_update_customer_satisfaction
            AFTER UPDATE OF satisfaction_rating ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION update_customer_satisfaction_score();
    END IF;
END $$;

-- Customer total tickets sayısı güncelleme
CREATE OR REPLACE FUNCTION update_customer_total_tickets()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customers 
        SET total_tickets = total_tickets + 1
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE customers 
        SET total_tickets = total_tickets - 1
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_customer_ticket_count') THEN
        CREATE TRIGGER trigger_update_customer_ticket_count
            AFTER INSERT OR DELETE ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION update_customer_total_tickets();
    END IF;
END $$;

-- ========================================
-- AGENTS TABLOSU TRIGGER'LARI
-- ========================================
-- Updated at trigger (eğer yoksa oluştur)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_agents_updated_at') THEN
        CREATE TRIGGER trigger_agents_updated_at
            BEFORE UPDATE ON agents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Agent performance score hesaplama
CREATE OR REPLACE FUNCTION update_agent_performance_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Çözülen ticket sayısını güncelle
    UPDATE agents 
    SET total_resolved = (
        SELECT COUNT(*)
        FROM tickets 
        WHERE agent_id = NEW.agent_id 
        AND status = 'resolved'
    )
    WHERE id = NEW.agent_id;
    
    -- Performance score hesapla (basit bir formül)
    UPDATE agents 
    SET performance_score = (
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(
                    (COUNT(*) FILTER (WHERE status = 'resolved') * 100.0 / COUNT(*)) +
                    (AVG(COALESCE(satisfaction_rating, 0)) * 0.5)
                )
            END
        FROM tickets 
        WHERE agent_id = NEW.agent_id
    )
    WHERE id = NEW.agent_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_agent_performance') THEN
        CREATE TRIGGER trigger_update_agent_performance
            AFTER UPDATE OF status, satisfaction_rating ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION update_agent_performance_score();
    END IF;
END $$;

-- ========================================
-- TICKETS TABLOSU TRIGGER'LARI
-- ========================================
-- Updated at trigger (eğer yoksa oluştur)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_tickets_updated_at') THEN
        CREATE TRIGGER trigger_tickets_updated_at
            BEFORE UPDATE ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Ticket resolved_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_ticket_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
    ELSIF NEW.status != 'resolved' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_ticket_resolved_at') THEN
        CREATE TRIGGER trigger_update_ticket_resolved_at
            BEFORE UPDATE ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION update_ticket_resolved_at();
    END IF;
END $$;

-- Ticket durumu değişikliği log'u
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO system_logs (action, user_id, details)
        VALUES (
            'ticket_status_change',
            auth.uid(),
            jsonb_build_object(
                'ticket_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'customer_id', NEW.customer_id,
                'agent_id', NEW.agent_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_ticket_status_change') THEN
        CREATE TRIGGER trigger_log_ticket_status_change
            AFTER UPDATE ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION log_ticket_status_change();
    END IF;
END $$;

-- ========================================
-- CHAT SİSTEMİ TRIGGER'LARI
-- ========================================
-- Channels updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_channels_updated_at') THEN
        CREATE TRIGGER trigger_channels_updated_at
            BEFORE UPDATE ON channels
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Channel member count güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE channels 
        SET member_count = member_count + 1
        WHERE id = NEW.channel_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE channels 
        SET member_count = member_count - 1
        WHERE id = OLD.channel_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Channel member count trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_channel_member_count') THEN
        
        CREATE TRIGGER trigger_update_channel_member_count
            AFTER INSERT OR DELETE ON channel_members
            FOR EACH ROW
            EXECUTE FUNCTION update_channel_member_count();
    END IF;
END $$;

-- Messages updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_messages_updated_at') THEN
        CREATE TRIGGER trigger_messages_updated_at
            BEFORE UPDATE ON messages
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Channel last_message_at güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE channels 
        SET last_message_at = NEW.created_at
        WHERE id = NEW.channel_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Channel last_message_at trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_channel_last_message') THEN
        
        CREATE TRIGGER trigger_update_channel_last_message
            AFTER INSERT ON messages
            FOR EACH ROW
            EXECUTE FUNCTION update_channel_last_message();
    END IF;
END $$;

-- Message soft delete kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION check_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
        NEW.deleted_at = NOW();
    ELSIF NEW.is_deleted = false THEN
        NEW.deleted_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Message soft delete trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_message_deletion') THEN
        
        CREATE TRIGGER trigger_check_message_deletion
            BEFORE UPDATE ON messages
            FOR EACH ROW
            EXECUTE FUNCTION check_message_deletion();
    END IF;
END $$;

-- ========================================
-- WORKFLOW APPROVAL TRIGGER'LARI
-- ========================================
-- Workflow definitions updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_definitions')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_workflow_definitions_updated_at') THEN
        CREATE TRIGGER trigger_workflow_definitions_updated_at
            BEFORE UPDATE ON workflow_definitions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Workflow instances updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_instances')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_workflow_instances_updated_at') THEN
        CREATE TRIGGER trigger_workflow_instances_updated_at
            BEFORE UPDATE ON workflow_instances
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Workflow completion kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION check_workflow_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Tüm adımlar tamamlandıysa workflow'u tamamla
    IF NOT EXISTS (
        SELECT 1 FROM workflow_steps 
        WHERE workflow_instance_id = NEW.workflow_instance_id 
        AND status NOT IN ('completed', 'skipped')
    ) THEN
        UPDATE workflow_instances 
        SET status = 'completed', completed_at = NOW()
        WHERE id = NEW.workflow_instance_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Workflow completion trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_steps') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_instances')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_workflow_completion') THEN
        
        CREATE TRIGGER trigger_check_workflow_completion
            AFTER UPDATE ON workflow_steps
            FOR EACH ROW
            EXECUTE FUNCTION check_workflow_completion();
    END IF;
END $$;

-- Approval request otomatik oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_approval_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Yeni workflow step oluşturulduğunda approval request oluştur
    IF NEW.step_type = 'approval' AND NEW.assigned_user_id IS NOT NULL THEN
        INSERT INTO approval_requests (
            workflow_instance_id,
            step_id,
            requester_id,
            approver_id,
            request_type,
            entity_id,
            entity_data,
            status,
            priority,
            due_date
        ) VALUES (
            NEW.workflow_instance_id,
            NEW.id,
            (SELECT created_by FROM workflow_instances WHERE id = NEW.workflow_instance_id),
            NEW.assigned_user_id,
            (SELECT workflow_type FROM workflow_instances wi 
             JOIN workflow_definitions wd ON wi.workflow_definition_id = wd.id 
             WHERE wi.id = NEW.workflow_instance_id),
            (SELECT entity_id FROM workflow_instances WHERE id = NEW.workflow_instance_id),
            (SELECT entity_data FROM workflow_instances WHERE id = NEW.workflow_instance_id),
            'pending',
            'medium',
            NEW.due_date
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Approval request trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_steps')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_instances')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_definitions')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_requests')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_approval_request') THEN
        
        CREATE TRIGGER trigger_create_approval_request
            AFTER INSERT ON workflow_steps
            FOR EACH ROW
            EXECUTE FUNCTION create_approval_request();
    END IF;
END $$;

-- ========================================
-- PROJECT MANAGEMENT TRIGGER'LARI
-- ========================================
-- Projects updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_projects_updated_at') THEN
        CREATE TRIGGER trigger_projects_updated_at
            BEFORE UPDATE ON projects
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Project progress hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE projects 
    SET progress_percentage = (
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(
                    (COUNT(*) FILTER (WHERE status = 'done') * 100.0 / COUNT(*))
                )
            END
        FROM project_tasks 
        WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Project progress trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_project_progress') THEN
        
        CREATE TRIGGER trigger_update_project_progress
            AFTER UPDATE OF status ON project_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_project_progress();
    END IF;
END $$;

-- Project tasks updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_project_tasks_updated_at') THEN
        CREATE TRIGGER trigger_project_tasks_updated_at
            BEFORE UPDATE ON project_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Task completion kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION update_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'done' THEN
        NEW.completed_at = NULL;
    END IF;
    
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
        NEW.started_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Task completion trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_task_completion') THEN
        
        CREATE TRIGGER trigger_update_task_completion
            BEFORE UPDATE ON project_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_task_completion();
    END IF;
END $$;

-- Task history log'u fonksiyonu
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Status değişikliği
    IF OLD.status != NEW.status THEN
        INSERT INTO task_history (task_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'status', OLD.status, NEW.status, auth.uid());
    END IF;
    
    -- Assignee değişikliği
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        INSERT INTO task_history (task_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'assignee_id', OLD.assignee_id::text, NEW.assignee_id::text, auth.uid());
    END IF;
    
    -- Priority değişikliği
    IF OLD.priority != NEW.priority THEN
        INSERT INTO task_history (task_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'priority', OLD.priority, NEW.priority, auth.uid());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Task history trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_history')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_task_changes') THEN
        
        CREATE TRIGGER trigger_log_task_changes
            AFTER UPDATE ON project_tasks
            FOR EACH ROW
            EXECUTE FUNCTION log_task_changes();
    END IF;
END $$;

-- Time entries updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_time_entries_updated_at') THEN
        CREATE TRIGGER trigger_time_entries_updated_at
            BEFORE UPDATE ON time_entries
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Time entry duration hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_time_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Time entry duration trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_calculate_time_duration') THEN
        
        CREATE TRIGGER trigger_calculate_time_duration
            BEFORE INSERT OR UPDATE ON time_entries
            FOR EACH ROW
            EXECUTE FUNCTION calculate_time_duration();
    END IF;
END $$;

-- ========================================
-- HR MANAGEMENT TRIGGER'LARI
-- ========================================
-- Employees updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_employees_updated_at') THEN
        CREATE TRIGGER trigger_employees_updated_at
            BEFORE UPDATE ON employees
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Leave requests updated at (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_leave_requests_updated_at') THEN
        CREATE TRIGGER trigger_leave_requests_updated_at
            BEFORE UPDATE ON leave_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Leave request durumu değişikliği log'u fonksiyonu
CREATE OR REPLACE FUNCTION log_leave_request_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO system_logs (action, user_id, details)
        VALUES (
            'leave_request_status_change',
            auth.uid(),
            jsonb_build_object(
                'leave_request_id', NEW.id,
                'employee_id', NEW.employee_id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'start_date', NEW.start_date,
                'end_date', NEW.end_date
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Leave request log trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_leave_request_changes') THEN
        
        CREATE TRIGGER trigger_log_leave_request_changes
            AFTER UPDATE ON leave_requests
            FOR EACH ROW
            EXECUTE FUNCTION log_leave_request_changes();
    END IF;
END $$;

-- ========================================
-- SMART FEATURES TRIGGER'LARI
-- ========================================
-- Form history usage count güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_form_history_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Aynı kullanıcı ve alan için mevcut kayıt var mı kontrol et
    INSERT INTO form_history (user_id, form_type, field_name, field_value, usage_count, last_used)
    VALUES (NEW.user_id, NEW.form_type, NEW.field_name, NEW.field_value, 1, NOW())
    ON CONFLICT (user_id, form_type, field_name, field_value)
    DO UPDATE SET 
        usage_count = form_history.usage_count + 1,
        last_used = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Search history temizleme fonksiyonu
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 90 günden eski aramaları sil
    DELETE FROM search_history 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Search history cleanup trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_cleanup_search_history') THEN
        
        CREATE TRIGGER trigger_cleanup_search_history
            AFTER INSERT ON search_history
            FOR EACH ROW
            EXECUTE FUNCTION cleanup_old_search_history();
    END IF;
END $$;

-- ========================================
-- NOTIFICATION TRIGGER'LARI
-- ========================================
-- Ticket atama bildirimi fonksiyonu
CREATE OR REPLACE FUNCTION notify_ticket_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.agent_id IS DISTINCT FROM NEW.agent_id AND NEW.agent_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            NEW.agent_id,
            'ticket_assigned',
            'Yeni Ticket Atandı',
            'Size yeni bir ticket atandı: ' || NEW.title,
            jsonb_build_object(
                'ticket_id', NEW.id,
                'customer_id', NEW.customer_id,
                'priority', NEW.priority
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ticket assignment notification trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_ticket_assignment') THEN
        
        CREATE TRIGGER trigger_notify_ticket_assignment
            AFTER UPDATE OF agent_id ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION notify_ticket_assignment();
    END IF;
END $$;

-- Workflow step atama bildirimi fonksiyonu
CREATE OR REPLACE FUNCTION notify_workflow_step_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.assigned_user_id IS NOT NULL AND NEW.status = 'pending' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            NEW.assigned_user_id,
            'workflow_step_assigned',
            'Onay İsteği',
            'Size yeni bir onay isteği atandı',
            jsonb_build_object(
                'workflow_step_id', NEW.id,
                'workflow_instance_id', NEW.workflow_instance_id,
                'step_name', NEW.step_name
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Workflow step notification trigger (tablolar varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_steps')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_workflow_step_assignment') THEN
        
        CREATE TRIGGER trigger_notify_workflow_step_assignment
            AFTER INSERT ON workflow_steps
            FOR EACH ROW
            EXECUTE FUNCTION notify_workflow_step_assignment();
    END IF;
END $$;

-- ========================================
-- AUDIT TRIGGER'LARI
-- ========================================
-- Kritik tablolar için audit log fonksiyonu
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO system_logs (action, user_id, details)
        VALUES (
            'record_created',
            auth.uid(),
            jsonb_build_object(
                'table_name', TG_TABLE_NAME,
                'record_id', NEW.id,
                'data', to_jsonb(NEW)
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO system_logs (action, user_id, details)
        VALUES (
            'record_updated',
            auth.uid(),
            jsonb_build_object(
                'table_name', TG_TABLE_NAME,
                'record_id', NEW.id,
                'old_data', to_jsonb(OLD),
                'new_data', to_jsonb(NEW)
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO system_logs (action, user_id, details)
        VALUES (
            'record_deleted',
            auth.uid(),
            jsonb_build_object(
                'table_name', TG_TABLE_NAME,
                'record_id', OLD.id,
                'data', to_jsonb(OLD)
            )
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Audit trigger'ları (tablolar varsa ve trigger'lar yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
        
        -- Kritik tablolar için audit trigger'ları
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers')
           AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_audit_customers') THEN
            CREATE TRIGGER trigger_audit_customers
                AFTER INSERT OR UPDATE OR DELETE ON customers
                FOR EACH ROW
                EXECUTE FUNCTION audit_table_changes();
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets')
           AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_audit_tickets') THEN
            CREATE TRIGGER trigger_audit_tickets
                AFTER INSERT OR UPDATE OR DELETE ON tickets
                FOR EACH ROW
                EXECUTE FUNCTION audit_table_changes();
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
           AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_audit_projects') THEN
            CREATE TRIGGER trigger_audit_projects
                AFTER INSERT OR UPDATE OR DELETE ON projects
                FOR EACH ROW
                EXECUTE FUNCTION audit_table_changes();
        END IF;
    END IF;
END $$;

-- ========================================
-- DATA VALIDATION TRIGGER'LARI
-- ========================================
-- Email format kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION validate_email_format()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Geçersiz email formatı: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Customer email validation trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_validate_customer_email') THEN
        
        CREATE TRIGGER trigger_validate_customer_email
            BEFORE INSERT OR UPDATE ON customers
            FOR EACH ROW
            EXECUTE FUNCTION validate_email_format();
    END IF;
END $$;

-- Agent email validation trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_validate_agent_email') THEN
        
        CREATE TRIGGER trigger_validate_agent_email
            BEFORE INSERT OR UPDATE ON agents
            FOR EACH ROW
            EXECUTE FUNCTION validate_email_format();
    END IF;
END $$;

-- Priority değer kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION validate_priority_value()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Geçersiz priority değeri: %. Geçerli değerler: low, medium, high, urgent', NEW.priority;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ticket priority validation trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_validate_ticket_priority') THEN
        
        CREATE TRIGGER trigger_validate_ticket_priority
            BEFORE INSERT OR UPDATE ON tickets
            FOR EACH ROW
            EXECUTE FUNCTION validate_priority_value();
    END IF;
END $$;

-- Project priority validation trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_validate_project_priority') THEN
        
        CREATE TRIGGER trigger_validate_project_priority
            BEFORE INSERT OR UPDATE ON projects
            FOR EACH ROW
            EXECUTE FUNCTION validate_priority_value();
    END IF;
END $$;

-- Task priority validation trigger (tablo varsa ve trigger yoksa oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_validate_task_priority') THEN
        
        CREATE TRIGGER trigger_validate_task_priority
            BEFORE INSERT OR UPDATE ON project_tasks
            FOR EACH ROW
            EXECUTE FUNCTION validate_priority_value();
    END IF;
END $$;

-- ========================================
-- PERFORMANS İYİLEŞTİRMELERİ
-- ========================================
-- Trigger fonksiyonlarını optimize et
ANALYZE;

-- Trigger performans istatistiklerini sıfırla (sadece superuser yetkisi varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND rolsuper = true) THEN
        PERFORM pg_stat_reset();
    END IF;
END $$;
