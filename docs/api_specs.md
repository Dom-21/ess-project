# REST API Specifications
## Employee Self Service (ESS) Portal

All requests use standard JSON payloads and include the HTTP header:
`Authorization: Bearer <jwt_token>`

---

## 1. Authentication & Security Module
Base Path: `/api/auth`

### POST `/login`
Authenticates user and returns JWT + user context.
- **Request Body**:
  ```json
  {
    "email": "rohan.sharma@ess.com",
    "password": "Password@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "4a5c6d7e...",
    "employeeId": "EMP015",
    "email": "rohan.sharma@ess.com",
    "firstName": "Rohan",
    "lastName": "Sharma",
    "roles": ["EMPLOYEE"],
    "permissions": ["VIEW_DASHBOARD", "REQUEST_LEAVE", "VIEW_PAYSLIP"]
  }
  ```

### POST `/refresh-token`
Generates a fresh JWT using a valid refresh token.
- **Request Body**:
  ```json
  {
    "refreshToken": "4a5c6d7e..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

---

## 2. Employee Profile & Hierarchy Module
Base Path: `/api/employees`

### GET `/profile`
Retrieves currently logged-in employee profile.
- **Response (200 OK)**:
  ```json
  {
    "id": 15,
    "employeeId": "EMP015",
    "firstName": "Rohan",
    "lastName": "Sharma",
    "email": "rohan.sharma@ess.com",
    "phone": "9876543224",
    "joiningDate": "2023-03-01",
    "department": "Software Engineering",
    "designation": "Senior Software Engineer",
    "managerName": "Devendra Singh",
    "profileImageUrl": "/uploads/profile_15.jpg"
  }
  ```

### POST `/profile/image`
Uploads a profile picture.
- **Request**: `Multipart File` under parameter `file`
- **Response (200 OK)**:
  ```json
  {
    "imageUrl": "/uploads/profile_15.jpg"
  }
  ```

---

## 3. Attendance Module
Base Path: `/api/attendance`

### POST `/check-in`
Registers daily check-in.
- **Request Body**:
  ```json
  {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "isWfh": false
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 85,
    "date": "2026-05-23",
    "checkIn": "2026-05-23T09:02:15Z",
    "isLate": false,
    "status": "PRESENT"
  }
  ```

### POST `/check-out`
Registers check-out and computes late mark bounds.
- **Response (200 OK)**:
  ```json
  {
    "id": 85,
    "checkOut": "2026-05-23T18:05:40Z",
    "status": "PRESENT"
  }
  ```

### GET `/my-records`
Lists personal attendance logs with paging and query filters.
- **Query Params**: `month=5`, `year=2026`
- **Response (200 OK)**:
  ```json
  [
    {
      "date": "2026-05-08",
      "checkIn": "2026-05-08T08:55:00Z",
      "checkOut": "2026-05-08T18:05:00Z",
      "isLate": false,
      "isWfh": false,
      "status": "PRESENT"
    }
  ]
  ```

---

## 4. Leave Module
Base Path: `/api/leaves`

### GET `/balances`
Retrieves available leave allocations.
- **Response (200 OK)**:
  ```json
  [
    {
      "leaveTypeCode": "CL",
      "leaveTypeName": "Casual Leave",
      "allocated": 12,
      "used": 2,
      "pendingApproval": 1,
      "available": 9
    }
  ]
  ```

### POST `/requests`
Submits a leave request (Maker action).
- **Request Body**:
  ```json
  {
    "leaveTypeId": 1,
    "startDate": "2026-06-01",
    "endDate": "2026-06-03",
    "reason": "Family emergency at hometown"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 12,
    "employeeId": 15,
    "leaveTypeName": "Casual Leave",
    "totalDays": 3.0,
    "status": "PENDING"
  }
  ```

---

## 5. Expense & Reimbursement Module
Base Path: `/api/expenses`

### POST `/claims`
Files a multi-item expense claim (Maker action).
- **Request Body**:
  ```json
  {
    "title": "Client Onboarding Trip",
    "claimDate": "2026-05-22",
    "items": [
      {
        "categoryId": 1,
        "amount": 4500.00,
        "description": "IndiGo Flight Bangalore to Mumbai",
        "fileMetadataId": 104
      }
    ]
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 4,
    "totalAmount": 4500.00,
    "status": "PENDING"
  }
  ```

---

## 6. Workflow Engine Module
Base Path: `/api/workflows`

### GET `/inbox`
Retrieves pending approval tasks for the logged-in approver (Checker view).
- **Response (200 OK)**:
  ```json
  [
    {
      "taskId": 1,
      "entityType": "LEAVE",
      "entityId": 1,
      "makerName": "Rohan Sharma",
      "amount": null,
      "description": "Casual Leave request for 3.0 days: Family emergency at hometown",
      "stepNumber": 1,
      "createdDate": "2026-05-23T01:23:59Z"
    }
  ]
  ```

### POST `/tasks/{taskId}/process`
Approves or rejects a pending workflow task (Checker action).
- **Request Body**:
  ```json
  {
    "action": "APPROVE",
    "remarks": "Approved. Ensure handoff is completed."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "taskId": 1,
    "status": "COMPLETED",
    "instanceStatus": "APPROVED",
    "message": "Task processed successfully."
  }
  ```
