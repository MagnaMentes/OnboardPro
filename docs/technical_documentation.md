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

## Development Environment

### Prerequisites
- Docker and Docker Compose
- Node.js (v16+) and npm
- Python 3.9+

### Setup Instructions
1. Clone the repository
2. Run `docker-compose up -d` to start the containers
3. Access the application at http://localhost:3000
4. Run `./frontend/validate_setup.sh` to verify the setup

### Environment Variables
- `DATABASE_URL`: SQLite database path
- `SECRET_KEY`: JWT secret key
- `FRONTEND_URL`: Frontend application URL

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
- `assigned_to`: User ID (foreign key)
- `assigned_by`: User ID (foreign key)
- `status`: Task status
- `due_date`: Due date
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
1. Build the Docker images: `docker-compose build`
2. Start the containers: `docker-compose up -d`
3. Access the application at http://localhost:3000

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

## Troubleshooting

### Common Issues
- **Database Connection**: Check DATABASE_URL environment variable
- **Authentication**: Verify JWT secret key
- **Frontend Build**: Check npm dependencies
- **Docker Issues**: Verify Docker and docker-compose installation

### Logs
- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Database logs: `docker-compose logs db`

### Support
For technical support, contact the development team at support@onboardpro.com 