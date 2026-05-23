-- ====================================================
-- DATABASE SCHEMA: Employee Self Service (ESS) Portal
-- Database: ess_portal
-- Target: MySQL 8.x / 5.7+
-- ====================================================

CREATE DATABASE IF NOT EXISTS ess_portal;
USE ess_portal;

-- Disable foreign key checks during creation to prevent ordering issues
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist for clean initialization
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS workflow_action_logs;
DROP TABLE IF EXISTS workflow_tasks;
DROP TABLE IF EXISTS workflow_instances;
DROP TABLE IF EXISTS workflow_step_config;
DROP TABLE IF EXISTS workflow_config;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS asset_requests;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS tax_declarations;
DROP TABLE IF EXISTS payslips;
DROP TABLE IF EXISTS salary_structures;
DROP TABLE IF EXISTS reimbursements;
DROP TABLE IF EXISTS reimbursement_templates;
DROP TABLE IF EXISTS expense_items;
DROP TABLE IF EXISTS expense_claims;
DROP TABLE IF EXISTS expense_categories;
DROP TABLE IF EXISTS trip_details;
DROP TABLE IF EXISTS travel_requests;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS leave_balances;
DROP TABLE IF EXISTS leave_types;
DROP TABLE IF EXISTS attendance_regularizations;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS employee_documents;
DROP TABLE IF EXISTS file_metadata;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS designations;
DROP TABLE IF EXISTS departments;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- 1. MASTER MODULE & SYSTEM CONFIGURATION
-- ====================================================

CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================
-- 2. AUTHENTICATION & ACCESS CONTROL (RBAC)
-- ====================================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    token_expiry TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    theme VARCHAR(20) DEFAULT 'light',
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================
-- 3. EMPLOYEE MANAGEMENT
-- ====================================================

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    joining_date DATE NOT NULL,
    department_id INT,
    designation_id INT,
    reporting_manager_id INT,
    profile_image_url VARCHAR(255),
    gender VARCHAR(20),
    date_of_birth DATE,
    address VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
    FOREIGN KEY (reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE file_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_path VARCHAR(55),
    file_size BIGINT,
    entity_type VARCHAR(50), -- PROFILE, RECEIPT, TRIP_DOCS, REIMBURSEMENT, ASSET
    entity_id INT,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employee_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    document_name VARCHAR(100) NOT NULL,
    file_metadata_id INT NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (file_metadata_id) REFERENCES file_metadata(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================
-- 4. ATTENDANCE MANAGEMENT
-- ====================================================

CREATE TABLE shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    late_buffer_minutes INT DEFAULT 15,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP NULL,
    check_out TIMESTAMP NULL,
    shift_id INT,
    is_late TINYINT(1) DEFAULT 0,
    is_wfh TINYINT(1) DEFAULT 0,
    latitude DOUBLE,
    longitude DOUBLE,
    status VARCHAR(20) NOT NULL, -- PRESENT, ABSENT, LEAVE, HOLIDAY, HALF_DAY
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL,
    UNIQUE KEY emp_date_unique (employee_id, date)
) ENGINE=InnoDB;

CREATE TABLE attendance_regularizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_record_id INT NOT NULL,
    requested_check_in TIMESTAMP NULL,
    requested_check_out TIMESTAMP NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED
    remarks TEXT,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================
-- 5. LEAVE MANAGEMENT
-- ====================================================

CREATE TABLE leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    annual_limit INT NOT NULL,
    carry_forward_limit INT DEFAULT 0,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE leave_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    allocated INT NOT NULL,
    used INT DEFAULT 0,
    pending_approval INT DEFAULT 0,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
    UNIQUE KEY emp_leave_type_unique (employee_id, leave_type_id)
) ENGINE=InnoDB;

CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL, -- DRAFT, PENDING, APPROVED, REJECTED, CANCELLED
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================
-- 6. TRAVEL MANAGEMENT
-- ====================================================

CREATE TABLE travel_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    purpose TEXT NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL,
    advance_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED, CANCELLED
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE trip_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    travel_request_id INT NOT NULL,
    travel_mode VARCHAR(50) NOT NULL, -- FLIGHT, TRAIN, CAB, BUS
    booking_date TIMESTAMP NULL,
    ticket_number VARCHAR(100),
    booking_status VARCHAR(50),
    hotel_details VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (travel_request_id) REFERENCES travel_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================
-- 7. EXPENSE CLAIM & REIMBURSEMENT
-- ====================================================

CREATE TABLE expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE expense_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    claim_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED, FINANCE_APPROVED, PAID, CANCELLED
    remarks TEXT,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE expense_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_claim_id INT NOT NULL,
    expense_category_id INT NOT NULL,
    item_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    file_metadata_id INT, -- Receipt attachment link
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_claim_id) REFERENCES expense_claims(id) ON DELETE CASCADE,
    FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (file_metadata_id) REFERENCES file_metadata(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE reimbursement_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- Medical, Internet, Laptop
    max_limit DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- MONTHLY, QUARTERLY, ANNUALLY, ONE_TIME
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reimbursements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    template_id INT NOT NULL,
    claim_amount DECIMAL(10,2) NOT NULL,
    approved_amount DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    status VARCHAR(20) NOT NULL, -- PENDING, HR_APPROVED, FINANCE_APPROVED, REJECTED, PAID, CANCELLED
    file_metadata_id INT, -- Invoice/receipt link
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES reimbursement_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (file_metadata_id) REFERENCES file_metadata(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ====================================================
-- 8. PAYROLL SUPPORT
-- ====================================================

CREATE TABLE salary_structures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL UNIQUE,
    basic DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) NOT NULL,
    special_allowance DECIMAL(10,2) NOT NULL,
    lta DECIMAL(10,2) DEFAULT 0.00,
    provident_fund DECIMAL(10,2) NOT NULL,
    professional_tax DECIMAL(10,2) DEFAULT 200.00,
    income_tax_projection DECIMAL(10,2) DEFAULT 0.00,
    ctc DECIMAL(10,2) NOT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE payslips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    basic DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) NOT NULL,
    special_allowance DECIMAL(10,2) NOT NULL,
    lta DECIMAL(10,2) DEFAULT 0.00,
    provident_fund DECIMAL(10,2) NOT NULL,
    professional_tax DECIMAL(10,2) DEFAULT 200.00,
    income_tax_deducted DECIMAL(10,2) DEFAULT 0.00,
    gross_earnings DECIMAL(10,2) NOT NULL,
    total_deductions DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL, -- PENDING, PROCESSED, PAID
    file_metadata_id INT, -- PDF file metadata
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (file_metadata_id) REFERENCES file_metadata(id) ON DELETE SET NULL,
    UNIQUE KEY emp_month_year_unique (employee_id, month, year)
) ENGINE=InnoDB;

CREATE TABLE tax_declarations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    financial_year VARCHAR(20) NOT NULL,
    section_80c DECIMAL(10,2) DEFAULT 0.00,
    section_80d DECIMAL(10,2) DEFAULT 0.00,
    home_loan_interest DECIMAL(10,2) DEFAULT 0.00,
    nps_investment DECIMAL(10,2) DEFAULT 0.00,
    other_income DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED
    remarks TEXT,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY emp_fy_unique (employee_id, financial_year)
) ENGINE=InnoDB;

-- ====================================================
-- 9. ASSET MANAGEMENT
-- ====================================================

CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- LAPTOP, MOBILE, MONITOR, ACCESSORY
    status VARCHAR(50) NOT NULL, -- AVAILABLE, ASSIGNED, UNDER_REPAIR, SCRAPPED
    assigned_to INT NULL,
    assignment_date DATE NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE asset_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, ALLOCATED, REJECTED, RETURN_REQUESTED, RETURNED
    asset_id INT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ====================================================
-- 10. NOTIFICATION CENTER
-- ====================================================

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- EMAIL, IN_APP, PUSH
    is_read TINYINT(1) DEFAULT 0,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================
-- 11. WORKFLOW ENGINE (MAKER-CHECKER SYSTEM)
-- ====================================================

CREATE TABLE workflow_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL UNIQUE, -- LEAVE, TRAVEL, EXPENSE, REIMBURSEMENT, ASSET
    name VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE workflow_step_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_config_id INT NOT NULL,
    step_number INT NOT NULL, -- Level 1, Level 2
    approver_role VARCHAR(100) NOT NULL, -- REPORTING_MANAGER, HR_ADMIN, FINANCE_MANAGER, ASSET_MANAGER
    escalation_buffer_hours INT DEFAULT 48,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_config_id) REFERENCES workflow_config(id) ON DELETE CASCADE,
    UNIQUE KEY wf_step_unique (workflow_config_id, step_number)
) ENGINE=InnoDB;

CREATE TABLE workflow_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_config_id INT NOT NULL,
    entity_id INT NOT NULL, -- Primary Key of the LeaveRequest, TravelRequest, etc.
    status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED, CANCELLED, ESCALATED
    current_step INT DEFAULT 1,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_config_id) REFERENCES workflow_config(id) ON DELETE CASCADE,
    UNIQUE KEY config_entity_unique (workflow_config_id, entity_id)
) ENGINE=InnoDB;

CREATE TABLE workflow_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_instance_id INT NOT NULL,
    step_number INT NOT NULL,
    assigned_approver_id INT, -- Employee ID of specific approver (e.g., manager)
    assigned_role VARCHAR(50), -- Role if generic role assigned
    status VARCHAR(20) NOT NULL, -- PENDING, COMPLETED, DELEGATED, ESCALATED, BYPASSED
    delegated_to_id INT NULL,
    escalation_deadline TIMESTAMP NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_approver_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (delegated_to_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE workflow_action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_instance_id INT NOT NULL,
    step_number INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- SUBMIT, APPROVE, REJECT, DELEGATE, ESCALATE, CANCEL
    actor_id INT NOT NULL, -- Employee ID who performed the action
    remarks TEXT,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    is_deleted TINYINT(1) DEFAULT 0,
    version INT DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ====================================================
-- 12. AUDIT TRAIL LOGGING
-- ====================================================

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL, -- LOGIN, PROFILE_UPDATE, LEAVE_CREATED, CLAIM_APPROVED
    entity_name VARCHAR(100),
    entity_id INT,
    actor_email VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    old_value TEXT, -- JSON diff representation
    new_value TEXT, -- JSON diff representation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ====================================================
-- 13. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================

CREATE INDEX idx_emp_user_id ON employees(user_id);
CREATE INDEX idx_emp_manager ON employees(reporting_manager_id);
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_attendance_emp_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_leave_emp ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_expense_emp ON expense_claims(employee_id);
CREATE INDEX idx_expense_status ON expense_claims(status);
CREATE INDEX idx_travel_emp ON travel_requests(employee_id);
CREATE INDEX idx_travel_status ON travel_requests(status);
CREATE INDEX idx_reimb_emp ON reimbursements(employee_id);
CREATE INDEX idx_reimb_status ON reimbursements(status);
CREATE INDEX idx_wf_instance_entity ON workflow_instances(entity_id);
CREATE INDEX idx_wf_task_approver ON workflow_tasks(assigned_approver_id);
CREATE INDEX idx_wf_task_status ON workflow_tasks(status);
CREATE INDEX idx_audit_actor ON audit_logs(actor_email);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_notification_recipient ON notifications(recipient_email);
CREATE INDEX idx_notification_read ON notifications(is_read);
