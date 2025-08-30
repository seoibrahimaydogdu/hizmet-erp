-- Performans optimizasyonu için index'ler
-- Bu dosya veritabanı performansını artırmak için gerekli index'leri içerir

-- ========================================
-- CUSTOMERS TABLOSU INDEX'LERİ
-- ========================================
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_plan ON customers(plan);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_satisfaction_score ON customers(satisfaction_score);
CREATE INDEX IF NOT EXISTS idx_customers_total_tickets ON customers(total_tickets);

-- ========================================
-- AGENTS TABLOSU INDEX'LERİ
-- ========================================
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_role ON agents(role);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_performance_score ON agents(performance_score);
CREATE INDEX IF NOT EXISTS idx_agents_total_resolved ON agents(total_resolved);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents(created_at);

-- ========================================
-- TICKETS TABLOSU INDEX'LERİ
-- ========================================
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_id ON tickets(agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_status ON tickets(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_status ON tickets(agent_id, status);

-- ========================================
-- SYSTEM_LOGS TABLOSU INDEX'LERİ
-- ========================================
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_action ON system_logs(user_id, action);

-- ========================================
-- CHAT SİSTEMİ INDEX'LERİ
-- ========================================
-- Channels tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels') THEN
        CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type);
        CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
        CREATE INDEX IF NOT EXISTS idx_channels_is_active ON channels(is_active);
        CREATE INDEX IF NOT EXISTS idx_channels_last_message_at ON channels(last_message_at);
        CREATE INDEX IF NOT EXISTS idx_channels_created_at ON channels(created_at);
    END IF;
END $$;

-- Channel members tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_members') THEN
        CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
        CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_channel_members_role ON channel_members(role);
        CREATE INDEX IF NOT EXISTS idx_channel_members_joined_at ON channel_members(joined_at);
    END IF;
END $$;

-- Messages tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON messages(channel_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
    END IF;
END $$;

-- Message reactions tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_reactions') THEN
        CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
        CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_message_reactions_reaction_type ON message_reactions(reaction_type);
    END IF;
END $$;

-- ========================================
-- SMART FEATURES INDEX'LERİ
-- ========================================
-- Form history tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_history') THEN
        CREATE INDEX IF NOT EXISTS idx_form_history_user_id ON form_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_form_history_form_type ON form_history(form_type);
        CREATE INDEX IF NOT EXISTS idx_form_history_field_name ON form_history(field_name);
        CREATE INDEX IF NOT EXISTS idx_form_history_last_used ON form_history(last_used);
    END IF;
END $$;

-- Training modules tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_modules') THEN
        CREATE INDEX IF NOT EXISTS idx_training_modules_difficulty_level ON training_modules(difficulty_level);
        CREATE INDEX IF NOT EXISTS idx_training_modules_is_active ON training_modules(is_active);
    END IF;
END $$;

-- User training progress tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_training_progress') THEN
        CREATE INDEX IF NOT EXISTS idx_user_training_progress_user_id ON user_training_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_training_progress_module_id ON user_training_progress(module_id);
        CREATE INDEX IF NOT EXISTS idx_user_training_progress_progress_percentage ON user_training_progress(progress_percentage);
    END IF;
END $$;

-- Search history tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'search_history') THEN
        CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_search_history_search_term ON search_history(search_term);
        CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
    END IF;
END $$;

-- ========================================
-- WORKFLOW APPROVAL INDEX'LERİ
-- ========================================
-- Workflow definitions tablosu (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_definitions')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_definitions' AND column_name = 'workflow_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_definitions' AND column_name = 'is_active')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_definitions' AND column_name = 'created_by') THEN
        
        CREATE INDEX IF NOT EXISTS idx_workflow_definitions_workflow_type ON workflow_definitions(workflow_type);
        CREATE INDEX IF NOT EXISTS idx_workflow_definitions_is_active ON workflow_definitions(is_active);
        CREATE INDEX IF NOT EXISTS idx_workflow_definitions_created_by ON workflow_definitions(created_by);
    END IF;
END $$;

-- Workflow instances tablosu (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_instances')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'workflow_definition_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'entity_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'entity_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'created_by')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'started_at') THEN
        
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_definition_id ON workflow_instances(workflow_definition_id);
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity_type ON workflow_instances(entity_type);
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity_id ON workflow_instances(entity_id);
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_created_by ON workflow_instances(created_by);
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_started_at ON workflow_instances(started_at);
    END IF;
END $$;

-- Workflow steps tablosu (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_steps')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_steps' AND column_name = 'workflow_instance_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_steps' AND column_name = 'assigned_user_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_steps' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_steps' AND column_name = 'due_date') THEN
        
        CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_instance_id ON workflow_steps(workflow_instance_id);
        CREATE INDEX IF NOT EXISTS idx_workflow_steps_assigned_user_id ON workflow_steps(assigned_user_id);
        CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
        CREATE INDEX IF NOT EXISTS idx_workflow_steps_due_date ON workflow_steps(due_date);
    END IF;
END $$;

-- Approval requests tablosu (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_requests')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'workflow_instance_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'requester_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'approver_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'priority')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'due_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'entity_id') THEN
        
        CREATE INDEX IF NOT EXISTS idx_approval_requests_workflow_instance_id ON approval_requests(workflow_instance_id);
        CREATE INDEX IF NOT EXISTS idx_approval_requests_requester_id ON approval_requests(requester_id);
        CREATE INDEX IF NOT EXISTS idx_approval_requests_approver_id ON approval_requests(approver_id);
        CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
        CREATE INDEX IF NOT EXISTS idx_approval_requests_priority ON approval_requests(priority);
        CREATE INDEX IF NOT EXISTS idx_approval_requests_due_date ON approval_requests(due_date);
        CREATE INDEX IF NOT EXISTS idx_approval_requests_entity_id ON approval_requests(entity_id);
    END IF;
END $$;

-- ========================================
-- PROJECT MANAGEMENT INDEX'LERİ
-- ========================================
-- Projects tablosu (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_manager_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'client_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'created_at') THEN
        
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
        CREATE INDEX IF NOT EXISTS idx_projects_project_manager_id ON projects(project_manager_id);
        CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
        CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
        CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
        CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
    END IF;
END $$;

-- Project members tablosu (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_members')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'project_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'user_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'role')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'is_active') THEN
        
        CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);
        CREATE INDEX IF NOT EXISTS idx_project_members_is_active ON project_members(is_active);
    END IF;
END $$;

-- Project tasks tablosu (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'project_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'parent_task_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'assignee_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'reporter_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'priority')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'due_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'created_at') THEN
        
        CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_parent_task_id ON project_tasks(parent_task_id);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_id ON project_tasks(assignee_id);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_reporter_id ON project_tasks(reporter_id);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_priority ON project_tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_created_at ON project_tasks(created_at);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_project_status ON project_tasks(project_id, status);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_status ON project_tasks(assignee_id, status);
    END IF;
END $$;

-- Task comments tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON task_comments(author_id);
        CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);
    END IF;
END $$;

-- Time entries tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
        CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
        CREATE INDEX IF NOT EXISTS idx_time_entries_end_time ON time_entries(end_time);
        CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON time_entries(created_at);
    END IF;
END $$;

-- ========================================
-- HR MANAGEMENT INDEX'LERİ
-- ========================================
-- Employees tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
        CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
        CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
        CREATE INDEX IF NOT EXISTS idx_employees_hire_date ON employees(hire_date);
        CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
    END IF;
END $$;

-- Leave requests tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests') THEN
        CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
        CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
        CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON leave_requests(start_date);
        CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date ON leave_requests(end_date);
        CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests(created_at);
    END IF;
END $$;

-- Performance reviews tablosu (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_reviews') THEN
        CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id ON performance_reviews(employee_id);
        CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer_id ON performance_reviews(reviewer_id);
        CREATE INDEX IF NOT EXISTS idx_performance_reviews_review_date ON performance_reviews(review_date);
    END IF;
END $$;

-- ========================================
-- COMPOSITE INDEX'LER (ÇOKLU ALAN)
-- ========================================
-- Tickets için composite index'ler (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
        CREATE INDEX IF NOT EXISTS idx_tickets_status_priority_created ON tickets(status, priority, created_at);
        CREATE INDEX IF NOT EXISTS idx_tickets_customer_status_created ON tickets(customer_id, status, created_at);
        CREATE INDEX IF NOT EXISTS idx_tickets_agent_status_created ON tickets(agent_id, status, created_at);
    END IF;
END $$;

-- Messages için composite index'ler (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_deleted') THEN
        
        CREATE INDEX IF NOT EXISTS idx_messages_channel_created_deleted ON messages(channel_id, created_at) WHERE is_deleted = false;
        CREATE INDEX IF NOT EXISTS idx_messages_sender_created_deleted ON messages(sender_id, created_at) WHERE is_deleted = false;
    END IF;
END $$;

-- Workflow instances için composite index'ler (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_instances')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'entity_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'entity_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'created_by')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'started_at') THEN
        
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity_type_status ON workflow_instances(entity_type, entity_id, status);
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_created_status ON workflow_instances(created_by, status, started_at);
    END IF;
END $$;

-- Project tasks için composite index'ler (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'project_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'priority')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'assignee_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'due_date') THEN
        
        CREATE INDEX IF NOT EXISTS idx_project_tasks_project_status_priority ON project_tasks(project_id, status, priority);
        CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee_status_due ON project_tasks(assignee_id, status, due_date);
    END IF;
END $$;

-- ========================================
-- PARTIAL INDEX'LER (KOŞULLU)
-- ========================================
-- Aktif ticket'lar için (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
        CREATE INDEX IF NOT EXISTS idx_tickets_active ON tickets(id, status, priority, created_at) WHERE status IN ('open', 'in_progress');
    END IF;
END $$;

-- Aktif projeler için (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date') THEN
        
        CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(id, status, priority, end_date) WHERE status = 'active';
    END IF;
END $$;

-- Aktif workflow'lar için (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_instances')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_instances' AND column_name = 'started_at') THEN
        
        CREATE INDEX IF NOT EXISTS idx_workflow_instances_active ON workflow_instances(id, status, started_at) WHERE status IN ('pending', 'in_progress');
    END IF;
END $$;

-- Son 30 günlük log'lar için (tablo varsa index oluştur)
-- NOT: NOW() fonksiyonu IMMUTABLE olmadığı için partial index'te kullanılamaz
-- Bu index'i manuel olarak oluşturmak gerekebilir
-- CREATE INDEX IF NOT EXISTS idx_system_logs_recent ON system_logs(id, action, created_at) WHERE created_at > NOW() - INTERVAL '30 days';

-- ========================================
-- FULL-TEXT SEARCH INDEX'LERİ
-- ========================================
-- Tickets için full-text search (tablo varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
        CREATE INDEX IF NOT EXISTS idx_tickets_fts ON tickets USING gin(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));
    END IF;
END $$;

-- Messages için full-text search (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_deleted') THEN
        
        CREATE INDEX IF NOT EXISTS idx_messages_fts ON messages USING gin(to_tsvector('turkish', content)) WHERE is_deleted = false;
    END IF;
END $$;

-- Project tasks için full-text search (tablo ve sütunlar varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'title')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'description') THEN
        
        CREATE INDEX IF NOT EXISTS idx_project_tasks_fts ON project_tasks USING gin(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));
    END IF;
END $$;

-- ========================================
-- JSONB INDEX'LERİ
-- ========================================
-- Messages metadata için (tablo ve sütun varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata') THEN
        
        CREATE INDEX IF NOT EXISTS idx_messages_metadata ON messages USING gin(metadata);
    END IF;
END $$;

-- Project tasks tags için (tablo ve sütun varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'tags') THEN
        
        CREATE INDEX IF NOT EXISTS idx_project_tasks_tags ON project_tasks USING gin(tags);
    END IF;
END $$;

-- Approval requests entity_data için (tablo ve sütun varsa index oluştur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_requests')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_requests' AND column_name = 'entity_data') THEN
        
        CREATE INDEX IF NOT EXISTS idx_approval_requests_entity_data ON approval_requests USING gin(entity_data);
    END IF;
END $$;

-- ========================================
-- PERFORMANS İYİLEŞTİRMELERİ
-- ========================================
-- NOT: VACUUM ANALYZE transaction bloğu içinde çalışamaz
-- Bu komutları migration sonrası manuel olarak çalıştırın:
-- VACUUM ANALYZE;

-- Index kullanım istatistiklerini sıfırla (sadece superuser yetkisi varsa)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND rolsuper = true) THEN
        PERFORM pg_stat_reset();
    END IF;
END $$;
