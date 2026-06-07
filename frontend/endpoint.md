# API Endpoints Documentation

## System

### 1. System Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Auth Required**: No
- **Note**: Checks database and system connectivity.

---

## Auth Module (`/auth`)

### 1. User Signup
- **URL**: `/auth/signup`
- **Method**: `POST`
- **Auth Required**: No
- **Note**: Automatically creates Organization, Membership (as Owner), and seeds system permissions.
- **Body**:
```json
{
  "organizationName": "string",
  "organizationSlug": "string",
  "email": "user@example.com",
  "password": "minimum_8_characters",
  "firstName": "optional_string",
  "lastName": "optional_string"
}
```

### 2. User Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Headers**:
  - `user-agent`: (Optional) Used for session tracking
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### 3. Refresh Token
- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
  "refreshToken": "string"
}
```

### 4. Google Auth
- **URL**: `/auth/google`
- **Method**: `GET`
- **Auth Required**: No (Redirects to Google OAuth)

### 5. Google Auth Callback
- **URL**: `/auth/google/callback`
- **Method**: `GET`
- **Auth Required**: No (Handles Google OAuth response)

### 6. Get Profile
- **URL**: `/auth/profile`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

### 7. Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

---

## Sessions Module (`/sessions`)

### 1. List Active Sessions
- **URL**: `/sessions`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

### 2. Revoke All Sessions
- **URL**: `/sessions/all`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Note**: Revokes all sessions except the current one.

### 3. Revoke Specific Session
- **URL**: `/sessions/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

---

## Organizations Module (`/organizations`)

These endpoints are for administrative use by Organization Members and MUST be protected by a **Member JWT**.

- **Headers**:
  - `Authorization`: `Bearer <Member-JWT>`

### 1. List My Organizations
- **URL**: `/organizations`
- **Method**: `GET`
- **Auth Required**: Yes

### 2. Update Organization
- **URL**: `/organizations/:orgId`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Permissions Required**: `members.manage`
- **Body**:
```json
{
  "name": "New Organization Name"
}
```

### 3. Delete Organization
- **URL**: `/organizations/:orgId`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions Required**: `members.manage`

### 4. Invite Member
- **URL**: `/organizations/:orgId/invitations`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions Required**: `invitations.manage`
- **Body**:
```json
{
  "email": "invitee@example.com",
  "roleId": "uuid"
}
```

### 5. List Organization Members
- **URL**: `/organizations/:orgId/members`
- **Method**: `GET`
- **Auth Required**: Yes
- **Note**: Any organization member can view the member list.

### 6. Get Membership Details
- **URL**: `/organizations/:orgId/members/:membershipId`
- **Method**: `GET`
- **Auth Required**: Yes
- **Note**: Any organization member can view membership details.

### 7. Update Membership Status (Suspend/Activate)
- **URL**: `/organizations/:orgId/members/:membershipId`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Permissions Required**: `members.manage`
- **Body**:
```json
{
  "status": "ACTIVE | SUSPENDED"
}
```

### 8. Remove Member from Organization
- **URL**: `/organizations/:orgId/members/:membershipId`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions Required**: `members.manage`

---

## Roles Module (`/organizations/:orgId/roles`)

### 1. Create Role
- **URL**: `/organizations/:orgId/roles`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `roles.manage`
- **Body**:
```json
{
  "name": "string",
  "description": "optional_string",
  "permissionIds": ["uuid_array"]
}
```

### 2. List All Roles
- **URL**: `/organizations/:orgId/roles`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `roles.manage`

### 3. Update Role
- **URL**: `/organizations/:orgId/roles/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `roles.manage`
- **Body**:
```json
{
  "name": "optional_string",
  "description": "optional_string",
  "permissionIds": ["optional_uuid_array"]
}
```

### 4. Remove Role
- **URL**: `/organizations/:orgId/roles/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `roles.manage`

---

## Membership Roles Module

### 1. Assign Role to Membership
- **URL**: `/organizations/:orgId/memberships/:membershipId/roles`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `members.manage`
- **Body**:
```json
{
  "roleId": "uuid"
}
```

### 2. Remove Role from Membership
- **URL**: `/organizations/:orgId/memberships/:membershipId/roles/:roleId`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `members.manage`

---

## Audit Logs Module (`/organizations/:orgId/audit-logs`)

### 1. List Audit Logs
- **URL**: `/organizations/:orgId/audit-logs`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `audit_logs.view`
- **Query Parameters**:
  - `limit`: (Optional) Default 50
  - `offset`: (Optional) Default 0

---

## End-User Auth Module (`/apps/:slug/auth`)

These endpoints are designed for client-side integration (React, Mobile, etc.) and MUST be protected by the **Publishable API Key**.

- **Headers**:
  - `x-api-key`: `pk_live_xxxxx` (Publishable Key)

### 1. End-User Signup
- **URL**: `/apps/:slug/auth/signup`
- **Method**: `POST`
- **Auth Required**: No (API Key Required)
- **Body**:
```json
{
  "email": "enduser@example.com",
  "password": "minimum_8_characters"
}
```

### 2. End-User Login
- **URL**: `/apps/:slug/auth/login`
- **Method**: `POST`
- **Auth Required**: No (API Key Required)
- **Body**:
```json
{
  "email": "enduser@example.com",
  "password": "password"
}
```

### 3. End-User Refresh Token
- **URL**: `/apps/:slug/auth/refresh`
- **Method**: `POST`
- **Auth Required**: No (API Key Required)
- **Body**:
```json
{
  "refreshToken": "string"
}
```

---

## Applications Module (`/organizations/:orgId/applications`)

### 1. Create Application
- **URL**: `/organizations/:orgId/applications`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`
- **Body**:
```json
{
  "name": "string",
  "slug": "lowercase-alphanumeric-with-hyphens",
  "description": "optional_string"
}
```

### 2. List Applications
- **URL**: `/organizations/:orgId/applications`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Note**: Any organization member can view applications.

### 3. Get Application Details
- **URL**: `/organizations/:orgId/applications/:appId`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Note**: Any organization member can view application details.

### 4. Update Application
- **URL**: `/organizations/:orgId/applications/:appId`
- **Method**: `PATCH`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`
- **Body**:
```json
{
  "name": "optional_string",
  "description": "optional_string"
}
```

### 5. Delete Application
- **URL**: `/organizations/:orgId/applications/:appId`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`

---

## Application User Management (Dashboard Scoped)

These endpoints allow organization members to manage application end-users.

### 1. List Application Users
- **URL**: `/organizations/:orgId/applications/:appId/users`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Note**: Any organization member can view application users.

### 2. Remove Application User
- **URL**: `/organizations/:orgId/applications/:appId/users/:userId`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`

---

## API Keys Module (`/organizations/:orgId/applications/:appId/api-keys`)

### 1. Create API Key
- **URL**: `/organizations/:orgId/applications/:appId/api-keys`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`
- **Body**:
```json
{
  "name": "string"
}
```

### 2. List API Keys
- **URL**: `/organizations/:orgId/applications/:appId/api-keys`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`

### 3. Revoke API Key
- **URL**: `/organizations/:orgId/applications/:appId/api-keys/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`

---

## Application Roles Module (`/organizations/:orgId/applications/:appId/roles`)

### 1. Create Application Role
- **URL**: `/organizations/:orgId/applications/:appId/roles`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`
- **Body**:
```json
{
  "name": "string",
  "description": "optional_string"
}
```

### 2. List Application Roles
- **URL**: `/organizations/:orgId/applications/:appId/roles`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`

### 3. Assign Application Role to End-User
- **URL**: `/organizations/:orgId/applications/:appId/roles/assignments/:userId`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`
- **Body**:
```json
{
  "roleId": "uuid"
}
```

### 4. Unassign Application Role from End-User
- **URL**: `/organizations/:orgId/applications/:appId/roles/assignments/:userId/:roleId`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`

### 5. Remove Application Role
- **URL**: `/organizations/:orgId/applications/:appId/roles/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `applications.manage`

---

## Server-Side Management APIs

These endpoints are designed for server-to-server communication and MUST be protected by the **Secret API Key**.

- **Headers**:
  - `x-api-key`: `sk_live_xxxxx` (Secret Key)

### 1. List Application Users
- **URL**: `/:applicationSlug/users`
- **Method**: `GET`
- **Auth Required**: No (Secret API Key Required)

### 2. Create Application User (Admin)
- **URL**: `/:applicationSlug/users`
- **Method**: `POST`
- **Auth Required**: No (Secret API Key Required)

### 3. Update Application User
- **URL**: `/:applicationSlug/users/:id`
- **Method**: `PATCH`
- **Auth Required**: No (Secret API Key Required)

### 4. Delete Application User
- **URL**: `/:applicationSlug/users/:id`
- **Method**: `DELETE`
- **Auth Required**: No (Secret API Key Required)

### 5. Bulk Import Users
- **URL**: `/:applicationSlug/users/bulk`
- **Method**: `POST`
- **Auth Required**: No (Secret API Key Required)
