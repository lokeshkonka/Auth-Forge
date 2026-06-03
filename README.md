# Auth Forge 
Description : Production-inspired Identity & Access Management (IAM) system implementing OAuth2, JWT, RBAC, MFA, session management, and audit trails using NestJS, PostgreSQL, Redis, and Docker.

## Architecture & Features

![Tech Stack](./Docs/Tech-Stack.png)

![Overall Authentication Features](./Docs/Overall-Authentication-Features.png)

![Authentication Features 1](./Docs/Authentication-Features1.png)

![Authentication Features 2](./Docs/Authentication-Features2.png)

## Authentication Management
- Based on 2 Sections
  - Our Customer
  - Customer's Application User


# File Structure (Tentative)
``` bash
backend/

src/
├── main.ts
├── app.module.ts
│
├── auth/
├── organizations/
├── members/
├── applications/
├── api-keys/
├── end-users/
├── sessions/
├── roles/
├── permissions/
├── audit/
│
├── common/
└── database/

test/

```

## Authorization Management Features

![Authorization Features](./Docs/Authorization-features.png)

## Permission Management  

![Permission Management](./Docs/Permission-management.png)