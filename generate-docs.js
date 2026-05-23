/**
 * ESS Portal - Documentation Generator
 * Generates a comprehensive .docx user manual + flow document
 * for all modules of the Employee Self Service Portal.
 *
 * Usage: node generate-docs.js
 * Output: docs/ESS_Portal_User_Manual.docx
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  TableOfContents, Header, Footer, PageNumber, NumberFormat,
  UnderlineType, ImageRun, ExternalHyperlink
} = require("docx");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
//  Colour Palette
// ─────────────────────────────────────────────
const BRAND_BLUE   = "1E3A5F";  // dark navy
const ACCENT_BLUE  = "2563EB";  // primary blue
const HEADER_BG    = "1E3A5F";  // table header fill
const ROW_ALT      = "EFF6FF";  // alternate row fill
const SECTION_LINE = "3B82F6";  // section rule
const GREEN        = "166534";
const RED          = "991B1B";
const AMBER        = "92400E";

// ─────────────────────────────────────────────
//  Helper: styled paragraph
// ─────────────────────────────────────────────
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  children: [new TextRun({ text, color: BRAND_BLUE, bold: true, size: 36 })]
});

const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 160 },
  children: [new TextRun({ text, color: ACCENT_BLUE, bold: true, size: 28 })]
});

const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, color: "374151", bold: true, size: 24 })]
});

const body = (text, { bold = false, italic = false, color = "374151" } = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold, italic, color, size: 22 })]
  });

const bullet = (text, level = 0) => new Paragraph({
  bullet: { level },
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, color: "374151" })]
});

const note = (text) => new Paragraph({
  spacing: { before: 120, after: 160 },
  shading: { type: ShadingType.SOLID, color: "FEF3C7", fill: "FEF3C7" },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: "F59E0B" } },
  indent: { left: 180 },
  children: [new TextRun({ text: `⚠  ${text}`, size: 22, color: AMBER, bold: true })]
});

const tip = (text) => new Paragraph({
  spacing: { before: 120, after: 160 },
  shading: { type: ShadingType.SOLID, color: "ECFDF5", fill: "ECFDF5" },
  border: { left: { style: BorderStyle.SINGLE, size: 12, color: "10B981" } },
  indent: { left: 180 },
  children: [new TextRun({ text: `✔  ${text}`, size: 22, color: GREEN })]
});

const rule = () => new Paragraph({
  spacing: { before: 240, after: 240 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E5E7EB" } },
  children: []
});

const empty = () => new Paragraph({ children: [] });

// ─────────────────────────────────────────────
//  Table helpers
// ─────────────────────────────────────────────
const cell = (text, { header = false, width = 20, color = "374151" } = {}) =>
  new TableCell({
    shading: header
      ? { type: ShadingType.SOLID, color: HEADER_BG, fill: HEADER_BG }
      : undefined,
    width: { size: width * 100, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: header,
            color: header ? "FFFFFF" : color,
            size: 20
          })
        ]
      })
    ]
  });

const tableRow = (cells, isHeader = false) =>
  new TableRow({
    tableHeader: isHeader,
    children: cells
  });

const mkTable = (headers, rows, widths) => {
  const cols = headers.length;
  const w = widths || headers.map(() => Math.floor(90 / cols));
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [
      tableRow(headers.map((h, i) => cell(h, { header: true, width: w[i] })), true),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((val, i) =>
            new TableCell({
              shading: ri % 2 === 1
                ? { type: ShadingType.SOLID, color: ROW_ALT, fill: ROW_ALT }
                : undefined,
              width: { size: w[i] * 100, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: val, size: 20, color: "374151" })]
                })
              ]
            })
          )
        })
      )
    ]
  });
}

// ─────────────────────────────────────────────
//  Section: Cover Page
// ─────────────────────────────────────────────
const coverPage = () => [
  empty(), empty(), empty(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({ text: "EMPLOYEE SELF SERVICE PORTAL", bold: true, size: 56, color: BRAND_BLUE })
    ]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [
      new TextRun({ text: "ESS PORTAL", bold: true, size: 44, color: ACCENT_BLUE })
    ]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: SECTION_LINE } },
    children: []
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({ text: "User Manual & Flow Documentation", size: 36, color: "4B5563" })
    ]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new TextRun({ text: "All Modules, Roles, Workflows & Login Reference", size: 26, color: "6B7280", italic: true })
    ]
  }),
  empty(), empty(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Version 1.0  |  Date: ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, size: 22, color: "9CA3AF" })]
  }),
  empty(), empty(), empty()
];

// ─────────────────────────────────────────────
//  Section 1: Introduction
// ─────────────────────────────────────────────
const introSection = () => [
  h1("1. Introduction"),
  body("The Employee Self Service (ESS) Portal is a comprehensive, enterprise-grade web application that enables employees to manage their HR, Finance, and IT service requests digitally — eliminating paper processes and manual approvals."),
  empty(),
  body("The portal empowers employees to:", { bold: true }),
  bullet("Apply for leaves and track approval status"),
  bullet("Log attendance via clock-in / clock-out"),
  bullet("Submit business travel requests"),
  bullet("File and track expense reimbursement claims"),
  bullet("Request IT hardware assets from a managed catalog"),
  bullet("View their own employee profile and payslips"),
  empty(),
  body("Managers and administrators can:", { bold: true }),
  bullet("Process pending approvals from a unified Workflow Inbox"),
  bullet("Access admin dashboards with consolidated metrics"),
  bullet("Manage employee master data, leave policies, and system configurations"),
  empty(),
  h2("1.1 Technology Stack"),
  mkTable(
    ["Layer", "Technology", "Details"],
    [
      ["Backend", "Java 21 + Spring Boot 3.x", "REST APIs, JWT Security, JPA"],
      ["Frontend", "Angular 21 (Zoneless)", "Angular Signals, PrimeNG, Tailwind CSS"],
      ["Database", "MySQL 8.x", "Relational, normalized, soft-delete enabled"],
      ["Authentication", "JWT Bearer Tokens", "Stateless, role-based via Spring Security"],
      ["Approval Engine", "Maker-Checker Workflow Engine", "Database-driven, multi-level configurable"],
    ],
    [30, 35, 35]
  ),
  empty(),
  h2("1.2 Application URLs"),
  mkTable(
    ["Service", "URL", "Purpose"],
    [
      ["Frontend Portal", "http://localhost:4300", "Angular UI accessed by all users"],
      ["Backend API", "http://localhost:8080/api", "Spring Boot REST API layer"],
      ["API Health", "http://localhost:8080/actuator/health", "System health check endpoint"],
    ],
    [20, 35, 45]
  ),
  empty()
];

// ─────────────────────────────────────────────
//  Section 2: User Roles & Login Reference
// ─────────────────────────────────────────────
const loginSection = () => [
  h1("2. User Roles & Login Reference"),
  body("All user accounts share the default password for the seed/demo environment. Passwords can be changed by the Super Admin via the Admin → User Management panel."),
  empty(),
  new Paragraph({
    shading: { type: ShadingType.SOLID, color: "EFF6FF", fill: "EFF6FF" },
    border: { left: { style: BorderStyle.SINGLE, size: 16, color: ACCENT_BLUE } },
    indent: { left: 180 },
    spacing: { before: 120, after: 200 },
    children: [
      new TextRun({ text: "🔑  Default Password for ALL accounts:  ", bold: true, size: 24, color: BRAND_BLUE }),
      new TextRun({ text: "Password@123", bold: true, size: 24, color: RED, font: "Courier New" }),
    ]
  }),
  empty(),
  h2("2.1 Primary Demo Accounts (Quick Login Personas)"),
  body("These are the principal test accounts used to exercise all system workflows end-to-end:"),
  empty(),
  mkTable(
    ["Role / Persona", "Employee ID", "Full Name", "Email Address", "Password", "Department"],
    [
      ["Super Admin / CEO",     "EMP001", "Vijay Mallya",     "vijay.mallya@ess.com",     "Password@123", "Executive Office"],
      ["HR Admin / HR Manager", "EMP007", "Shalini Sharma",   "shalini.sharma@ess.com",   "Password@123", "Human Resources"],
      ["Finance Manager",       "EMP008", "Anil Gupta",       "anil.gupta@ess.com",       "Password@123", "Finance & Accounts"],
      ["IT Admin",              "EMP009", "Karan Kumar",      "karan.kumar@ess.com",       "Password@123", "Information Technology"],
      ["Team Lead / Manager",   "EMP010", "Devendra Singh",   "devendra.singh@ess.com",   "Password@123", "Software Engineering"],
      ["Employee (Maker)",      "EMP015", "Rohan Sharma",     "rohan.sharma@ess.com",     "Password@123", "Software Engineering"],
    ],
    [28, 18, 22, 38, 22, 32]
  ),
  empty(),
  h2("2.2 All System Roles"),
  mkTable(
    ["Role Name", "Scope", "Key Permissions"],
    [
      ["SUPER_ADMIN",       "Full System Access",          "All permissions — user mgmt, payroll, config"],
      ["HR_ADMIN",          "Human Resources",             "Employee master, leave config, approvals"],
      ["HR_EXECUTIVE",      "HR Operations",               "Routine HR data entry and employee support"],
      ["FINANCE_MANAGER",   "Finance & Accounts",          "Expense L2 approval, payroll generation"],
      ["FINANCE_EXECUTIVE", "Finance Operations",          "Claim payout processing"],
      ["DELIVERY_MANAGER",  "Division Leadership",         "Senior-level approval, cross-team oversight"],
      ["PROJECT_MANAGER",   "Project Teams",               "Leave / travel / expense approval for project"],
      ["TEAM_LEAD",         "Team Management",             "L1 approval — leave, expense, asset for team"],
      ["EMPLOYEE",          "Self Service",                "Apply leave, travel, expense, asset requests"],
      ["IT_ADMIN",          "IT Infrastructure",           "Manage asset catalog, approve device requests"],
      ["ASSET_MANAGER",     "Asset Operations",            "Asset catalog management and return processing"],
      ["TRAVEL_APPROVER",   "Travel Management",           "Approve and coordinate business travel"],
    ],
    [28, 28, 44]
  ),
  empty(),
  h2("2.3 Complete Employee Directory (Seed Data)"),
  body("All 52 employees from the seed data are listed below. Each can log in with their email and the default password Password@123."),
  empty(),
  mkTable(
    ["Emp ID", "Name", "Email", "Role", "Reports To"],
    [
      ["EMP001", "Vijay Mallya",     "vijay.mallya@ess.com",     "Super Admin",       "—"],
      ["EMP002", "Rajesh Iyer",      "rajesh.iyer@ess.com",      "Delivery Manager",  "EMP001"],
      ["EMP003", "Sunita Rao",       "sunita.rao@ess.com",       "Delivery Manager",  "EMP001"],
      ["EMP004", "Amit Patel",       "amit.patel@ess.com",       "Project Manager",   "EMP002"],
      ["EMP005", "Priya Nair",       "priya.nair@ess.com",       "Project Manager",   "EMP002"],
      ["EMP006", "Vikram Reddy",     "vikram.reddy@ess.com",     "Project Manager",   "EMP003"],
      ["EMP007", "Shalini Sharma",   "shalini.sharma@ess.com",   "HR Admin",          "EMP001"],
      ["EMP008", "Anil Gupta",       "anil.gupta@ess.com",       "Finance Manager",   "EMP001"],
      ["EMP009", "Karan Kumar",      "karan.kumar@ess.com",      "IT Admin",          "EMP001"],
      ["EMP010", "Devendra Singh",   "devendra.singh@ess.com",   "Team Lead",         "EMP004"],
      ["EMP011", "Meera Desai",      "meera.desai@ess.com",      "Team Lead",         "EMP005"],
      ["EMP012", "Sneha Bansal",     "sneha.bansal@ess.com",     "HR Executive",      "EMP007"],
      ["EMP013", "Rohit Trivedi",    "rohit.trivedi@ess.com",    "Finance Executive", "EMP008"],
      ["EMP014", "Varun Mehta",      "varun.mehta@ess.com",      "Employee",          "EMP001"],
      ["EMP015", "Rohan Sharma",     "rohan.sharma@ess.com",     "Employee",          "EMP010"],
      ["EMP016", "Aditi Sen",        "aditi.sen@ess.com",        "Employee",          "EMP010"],
      ["EMP017", "Abhishek Joshi",   "abhishek.joshi@ess.com",   "Employee",          "EMP010"],
      ["EMP018", "Kavita Deshmukh",  "kavita.deshmukh@ess.com",  "Employee",          "EMP010"],
      ["EMP019", "Vivek Chawla",     "vivek.chawla@ess.com",     "Employee",          "EMP010"],
      ["EMP020", "Sanjay Verma",     "sanjay.verma@ess.com",     "Team Lead (QA)",    "EMP006"],
      ["EMP021", "Pooja Rao",        "pooja.rao@ess.com",        "Employee",          "EMP020"],
      ["EMP022", "Ajay Mishra",      "ajay.mishra@ess.com",      "Employee",          "EMP020"],
      ["EMP023", "Akash Singh",      "akash.singh@ess.com",      "Employee",          "EMP011"],
      ["EMP024", "Ananya Sen",       "ananya.sen@ess.com",       "Employee",          "EMP011"],
      ["EMP025", "Arjun Das",        "arjun.das@ess.com",        "Employee",          "EMP011"],
      ["EMP026", "Bharti Sharma",    "bharti.sharma@ess.com",    "Employee",          "EMP011"],
      ["EMP027", "Chetan Joshi",     "chetan.joshi@ess.com",     "Employee",          "EMP011"],
      ["EMP028", "Deepika Raj",      "deepika.raj@ess.com",      "Employee",          "EMP011"],
      ["EMP029", "Gautam Nair",      "gautam.nair@ess.com",      "Employee",          "EMP011"],
      ["EMP030", "Harsha Vardhan",   "harsha.vardhan@ess.com",   "Employee",          "EMP010"],
      ["EMP031", "Isha Bhat",        "isha.bhat@ess.com",        "Employee",          "EMP010"],
      ["EMP032", "Jitendra Yadav",   "jitendra.yadav@ess.com",   "Employee",          "EMP010"],
    ],
    [15, 22, 40, 28, 15]
  ),
  empty()
];

// ─────────────────────────────────────────────
//  Section 3: System Architecture Overview
// ─────────────────────────────────────────────
const architectureSection = () => [
  h1("3. System Architecture"),
  h2("3.1 High-Level Architecture"),
  body("The ESS Portal follows a clean three-tier layered architecture with domain isolation making it microservice-ready:"),
  empty(),
  mkTable(
    ["Layer", "Technology", "Role"],
    [
      ["Presentation Tier",  "Angular 21 + PrimeNG + Tailwind", "Reactive SPA — Signals-driven, Zoneless CD"],
      ["API Gateway",        "Spring Boot 3.x (REST Controllers)", "HTTP boundary, DTO validation, JWT auth"],
      ["Business Logic",     "Service Interfaces + Workflow Engine", "Core domain logic, transaction management"],
      ["Data Access",        "Spring Data JPA + MySQL 8.x", "ORM, Specifications, Soft Delete, Audit Logging"],
    ],
    [22, 40, 38]
  ),
  empty(),
  h2("3.2 Workflow Engine Architecture"),
  body("The Maker-Checker engine is fully database-driven — approval chains are configured in the DB, not hardcoded."),
  empty(),
  mkTable(
    ["DB Table", "Purpose"],
    [
      ["`workflow_config`",       "Registers which entity types require approvals (LEAVE, TRAVEL, EXPENSE, ASSET)"],
      ["`workflow_step_config`",  "Defines approval levels per config (Step 1: REPORTING_MANAGER, Step 2: FINANCE_MANAGER)"],
      ["`workflow_instances`",    "Live execution state machine: tracks current_step and overall status (PENDING/APPROVED/REJECTED)"],
      ["`workflow_tasks`",        "Per-step inbox item assigned to a specific approver employee"],
      ["`workflow_action_logs`",  "Immutable audit trail of every submit, approve, or reject action with remarks and actor"],
    ],
    [30, 70]
  ),
  empty(),
  h2("3.3 Security Model"),
  bullet("JWT Bearer Token authentication — stateless, issued on login, validated on every request"),
  bullet("BCrypt-hashed passwords stored in the `users` table (cost factor 10)"),
  bullet("Role-Based Access Control: @PreAuthorize enforces permissions at service method level"),
  bullet("CORS policy restricted to localhost:4300 for development (configurable for production domains)"),
  bullet("Maker-Checker constraint enforced: the submitter cannot approve their own request"),
  empty()
];

// ─────────────────────────────────────────────
//  Section 4: Module Flows
// ─────────────────────────────────────────────
const moduleFlowsSection = () => [
  h1("4. Module Flows & User Guide"),
  body("This section describes every module available in the ESS Portal — how to access it, who can use it, the step-by-step flow, and what the system does internally at each stage."),
  empty(),

  // ── 4.1 Login ──
  rule(),
  h2("4.1 Login & Authentication"),
  h3("Who Uses This"),
  body("All users — employees, managers, admins."),
  empty(),
  h3("How to Log In"),
  bullet("Open your browser and navigate to: http://localhost:4300"),
  bullet("The portal displays the Login page with the ESS Portal branding"),
  bullet("Enter your registered Email Address and Password"),
  bullet("Click the Login button"),
  bullet("On successful authentication, you are redirected to your role-specific Dashboard"),
  empty(),
  h3("Login Flow Diagram"),
  mkTable(
    ["Step", "User Action", "System Response"],
    [
      ["1", "Enter email + password → click Login", "Frontend sends POST /api/auth/login with credentials"],
      ["2", "—", "Backend validates credentials, BCrypt-verifies password against DB"],
      ["3", "—", "JWT token generated (24-hour expiry) and returned in response"],
      ["4", "—", "Frontend stores token in sessionStorage, decodes role claims"],
      ["5", "—", "Angular router redirects user to /dashboard based on role"],
    ],
    [10, 35, 55]
  ),
  empty(),
  tip("Session Tip: Your session automatically expires after 24 hours. Simply log in again to continue."),
  note("If you forget your password, contact your HR Admin or Super Admin to reset it through the Admin panel."),
  empty(),

  // ── 4.2 Dashboard ──
  rule(),
  h2("4.2 Dashboard"),
  h3("Access Level"),
  body("All users see the Dashboard after login. Employees see personal stats; Admins/Managers see organisational summaries."),
  empty(),
  h3("Employee Dashboard Widgets"),
  bullet("Leave Balance Summary — Casual, Earned, Sick leaves available vs. used"),
  bullet("Active Attendance Status — Shows \"Active on Duty\" if clocked-in, with duration"),
  bullet("Pending Requests — Count of leave/expense/travel/asset requests awaiting approval"),
  bullet("Recent Announcements — Company-wide notices from HR"),
  empty(),
  h3("Manager / Admin Dashboard Widgets"),
  bullet("Pending Approvals Count — Tasks waiting in your Workflow Inbox"),
  bullet("Team Attendance Overview — How many team members are present today"),
  bullet("Department Leave Calendar — Visual calendar of approved absences"),
  bullet("Expense Claim Summary — Total claims pending Finance review"),
  empty(),

  // ── 4.3 Attendance ──
  rule(),
  h2("4.3 Attendance Module (Clock-In / Clock-Out)"),
  h3("Who Uses This"),
  body("All employees (any role) to record daily attendance."),
  empty(),
  h3("Accessing Attendance"),
  bullet("Navigate to: Sidebar → Attendance"),
  empty(),
  h3("Clock-In Process"),
  mkTable(
    ["Step", "Action", "Result"],
    [
      ["1", "Click \"Clock In\" button on the Attendance page", "System records current timestamp as check_in_time"],
      ["2", "Status indicator changes to \"Active on Duty\"", "Session card shows employee name, time, and duration"],
      ["3", "Dashboard updates automatically", "Attendance widget reflects active duty status"],
    ],
    [10, 45, 45]
  ),
  empty(),
  h3("Clock-Out Process"),
  mkTable(
    ["Step", "Action", "Result"],
    [
      ["1", "Click \"Clock Out\" button on the Attendance page", "System records current timestamp as check_out_time"],
      ["2", "Duration is calculated automatically", "Total hours worked is computed and saved"],
      ["3", "Today's attendance row appears in history", "Date, Check-In, Check-Out, Hours shown in the table"],
    ],
    [10, 45, 45]
  ),
  empty(),
  tip("You can only clock-in once per day. Subsequent clock-ins on the same date update the existing record."),
  note("If you forget to clock-out, contact your HR Admin to manually correct the record."),
  empty(),

  // ── 4.4 Leave ──
  rule(),
  h2("4.4 Leave Module"),
  h3("Who Uses This"),
  body("Employees to apply for leave. Managers (Team Lead, Project Manager) to approve."),
  empty(),
  h3("Leave Types"),
  mkTable(
    ["Leave Type", "Code", "Default Annual Allocation"],
    [
      ["Casual Leave",    "CL", "12 days"],
      ["Earned Leave",    "EL", "15 days"],
      ["Sick Leave",      "SL", "10 days"],
      ["Maternity Leave", "ML", "180 days (eligible employees only)"],
      ["Paternity Leave", "PL", "15 days (eligible employees only)"],
      ["Loss of Pay",     "LOP", "Unlimited (unpaid, deducted from salary)"],
    ],
    [30, 15, 55]
  ),
  empty(),
  h3("Applying for Leave — Step-by-Step"),
  mkTable(
    ["Step", "Action", "Details"],
    [
      ["1", "Navigate to Leave Center", "Sidebar → Leave Center"],
      ["2", "Click 'Apply for Leave'", "A form panel opens on the right side of the page"],
      ["3", "Select Leave Type", "Choose from CL, EL, SL, ML, PL, LOP"],
      ["4", "Set From Date and To Date", "Use the date pickers; weekends are typically excluded"],
      ["5", "Enter Reason", "Mandatory free-text field with your justification"],
      ["6", "Click 'Submit Application'", "System validates leave balance and creates the workflow"],
      ["7", "Request appears with 'PENDING' status", "Visible immediately in your Leave Applications table"],
    ],
    [8, 28, 64]
  ),
  empty(),
  h3("Leave Approval Flow (Maker-Checker)"),
  mkTable(
    ["Stage", "Actor", "Action", "Next State"],
    [
      ["Submission",   "Employee (Rohan)",   "Submits leave application",          "PENDING → Reporting Manager inbox"],
      ["L1 Approval",  "Reporting Manager",   "Reviews and Approves",               "APPROVED (single-level workflow)"],
      ["L1 Rejection", "Reporting Manager",   "Rejects with reason",                "REJECTED — employee notified"],
    ],
    [20, 25, 30, 25]
  ),
  empty(),
  tip("Leave balances are automatically deducted upon approval. The balance counter on the Leave Center updates in real time."),
  note("Employees cannot cancel a leave once it has been Approved. Contact HR to make corrections."),
  empty(),
  h3("Manager: Approving a Leave"),
  bullet("Log in as a Manager (e.g., Devendra Singh)"),
  bullet("Navigate to: Sidebar → Workflow Tasks"),
  bullet("The Workflow Inbox shows all pending approval tasks assigned to you"),
  bullet("Click on the leave task row to expand the full request details"),
  bullet("Review the employee name, leave type, dates, reason, and balance information"),
  bullet("Enter optional Remarks (e.g., \"Approved — coverage arranged\")"),
  bullet("Click 'Approve' or 'Reject'"),
  bullet("The task disappears from your inbox; the employee's leave status updates instantly"),
  empty(),

  // ── 4.5 Travel ──
  rule(),
  h2("4.5 Travel Claims Module"),
  h3("Who Uses This"),
  body("Employees to request business travel. Managers (L1) then same/alternate approver (L2) to approve. Finance may also be involved."),
  empty(),
  h3("Submitting a Travel Request — Step-by-Step"),
  mkTable(
    ["Step", "Field / Action", "Details"],
    [
      ["1", "Navigate to Travel",           "Sidebar → Travel"],
      ["2", "Click 'Apply for Travel'",      "Travel application form panel opens"],
      ["3", "Trip Title",                    "Short title (e.g., 'Client Pitch – Delhi')"],
      ["4", "Destination",                   "City or location of travel"],
      ["5", "Travel Dates (From → To)",      "Select departure and return dates"],
      ["6", "Mode of Travel",                "Flight / Train / Bus / Own Vehicle / Cab"],
      ["7", "Estimated Cost (₹)",            "Approximate total budget for the trip"],
      ["8", "Business Purpose",              "Detailed description of the business objective"],
      ["9", "Click 'Submit Travel Claim'",   "Workflow initiated — request appears as PENDING"],
    ],
    [8, 28, 64]
  ),
  empty(),
  h3("Travel Approval Flow"),
  mkTable(
    ["Stage", "Actor", "Action", "Next State"],
    [
      ["Submission", "Employee",          "Submits travel request",         "PENDING → Manager inbox (L1)"],
      ["L1 Approval", "Reporting Manager", "Approves L1",                   "PENDING → L2 approver inbox"],
      ["L2 Approval", "Sr. Manager / PM",  "Approves L2 (if configured)",   "APPROVED — fully cleared"],
      ["Rejection",   "Any approver",      "Rejects with reason",            "REJECTED — employee notified"],
    ],
    [20, 25, 30, 25]
  ),
  empty(),
  tip("Once approved, print or save the approval confirmation for submission to the Finance team for reimbursement."),
  empty(),

  // ── 4.6 Expense ──
  rule(),
  h2("4.6 Expense Claims Module"),
  h3("Who Uses This"),
  body("Employees to file reimbursement claims for business expenses. Team Lead (L1) and Finance Manager (L2) to approve."),
  empty(),
  h3("Filing an Expense Claim — Step-by-Step"),
  mkTable(
    ["Step", "Field / Action", "Details"],
    [
      ["1", "Navigate to Expense",           "Sidebar → Expense"],
      ["2", "Click 'Submit Expense Claim'",   "Expense form panel opens"],
      ["3", "Claim Title",                    "E.g., 'Project Kickoff Lodging'"],
      ["4", "Category",                       "Lodging & Boarding / Meals / Transport / Communication / Misc"],
      ["5", "Description",                    "Context for the expenditure"],
      ["6", "Expense Date",                   "Date when the expense was incurred"],
      ["7", "Add Line Items",                 "Click '+ Add Item' to add multiple expense line items with amounts"],
      ["8", "Total Amount",                   "Auto-calculated from line items"],
      ["9", "Click 'Submit Expense Claim'",   "Workflow initiated — appears as PENDING in your history"],
    ],
    [8, 28, 64]
  ),
  empty(),
  h3("Expense Approval Flow (2-Level)"),
  mkTable(
    ["Stage", "Actor", "Action", "Next State"],
    [
      ["Submission",   "Employee",          "Submits claim with items",       "PENDING → Reporting Manager (L1)"],
      ["L1 Approval",  "Team Lead/Manager", "Reviews and approves",           "PENDING → Finance Manager (L2)"],
      ["L2 Approval",  "Finance Manager",   "Finance reviews and approves",   "APPROVED — Reimbursement cleared"],
      ["L1 Rejection", "Team Lead",         "Rejects with business reason",   "REJECTED — no further processing"],
      ["L2 Rejection", "Finance Manager",   "Finance rejects claim",          "REJECTED — employee notified"],
    ],
    [20, 25, 30, 25]
  ),
  empty(),
  note("Expense claims should be filed within 30 days of incurring the expense per company policy."),
  tip("Attach scanned receipts by saving them as comments in the Remarks field and providing the receipt number for Finance audit purposes."),
  empty(),

  // ── 4.7 Asset ──
  rule(),
  h2("4.7 IT Asset Allocation Module"),
  h3("Who Uses This"),
  body("Employees to request IT hardware from the company catalog. IT Admin to approve and fulfil."),
  empty(),
  h3("Requesting an Asset — Step-by-Step"),
  mkTable(
    ["Step", "Field / Action", "Details"],
    [
      ["1", "Navigate to Assets",             "Sidebar → IT Assets"],
      ["2", "Browse Available Catalog",        "All available hardware items are shown as cards"],
      ["3", "Select an Item",                  "Click 'Select' on the desired device"],
      ["4", "Business Justification",          "Enter why this device is needed for your work"],
      ["5", "Click 'Submit Hardware Request'", "Workflow initiated — request visible in your history"],
    ],
    [8, 28, 64]
  ),
  empty(),
  h3("Asset Approval Flow"),
  mkTable(
    ["Stage", "Actor", "Action", "Next State"],
    [
      ["Request",    "Employee",  "Selects device and submits",    "PENDING → IT Admin inbox"],
      ["L1 Approve", "IT Admin",  "Reviews need, approves request", "APPROVED — device allocated"],
      ["L1 Reject",  "IT Admin",  "Rejects (e.g., not in budget)", "REJECTED — employee notified"],
    ],
    [18, 22, 35, 25]
  ),
  empty(),
  h3("Returning an Asset"),
  bullet("Navigate to IT Assets → My Allocations"),
  bullet("On an APPROVED allocation row, click 'Return Device'"),
  bullet("Confirm the return; the asset is marked as returned and re-enters the available catalog"),
  empty(),
  tip("When your approved hardware arrives, confirm receipt in the system by locating the approved record and clicking 'Confirm Receipt'."),
  empty(),

  // ── 4.8 Workflow Tasks ──
  rule(),
  h2("4.8 Workflow Tasks (Approval Inbox)"),
  h3("Who Uses This"),
  body("All approvers: Team Leads, Project Managers, Delivery Managers, Finance Managers, HR Admins, IT Admins."),
  empty(),
  h3("Accessing the Workflow Inbox"),
  bullet("Log in as any approver role"),
  bullet("Navigate to: Sidebar → Workflow Tasks"),
  bullet("The inbox shows all tasks currently assigned to you across all request types"),
  empty(),
  h3("Processing a Task"),
  mkTable(
    ["Step", "Action", "Details"],
    [
      ["1", "View Task List",    "Each row shows: Request Type, Applicant Name, Submitted Date, Request Summary"],
      ["2", "Click to Expand",  "Click a task row to expand the full request details inline"],
      ["3", "Review Details",   "See all fields submitted: dates, amounts, purpose, employee leave balance etc."],
      ["4", "Enter Remarks",    "Type your approval comment or rejection reason (optional but recommended)"],
      ["5", "Click Approve",    "Task is completed; next step is triggered or request is fully approved"],
      ["6", "Click Reject",     "Request is rejected; reason is recorded; employee notified"],
    ],
    [8, 20, 72]
  ),
  empty(),
  tip("The Workflow Inbox automatically refreshes. After approving, the task disappears instantly from your queue."),
  note("You cannot approve a request that you yourself submitted (Maker-Checker constraint enforced by the system)."),
  empty(),

  // ── 4.9 Employee Profile ──
  rule(),
  h2("4.9 Employee Profile"),
  h3("Who Uses This"),
  body("All employees to view and update personal information. HR Admin to manage records."),
  empty(),
  h3("Profile Sections"),
  mkTable(
    ["Section", "Fields", "Editable By"],
    [
      ["Personal Info",    "Name, DOB, Gender, Phone, Address",       "Employee (limited) / HR Admin"],
      ["Work Info",        "Emp ID, Department, Designation, Manager", "HR Admin only"],
      ["Joining Info",     "Joining Date, Probation End Date",         "HR Admin only"],
      ["Bank Details",     "Bank Account, IFSC, Account Name",         "Employee (for payroll)"],
      ["Documents",        "Uploaded ID proofs, certificates",         "Employee / HR Admin"],
    ],
    [25, 45, 30]
  ),
  empty()
];

// ─────────────────────────────────────────────
//  Section 5: Admin Module
// ─────────────────────────────────────────────
const adminSection = () => [
  h1("5. Administration Module"),
  body("The Admin module is accessible only to Super Admin (Vijay Mallya) and HR Admin (Shalini Sharma). It provides master data management and system configuration capabilities."),
  empty(),
  h2("5.1 Admin Sub-Modules"),
  mkTable(
    ["Sub-Module", "Access Role", "Purpose"],
    [
      ["User Management",       "Super Admin",           "Create / deactivate / reset passwords for user accounts"],
      ["Employee Master",       "HR Admin, Super Admin", "Add, edit, or deactivate employee records"],
      ["Department Management", "HR Admin",              "Create and manage departments and cost centres"],
      ["Designation Config",    "HR Admin",              "Configure designation hierarchy and grades"],
      ["Leave Policy Config",   "HR Admin",              "Set annual leave entitlements per leave type per role"],
      ["Workflow Config",       "Super Admin",           "Configure approval chains (add/remove levels per entity type)"],
      ["Asset Catalog",         "IT Admin",              "Add new items to the IT hardware catalog"],
      ["Audit Logs",            "Super Admin",           "View immutable transaction history across all modules"],
      ["Payroll Processing",    "Finance Manager",       "Trigger monthly payroll run and generate payslips"],
    ],
    [30, 28, 42]
  ),
  empty(),
  h2("5.2 Configuring Workflow Approval Chains"),
  body("The workflow engine is driven entirely by database configuration. To add or modify approval levels:"),
  bullet("Log in as Super Admin (vijay.mallya@ess.com)"),
  bullet("Navigate to Admin → Workflow Config"),
  bullet("Select the entity type (LEAVE / TRAVEL / EXPENSE / ASSET)"),
  bullet("Add or remove workflow steps; assign approver role (REPORTING_MANAGER / FINANCE_MANAGER / HR_ADMIN / IT_ADMIN)"),
  bullet("Save — the changes take effect on the next submission of that entity type"),
  empty()
];

// ─────────────────────────────────────────────
//  Section 6: Workflow Scenarios Quick Reference
// ─────────────────────────────────────────────
const scenariosSection = () => [
  h1("6. End-to-End Workflow Scenarios (Quick Reference)"),
  h2("6.1 Scenario A: Casual Leave Application"),
  mkTable(
    ["Actor", "Action", "Login Email"],
    [
      ["Rohan Sharma (Employee)", "1. Login → Leave Center → Apply for Leave → Fill form → Submit", "rohan.sharma@ess.com"],
      ["Devendra Singh (TL)",     "2. Login → Workflow Tasks → Expand task → Add remarks → Approve", "devendra.singh@ess.com"],
      ["Rohan Sharma",            "3. Login → Leave Center → Verify status shows APPROVED + balance deducted", "rohan.sharma@ess.com"],
    ],
    [30, 45, 25]
  ),
  empty(),
  h2("6.2 Scenario B: Expense Claim (2-Level Approval)"),
  mkTable(
    ["Actor", "Action", "Login Email"],
    [
      ["Rohan Sharma",          "1. Login → Expense → Submit Expense Claim → Add items → Submit",          "rohan.sharma@ess.com"],
      ["Devendra Singh (TL)",   "2. Login → Workflow Tasks → Approve (Level 1 — forwards to Finance)",    "devendra.singh@ess.com"],
      ["Anil Gupta (Finance)",  "3. Login → Workflow Tasks → Approve (Level 2 — final approval)",          "anil.gupta@ess.com"],
      ["Rohan Sharma",          "4. Login → Expense → History shows APPROVED + Finance Manager remarks",    "rohan.sharma@ess.com"],
    ],
    [25, 50, 25]
  ),
  empty(),
  h2("6.3 Scenario C: Business Travel Request (Multi-Level)"),
  mkTable(
    ["Actor", "Action", "Login Email"],
    [
      ["Rohan Sharma",          "1. Login → Travel → Apply for Travel → Fill details → Submit",             "rohan.sharma@ess.com"],
      ["Devendra Singh (TL)",   "2. Login → Workflow Tasks → Approve L1 and L2 tasks",                     "devendra.singh@ess.com"],
      ["Rohan Sharma",          "3. Login → Travel → History shows APPROVED with clearance remarks",         "rohan.sharma@ess.com"],
    ],
    [25, 50, 25]
  ),
  empty(),
  h2("6.4 Scenario D: IT Hardware Request"),
  mkTable(
    ["Actor", "Action", "Login Email"],
    [
      ["Rohan Sharma",         "1. Login → IT Assets → Select device → Submit Hardware Request",            "rohan.sharma@ess.com"],
      ["Karan Kumar (IT)",     "2. Login → Workflow Tasks → Approve asset allocation",                       "karan.kumar@ess.com"],
      ["Rohan Sharma",         "3. Login → IT Assets → History shows APPROVED + 'Return Device' button",    "rohan.sharma@ess.com"],
    ],
    [25, 50, 25]
  ),
  empty()
];

// ─────────────────────────────────────────────
//  Section 7: Troubleshooting
// ─────────────────────────────────────────────
const troubleshootingSection = () => [
  h1("7. Troubleshooting & FAQs"),
  h2("7.1 Common Issues"),
  mkTable(
    ["Issue", "Likely Cause", "Resolution"],
    [
      ["Cannot log in",                    "Incorrect email or password",                    "Verify credentials; use Password@123 for demo accounts"],
      ["Session expires quickly",           "JWT token has 24-hour TTL",                      "Simply log in again; sessions are stateless"],
      ["Leave balance not updated",         "Backend propagation delay",                       "Refresh the page; balance updates on approval"],
      ["Workflow task not appearing",       "Not the designated approver for this step",       "Verify your role matches the configured step approver"],
      ["Admin dashboard shows 500 error",  "Admin summary API may need DB seed data",         "Non-blocking; all workflow functions work normally"],
      ["Backend port 8080 unavailable",    "Another process occupies port 8080",              "Run: netstat -ano | findstr :8080 and terminate the conflicting process"],
      ["Frontend port 4300 unavailable",   "Another process occupies port 4300",              "Run: netstat -ano | findstr :4300 and terminate"],
    ],
    [28, 32, 40]
  ),
  empty(),
  h2("7.2 Starting the Application"),
  body("The ESS Portal is started using a unified orchestration script:"),
  empty(),
  new Paragraph({
    shading: { type: ShadingType.SOLID, color: "1F2937", fill: "1F2937" },
    spacing: { before: 120, after: 200 },
    indent: { left: 180, right: 180 },
    children: [
      new TextRun({ text: "cd ess-project", size: 22, font: "Courier New", color: "10B981" }),
      new TextRun({ text: "\nnode start.js", size: 22, font: "Courier New", color: "F9FAFB" }),
    ]
  }),
  empty(),
  bullet("start.js starts the Spring Boot backend JAR and the Angular dev server concurrently"),
  bullet("Backend is available at http://localhost:8080 (allow ~20 seconds for JVM startup)"),
  bullet("Frontend is available at http://localhost:4300"),
  empty()
];

// ─────────────────────────────────────────────
//  Section 8: API Reference Summary
// ─────────────────────────────────────────────
const apiSection = () => [
  h1("8. Key API Endpoints Summary"),
  body("All endpoints require a Bearer JWT token in the Authorization header (except /api/auth/login)."),
  empty(),
  mkTable(
    ["Module", "Method", "Endpoint", "Description"],
    [
      ["Auth",        "POST", "/api/auth/login",                  "Authenticate user, receive JWT token"],
      ["Auth",        "POST", "/api/auth/logout",                 "Invalidate current session"],
      ["Attendance",  "POST", "/api/attendance/clock-in",         "Record clock-in for today"],
      ["Attendance",  "POST", "/api/attendance/clock-out",        "Record clock-out for today"],
      ["Attendance",  "GET",  "/api/attendance/my",               "Fetch personal attendance history"],
      ["Leave",       "GET",  "/api/leaves/my",                   "Fetch personal leave applications"],
      ["Leave",       "POST", "/api/leaves/request",              "Submit a new leave application"],
      ["Leave",       "GET",  "/api/leaves/balance",              "Fetch leave balance by type"],
      ["Travel",      "GET",  "/api/travel/my",                   "Fetch personal travel requests"],
      ["Travel",      "POST", "/api/travel/request",              "Submit a new travel request"],
      ["Expense",     "GET",  "/api/expense/my",                  "Fetch personal expense claims"],
      ["Expense",     "POST", "/api/expense/submit",              "Submit a new expense claim"],
      ["Asset",       "GET",  "/api/assets/my-allocations",       "Fetch personal asset allocations"],
      ["Asset",       "POST", "/api/assets/request",              "Submit a new asset request"],
      ["Asset",       "GET",  "/api/assets/catalog",              "Browse available IT asset catalog"],
      ["Workflow",    "GET",  "/api/workflow/tasks/my",           "Fetch tasks in approver's inbox"],
      ["Workflow",    "POST", "/api/workflow/tasks/{id}/approve", "Approve a specific workflow task"],
      ["Workflow",    "POST", "/api/workflow/tasks/{id}/reject",  "Reject a specific workflow task"],
      ["Employee",    "GET",  "/api/employees/me",                "Fetch current user's profile"],
      ["Admin",       "GET",  "/api/admin/employees",             "List all employees (HR/Admin)"],
    ],
    [16, 12, 42, 30]
  ),
  empty()
];

// ─────────────────────────────────────────────
//  Build & write the document
// ─────────────────────────────────────────────
async function buildDocument() {
  const sections = [
    ...coverPage(),
    ...introSection(),
    ...loginSection(),
    ...architectureSection(),
    ...moduleFlowsSection(),
    ...adminSection(),
    ...scenariosSection(),
    ...troubleshootingSection(),
    ...apiSection(),
  ];

  const doc = new Document({
    title: "ESS Portal User Manual & Flow Documentation",
    subject: "Employee Self Service Portal — All Modules",
    creator: "ESS Portal Documentation Generator",
    description: "Complete user manual covering all modules, roles, workflows, and login reference for the ESS Portal.",
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Calibri", size: 22, color: "374151" }
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 900, bottom: 720, left: 900 }
          }
        },
        children: sections
      }
    ]
  });

  const outDir = path.join(__dirname, "docs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "ESS_Portal_User_Manual.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`\n✅ Document generated successfully!`);
  console.log(`📄 Saved to: ${outPath}`);
  console.log(`📦 File size: ${(buffer.length / 1024).toFixed(1)} KB\n`);
  return outPath;
}

buildDocument().catch(err => {
  console.error("❌ Error generating document:", err);
  process.exit(1);
});
