# Tech Stack Documentation

## Frontend

### Core Framework & Build Tools
- React 18 with TypeScript
- Vite for build tooling and development server
- TypeScript for type safety
- React Router for navigation

### UI & Styling
- Tailwind CSS for utility-first styling
- Material UI for core components
- Shadcn UI for enhanced components
- CSS Modules for component-specific styles

### State Management
- React Context API for global state
- Custom hooks for local state management
- React Query for server state management

### Forms & Validation
- React Hook Form for form management
- Zod for schema validation
- TypeScript for type checking

## Backend

### Core Framework
- FastAPI for REST API
- Python 3.11+
- Uvicorn as ASGI server

### Database & ORM
- MySQL 8.0.41
- SQLAlchemy as ORM
- Database migrations handling

### Authentication
- Clerk for authentication
- JWT token management
- Social login (Google, Facebook, Email)

### AI Integration
- Gemini API for:
  - Important report summary generation

## Infrastructure

### Deployment
- Cloudfare Pages for frontend hosting
- VPS with Debian 12.10 for database server (Standalone mode native Debian MySQL 8)
- FastAPI backend deployment by Coolify self-hosted on VPS with Debian 12.10

### Development Tools
- Git for version control
- GitHub for repository
- GitHub Actions for CI/CD
- ESLint & Prettier for code formatting
- Husky for git hooks

### Monitoring & Error Tracking
- Sentry for error tracking
- Basic analytics integration
- Performance monitoring

### Testing
- Jest for frontend testing
- Pytest for backend testing
- Cypress for E2E testing

## Security
- HTTPS enforcement
- Clerk security features
- API rate limiting
- Input validation
- SQL injection prevention