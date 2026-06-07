<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

 # AuthForge Backend

The core engine of AuthForge, a high-performance, multi-tenant Identity & Access Management (IAM) platform. Built with **NestJS**, **Prisma (PostgreSQL)**, and **Redis**.

## 🚀 Key Features

- **Multi-Tenant Architecture**: Isolate data between organizations and applications seamlessly.
- **Smart Ownership**: Membership-level `isOwner` flag for instant, robust administrative access.
- **Simplified Application Roles**: Create and assign roles (e.g., "Agent", "Banker") to end-users without complex permission mapping.
- **Secure API Key Management**: Hash-protected Publishable and Secret keys for client and server integrations.
- **Automated Seeding**: Permissions are automatically seeded on container startup via Docker.
- **Comprehensive Swagger UI**: Fully documented API with interactive testing.
- **Immuntable Audit Logs**: Track every sensitive action within your organization.

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Caching & Sessions**: [Redis](https://redis.io/)
- **Validation**: [class-validator](https://github.com/typestack/class-validator)
- **Documentation**: [Swagger (OpenAPI)](https://swagger.io/)

## 🚦 Getting Started

### Prerequisites
- Node.js (v22+)
- Docker & Docker Compose

### Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env` and update the values.

3. **Database Migration & Seeding**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run the Server**:
   ```bash
   npm run start:dev
   ```

### Docker Usage
The backend is configured to handle migrations and permission seeding automatically:
```bash
docker-compose up -d --build
```

## 📚 API Documentation

Once the server is running, access the interactive Swagger documentation at:
`http://localhost:3000/docs`

### Permission Catalog
Management permissions (for organization members) are categorized by:
- `Authentication`: Signup, Login, Logout
- `Organizations`: Created, Updated, Deleted
- `Members`: Invited, Accepted, Suspended, Removed
- `Roles`: Created, Updated, Deleted, Assigned
- `Applications`: Created, Updated, Deleted
- `API Keys`: Created, Revoked
- `Application Roles`: Created, Updated, Deleted, Assigned, Unassigned
- `Audit Logs`: Read
- `Permissions`: Read
- `Sessions`: Revoked

## 🧪 Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```

## 📂 Project Structure

- `src/api-keys`: API Key lifecycle management.
- `src/applications`: Multi-tenant application and role management.
- `src/auth`: Member authentication and Google OAuth.
- `src/common`: Guards, decorators, filters, and shared constants.
- `src/end-users`: Application-specific user authentication and roles.
- `src/organizations`: Team management and invitation system.
- `src/sessions`: Member and End-user session tracking.
- `src/audit`: Immutable logging system.
