# Technical Context

## Technology Stack

### Frontend
1. **Core Technologies**
   - React 19.0.0
   - React Router DOM 7.1.5
   - Material-UI (MUI) 6.4.3
   - Emotion (CSS-in-JS) 11.14.0

2. **UI Components**
   - MUI Data Grid 7.25.0
   - MUI Icons
   - Roboto Font

3. **Functionality**
   - ZXing (Barcode/QR scanning) 0.21.3
   - Axios 1.7.9 (HTTP client)

4. **Development Tools**
   - Create React App
   - React Scripts 5.0.1
   - ESLint

### Backend
1. **Core Technologies**
   - FastAPI 0.104.1
   - Uvicorn 0.24.0 (ASGI server)
   - Python 3.x
   - Temporal.io (Workflow orchestration)

2. **Database**
   - SQLAlchemy 2.0.25 (ORM)
   - aiosqlite 0.19.0
   - SQLite (Database)

3. **API & Data**
   - Pydantic 2.7.4 (Data validation)
   - python-multipart 0.0.6
   - Jinja2 3.1.2 (Template engine)
   - temporalio (Python SDK)

4. **Security**
   - python-jose 3.3.0 (JWT)
   - passlib 1.7.4 (Password hashing)

5. **Workflow Management**
   - Temporal Server
   - Workflow definitions
   - Activity implementations
   - Error handling and retries

## Development Setup

### Frontend Setup
```bash
# Install dependencies
npm install

# Development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Unix
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start Temporal server (requires Docker)
docker run --network host temporalio/temporal:latest

# Run Temporal worker (in a separate terminal)
python -m app.worker

# Run development server
uvicorn app.main:app --reload
```

## Technical Constraints

### Frontend
1. **Browser Support**
   - Modern browsers (Chrome, Firefox, Safari)
   - Progressive enhancement for older browsers
   - Mobile browser optimization

2. **Performance**
   - Client-side rendering
   - Optimized bundle size
   - Responsive design requirements

3. **PWA Requirements**
   - Service worker implementation
   - Offline functionality
   - Local storage management

### Backend
1. **Database**
   - SQLite for local storage
   - Async database operations
   - Data migration support

2. **API**
   - RESTful endpoints
   - JSON response format
   - JWT authentication
   - Rate limiting considerations

3. **Security**
   - Password hashing
   - Token-based authentication
   - Input validation
   - CORS configuration

4. **Workflow**
   - Type-safe workflow definitions
   - Activity timeout configuration
   - Retry policies
   - State persistence
   - Error handling strategies

## Dependencies
All dependencies are managed through:
- Frontend: package.json (npm)
- Backend: requirements.txt (pip)

Regular updates and security patches should be monitored and applied as needed.
