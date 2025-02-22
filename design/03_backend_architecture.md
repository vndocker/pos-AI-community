# Backend Architecture

## FastAPI Application Structure

```mermaid
graph TD
    subgraph "Main Application"
        Main[main.py]
        DB[database.py]
        Models[models.py]
        Schemas[schemas.py]
    end

    subgraph "Routers"
        Auth[auth.py]
        Products[products.py]
        Invoices[invoices.py]
        Health[health.py]
        Inventory[inventory.py]
    end

    subgraph "Workflows"
        AuthWF[auth_workflow.py]
        OrderWF[order_workflow.py]
    end

    subgraph "Activities"
        AuthAct[auth_activities.py]
        OrderAct[order_activities.py]
    end

    Main --> DB
    Main --> Models
    Main --> Schemas
    
    Main --> Auth
    Main --> Products
    Main --> Invoices
    Main --> Health
    Main --> Inventory
    
    Auth --> AuthWF
    Invoices --> OrderWF
    
    AuthWF --> AuthAct
    OrderWF --> OrderAct
```

## Database Schema

```mermaid
erDiagram
    Users ||--o{ Products : creates
    Users ||--o{ Invoices : generates
    Products ||--o{ InvoiceItems : contains
    Invoices ||--o{ InvoiceItems : includes
    
    Users {
        int id PK
        string email
        string hashed_password
        string full_name
        datetime created_at
        datetime updated_at
    }
    
    Products {
        int id PK
        string name
        float price
        int quantity
        string barcode
        int user_id FK
        datetime created_at
        datetime updated_at
    }
    
    Invoices {
        int id PK
        int user_id FK
        float total_amount
        string status
        datetime created_at
        datetime updated_at
    }
    
    InvoiceItems {
        int id PK
        int invoice_id FK
        int product_id FK
        int quantity
        float unit_price
        float total_price
    }
```

## Temporal Workflow Architecture

```mermaid
graph TB
    subgraph "Workflow Engine"
        Worker[Temporal Worker]
        Queue[Task Queue]
        History[Event History]
    end

    subgraph "Workflows"
        Auth[Authentication]
        Order[Order Processing]
        Inventory[Inventory Management]
    end

    subgraph "Activities"
        ValidateAuth[Validate Auth]
        ProcessPayment[Process Payment]
        UpdateStock[Update Stock]
        NotifyUser[Notify User]
    end

    Worker --> Queue
    Queue --> History
    
    Auth --> ValidateAuth
    Order --> ProcessPayment
    Order --> UpdateStock
    Order --> NotifyUser
    Inventory --> UpdateStock
```

## API Endpoints Structure

```mermaid
graph LR
    subgraph "Authentication"
        Login[/auth/login]
        Register[/auth/register]
        Profile[/auth/profile]
    end

    subgraph "Products"
        GetProducts[/products]
        CreateProduct[/products/create]
        UpdateProduct[/products/update]
        DeleteProduct[/products/delete]
    end

    subgraph "Invoices"
        CreateInvoice[/invoices/create]
        GetInvoices[/invoices]
        GetInvoice[/invoices/{id}]
    end

    subgraph "Inventory"
        UpdateStock[/inventory/update]
        CheckStock[/inventory/check]
    end
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Router
    participant W as Auth Workflow
    participant D as Database
    
    C->>A: POST /auth/login
    A->>W: Start Auth Workflow
    W->>D: Validate Credentials
    D-->>W: User Data
    W->>W: Generate JWT
    W-->>A: Auth Response
    A-->>C: Token + User Data
```

## Technical Implementation

### Core Technologies
- FastAPI 0.104.1
- SQLAlchemy 2.0.25
- Temporal.io
- Python 3.x
- SQLite

### Database Access
```mermaid
graph TD
    subgraph "Database Layer"
        Models[SQLAlchemy Models]
        Session[Database Session]
        Engine[SQLite Engine]
    end

    subgraph "Access Patterns"
        CRUD[CRUD Operations]
        Query[Query Builder]
        Trans[Transactions]
    end

    Models --> Session
    Session --> Engine
    CRUD --> Session
    Query --> Session
    Trans --> Session
```

### Error Handling

```mermaid
graph TD
    subgraph "Error Types"
        HTTP[HTTP Exceptions]
        DB[Database Errors]
        Auth[Auth Errors]
        Val[Validation Errors]
    end

    subgraph "Handlers"
        Global[Global Handler]
        Custom[Custom Handlers]
    end

    HTTP --> Global
    DB --> Custom
    Auth --> Custom
    Val --> Global
```

## Security Implementation

### Authentication & Authorization
- JWT token-based authentication
- Password hashing with passlib
- Role-based access control
- Session management

### Data Protection
- Input validation with Pydantic
- SQL injection prevention
- CORS configuration
- Rate limiting

## Development Tools
- uvicorn for ASGI server
- pytest for testing
- black for code formatting
- mypy for type checking

This architecture ensures:
- Clean separation of concerns
- Scalable workflow management
- Secure authentication and data handling
- Efficient database operations
- Maintainable codebase structure
