-- ====================================================
-- DATABASE SEED DATA: Employee Self Service (ESS) Portal
-- Target: MySQL 8.x / 5.7+
-- Default Password for all users: Password@123
-- BCrypt Hash: $2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe
-- ====================================================

USE ess_portal;

-- ====================================================
-- 1. SEED DEPARTMENTS
-- ====================================================
INSERT INTO departments (name, code, created_by) VALUES
('Executive Office', 'EXEC', 'SYSTEM'),
('Human Resources', 'HR', 'SYSTEM'),
('Finance & Accounts', 'FIN', 'SYSTEM'),
('Information Technology', 'IT', 'SYSTEM'),
('Software Engineering', 'ENG', 'SYSTEM'),
('Quality Assurance', 'QA', 'SYSTEM'),
('Product Management', 'PMD', 'SYSTEM');

-- ====================================================
-- 2. SEED DESIGNATIONS
-- ====================================================
INSERT INTO designations (title, code, created_by) VALUES
('Chief Executive Officer', 'CEO', 'SYSTEM'),
('Delivery Manager', 'DM', 'SYSTEM'),
('Project Manager', 'PM', 'SYSTEM'),
('Technical Lead', 'TL', 'SYSTEM'),
('Senior Software Engineer', 'SSE', 'SYSTEM'),
('Software Engineer', 'SE', 'SYSTEM'),
('Associate Software Engineer', 'ASE', 'SYSTEM'),
('QA Lead', 'QAL', 'SYSTEM'),
('Quality Analyst', 'QA', 'SYSTEM'),
('Product Manager', 'PRODM', 'SYSTEM'),
('HR Manager', 'HRM', 'SYSTEM'),
('HR Executive', 'HRE', 'SYSTEM'),
('Finance Manager', 'FM', 'SYSTEM'),
('Finance Executive', 'FE', 'SYSTEM'),
('IT Systems Administrator', 'ITA', 'SYSTEM');

-- ====================================================
-- 3. SEED ROLES
-- ====================================================
INSERT INTO roles (name, description, created_by) VALUES
('SUPER_ADMIN', 'Overall System Administrator with all permissions', 'SYSTEM'),
('HR_ADMIN', 'HR Manager with access to employee master, leaves, and configurations', 'SYSTEM'),
('HR_EXECUTIVE', 'HR Executive executing routine employee processes', 'SYSTEM'),
('FINANCE_MANAGER', 'Finance Manager reviewing expenses, reimbursements, and payroll', 'SYSTEM'),
('FINANCE_EXECUTIVE', 'Finance Executive processing claim payouts', 'SYSTEM'),
('TEAM_LEAD', 'Team Lead reviewing standard tasks and leaves', 'SYSTEM'),
('PROJECT_MANAGER', 'Project Manager overseeing leave, expense, and travel workflows', 'SYSTEM'),
('DELIVERY_MANAGER', 'Delivery Manager with senior division approvals', 'SYSTEM'),
('EMPLOYEE', 'Standard Employee requesting services', 'SYSTEM'),
('IT_ADMIN', 'IT Administrator managing asset repositories', 'SYSTEM'),
('ASSET_MANAGER', 'Asset Manager handling requests and returns', 'SYSTEM'),
('TRAVEL_APPROVER', 'Travel Approver managing travels and bookings', 'SYSTEM');

-- ====================================================
-- 4. SEED PERMISSIONS
-- ====================================================
INSERT INTO permissions (name, description, created_by) VALUES
('VIEW_DASHBOARD', 'Permission to view standard employee dashboard', 'SYSTEM'),
('VIEW_ADMIN_DASHBOARD', 'Permission to view executive dashboards', 'SYSTEM'),
('MANAGE_USERS', 'Permission to create, update, or deactivate users', 'SYSTEM'),
('MANAGE_EMPLOYEES', 'Permission to manage employee records', 'SYSTEM'),
('MANAGE_ROLES', 'Permission to assign roles and edit permissions', 'SYSTEM'),
('REQUEST_LEAVE', 'Permission to request a leave', 'SYSTEM'),
('APPROVE_LEAVE', 'Permission to approve/reject leave requests', 'SYSTEM'),
('REQUEST_TRAVEL', 'Permission to apply for business travel', 'SYSTEM'),
('APPROVE_TRAVEL', 'Permission to approve/reject travel requests', 'SYSTEM'),
('BOOK_TRAVEL', 'Permission to book transport and hotel itineraries', 'SYSTEM'),
('SUBMIT_EXPENSE', 'Permission to file expense claims', 'SYSTEM'),
('APPROVE_EXPENSE', 'Permission to approve/reject expense claims', 'SYSTEM'),
('SUBMIT_REIMBURSEMENT', 'Permission to request benefit reimbursements', 'SYSTEM'),
('APPROVE_REIMBURSEMENT', 'Permission to review and approve reimbursements', 'SYSTEM'),
('MANAGE_ASSETS', 'Permission to catalog and assign assets', 'SYSTEM'),
('REQUEST_ASSET', 'Permission to file a device request', 'SYSTEM'),
('APPROVE_ASSET', 'Permission to approve device requests', 'SYSTEM'),
('VIEW_PAYSLIP', 'Permission to access personal salary payslips', 'SYSTEM'),
('GENERATE_PAYROLL', 'Permission to process monthly salary run', 'SYSTEM'),
('VIEW_AUDIT_LOGS', 'Permission to review transactional audit logs', 'SYSTEM'),
('MANAGE_WORKFLOWS', 'Permission to configure maker-checker workflows', 'SYSTEM');

-- Map permissions to SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Map permissions to HR_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN 
('VIEW_DASHBOARD', 'VIEW_ADMIN_DASHBOARD', 'MANAGE_EMPLOYEES', 'REQUEST_LEAVE', 'APPROVE_LEAVE', 'SUBMIT_EXPENSE', 'SUBMIT_REIMBURSEMENT', 'APPROVE_REIMBURSEMENT', 'REQUEST_ASSET');

-- Map permissions to FINANCE_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE name IN 
('VIEW_DASHBOARD', 'VIEW_ADMIN_DASHBOARD', 'REQUEST_LEAVE', 'APPROVE_EXPENSE', 'APPROVE_REIMBURSEMENT', 'GENERATE_PAYROLL', 'VIEW_PAYSLIP');

-- Map permissions to EMPLOYEE
INSERT INTO role_permissions (role_id, permission_id)
SELECT 9, id FROM permissions WHERE name IN 
('VIEW_DASHBOARD', 'REQUEST_LEAVE', 'REQUEST_TRAVEL', 'SUBMIT_EXPENSE', 'SUBMIT_REIMBURSEMENT', 'REQUEST_ASSET', 'VIEW_PAYSLIP');

-- Map permissions to PROJECT_MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 7, id FROM permissions WHERE name IN 
('VIEW_DASHBOARD', 'REQUEST_LEAVE', 'APPROVE_LEAVE', 'REQUEST_TRAVEL', 'APPROVE_TRAVEL', 'SUBMIT_EXPENSE', 'APPROVE_EXPENSE', 'SUBMIT_REIMBURSEMENT', 'REQUEST_ASSET', 'VIEW_PAYSLIP');

-- Map permissions to IT_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 10, id FROM permissions WHERE name IN 
('VIEW_DASHBOARD', 'MANAGE_ASSETS', 'APPROVE_ASSET', 'REQUEST_LEAVE', 'VIEW_PAYSLIP');


-- ====================================================
-- 5. SEED USERS & HIERARCHICAL EMPLOYEES (50+ Indian Names)
-- Default Password: Password@123 (BCrypt representation)
-- ====================================================

-- 1. CEO (Root)
INSERT INTO users (email, password, created_by) VALUES ('vijay.mallya@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1); -- Super Admin
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(1, 'EMP001', 'Vijay', 'Mallya', '9876543210', '2020-01-01', 1, 1, NULL, 'MALE', '1965-12-18', 'UB Towers, Bangalore');

-- 2. Delivery Managers (Report to CEO)
INSERT INTO users (email, password, created_by) VALUES ('rajesh.iyer@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (2, 8); -- Delivery Manager
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(2, 'EMP002', 'Rajesh', 'Iyer', '9876543211', '2021-02-15', 5, 2, 1, 'MALE', '1978-05-20', 'Whitefield, Bangalore');

INSERT INTO users (email, password, created_by) VALUES ('sunita.rao@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (3, 8); -- Delivery Manager
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(3, 'EMP003', 'Sunita', 'Rao', '9876543212', '2021-06-01', 6, 2, 1, 'FEMALE', '1980-09-14', 'Jayanagar, Bangalore');

-- 3. Project Managers (Report to Delivery Managers)
INSERT INTO users (email, password, created_by) VALUES ('amit.patel@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (4, 7); -- Project Manager (also Leave workflow manager for team)
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(4, 'EMP004', 'Amit', 'Patel', '9876543213', '2022-01-10', 5, 3, 2, 'MALE', '1984-03-22', 'Indiranagar, Bangalore');

INSERT INTO users (email, password, created_by) VALUES ('priya.nair@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (5, 7); -- Project Manager
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(5, 'EMP005', 'Priya', 'Nair', '9876543214', '2022-03-18', 5, 3, 2, 'FEMALE', '1986-07-30', 'HSR Layout, Bangalore');

INSERT INTO users (email, password, created_by) VALUES ('vikram.reddy@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (6, 7); -- Project Manager
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(6, 'EMP006', 'Vikram', 'Reddy', '9876543215', '2022-05-12', 6, 3, 3, 'MALE', '1983-11-05', 'Marathahalli, Bangalore');

-- 4. HR Manager (Reports to CEO)
INSERT INTO users (email, password, created_by) VALUES ('shalini.sharma@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (7, 2); -- HR Admin
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(7, 'EMP007', 'Shalini', 'Sharma', '9876543216', '2021-08-01', 2, 11, 1, 'FEMALE', '1982-01-25', 'Koramangala, Bangalore');

-- 5. Finance Manager (Reports to CEO)
INSERT INTO users (email, password, created_by) VALUES ('anil.gupta@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (8, 4); -- Finance Manager
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(8, 'EMP008', 'Anil', 'Gupta', '9876543217', '2021-10-10', 3, 13, 1, 'MALE', '1981-06-12', 'Malleshwaram, Bangalore');

-- 6. IT Systems Admin (Reports to CEO)
INSERT INTO users (email, password, created_by) VALUES ('karan.kumar@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (9, 10); -- IT Admin
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(9, 'EMP009', 'Karan', 'Kumar', '9876543218', '2022-02-01', 4, 15, 1, 'MALE', '1988-10-15', 'Hebbal, Bangalore');

-- 7. Team Leads (Report to Project Managers)
INSERT INTO users (email, password, created_by) VALUES ('devendra.singh@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (10, 6); -- Team Lead
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(10, 'EMP010', 'Devendra', 'Singh', '9876543219', '2022-09-01', 5, 4, 4, 'MALE', '1989-08-20', 'Electronic City, Bangalore');

INSERT INTO users (email, password, created_by) VALUES ('meera.desai@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (11, 6); -- Team Lead
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(11, 'EMP011', 'Meera', 'Desai', '9876543220', '2022-11-15', 5, 4, 5, 'FEMALE', '1990-12-05', 'BTM Layout, Bangalore');

-- 8. Standard Employees & Executives (Report to Leads or Managers)
-- Creating remaining 40 employees directly to hit 51 total employees
-- Loop insertion simulation in SQL:

-- HR Executive
INSERT INTO users (email, password, created_by) VALUES ('sneha.bansal@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (12, 3); -- HR Executive
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(12, 'EMP012', 'Sneha', 'Bansal', '9876543221', '2023-01-10', 2, 12, 7, 'FEMALE', '1993-04-18', 'Koramangala, Bangalore');

-- Finance Executive
INSERT INTO users (email, password, created_by) VALUES ('rohit.trivedi@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (13, 5); -- Finance Executive
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(13, 'EMP013', 'Rohit', 'Trivedi', '9876543222', '2023-02-15', 3, 14, 8, 'MALE', '1992-09-22', 'Malleshwaram, Bangalore');

-- Product Manager (Reports to CEO)
INSERT INTO users (email, password, created_by) VALUES ('varun.mehta@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (14, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(14, 'EMP014', 'Varun', 'Mehta', '9876543223', '2022-04-01', 7, 10, 1, 'MALE', '1987-11-20', 'JP Nagar, Bangalore');

-- Senior Engineers (ENG) - Report to TL Devendra
INSERT INTO users (email, password, created_by) VALUES ('rohan.sharma@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (15, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(15, 'EMP015', 'Rohan', 'Sharma', '9876543224', '2023-03-01', 5, 5, 10, 'MALE', '1991-05-15', 'Bellandur, Bangalore');

INSERT INTO users (email, password, created_by) VALUES ('aditi.sen@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (16, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(16, 'EMP016', 'Aditi', 'Sen', '9876543225', '2023-04-10', 5, 5, 10, 'FEMALE', '1992-08-11', 'Sarjapur Road, Bangalore');

-- Software Engineers (ENG) - Report to TL Devendra
INSERT INTO users (email, password, created_by) VALUES ('abhishek.joshi@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (17, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(17, 'EMP017', 'Abhishek', 'Joshi', '9876543226', '2023-07-01', 5, 6, 10, 'MALE', '1995-10-02', 'BTM Layout, Bangalore');

INSERT INTO users (email, password, created_by) VALUES ('kavita.deshmukh@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (18, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(18, 'EMP018', 'Kavita', 'Deshmukh', '9876543227', '2023-08-20', 5, 6, 10, 'FEMALE', '1996-03-14', 'Bannerghatta, Bangalore');

-- Associate Engineers (ENG) - Report to TL Devendra
INSERT INTO users (email, password, created_by) VALUES ('vivek.chawla@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (19, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(19, 'EMP019', 'Vivek', 'Chawla', '9876543228', '2024-01-15', 5, 7, 10, 'MALE', '1998-02-28', 'Whitefield, Bangalore');

-- QA Lead (Reports to PM Vikram Reddy)
INSERT INTO users (email, password, created_by) VALUES ('sanjay.verma@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (20, 6); -- Team Lead Role for QA Lead
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(20, 'EMP020', 'Sanjay', 'Verma', '9876543229', '2022-10-01', 6, 8, 6, 'MALE', '1988-06-19', 'HSR Layout, Bangalore');

-- QA Analysts - Report to Sanjay Verma
INSERT INTO users (email, password, created_by) VALUES ('pooja.rao@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (21, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(21, 'EMP021', 'Pooja', 'Rao', '9876543230', '2023-05-15', 6, 9, 20, 'FEMALE', '1994-09-08', 'Electronic City, Bangalore');

INSERT INTO users (email, password, created_by) VALUES ('ajay.mishra@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');
INSERT INTO user_roles (user_id, role_id) VALUES (22, 9);
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(22, 'EMP022', 'Ajay', 'Mishra', '9876543231', '2023-09-01', 6, 9, 20, 'MALE', '1995-12-25', 'BTM Layout, Bangalore');

-- Seed additional 30 employees using a simple iterative insert syntax for size efficiency
-- We can add 30 more employees (from EMP023 to EMP052) reporting to TL Devendra or TL Meera, to easily cross the 50 mark.
INSERT INTO users (email, password, created_by) VALUES
('akash.singh@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('ananya.sen@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('arjun.das@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('bharti.sharma@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('chetan.joshi@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('deepika.raj@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('gautam.nair@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('harsha.vardhan@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('isha.bhat@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('jitendra.yadav@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('kiran.gowda@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('lalit.patil@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('manoj.kulkarni@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('nisha.pillai@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('omkar.prabhu@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('pallavi.hegde@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('pranav.shah@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('ritesh.deshmukh@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('swati.karanth@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('tarun.goyal@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('uday.shetty@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('vaishali.singh@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('vinay.reddy@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('yash.malhotra@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('shweta.tiwari@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('sandeep.sinha@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('nidhi.saxena@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('prashant.roy@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('rashmi.shekhar@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM'),
('vikas.grover@ess.com', '$2a$10$U6wymsMAzBXShokHxtQqXuSwyTn.jAlTX0xeAB1dcSeUxRYxkzmYe', 'SYSTEM');

-- Assign employee role to all these 30 users (user_ids 23 to 52)
INSERT INTO user_roles (user_id, role_id)
SELECT id, 9 FROM users WHERE id >= 23 AND id <= 52;

-- Insert remaining 30 employees
INSERT INTO employees (user_id, employee_id, first_name, last_name, phone_number, joining_date, department_id, designation_id, reporting_manager_id, gender, date_of_birth, address) VALUES
(23, 'EMP023', 'Akash', 'Singh', '9876543232', '2023-05-10', 5, 6, 11, 'MALE', '1995-02-14', 'HSR Layout, Bangalore'),
(24, 'EMP024', 'Ananya', 'Sen', '9876543233', '2023-06-01', 5, 6, 11, 'FEMALE', '1996-07-22', 'Indiranagar, Bangalore'),
(25, 'EMP025', 'Arjun', 'Das', '9876543234', '2023-07-15', 5, 7, 11, 'MALE', '1997-03-30', 'Marathahalli, Bangalore'),
(26, 'EMP026', 'Bharti', 'Sharma', '9876543235', '2023-08-12', 5, 7, 11, 'FEMALE', '1997-12-05', 'Whitefield, Bangalore'),
(27, 'EMP027', 'Chetan', 'Joshi', '9876543236', '2023-09-20', 5, 7, 11, 'MALE', '1998-05-18', 'Sarjapur Road, Bangalore'),
(28, 'EMP028', 'Deepika', 'Raj', '9876543237', '2023-10-01', 5, 7, 11, 'FEMALE', '1998-11-20', 'Hebbal, Bangalore'),
(29, 'EMP029', 'Gautam', 'Nair', '9876543238', '2023-11-15', 5, 7, 11, 'MALE', '1999-01-25', 'Jayanagar, Bangalore'),
(30, 'EMP030', 'Harsha', 'Vardhan', '9876543239', '2023-12-01', 5, 6, 10, 'MALE', '1994-04-18', 'Bellandur, Bangalore'),
(31, 'EMP031', 'Isha', 'Bhat', '9876543240', '2024-01-10', 5, 7, 10, 'FEMALE', '1999-09-12', 'Koramangala, Bangalore'),
(32, 'EMP032', 'Jitendra', 'Yadav', '9876543241', '2024-02-01', 5, 7, 10, 'MALE', '1998-08-15', 'Malleshwaram, Bangalore'),
(33, 'EMP033', 'Kiran', 'Gowda', '9876543242', '2024-02-15', 5, 7, 10, 'MALE', '1997-10-10', 'JP Nagar, Bangalore'),
(34, 'EMP034', 'Lalit', 'Patil', '9876543243', '2024-03-01', 5, 7, 10, 'MALE', '1996-03-25', 'BTM Layout, Bangalore'),
(35, 'EMP035', 'Manoj', 'Kulkarni', '9876543244', '2024-03-15', 5, 7, 10, 'MALE', '1995-12-12', 'Electronic City, Bangalore'),
(36, 'EMP036', 'Nisha', 'Pillai', '9876543245', '2024-04-01', 5, 7, 10, 'FEMALE', '1996-01-10', 'Bannerghatta, Bangalore'),
(37, 'EMP037', 'Omkar', 'Prabhu', '9876543246', '2024-04-15', 5, 7, 10, 'MALE', '1997-06-18', 'UB Towers, Bangalore'),
(38, 'EMP038', 'Pallavi', 'Hegde', '9876543247', '2024-05-01', 5, 7, 10, 'FEMALE', '1998-07-22', 'Whitefield, Bangalore'),
(39, 'EMP039', 'Pranav', 'Shah', '9876543248', '2024-05-15', 5, 7, 10, 'MALE', '1999-03-30', 'Marathahalli, Bangalore'),
(40, 'EMP040', 'Ritesh', 'Deshmukh', '9876543249', '2024-06-01', 5, 7, 10, 'MALE', '1997-12-05', 'Indiranagar, Bangalore'),
(41, 'EMP041', 'Swati', 'Karanth', '9876543250', '2024-06-15', 5, 7, 10, 'FEMALE', '1998-05-18', 'HSR Layout, Bangalore'),
(42, 'EMP042', 'Tarun', 'Goyal', '9876543251', '2024-07-01', 5, 7, 10, 'MALE', '1998-11-20', 'Sarjapur Road, Bangalore'),
(43, 'EMP043', 'Uday', 'Shetty', '9876543252', '2024-07-15', 5, 7, 10, 'MALE', '1999-01-25', 'Hebbal, Bangalore'),
(44, 'EMP044', 'Vaishali', 'Singh', '9876543253', '2024-08-01', 5, 7, 10, 'FEMALE', '1994-04-18', 'Jayanagar, Bangalore'),
(45, 'EMP045', 'Vinay', 'Reddy', '9876543254', '2024-08-15', 5, 7, 10, 'MALE', '1999-09-12', 'Bellandur, Bangalore'),
(46, 'EMP046', 'Yash', 'Malhotra', '9876543255', '2024-09-01', 5, 7, 10, 'MALE', '1998-08-15', 'Koramangala, Bangalore'),
(47, 'EMP047', 'Shweta', 'Tiwari', '9876543256', '2024-09-15', 5, 7, 10, 'FEMALE', '1997-10-10', 'Malleshwaram, Bangalore'),
(48, 'EMP048', 'Sandeep', 'Sinha', '9876543257', '2024-10-01', 5, 7, 10, 'MALE', '1996-03-25', 'JP Nagar, Bangalore'),
(49, 'EMP049', 'Nidhi', 'Saxena', '9876543258', '2024-10-15', 5, 7, 10, 'FEMALE', '1995-12-12', 'BTM Layout, Bangalore'),
(50, 'EMP050', 'Prashant', 'Roy', '9876543259', '2024-11-01', 5, 7, 10, 'MALE', '1996-01-10', 'Electronic City, Bangalore'),
(51, 'EMP051', 'Rashmi', 'Shekhar', '9876543260', '2024-11-15', 5, 7, 10, 'FEMALE', '1997-06-18', 'Bannerghatta, Bangalore'),
(52, 'EMP052', 'Vikas', 'Grover', '9876543261', '2024-12-01', 5, 7, 10, 'MALE', '1998-07-22', 'UB Towers, Bangalore');


-- ====================================================
-- 6. SEED LEAVE TYPES & BALANCES FOR ALL EMPLOYEES
-- ====================================================
INSERT INTO leave_types (name, code, annual_limit, carry_forward_limit) VALUES
('Casual Leave', 'CL', 12, 0),
('Earned Leave', 'EL', 18, 10),
('Sick Leave', 'SL', 12, 0),
('Maternity Leave', 'ML', 90, 0);

-- Populate balances for all 52 employees
-- Inserting default CL=12, EL=18, SL=12 for each employee
-- Using SQL logic:
INSERT INTO leave_balances (employee_id, leave_type_id, allocated, used, pending_approval)
SELECT e.id, lt.id, lt.annual_limit, 0, 0
FROM employees e CROSS JOIN leave_types lt;


-- ====================================================
-- 7. SEED SHIFTS & ATTENDANCE DATA
-- ====================================================
INSERT INTO shifts (name, start_time, end_time, late_buffer_minutes) VALUES
('General Shift', '09:00:00', '18:00:00', 15),
('Night Shift', '21:00:00', '06:00:00', 15);

-- Seed representative attendance records for user 15 (rohan.sharma) for the last 15 days
-- Daily check-in/out, some late marks, some WFH
INSERT INTO attendance_records (employee_id, date, check_in, check_out, shift_id, is_late, is_wfh, status) VALUES
(15, '2026-05-08', '2026-05-08 08:55:00', '2026-05-08 18:05:00', 1, 0, 0, 'PRESENT'),
(15, '2026-05-09', '2026-05-09 09:20:00', '2026-05-09 18:10:00', 1, 1, 0, 'PRESENT'), -- Late
(15, '2026-05-10', NULL, NULL, 1, 0, 0, 'ABSENT'),
(15, '2026-05-11', '2026-05-11 09:00:00', '2026-05-11 18:00:00', 1, 0, 1, 'PRESENT'), -- WFH
(15, '2026-05-12', '2026-05-12 08:45:00', '2026-05-12 18:00:00', 1, 0, 0, 'PRESENT'),
(15, '2026-05-13', '2026-05-13 09:05:00', '2026-05-13 18:15:00', 1, 0, 0, 'PRESENT'),
(15, '2026-05-14', '2026-05-14 09:25:00', '2026-05-14 18:00:00', 1, 1, 0, 'PRESENT'), -- Late
(15, '2026-05-15', '2026-05-15 08:50:00', '2026-05-15 18:00:00', 1, 0, 0, 'PRESENT');


-- ====================================================
-- 8. SEED EXPENSE CATEGORIES & TEMPLATES
-- ====================================================
INSERT INTO expense_categories (name, code, description) VALUES
('Travel Expenses', 'TRAVEL', 'Flight, train, or bus travel charges'),
('Lodging & Boarding', 'LODGE', 'Hotel stay expenses during business trips'),
('Client Entertainment', 'CLIENT', 'Business lunches/dinners with external clients'),
('Office Supplies', 'SUPPLY', 'General stationery or temporary hardware');

INSERT INTO reimbursement_templates (name, max_limit, frequency) VALUES
('Medical Reimbursement', 15000.00, 'ANNUALLY'),
('Internet Allowance', 1200.00, 'MONTHLY'),
('Laptop Reimbursement', 60000.00, 'ONE_TIME');


-- ====================================================
-- 9. SEED WORKFLOW CONFIGURATIONS
-- ====================================================
INSERT INTO workflow_config (entity_type, name) VALUES
('LEAVE', 'Standard Leave Approval Workflow'),
('TRAVEL', 'Standard Business Travel Workflow'),
('EXPENSE', 'Standard Expense Claim Workflow'),
('REIMBURSEMENT', 'Standard Benefit Reimbursement Workflow'),
('ASSET', 'Standard IT Asset Request Workflow');

-- Step Configs:
-- LEAVE: Level 1 - REPORTING_MANAGER
INSERT INTO workflow_step_config (workflow_config_id, step_number, approver_role) VALUES
(1, 1, 'REPORTING_MANAGER');

-- TRAVEL: Level 1 - REPORTING_MANAGER, Level 2 - TRAVEL_APPROVER
INSERT INTO workflow_step_config (workflow_config_id, step_number, approver_role) VALUES
(2, 1, 'REPORTING_MANAGER'),
(2, 2, 'TRAVEL_APPROVER');

-- EXPENSE: Level 1 - REPORTING_MANAGER, Level 2 - FINANCE_MANAGER
INSERT INTO workflow_step_config (workflow_config_id, step_number, approver_role) VALUES
(3, 1, 'REPORTING_MANAGER'),
(3, 2, 'FINANCE_MANAGER');

-- REIMBURSEMENT: Level 1 - HR_ADMIN, Level 2 - FINANCE_MANAGER
INSERT INTO workflow_step_config (workflow_config_id, step_number, approver_role) VALUES
(4, 1, 'HR_ADMIN'),
(4, 2, 'FINANCE_MANAGER');

-- ASSET: Level 1 - IT_ADMIN
INSERT INTO workflow_step_config (workflow_config_id, step_number, approver_role) VALUES
(5, 1, 'IT_ADMIN');


-- ====================================================
-- 10. SEED ASSET REPOSITORY
-- ====================================================
INSERT INTO assets (serial_number, name, category, status, assigned_to, assignment_date) VALUES
('SN-LAP-2024-001', 'MacBook Pro 16" M3', 'LAPTOP', 'ASSIGNED', 15, '2024-01-10'), -- Rohan Sharma
('SN-LAP-2024-002', 'Lenovo ThinkPad T14', 'LAPTOP', 'ASSIGNED', 16, '2024-02-15'),
('SN-MON-2024-055', 'Dell 27" UltraSharp', 'MONITOR', 'AVAILABLE', NULL, NULL),
('SN-MOB-2024-101', 'iPhone 15 Pro Max', 'MOBILE', 'AVAILABLE', NULL, NULL);


-- ====================================================
-- 11. SEED WORKFLOW TRANSACTION TEST DATA
-- ====================================================

-- Leave request by Rohan (Maker: 15) -> Manager: Amit (14)
-- Date range: 2026-06-01 to 2026-06-03 (3 days)
INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status) VALUES
(15, 1, '2026-06-01', '2026-06-03', 3.00, 'Family emergency at hometown', 'PENDING');

-- Create corresponding workflow instance
INSERT INTO workflow_instances (workflow_config_id, entity_id, status, current_step) VALUES
(1, 1, 'PENDING', 1); -- Entity ID is 1 (the leave request)

-- Assign Task to Devendra Singh (Manager: employee_id 10)
INSERT INTO workflow_tasks (workflow_instance_id, step_number, assigned_approver_id, assigned_role, status) VALUES
(1, 1, 10, 'REPORTING_MANAGER', 'PENDING');

-- Create corresponding submission log
INSERT INTO workflow_action_logs (workflow_instance_id, step_number, action, actor_id, remarks) VALUES
(1, 1, 'SUBMIT', 15, 'Request submitted and routed to level 1.');


-- ====================================================
-- 12. SEED SALARY STRUCTURES
-- ====================================================
INSERT INTO salary_structures (employee_id, basic, hra, special_allowance, provident_fund, ctc) VALUES
(15, 30000.00, 15000.00, 20000.00, 3600.00, 850000.00); -- Rohan Sharma
