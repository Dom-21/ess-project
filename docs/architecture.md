# System Architecture Documentation
## Employee Self Service (ESS) Portal

This document outlines the architectural paradigms, design patterns, security frameworks, and state-management designs implemented in the **Employee Self Service Portal (ESS Portal)**.

---

## 1. Core Architectural Pillars

The application is engineered using high-performance, robust, and clean patterns:
- **Backend**: Java 21 & Spring Boot 3.x following a structured **Hexagonal-adjacent Layered Architecture**.
- **Frontend**: Zoneless Angular 21 employing **Angular Signals** for reactive state management, **PrimeNG** components, and **Tailwind CSS** for layout styling.
- **Database**: MySQL 8.x, utilizing normalization, optimized Indexes, Soft Deletion, and transactional safety features.

```
       [ Client Browser ] (Angular 21 Zoneless App)
              │
         JSON / HTTPS (JWT Auth Header)
              │
              ▼
    [ REST Controllers ] <─> [ JWT Interceptor / Security Filter ]
              │
              ▼
     [ Service Interface ] (Business Logic & Transactions)
       ├── [ Workflow Engine Service ] (Maker-Checker Engine)
       ├── [ Audit Log Aspect ] (Raw Entity Change Tracking)
       └── [ Notification Service ] (In-App & Email alerts)
              │
              ▼
     [ Spring Data JPA ] (JPA Repositories)
              │
              ▼
      [( MySQL Engine )]
```

---

## 2. Backend Design Patterns (Spring Boot 3.x)

### A. Layered Package Isolation
To enable microservice-readiness, packages are strictly modularized. Business domains like `Leave`, `Attendance`, `Expense`, and `Travel` are self-contained. 
- **Controller Layer**: Enforces boundary validation (`@Valid`), executes HTTP mappings, and transfers DTOs.
- **Service Layer**: Implements core transactions. It interacts with the `WorkflowEngineService` when requests require managerial checkoffs.
- **Repository Layer**: Utilizes Spring Data JPA. Complex dynamic queries (e.g., auditing, filters) leverage the **Specification Pattern** (`JpaSpecificationExecutor`).

### B. Dynamic Maker-Checker Workflow Engine
A critical enterprise requirement is avoiding hardcoded approval chains. We implement a database-configured workflow system:
1. **Definition**: Workflows are declared in `workflow_config` for specific entities (e.g., `LEAVE`). `workflow_step_config` dictates approval steps (e.g., Step 1: Reporting Manager, Step 2: Finance Manager).
2. **Instantiation**: Submitting a request triggers `WorkflowEngineService.initiate(...)`. This creates a `workflow_instance` linked to the request and spawns a pending `workflow_task` for the designated approver.
3. **Execution**: The manager approves the task via `processTask(...)`. If another step exists, the engine increments `current_step` and routes it. Otherwise, it finalizes the target entity.
4. **Maker-Checker Constraint**: The service guarantees that `actor_id` (approver) cannot equal `maker_id` (requester).

### C. Enterprise Auditing & Database Tracking
State mutations must be tracked to meet corporate compliance standards.
- **Aspect-Oriented Audit Aspect**: Standard entities inherit from `BaseEntity` (containing `created_by`, `created_at`, `version`, `is_deleted` properties).
- **JSON Transaction Diffing**: A custom AOP Aspect intercepts modifying service operations. It serializes the entity state before and after execution, recording the fields changed along with client IP and User-Agent details to the `audit_logs` table.

---

## 3. Frontend Design Patterns (Angular 21)

### A. Zoneless Angular Change Detection
The application bootstraps with:
```typescript
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    ...
  ]
});
```
By removing `zone.js` runtime tracking, the application achieves outstanding performance. Change detection is triggered only when Signals change, asynchronous events fire, or Observables emit, making the DOM extremely responsive.

### B. Signal-Based State Management
We avoid heavy state management libraries (like Ngrx boilerplate) by using **Injectable Signal Stores**:
- Stores (e.g., `AuthStore`, `WorkflowStore`) wrap private `signal()` states and expose computed `computed()` values (e.g., `currentUser`, `isLoggedIn`).
- State modifications are exposed through clean store methods, making state updates completely deterministic and observable.

### C. Premium Theme & Responsive UX
- **Tailwind CSS**: Governs global responsive layouts, margins, spacing, and modern typography grids.
- **PrimeNG Custom Dark Theme**: Features complete integration with Tailwind. Dynamic theme switching injects the `.dark` class to activate dark glassmorphism styling.

---

## 4. Security Framework (Spring Security + JWT)

- **Token Authentication**: Secure JWT generation containing subject, issues, expiry, and authorities claims. Handled on subsequent calls using a stateless `JwtAuthenticationFilter`.
- **Method-Level Authorization**: Secured via `@PreAuthorize` annotations evaluating user roles and permission tokens mapping down to SQL `role_permissions` schema.
- **CORS Config**: Strictly scoped to allow verified HTTP methods (GET, POST, PUT, DELETE, OPTIONS) and credential headers from authorized origins (localhost:4200).
