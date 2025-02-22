# System Architecture Overview

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend (React PWA)"
        UI[User Interface]
        SW[Service Worker]
        LC[Local Cache]
        UI --> SW
        UI --> LC
    end

    subgraph "Backend (FastAPI)"
        API[API Layer]
        WF[Temporal Workflows]
        DB[(SQLite Database)]
        API --> WF
        WF --> DB
    end

    UI --"HTTP/REST"--> API
    SW --"Background Sync"--> API
    LC --"Offline Data"--> UI
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant C as Cache/PWA
    participant A as API
    participant W as Workflow
    participant D as Database

    U->>F: Interact with UI
    alt Online Mode
        F->>A: API Request
        A->>W: Start Workflow
        W->>D: Database Operation
        D-->>W: Data Response
        W-->>A: Workflow Result
        A-->>F: API Response
        F->>C: Update Cache
    else Offline Mode
        F->>C: Read/Write Data
        C-->>F: Cached Response
        Note over C: Background Sync<br/>when online
    end
    F-->>U: Update UI
```

## Component Integration

```mermaid
graph LR
    subgraph "Frontend Components"
        POS[POS Page]
        Inv[Inventory]
        Prof[Profile]
        Cam[Camera Modal]
        Auth[Auth Context]
        
        POS --> Cam
        POS --> Auth
        Inv --> Auth
        Prof --> Auth
    end

    subgraph "Backend Services"
        Products[Products API]
        Orders[Orders API]
        Users[Users API]
        WF[Workflows]
        
        Products --> WF
        Orders --> WF
        Users --> WF
    end

    POS --> Products
    POS --> Orders
    Prof --> Users
    Inv --> Products
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant D as Database

    U->>F: Login Request
    F->>A: POST /auth/login
    A->>D: Validate Credentials
    D-->>A: User Data
    A-->>F: JWT Token
    F->>F: Store Token
    F-->>U: Redirect to POS
```

## Key Features & Technologies

### Frontend
- React 19.0.0 with Material-UI
- PWA capabilities for offline functionality
- Service worker for background sync
- Local storage for offline data persistence
- Responsive design for all devices

### Backend
- FastAPI for REST API endpoints
- Temporal.io for workflow orchestration
- SQLite database with SQLAlchemy ORM
- JWT authentication
- Background task processing

### Integration Points
- RESTful API communication
- JWT token-based authentication
- Background synchronization
- File upload/download handling
- Real-time updates (where applicable)

## Security Measures

```mermaid
graph TD
    subgraph "Security Layer"
        JWT[JWT Authentication]
        Hash[Password Hashing]
        Val[Input Validation]
        CORS[CORS Policy]
        
        JWT --> Val
        Hash --> Val
        CORS --> Val
    end

    subgraph "Data Protection"
        Enc[Data Encryption]
        Backup[Data Backup]
        Sync[Sync Protocol]
        
        Enc --> Sync
        Backup --> Sync
    end
```

This architecture ensures:
- Secure authentication and authorization
- Reliable offline functionality
- Scalable workflow management
- Efficient data synchronization
- Responsive user experience across devices
