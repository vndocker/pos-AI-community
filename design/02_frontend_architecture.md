# Frontend Architecture

## Component Hierarchy

```mermaid
graph TD
    subgraph "App Structure"
        App[App.jsx]
        Layout[Layout.jsx]
        Protected[ProtectedLayout.jsx]
        
        App --> Layout
        Layout --> Protected
    end

    subgraph "Pages"
        POS[POS.jsx]
        Products[Products.jsx]
        Invoices[Invoices.jsx]
        SignIn[SignIn.jsx]
        
        Protected --> POS
        Protected --> Products
        Protected --> Invoices
        Layout --> SignIn
    end

    subgraph "Components"
        Camera[CameraModal.jsx]
        Import[ImportProductsModal.jsx]
        Profile[ProfileModal.jsx]
        Avatar[UserAvatar.jsx]
        
        POS --> Camera
        Products --> Import
        Protected --> Profile
        Profile --> Avatar
    end
```

## State Management

```mermaid
graph TB
    subgraph "Global State"
        Auth[AuthContext]
        Theme[ThemeContext]
    end

    subgraph "Component State"
        POSState[POS Local State]
        ProductState[Product Local State]
        InvoiceState[Invoice Local State]
        ModalState[Modal States]
    end

    subgraph "Data Flow"
        API[API Service]
        Cache[Local Cache]
        SW[Service Worker]
    end

    Auth --> POSState
    Auth --> ProductState
    Auth --> InvoiceState
    
    POSState --> API
    ProductState --> API
    InvoiceState --> API
    
    API --> Cache
    Cache --> SW
```

## Routing Structure

```mermaid
graph LR
    subgraph "Public Routes"
        Sign[/signin]
    end

    subgraph "Protected Routes"
        POS[/pos]
        Prod[/products]
        Inv[/invoices]
        Prof[/profile]
    end

    Sign --> POS
    POS --> Prod
    POS --> Inv
    POS --> Prof
```

## PWA Architecture

```mermaid
graph TB
    subgraph "PWA Components"
        SW[Service Worker]
        Cache[Cache Storage]
        IDB[IndexedDB]
        
        SW --> Cache
        SW --> IDB
    end

    subgraph "Offline Features"
        Products[Product Data]
        Trans[Transactions]
        User[User Data]
        
        IDB --> Products
        IDB --> Trans
        Cache --> User
    end

    subgraph "Sync"
        Queue[Sync Queue]
        Back[Background Sync]
        
        Trans --> Queue
        Queue --> Back
        Back --> API[Backend API]
    end
```

## Component Details

### Core Components

1. **Layout.jsx**
   - Main application layout
   - Navigation structure
   - Theme management
   - Responsive design handling

2. **ProtectedLayout.jsx**
   - Authentication check
   - Route protection
   - User session management
   - Navigation guards

3. **UserAvatar.jsx**
   - Profile picture display
   - User status indicator
   - Click handling for profile modal

### Feature Components

1. **CameraModal.jsx**
   - Barcode/QR scanning
   - Camera access management
   - Image processing
   - Error handling

2. **ImportProductsModal.jsx**
   - File upload handling
   - Data validation
   - Progress indication
   - Error reporting

3. **ProfileModal.jsx**
   - User information display
   - Profile editing
   - Password management
   - Settings configuration

## State Management Patterns

### AuthContext
```mermaid
graph TD
    subgraph "Authentication State"
        Login[Login]
        Token[JWT Token]
        User[User Data]
        Perms[Permissions]
        
        Login --> Token
        Token --> User
        User --> Perms
    end

    subgraph "Auth Actions"
        SignIn[Sign In]
        SignOut[Sign Out]
        Refresh[Refresh Token]
        Update[Update Profile]
        
        SignIn --> Token
        SignOut --> Token
        Refresh --> Token
        Update --> User
    end
```

## Technical Implementation

### Frontend Technologies
- React 19.0.0
- Material-UI 6.4.3
- React Router DOM 7.1.5
- Emotion (CSS-in-JS)

### Development Tools
- Vite for build tooling
- ESLint for code quality
- Jest for testing
- React Testing Library

### PWA Features
- Service Worker registration
- Cache management
- Offline functionality
- Push notifications (where applicable)

## Performance Optimizations

```mermaid
graph TD
    subgraph "Performance Features"
        Code[Code Splitting]
        Lazy[Lazy Loading]
        Cache[Cache Strategy]
        Prefetch[Prefetching]
        
        Code --> Bundle[Bundle Size]
        Lazy --> Bundle
        Cache --> Performance
        Prefetch --> Performance
    end
```

This architecture ensures:
- Clean component hierarchy
- Efficient state management
- Robust offline capabilities
- Optimized performance
- Maintainable codebase
