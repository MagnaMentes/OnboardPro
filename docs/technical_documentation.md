# OnboardPro Technical Documentation
## © 2025 magna_mentes. All rights reserved.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Development Environment](#development-environment)
3. [Backend API](#backend-api)
4. [Frontend Implementation](#frontend-implementation)
5. [Database Schema](#database-schema)
6. [Deployment](#deployment)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)

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
  - `ManagerDashboard.js`: Manager interface for task and plan management
- `context/`: React context providers
- `hooks/`: Custom React hooks
- `utils/`: Utility functions

### Responsive Design
- Desktop (≥1280px): Full navigation with icons and text
- Tablet (≥768px, <1280px): Icons-only navigation
- Mobile (<768px): Burger menu navigation

### State Management
- React Context API for global state
- Local component state for UI elements
- Form state management with controlled components

## Database Schema

### Users Table
- `id`: Primary key
- `email`: User email (unique)
- `password_hash`: Hashed password
- `role`: User role (HR, Manager, Employee)
- `department`: User department
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

### Logs
- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`

### Support
For technical support, contact the development team at support@onboardpro.com 