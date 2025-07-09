To create a Markdown (`.md`) file for your backend code, you'll typically want to focus on documentation relevant to developers working with the backend, such as API endpoints, data models, setup instructions, and deployment details.

Here's a structured `.md` file based on the provided SIRE TECH System Documentation, tailored for backend inclusion. I've focused on sections most relevant to backend developers and maintained the original structure and information flow.

```markdown
# SIRE TECH Backend System Documentation

## 1. Introduction
This document outlines the functional and technical specifications for SIRE TECH’s internal company management system's backend, built on the MERN (MongoDB, Express, Node.js) stack[cite: 20]. It serves as a blueprint for developers, testers, and anyone involved in the backend project lifecycle[cite: 21].

## 2. System Overview
The platform is divided into six major modules, with the backend primarily supporting their functionalities[cite: 39].

### Key Responsibilities of Backend Modules:
* **Project Management**: CRUD operations for projects; tracking status; storing project documentation links. [cite: 40]
* **Client Management (CRM)**: CRUD operations for clients; storing contact and organization details; assigning projects. [cite: 40]
* **Communication Hub**: Handling email (via SMTP provider) and WhatsApp messages (via Twilio or Meta Cloud API); logging communication threads. [cite: 40]
* **Quotation & Invoicing**: Generating quotations and invoices from project specs; version control; PDF export; CRUD operations. [cite: 40]
* **Payments**: Recording offline cash receipts; integrating Safaricom Daraja API for M-Pesa STK push; integrating Stripe for card payments; reconciling against invoices. [cite: 40]
* **Admin Dashboard**: Managing role-based access control, KPIs, audit logs, and system settings. [cite: 40]

## 3. Functional Requirements (Backend Focus)

### 3.1 Project Management
* The system shall allow authorized users to create a new project with title, description, client, start date, expected end date, and status[cite: 43].
* The system shall enable users to upload or link project documentation (Markdown, PDF, Docs)[cite: 43].
* Users shall be able to update and delete projects. Deleting requires admin confirmation[cite: 43].
* The project list shall support filtering by status and client[cite: 43].

### 3.2 Client Management (CRM)
* The system shall provide CRUD operations for client records (name, contact person, email, phone, WhatsApp number, address)[cite: 45].
* The system shall display all projects linked to a client in the client detail view[cite: 45].
* The system shall track communication history per client[cite: 45].

### 3.3 Communication
* The user shall be able to send an email to any client directly from the system, using predefined templates[cite: 47].
* The user shall be able to initiate a WhatsApp message via Twilio API or Meta Cloud API[cite: 47].
* All outgoing communication events shall be logged with timestamp, sender, channel, and status (queued, sent, failed)[cite: 47].

### 3.4 Quotation & Invoicing
* The system shall generate a quotation from project data with editable line items and VAT handling[cite: 49].
* The system shall convert an approved quotation into an invoice with a unique sequential number[cite: 49].
* Users shall be able to email PDFs of quotations/invoices to clients and record when they were sent[cite: 49].
* CRUD operations shall be supported on quotations and invoices; invoices can only be deleted if no payments attached[cite: 49].

### 3.5 Payments
* The system shall record cash payments with receipt number[cite: 51].
* The system shall initiate M-Pesa STK push for invoice settlement and update status via callback[cite: 51].
* The system shall process card payments using Stripe and match them to invoices[cite: 51].
* The system shall prevent over-payment and handle partial payments[cite: 51].

### 3.6 Admin & RBAC
* The system shall support roles: Admin, Accountant, Project Manager, Developer, Viewer[cite: 53].
* Permissions shall be configurable per role down to resource & action level[cite: 53].
* All critical actions shall be logged in an immutable audit log[cite: 53].

## 4. Non-Functional Requirements (Backend Focus)

| Category      | Requirement                                                                   |
| :------------ | :---------------------------------------------------------------------------- |
| Performance   | API responses $\leq$ 300 ms (p95) under 200 concurrent users. [cite: 55]      |
| Scalability   | Horizontal scaling for Node.js services and MongoDB replica set. [cite: 55]  |
| Availability  | $\ge$ 99.5 % monthly uptime for core services. [cite: 55]                     |
| Security      | OAuth 2.0 / JWT authentication; data encryption in transit (TLS 1.3) and at rest. [cite: 55] |
| Compliance    | Adhere to Kenya Data Protection Act 2019 and PCI DSS for card payments. [cite: 55] |
| Maintainability | Code coverage $\ge$ 80 % unit tests; ESLint & Prettier enforced. [cite: 55]|

## 5. System Architecture
The backend is built on a microservices architecture. [cite: 56]

```

┌───────────────────────────────┐        ┌──────────────────────────┐
│           Frontend           │        │  Admin Dashboard (SPA)   │
│   React 18  •  Next.js       │   Web  │  React + TailwindCSS     │
└─────────────┬────────────────┘        └────────────┬─────────────┘
│ REST/GraphQL                     │
┌─────────────▼────────────────┐        ┌────────────▼─────────────┐
│        API Gateway          │        │    Auth Service (JWT)    │
│  Express + Apollo Server    │  ⇄     │   Node.js + Passport     │
└─────────────┬────────────────┘        └────────────┬─────────────┘
│ Internal gRPC / REST               │
┌─────────────▼────────────────┐        ┌────────────▼─────────────┐
│ Project & Client Service     │        │     Billing Service      │
│ Node.js (NestJS)             │        │  Node.js (NestJS)        │
└─────────────┬────────────────┘        └────────────┬─────────────┘
│                                        │
┌───────▼────────┐                     ┌─────────▼──────────┐
│  MongoDB Atlas │                     │  Payment Gateways  │
│ (Replica Set)  │                     │  (Mpesa, Stripe)   │
└────────────────┘                     └────────────────────┘

```
[cite: 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75]

### Key Backend Technologies
* **Backend**: Node.js 20, Express/NestJS, GraphQL (Apollo), REST, TypeScript [cite: 78]
* **Database**: MongoDB Atlas with Mongoose ODM [cite: 79]
* **Messaging / Jobs**: BullMQ with Redis 7 [cite: 80]
* **Authentication**: JWT & Refresh tokens, optional SSO via Google OAuth2 [cite: 82]
* **CI/CD**: GitHub Actions $\rightarrow$ Docker $\rightarrow$ AWS ECS (Fargate) [cite: 81]

## 6. Data Model & Backend Summary

### 6.1 ER Overview

| Entity        | Important Fields                                             | Relationships                                    |
| :------------ | :----------------------------------------------------------- | :----------------------------------------------- |
| User          | `_id`, `name`, `email`, `role`, `passwordHash`, `isActive` | 1‑n Communication, 1‑n Project (as manager) [cite: 85] |
| Client        | `_id`, `orgName`, `contactName`, `email`, `phone`, `whatsapp`, `address` | 1‑n Project, 1‑n Invoice [cite: 85]               |
| Project       | `_id`, `title`, `description`, `status`, `startDate`, `endDate`, `clientId`, `managerId` | n‑1 Client, 1‑n ProjectDoc, 1‑n Invoice [cite: 85] |
| ProjectDoc    | `_id`, `projectId`, `docType`, `url`, `createdAt`            | n‑1 Project [cite: 85]                           |
| Quotation     | `_id`, `projectId`, `issueDate`, `expiryDate`, `items[]`, `subtotal`, `vat`, `total`, `status` | 1‑1 Invoice (after approval) [cite: 85]        |
| Invoice       | `_id`, `invoiceNo`, `projectId`, `clientId`, `issueDate`, `dueDate`, `total`, `balance`, `status` | n‑m Payments [cite: 85]                          |
| Payment       | `_id`, `invoiceId`, `amount`, `method` (Cash/Mpesa/Card), `reference`, `date`, `status` | n‑1 Invoice [cite: 85]                           |
| Communication | `_id`, `clientId`, `userId`, `channel` (Email/WhatsApp), `subject`, `body`, `status`, `timestamp` | n‑1 Client [cite: 85]                            |

### 6.2 Model Schema Summary (Mongoose)

| Model         | Collection    | Key Fields (Type & Constraints)                                                                                                              | Notable Indexes / Validation                                    |
| :------------ | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| User          | `users`       | `name:String(2‑50)`, `email:String(unique, lowercase)`, `passwordHash:String`, `role:Enum(Admin,Accountant,PM,Dev,Viewer)`, `isActive:Boolean(default true)`, `createdAt/updatedAt` | unique email; enum role [cite: 88]                              |
| Client        | `clients`     | `orgName:String(required)`, `contactName:String`, `email:String`, `phone:String`, `whatsapp:String`, `address:String`, `isActive:Boolean` | email (optional) unique [cite: 88]                              |
| Project       | `projects`    | `title:String(required)`, `description:String`, `status:Enum(Ongoing,Finished)`, `startDate:Date`, `endDate:Date`, `clientId:ObjectId→Client`, `managerId:ObjectId→User` | `clientId`, `managerId` indexed [cite: 88]                    |
| ProjectDoc    | `projectdocs` | `projectId:ObjectId→Project`, `docType:Enum(Markdown,PDF,Link)`, `url:String`, `createdAt:Date(default now)`                                | `projectId` index [cite: 88]                                    |
| Quotation     | `quotations`  | `projectId:ObjectId→Project`, `issueDate:Date`, `expiryDate:Date`, `items:[{desc:String,qty:Number,rate:Number}]`, `subtotal:Number`, `vat:Number`, `total:Number`, `status:Enum(Draft,Sent,Approved,Expired)` | `projectId` index [cite: 88]                                    |
| Invoice       | `invoices`    | `invoiceNo:String(unique)`, `projectId:ObjectId→Project`, `clientId:ObjectId→Client`, `issueDate:Date`, `dueDate:Date`, `total:Number`, `balance:Number`, `status:Enum(Unpaid,PartiallyPaid,Paid,Void)` | unique `invoiceNo` [cite: 88]                                   |
| Payment       | `payments`    | `invoiceId:ObjectId→Invoice`, `amount:Number`, `method:Enum(Cash,Mpesa,Card)`, `reference:String`, `date:Date`, `status:Enum(Pending,Confirmed,Failed)` | `invoiceId` index [cite: 88]                                    |
| Communication | `communications`| `clientId:ObjectId→Client`, `userId:ObjectId→User`, `channel:Enum(Email,WhatsApp)`, `subject:String`, `body:String`, `status:Enum(Queued,Sent,Failed)`, `timestamp:Date(default now)` | `clientId` index [cite: 88]                                     |

All schemas enable `timestamps:true` and export both the Mongoose model and a corresponding TypeScript interface for type‑safe service access[cite: 89].

### 6.3 Controller Responsibilities

| Controller          | Core Routes                                                              | Major Logic / Services                                             |
| :------------------ | :----------------------------------------------------------------------- | :----------------------------------------------------------------- |
| `AuthController`    | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | Argon2id hashing, JWT issue/revoke, refresh‑token rotation. [cite: 91] |
| `UserController`    | `GET /users`, `PUT /users/:id`, `DELETE /users/:id`                      | RBAC checks, soft‑delete, password reset email. [cite: 91]         |
| `ClientController`  | `CRUD /clients`                                                          | Duplicate email check, project aggregation, communication stats. [cite: 91] |
| `ProjectController` | `CRUD /projects`                                                         | Status transitions, attach docs, automatic progress % calc. [cite: 91] |
| `ProjectDocController` | `POST /projects/:id/docs`                                              | S3 presigned upload, MIME whitelist, versioning. [cite: 91]        |
| `CommunicationController` | `POST /communications/email`, `POST /communications/whatsapp`, `GET /communications` | Handlebars template render, BullMQ queue, webhook status updates. [cite: 91] |
| `QuotationController` | `CRUD /quotations`                                                       | Totals calc, PDF generation (Puppeteer), approval token link. [cite: 91] |
| `InvoiceController` | `CRUD /invoices`                                                         | Sequential number generator, PDF/email dispatch, overdue scheduler. [cite: 91] |
| `PaymentController` | `POST /invoices/:id/payments/mpesa`, `/card`, `POST /payments/callback` | STK push via Daraja, Stripe webhooks, balance reconciliation. [cite: 91] |
| `DashboardController` | `GET /dashboard/metrics`                                                 | KPI aggregation via MongoDB pipeline (revenue, active projects). [cite: 91] |
| `AdminController`   | `GET /audit`, `PATCH /settings`                                          | Immutable audit log query, global settings CRUD. [cite: 91]        |

Service Layer Pattern: Each controller delegates to a dedicated service (e.g., `InvoiceService`) to preserve single‑responsibility and facilitate unit testing[cite: 92].

## 7. API Specification (Excerpt)

### 7.1 Authentication

| Method | Endpoint               | Description                       |
| :----- | :--------------------- | :-------------------------------- |
| POST   | `/api/auth/register`   | Register a new internal user      |
| POST   | `/api/auth/login`      | Login & receive access/refresh tokens [cite: 96] |

### 7.2 Projects

| Method | Endpoint              | Description                           |
| :----- | :-------------------- | :------------------------------------ |
| GET    | `/api/projects`       | List projects (query params: status, client) [cite: 98] |
| POST   | `/api/projects`       | Create project [cite: 98]             |
| GET    | `/api/projects/:id`   | Get project by ID [cite: 98]          |
| PUT    | `/api/projects/:id`   | Update project [cite: 98]             |
| DELETE | `/api/projects/:id`   | Delete project [cite: 98]             |

### 7.3 Clients

| Method | Endpoint            | Description                   |
| :----- | :------------------ | :---------------------------- |
| GET    | `/api/clients`      | List clients [cite: 100]      |
| POST   | `/api/clients`      | Create client [cite: 100]     |
| PUT    | `/api/clients/:id`  | Update client [cite: 100]     |
| DELETE | `/api/clients/:id`  | Delete client [cite: 100]     |

### 7.4 Invoices & Payments

| Method | Endpoint                      | Description                           |
| :----- | :---------------------------- | :------------------------------------ |
| POST   | `/api/invoices`               | Create invoice [cite: 102]            |
| POST   | `/api/invoices/:id/payments/mpesa` | Trigger M‑Pesa STK push [cite: 102] |
| POST   | `/api/invoices/:id/payments/card` | Process Stripe payment [cite: 102]  |
| GET    | `/api/invoices/:id/payments`  | List payments for invoice [cite: 102] |

(A full Postman collection is maintained separately.) [cite: 103]

## 8. Security & Compliance
* Enforce least‑privilege RBAC. [cite: 116]
* Passwords hashed with Argon2id + unique salt. [cite: 117]
* All secrets stored in AWS Secrets Manager. [cite: 118]
* Webhooks (M‑Pesa, Stripe) validated with HMAC. [cite: 119]
* Quarterly vulnerability scans & penetration testing. [cite: 120]

## 9. Deployment & DevOps

| Stage       | Environment   | URL                           | Notes                              |
| :---------- | :------------ | :---------------------------- | :--------------------------------- |
| Development | AWS ECS (Dev) | `dev.api.siretech.co.ke`      | Auto‑deploys from `develop` branch [cite: 122] |
| Staging     | AWS ECS (Stg) | `stg.api.siretech.co.ke`      | QA sign‑off [cite: 122]            |
| Production  | AWS ECS (Prod)| `api.siretech.co.ke`          | Blue/green deployments [cite: 122] |

CI/CD uses GitHub Actions $\rightarrow$ Docker build $\rightarrow$ ECR push $\rightarrow$ ECS update[cite: 123].
Infrastructure codified with Terraform[cite: 124].

## 10. Testing Strategy

| Layer       | Tools                             | Targets                           |
| :---------- | :-------------------------------- | :-------------------------------- |
| Unit        | Jest, ts‑jest                     | Services, utility functions [cite: 126] |
| Integration | Supertest, mongodb‑memory‑server | API endpoints, data layer [cite: 126]   |
| E2E         | Playwright                        | Critical user journeys [cite: 126]      |
| Load        | k6                                | 200 concurrent users, 10 min soak [cite: 126] |
| Security    | OWASP ZAP, snyk                   | Dependency & runtime scans [cite: 126]    |

## 11. Future Enhancements (Backend Impact)
* BI dashboard integration (data aggregation)[cite: 128].
* Multi‑currency invoicing (backend logic for currency conversion and storage)[cite: 130].
* AI‑assisted project time estimation (backend model integration)[cite: 131].

## 12. Glossary

| Term      | Definition                                              |
| :-------- | :------------------------------------------------------ |
| MERN      | MongoDB, Express, React, Node.js. [cite: 133]          |
| Mpesa     | Kenyan mobile money transfer service by Safaricom. [cite: 133] |
| STK Push  | Mpesa payment flow that triggers a PIN prompt on user’s phone. [cite: 133] |
| RBAC      | Role‑Based Access Control. [cite: 133]                  |
| JWT       | JSON Web Token used for stateless authentication. [cite: 133] |
| CI/CD     | Continuous Integration / Continuous Deployment. [cite: 133] |

© 2025 SIRE TECH. All rights reserved. [cite: 134]
```