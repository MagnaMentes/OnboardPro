# OnboardPro Architecture
## Date: April 24, 2025
## Overview
OnboardPro is a web application for employee onboarding, built with a modern stack.

## Components
- **Backend**: FastAPI, Python, SQLite (/onboardpro/backend/onboardpro.db).
  - Handles authentication, user roles (HR, Manager, Employee), and business logic.
  - Key endpoint: `/users/me` for user info.
- **Frontend**: React, Tailwind CSS, Heroicons.
  - Replaces static HTML frontend for improved interactivity.
  - Features adaptive navigation, fixed footer, and role-based UI.
  - Pages: Login, Dashboard, Manager Dashboard, HR Dashboard, Feedback, Profiles, Integrations.
- **Infrastructure**: Docker, docker-compose.
  - Backend runs on port 8000, frontend on port 3000.
  - SQLite database persists in /onboardpro/backend.

## User Roles
- **HR**: Full access to all features
- **Manager**: Access to Dashboard, Manager Dashboard, Feedback, Profiles
- **Employee**: Access to Dashboard, Feedback

## UI Design
- **Adaptive Navigation**:
  - Ultrawide (≥1920px): Logo left, navigation (icons+text) right, content centered
  - Desktop (≥1280px): Logo left, navigation (icons+text) right
  - Tablet/Laptop (<1280px): Logo left, navigation (icons only) right
  - Mobile (<768px): Logo left, burger menu right, expandable navigation
- **Fixed Footer**: Copyright "© 2025 magna_mentes" at bottom
- **User Info**: Email and role displayed in header (≥1280px)

## Deployment
- Local development in Docker.
- Future: CI/CD with GitHub Actions, deployment to Render. 