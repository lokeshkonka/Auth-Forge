# API Endpoints Documentation

## System

### 1. System Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Auth Required**: No
- **Note**: Checks database and system connectivity.

---

## Auth Module (`/auth`)

### 1. Health Check
- **URL**: `/auth/health`
- **Method**: `GET`
- **Auth Required**: No

### 2. User Signup
- **URL**: `/auth/signup`
- **Method**: `POST`
- **Auth Required**: No
- **Note**: Automatically creates Organization, Membership, Owner Role, and assigns all permissions to the owner.
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

### 3. User Login
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

### 4. Refresh Token
- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
  "refreshToken": "string"
}
```

### 5. Google Auth
- **URL**: `/auth/google`
- **Method**: `GET`
- **Auth Required**: No (Redirects to Google OAuth)

### 6. Google Auth Callback
- **URL**: `/auth/google/callback`
- **Method**: `GET`
- **Auth Required**: No (Handles Google OAuth response)

### 7. Get Profile
- **URL**: `/auth/profile`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

### 8. List Sessions (Auth Controller)
- **URL**: `/auth/sessions`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

### 9. Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

### 10. Delete Session (Auth Controller)
- **URL**: `/auth/sessions/:id`
- **Method**: `DELETE`
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

## Invitations Module (`/invitations` & `/organizations/:orgId/invitations`)

### 1. Accept Invitation
- **URL**: `/invitations/accept`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Body**:
```json
{
  "token": "string"
}
```

### 2. List Pending Invitations (Organization Scoped)
- **URL**: `/organizations/:organizationId/invitations`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `invitation.read`

### 3. Revoke Invitation (Organization Scoped)
- **URL**: `/organizations/:organizationId/invitations/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `invitation.delete`

---

## Roles Module (`/organizations/:orgId/roles`)

### 1. Create Role
- **URL**: `/organizations/:orgId/roles`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
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

### 3. Get Role Details
- **URL**: `/organizations/:orgId/roles/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

### 4. Update Role
- **URL**: `/organizations/:orgId/roles/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Body**:
```json
{
  "name": "optional_string",
  "description": "optional_string",
  "permissionIds": ["optional_uuid_array"]
}
```

### 5. Remove Role
- **URL**: `/organizations/:orgId/roles/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

---

## Organizations Module (`/organizations`)

### 1. List My Organizations
- **URL**: `/organizations`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

### 2. Invite Member
- **URL**: `/organizations/:orgId/invitations`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `member.invite`
- **Body**:
```json
{
  "email": "invitee@example.com",
  "roleId": "uuid"
}
```

### 3. List Organization Members
- **URL**: `/organizations/:orgId/members`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `member.read`

### 4. Get Membership Details
- **URL**: `/organizations/:orgId/members/:membershipId`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `member.read`

### 5. Update Membership Status (Suspend/Activate)
- **URL**: `/organizations/:orgId/members/:membershipId`
- **Method**: `PATCH`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `member.update`
- **Body**:
```json
{
  "status": "ACTIVE | SUSPENDED"
}
```

### 6. Remove Member from Organization
- **URL**: `/organizations/:orgId/members/:membershipId`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `member.delete`

### 7. Assign Role to Membership
- **URL**: `/organizations/:orgId/memberships/:membershipId/roles`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `role.assign`
- **Body**:
```json
{
  "roleId": "uuid"
}
```

### 8. Remove Role from Membership
- **URL**: `/organizations/:orgId/memberships/:membershipId/roles/:roleId`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `role.assign`

---

## Permissions Module

### 1. List All Permissions (Grouped)
- **URL**: `/permissions`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)

---

## End-User Auth Module (`/applications/:appId/auth`)

### 1. End-User Signup
- **URL**: `/applications/:appId/auth/signup`
- **Method**: `POST`
- **Auth Required**: No (Scoped to `appId`)
- **Body**:
```json
{
  "email": "enduser@example.com",
  "password": "minimum_8_characters"
}
```

### 2. End-User Login
- **URL**: `/applications/:appId/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
  "email": "enduser@example.com",
  "password": "password"
}
```

### 3. End-User Refresh Token
- **URL**: `/applications/:appId/auth/refresh`
- **Method**: `POST`
- **Auth Required**: No
- **Body**:
```json
{
  "refreshToken": "string"
}
```

### 4. End-User Get Profile
- **URL**: `/applications/:appId/auth/profile`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <EndUser-JWT>`)

### 5. End-User Logout
- **URL**: `/applications/:appId/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <EndUser-JWT>`)

### 6. List End-User Sessions
- **URL**: `/applications/:appId/auth/sessions`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <EndUser-JWT>`)

---

## Application Roles Module (`/organizations/:orgId/applications/:appId/roles`)

### 1. Create Application Role
- **URL**: `/organizations/:orgId/applications/:appId/roles`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_role.create`
- **Body**:
```json
{
  "name": "string",
  "description": "optional_string",
  "permissionIds": ["uuid_array"]
}
```

### 2. List Application Roles
- **URL**: `/organizations/:orgId/applications/:appId/roles`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_role.read`

### 3. Get Application Role Details
- **URL**: `/organizations/:orgId/applications/:appId/roles/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_role.read`

### 4. Update Application Role
- **URL**: `/organizations/:orgId/applications/:appId/roles/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_role.update`
- **Body**:
```json
{
  "name": "optional_string",
  "description": "optional_string",
  "permissionIds": ["optional_uuid_array"]
}
```

### 5. Remove Application Role
- **URL**: `/organizations/:orgId/applications/:appId/roles/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_role.delete`

### 6. Assign Role to End-User
- **URL**: `/organizations/:orgId/applications/:appId/roles/assignments/:userId`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_role.assign`
- **Body**:
```json
{
  "roleId": "uuid"
}
```

### 7. Unassign Role from End-User
- **URL**: `/organizations/:orgId/applications/:appId/roles/assignments/:userId/:roleId`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_role.assign`

---

## Application Permissions Module (`/organizations/:orgId/applications/:appId/permissions`)

### 1. Create Application Permission
- **URL**: `/organizations/:orgId/applications/:appId/permissions`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_permission.create`
- **Body**:
```json
{
  "name": "string",
  "description": "optional_string"
}
```

### 2. List Application Permissions
- **URL**: `/organizations/:orgId/applications/:appId/permissions`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_permission.read`

### 3. Remove Application Permission
- **URL**: `/organizations/:orgId/applications/:appId/permissions/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <Member-JWT>`)
- **Permissions Required**: `app_permission.delete`

---

## Audit Module

### 1. List Audit Logs
- **URL**: `/organizations/:orgId/audit-logs`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `audit.read`
- **Query Parameters**:
  - `limit`: (Optional) Number of logs to return (default: 50)
  - `offset`: (Optional) Number of logs to skip (default: 0)

---

## Applications Module (`/organizations/:orgId/applications`)

### 1. Create Application
- **URL**: `/organizations/:orgId/applications`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `application.create`
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
- **Permissions Required**: `application.read`

### 3. Get Application Details
- **URL**: `/organizations/:orgId/applications/:id`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `application.read`

### 4. Update Application
- **URL**: `/organizations/:orgId/applications/:id`
- **Method**: `PATCH`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `application.update`
- **Body**:
```json
{
  "name": "optional_string",
  "description": "optional_string"
}
```

### 5. Delete Application
- **URL**: `/organizations/:orgId/applications/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `application.delete`

---

## API Keys Module (`/organizations/:orgId/applications/:appId/api-keys`)

### 1. Create API Key
- **URL**: `/organizations/:orgId/applications/:appId/api-keys`
- **Method**: `POST`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `apikey.create`
- **Body**:
```json
{
  "name": "string"
}
```
- **Response**: Includes the `rawKey` which is shown only once.

### 2. List API Keys
- **URL**: `/organizations/:orgId/applications/:appId/api-keys`
- **Method**: `GET`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `apikey.read`

### 3. Revoke API Key
- **URL**: `/organizations/:orgId/applications/:appId/api-keys/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`Authorization: Bearer <JWT>`)
- **Permissions Required**: `apikey.delete`
