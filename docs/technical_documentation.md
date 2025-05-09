# OnboardPro Technical Documentation

## © 2025 magna_mentes. All rights reserved.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Development Environment](#development-environment)
3. [Backend API](#backend-api)
4. [Frontend Implementation](#frontend-implementation)
5. [Database Schema](#database-schema)
6. [Database Migrations](#database-migrations)
7. [Deployment](#deployment)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

## System Architecture

OnboardPro follows a modern web application architecture:

- **Backend**: FastAPI (Python) with SQLite database
- **Frontend**: React with Tailwind CSS and Heroicons
- **Infrastructure**: Docker and docker-compose for containerization
- **Authentication**: JWT-based authentication system
- **External Integrations**: Telegram Bot, Google Calendar, Workable API

## Development Environment

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+) and npm
- Python 3.11+

### Setup Instructions

1. Clone the repository
2. Create a `.env` file with required environment variables
3. Run `docker-compose up -d` to start the containers
4. Access the application at http://localhost:3000

### Environment Variables

Required environment variables:

- `DATABASE_URL`: SQLite database path (default: sqlite:///onboardpro.db)
- `SECRET_KEY`: JWT secret key for authentication
- `TELEGRAM_BOT_TOKEN`: Telegram Bot API token
- `GOOGLE_CREDENTIALS_PATH`: Path to Google API credentials file
- `WORKABLE_API_KEY`: Workable API key for recruitment integration

Frontend environment variables:

- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:8000)

## Backend API

### Authentication Endpoints

- `POST /auth/login`: User login
- `POST /auth/refresh`: Refresh JWT token
- `GET /users/me`: Get current user information

### User Management

- `GET /users`: List all users (HR only)
- `POST /users`: Create new user (HR only)
- `PUT /users/{id}`: Update user (HR only)
- `DELETE /users/{id}`: Delete user (HR only)

### Task Management

- `GET /tasks`: List tasks
- `POST /tasks`: Create task
- `PUT /tasks/{id}`: Update task
- `DELETE /tasks/{id}`: Delete task

### Plan Management

- `GET /plans`: List adaptation plans
- `POST /plans`: Create new plan
- `PUT /plans/{id}`: Update plan
- `DELETE /plans/{id}`: Delete plan

### Feedback

- `GET /feedback`: List feedback
- `POST /feedback`: Create feedback
- `PUT /feedback/{id}`: Update feedback
- `DELETE /feedback/{id}`: Delete feedback

## Frontend Implementation

### Component Structure

- `App.js`: Main application component
- `components/`: Reusable UI components
- `pages/`: Page components
  - `ManagerDashboard.jsx`: Manager interface with two main sections:
    - Task Management: Create and manage tasks with modal forms
    - Plan Management: Create and manage adaptation plans with modal forms
- `context/`: React context providers
- `hooks/`: Custom React hooks
- `utils/`: Utility functions

### UI/UX Design

- **Modal Windows**: Forms for creating tasks and plans are displayed in modal windows
- **Section Organization**: Content is organized into logical sections with clear headers
- **Responsive Design**:
  - Desktop (≥1280px): Full navigation with icons and text
  - Tablet (≥768px, <1280px): Icons-only navigation
  - Mobile (<768px): Burger menu navigation
- **Visual Hierarchy**:
  - Clear section headers
  - Consistent button styling
  - Color-coded status indicators
  - Intuitive table layouts

### State Management

- React Context API for global state
- Local component state for UI elements:
  - Modal visibility states
  - Form input states
  - Loading and error states
- Form state management with controlled components

## Database Schema

### Users Table

- `id`: Primary key
- `email`: User email (unique)
- `password_hash`: Hashed password
- `role`: User role (HR, Manager, Employee)
- `department`: User department
- `first_name`: User first name
- `last_name`: User last name
- `middle_name`: User middle name
- `phone`: User phone number in the format +380 XX XXX XX XX
- `disabled`: User blocking flag (true/false)
- `photo`: Path to user photo (updated on 28.04.2025)
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

### Tasks Table

- `id`: Primary key
- `title`: Task title
- `description`: Task description
- `user_id`: Assigned user ID (foreign key)
- `plan_id`: Plan ID (foreign key)
- `priority`: Task priority (low, medium, high)
- `status`: Task status
- `deadline`: Due date
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

### Plans Table

- `id`: Primary key
- `title`: Plan title
- `description`: Plan description
- `role`: Target role (employee, manager)
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

### Feedback Table

- `id`: Primary key
- `content`: Feedback content
- `from_user`: User ID (foreign key)
- `to_user`: User ID (foreign key)
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

## Database Migrations

### Using Alembic

Alembic is used to manage the database schema:

- **Migration Initialization**: Migrations are already initialized in the project
- **Configuration**: Settings are in the `alembic.ini` file
- **Creating Migrations**: `alembic revision --autogenerate -m "change description"`
- **Applying Migrations**: `alembic upgrade head`
- **Rolling Back Migrations**: `alembic downgrade -1`
- **Migration History**: `alembic history`

### Migration Structure

- `backend/migrations/env.py`: Migration environment configuration
- `backend/migrations/versions/`: Directory with migration files
- `backend/alembic.ini`: Main Alembic configuration file

### Database Resilience Mechanisms

To ensure stable database operation, the following mechanisms have been implemented:

- **DB Structure Check at Startup**: The `start.sh` script checks for the presence of required tables and fields
- **Direct DB Update**: The `direct_db_update.py` script for emergency database structure updates when migrations fail
- **Multi-level Update Approach**:
  1. Standard migration process through Alembic
  2. Direct DB update in case of migration failures
  3. Emergency creation of missing tables and fields using SQLite tools

### Model-DB Validation

The `validate_db_models.py` tool allows you to:

- Check if the DB structure matches the SQLAlchemy models
- Identify missing columns and tables
- Get recommendations for solving problems

## Deployment

### Docker Deployment

1. Create `.env` file with required environment variables
2. Build the Docker images: `docker-compose build`
3. Start the containers: `docker-compose up -d`
4. Access the application at http://localhost:3000

### Container Configuration

- Backend container:
  - Health check endpoint: `/health`
  - Automatic restart policy: `unless-stopped`
  - Volume mounts for development
- Frontend container:
  - Development server on port 3000
  - Automatic restart policy: `unless-stopped`
  - Volume mounts for development
  - Node modules volume for performance

### Production Deployment

1. Set up a production server
2. Configure environment variables
3. Build and deploy the Docker containers
4. Set up a reverse proxy (Nginx recommended)
5. Configure SSL certificates

## Security Considerations

### Authentication

- JWT tokens with expiration
- Password hashing with bcrypt
- Role-based access control

### Data Protection

- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

### API Security

- Rate limiting
- Request validation
- Error handling
- Environment variable protection

## Troubleshooting

### Common Issues

- **Environment Variables**: Ensure all required variables are set in `.env`
- **Database Connection**: Check DATABASE_URL environment variable
- **Authentication**: Verify JWT secret key
- **Frontend Build**: Check npm dependencies
- **Docker Issues**: Verify Docker and docker-compose installation

### Authentication and Photo Handling Issues

- **Error 500 during authentication**: The database structure might not match the model:
  1. Check server logs for errors like `no such column`
  2. Run the `validate_db_models.py` script to check the correspondence between models and DB
  3. If necessary, restart containers with `docker-compose down && docker-compose up -d`
  4. For persistent issues, use manual database update: `python direct_db_update.py`
- **Problems with photo uploads**:
  1. Ensure the `static/photos` directory exists and is writable
  2. Verify that the `photo` field is correctly defined in the model and exists in the database
  3. If necessary, apply a migration to add the field: `alembic upgrade head`

### React Component Issues

- **Infinite update loop in Manager Dashboard**: If the page becomes unresponsive and navigation stops working:

  1. Check browser console for `Maximum update depth exceeded` errors
  2. Verify dependency arrays in useEffect hooks, removing state variables that change during the effect
  3. Ensure proper props are passed to modal components with correct names
  4. Validate that all required props are provided to components
  5. Fix component parameter mismatches between declaration and usage

- **Modal component errors**:
  1. Ensure React hooks are called at the top level, not inside conditionals
  2. Verify that the component receives all required props
  3. Check for circular dependencies in component state updates
  4. Use React Developer Tools to inspect component props and state

### Logs

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`

### Support

For technical support, contact the development team at support@onboardpro.com
