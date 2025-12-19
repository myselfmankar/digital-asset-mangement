# PhotoStack AI - System Architecture

> **Visual documentation of system design, data flow, and architectural patterns**

---

## 📊 **Database Schema**

### **Entity Relationship Diagram**

```mermaid
erDiagram
    images ||--o| metadata : "has one"
    metadata ||--o| locations : "has one"
    images }o--o{ tags : "tagged with"
    images }o--o{ albums : "belongs to"
    
    images {
        int id PK
        string filename UK "Unique constraint"
        string filepath
        datetime upload_date
        string resolution
        int image_size
        string mimetype
        string status "processing|completed|failed"
        boolean is_favorite
        string phash "Perceptual hash for duplicates"
    }
    
    metadata {
        int id PK
        int image_id FK
        string camera_model
        datetime date_taken "EXIF DateTimeOriginal"
        float f_number "Aperture"
        string exposure_time "Shutter speed"
        int iso
        string focal_length
        string lens_model
        json raw_exif "Full EXIF dump"
    }
    
    locations {
        int id PK
        int metadata_id FK
        float latitude
        float longitude
        string address "Reverse geocoded"
    }
    
    tags {
        int id PK
        string name UK "Unique constraint"
    }
    
    albums {
        int id PK
        string name
        string description
    }
    
    image_tag_association {
        int image_id FK
        int tag_id FK
    }
    
    image_album_association {
        int image_id FK
        int album_id FK
    }
```

### **Key Relationships**

| Type | Entities | Rationale |
|------|----------|-----------|
| **1:1** | Image → Metadata | Not all images have EXIF; separation keeps `images` table lean |
| **1:1** | Metadata → Location | GPS is optional; location is extension of metadata |
| **M:N** | Images ↔ Tags | One image has multiple tags; one tag applies to many images |
| **M:N** | Images ↔ Albums | One image can be in multiple albums (e.g., "2023 Summer" + "Beach Photos") |

---

## 🏗️ **System Architecture**

### **High-Level Overview**

```mermaid
graph TB
    subgraph "Client Layer"
        FE[React Frontend<br/>TypeScript + TailwindCSS]
    end
    
    subgraph "API Layer"
        API[FastAPI<br/>Python 3.11+]
        CORS[CORS Middleware]
        FE --> CORS --> API
    end
    
    subgraph "Service Layer"
        IMG[Image Processing<br/>Pillow + HEIF]
        AI_TAG[AI Tagging<br/>Gemini 2.0 Flash]
        AI_SEARCH[AI Search<br/>LangChain + Structured Output]
        AI_SUGGEST[AI Suggestions<br/>Album & Query Generation]
        GEO[Geocoding<br/>Geopy + Nominatim]
        
        API --> IMG
        API --> AI_SEARCH
        API --> AI_SUGGEST
        IMG --> AI_TAG
        IMG --> GEO
    end
    
    subgraph "Data Layer"
        CRUD[CRUD Operations<br/>SQLAlchemy]
        DB[(PostgreSQL<br/>Relational DB)]
        FILES[File Storage<br/>uploads/ directory]
        
        AI_TAG --> CRUD
        AI_SEARCH --> CRUD
        AI_SUGGEST --> CRUD
        GEO --> CRUD
        IMG --> FILES
        CRUD --> DB
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini API<br/>Multimodal AI]
        NOMINATIM[Nominatim<br/>Reverse Geocoding]
        
        AI_TAG -.HTTP.-> GEMINI
        AI_SEARCH -.HTTP.-> GEMINI
        AI_SUGGEST -.HTTP.-> GEMINI
        GEO -.HTTP.-> NOMINATIM
    end
    
    style GEMINI fill:#8E75B2,color:#fff
    style DB fill:#4169E1,color:#fff
    style API fill:#009688,color:#fff
    style FE fill:#61DAFB,color:#000
```

### **Technology Stack Mapping**

```mermaid
mindmap
    root((PhotoStack AI))
        Backend
            FastAPI
                Async/Await
                Pydantic V2
                OpenAPI Docs
            SQLAlchemy
                ORM Models
                Connection Pooling
                Eager Loading
            Python Libraries
                Pillow + pillow-heif
                ExifRead
                ImageHash pHash
                Geopy
        AI/ML
            Google Gemini 2.0 Flash
                Multimodal Vision
                Fast Response
                Cost Effective
            LangChain
                Structured Output
                Prompt Templates
                Chain Composition
        Frontend
            React 18
                TypeScript
                Hooks + Context
                React Router
            Styling
                TailwindCSS
                Dark/Light Themes
            Libraries
                Leaflet Maps
                React Query
        Infrastructure
            Docker
                Multi-stage Builds
                Docker Compose
            PostgreSQL
                Relational DB
                JSON Support
                Full-text Search
```

---

## 🔄 **Data Flow Diagrams**

### **Image Upload & Processing Pipeline**

```mermaid
sequenceDiagram
    actor User
    participant UI as React UI
    participant API as FastAPI
    participant DB as PostgreSQL
    participant BG as Background Thread
    participant IMG as Image Service
    participant AI as Gemini API
    participant GEO as Nominatim API
    
    User->>UI: Upload photo.heic
    UI->>API: POST /api/v1/images/upload
    
    API->>DB: Create placeholder<br/>(status='processing')
    DB-->>API: image_id: 42
    API-->>UI: {id: 42, status: 'processing'}
    UI-->>User: Upload successful!<br/>Processing...
    
    API->>BG: Spawn background task<br/>process_image(42)
    
    rect rgb(240, 240, 255)
        Note over BG,GEO: Background Processing (async)
        
        BG->>IMG: process_and_save_metadata(42)
        
        IMG->>IMG: Convert HEIC → JPEG
        IMG->>IMG: Generate WebP thumbnail (400px)
        IMG->>IMG: Generate WebP preview (1920px)
        IMG->>IMG: Extract EXIF metadata
        IMG->>IMG: Calculate pHash
        
        IMG->>AI: Analyze image<br/>(base64 + prompt)
        AI-->>IMG: Tags: ["beach", "sunset", "ocean"]
        
        opt GPS data exists
            IMG->>GEO: Reverse geocode<br/>(lat, lon)
            GEO-->>IMG: "Malibu, California, USA"
        end
        
        IMG->>DB: Update image_id 42<br/>+ metadata + tags + location
        DB-->>IMG: Success
        
        IMG->>DB: Set status='completed'
    end
    
    UI->>API: Poll GET /api/v1/images/42
    API->>DB: Fetch image 42
    DB-->>API: {status: 'completed', tags: [...]}
    API-->>UI: Image data
    UI-->>User: Display processed image!
```

### **AI-Powered Search Flow**

```mermaid
flowchart TD
    A[User Query:<br/>'sunset photos from California in 2023'] --> B{AI Search Service}
    
    B --> C[Tier 1: Structured Extraction]
    C --> D[LangChain + Gemini]
    
    D --> E{Extract Filters}
    E -->|Success| F[SearchQuery Schema:<br/>tags=['sunset']<br/>location='California'<br/>date='2023-01-01 to 2023-12-31']
    E -->|Failed| L[Skip to Tier 2]
    
    F --> G[CRUD: search_by_filters]
    G --> H[SQL Query with JOINs]
    
    H --> I{Results Found?}
    I -->|Yes| J[Return Images]
    I -->|No| K[Tier 2: Keyword Fallback]
    
    L --> K
    K --> M[Remove Stop Words:<br/>'sunset', 'photos', 'California', '2023']
    M --> N[CRUD: search_by_keywords]
    N --> O[SQL with OR conditions<br/>ILIKE across tags/locations]
    O --> J
    
    J --> P[API Response:<br/>List of Image objects]
    
    style D fill:#8E75B2,color:#fff
    style H fill:#4169E1,color:#fff
    style J fill:#28a745,color:#fff
```

### **Album Suggestion Generation**

```mermaid
graph LR
    A[User clicks<br/>'Get Suggestions'] --> B[AI Suggestion Service]
    
    B --> C[Fetch top 100 tags<br/>from database]
    C --> D[Random sample 30 tags<br/>+ shuffle]
    
    D --> E[Build prompt:<br/>'beach 45, sunset 32...']
    E --> F[LangChain Chain:<br/>Prompt → Gemini → Parser]
    
    F --> G{Gemini API<br/>temp=0.8}
    G --> H[Raw response:<br/>JSON string]
    
    H --> I[Parse JSON:<br/>extract 'suggestions' array]
    I --> J[Validate:<br/>4-5 unique titles]
    
    J --> K{Valid?}
    K -->|Yes| L[Return:<br/>['Golden Hour by the Sea',<br/>'Coastal Adventures']]
    K -->|No| M[Fallback:<br/>Generic suggestions]
    
    M --> L
    L --> N[API Response]
    
    style G fill:#8E75B2,color:#fff
    style L fill:#28a745,color:#fff
```

---

## 🧠 **AI Pipeline Architecture**

### **Image Tagging Pipeline**

```mermaid
stateDiagram-v2
    [*] --> ImageUpload
    
    ImageUpload --> FormatDetection
    
    FormatDetection --> HEICConversion: .heic/.heif
    FormatDetection --> DirectProcessing: .jpg/.png
    
    HEICConversion --> Base64Encoding
    DirectProcessing --> Base64Encoding
    
    Base64Encoding --> PromptConstruction
    
    state PromptConstruction {
        [*] --> TextPrompt
        TextPrompt --> ImageData
        ImageData --> HumanMessage
    }
    
    PromptConstruction --> GeminiAPI
    
    state GeminiAPI {
        [*] --> VisionModel
        VisionModel --> ContentAnalysis
        ContentAnalysis --> TagGeneration
    }
    
    GeminiAPI --> ResponseParsing
    
    state ResponseParsing {
        [*] --> SplitByComma
        SplitByComma --> Lowercase
        Lowercase --> Trim
        Trim --> ValidateTags
    }
    
    ResponseParsing --> DatabaseStorage
    
    DatabaseStorage --> [*]
```

### **Search Query Processing**

```mermaid
graph TD
    subgraph "Input Layer"
        A[Natural Language Query]
    end
    
    subgraph "AI Processing"
        B[Context Injection<br/>Current date, User location]
        C[LangChain Structured Output]
        D[Gemini 2.0 Flash<br/>Lower temperature]
        E[Pydantic Validation]
        
        A --> B --> C --> D --> E
    end
    
    subgraph "Query Construction"
        F{Filters Extracted?}
        G[Build SQLAlchemy Query<br/>with filters]
        H[Build Keyword Query<br/>with OR conditions]
        
        E --> F
        F -->|Yes| G
        F -->|No| H
    end
    
    subgraph "Database Execution"
        I[Execute with joinedload]
        J[Apply DISTINCT]
        K[Return Results]
        
        G --> I
        H --> I
        I --> J --> K
    end
    
    subgraph "Fallback Logic"
        L{Results Empty?}
        M[Switch to Keyword Search]
        
        K --> L
        L -->|Yes & from Tier 1| M
        M --> H
    end
    
    L -->|No| N[Return to API]
    
    style D fill:#8E75B2,color:#fff
    style I fill:#4169E1,color:#fff
```

---

## 🔐 **Security & Authentication Flow**

```mermaid
sequenceDiagram
    participant Env as .env File
    participant App as FastAPI App
    participant Settings as Pydantic Settings
    participant Service as AI Service
    participant Gemini as Gemini API
    
    Note over Env,Gemini: Configuration Loading
    
    Env->>Settings: Load environment variables
    Settings->>Settings: Validate GEMINI_API_KEY exists
    Settings->>App: Inject settings object
    
    Note over App,Gemini: Runtime Usage
    
    App->>Service: Initialize AI services
    Service->>Settings: Get GEMINI_API_KEY
    Settings-->>Service: api_key_value
    
    Service->>Gemini: HTTP Request<br/>Header: x-goog-api-key
    Gemini-->>Service: AI Response
    
    Note over Env,Gemini: Key never exposed to frontend
```

### **Data Privacy Architecture**

```mermaid
graph TB
    subgraph "User's Infrastructure"
        USER[User]
        BROWSER[Web Browser]
        
        subgraph "Docker Container"
            API[FastAPI Server]
            DB[(PostgreSQL)]
            FILES[/uploads/ directory]
        end
        
        USER --> BROWSER
        BROWSER <-->|HTTPS| API
        API <--> DB
        API <--> FILES
    end
    
    subgraph "External Services"
        GEMINI[Google Gemini API]
        NOMINATIM[Nominatim OSM]
    end
    
    API -.->|Image analysis only| GEMINI
    API -.->|Coordinates only| NOMINATIM
    
    style FILES fill:#90EE90,color:#000
    style DB fill:#90EE90,color:#000
    style GEMINI fill:#FFD700,color:#000
    style NOMINATIM fill:#FFD700,color:#000
    
    classDef private fill:#90EE90,color:#000
    classDef external fill:#FFD700,color:#000
    
    Note1[✅ Photos stored locally] -.-> FILES
    Note2[⚠️ Only base64 images sent<br/>Not stored by Google] -.-> GEMINI
```

---

## ⚡ **Performance Optimization**

### **Database Query Optimization**

```mermaid
graph LR
    subgraph "Problem: N+1 Queries"
        A1[Query: Get all images] --> A2[100 images returned]
        A2 --> A3[For each image,<br/>lazy load tags]
        A3 --> A4[100 additional queries!]
    end
    
    subgraph "Solution: Eager Loading"
        B1[Query with joinedload] --> B2[Single SQL query<br/>with JOINs]
        B2 --> B3[All data loaded<br/>in one trip]
    end
    
    A4 -.->|Slow| C[❌ Poor Performance]
    B3 -.->|Fast| D[✅ Optimized]
    
    style A4 fill:#ff6b6b,color:#fff
    style B3 fill:#51cf66,color:#000
```

### **Connection Pool Management**

```mermaid
stateDiagram-v2
    [*] --> Idle: App starts
    
    Idle --> Active: Request arrives
    
    state Active {
        [*] --> CheckPool
        
        CheckPool --> UseExisting: Connection available<br/>(pool_size=20)
        CheckPool --> CreateNew: Pool full<br/>(overflow < 10)
        CheckPool --> Wait: Max connections reached
        
        UseExisting --> ExecuteQuery
        CreateNew --> ExecuteQuery
        Wait --> CheckPool: Connection released
        
        ExecuteQuery --> ReleaseConnection
        ReleaseConnection --> [*]
    }
    
    Active --> Idle: Request complete
```

---

## 📦 **Deployment Architecture**

### **Docker Compose Services**

```mermaid
graph TB
    subgraph "docker-compose.yml"
        subgraph "web service"
            API[FastAPI App<br/>Port 8000]
            FILES[/uploads volume mount]
        end
        
        subgraph "db service"
            PG[(PostgreSQL<br/>Port 5432)]
            PGDATA[/var/lib/postgresql/data]
        end
    end
    
    subgraph "Host Machine"
        ENV[.env file<br/>GEMINI_API_KEY]
        UPLOADS[./uploads directory]
    end
    
    ENV -.->|Environment variables| API
    UPLOADS <-->|Volume mount| FILES
    API <-->|TCP/IP| PG
    
    CLIENT[Web Browser] -->|HTTP :8000| API
    
    style PG fill:#4169E1,color:#fff
    style API fill:#009688,color:#fff
```

### **Build & Run Flow**

```mermaid
flowchart LR
    A[docker-compose up --build] --> B[Build web image]
    B --> C[Build db image]
    
    C --> D[Create network]
    D --> E[Start PostgreSQL container]
    E --> F[Wait for DB ready]
    
    F --> G[Start FastAPI container]
    G --> H[Run database migrations<br/>Base.metadata.create_all]
    
    H --> I[Start background tasks<br/>Image scan + Geocoding]
    I --> J[API ready on :8000]
    
    J --> K{Images in uploads/?}
    K -->|Yes| L[Process all images]
    K -->|No| M[Wait for uploads]
    
    L --> M
    M --> N[Service running]
```

---

## 🧪 **Testing Architecture**

### **Test Coverage Map**

```mermaid
mindmap
    root((Testing Strategy))
        Unit Tests
            CRUD Operations
                get_image_by_id
                create_placeholder
                update_with_metadata
            Services
                generate_tags
                extract_exif
                calculate_phash
            Utils
                convert_to_degrees
                stop_word_removal
        Integration Tests
            API Endpoints
                POST /upload
                POST /search
                GET /suggestions
            Database
                Connection pooling
                Transaction rollback
                Cascade deletes
        E2E Tests
            Upload Flow
                UI upload → Processing → Display
            Search Flow
                Query → AI → Results
```

---

## 📐 **Code Organization**

### **Backend Module Structure**

```mermaid
graph TD
    ROOT[api/] --> MAIN[main.py<br/>FastAPI app + lifespan]
    ROOT --> CONFIG[config.py<br/>Pydantic settings]
    ROOT --> DB[database.py<br/>SQLAlchemy setup]
    ROOT --> MODELS[models.py<br/>ORM models]
    ROOT --> SCHEMAS[schemas.py<br/>Pydantic schemas]
    ROOT --> CRUD[crud.py<br/>Database operations]
    ROOT --> UTILS[utils.py<br/>Helper functions]
    
    ROOT --> ROUTERS[routers/]
    ROUTERS --> R1[images.py]
    ROUTERS --> R2[search.py]
    ROUTERS --> R3[suggestions.py]
    ROUTERS --> R4[albums.py]
    ROUTERS --> R5[duplicates.py]
    
    ROOT --> SERVICES[services/]
    SERVICES --> S1[image_processing.py<br/>EXIF + Thumbnails]
    SERVICES --> S2[ai_tagging.py<br/>Gemini vision]
    SERVICES --> S3[ai_search.py<br/>LangChain structured]
    SERVICES --> S4[ai_suggestions.py<br/>Album/query ideas]
    SERVICES --> S5[geocoding.py<br/>Reverse geocode]
    
    style ROUTERS fill:#e3f2fd
    style SERVICES fill:#fff3e0
```

---

## 🔄 **State Management**

### **Image Processing States**

```mermaid
stateDiagram-v2
    [*] --> Processing: Upload received
    
    Processing --> Processing: EXIF extraction
    Processing --> Processing: Thumbnail generation
    Processing --> Processing: AI tagging
    Processing --> Processing: Geocoding
    
    Processing --> Completed: All tasks successful
    Processing --> Failed: Any task failed
    
    Failed --> Processing: Retry triggered
    
    Completed --> [*]
    
    note right of Processing
        Background thread
        Status updates in DB
    end note
    
    note right of Failed
        Logged for debugging
        Can be retried on restart
    end note
```

---

## 📊 **Metrics & Monitoring**

### **Key Performance Indicators**

```mermaid
graph TB
    subgraph "Application Metrics"
        A1[Request Rate<br/>req/sec]
        A2[Response Time<br/>p50, p95, p99]
        A3[Error Rate<br/>5xx errors]
    end
    
    subgraph "AI Metrics"
        B1[Gemini API Latency<br/>avg, max]
        B2[Token Usage<br/>per request]
        B3[AI Success Rate<br/>valid responses]
    end
    
    subgraph "Database Metrics"
        C1[Query Time<br/>per endpoint]
        C2[Connection Pool<br/>active/idle]
        C3[Slow Queries<br/>> 100ms]
    end
    
    subgraph "Storage Metrics"
        D1[Total Images<br/>count]
        D2[Disk Usage<br/>GB]
        D3[Processing Queue<br/>pending count]
    end
    
    MONITOR[Monitoring Dashboard] --> A1
    MONITOR --> B1
    MONITOR --> C1
    MONITOR --> D1
```

---

## 🎯 **Design Patterns**

### **Repository Pattern**

```mermaid
classDiagram
    class Router {
        +POST /upload()
        +GET /images()
        +DELETE /images/:id()
    }
    
    class CRUD {
        +get_image_by_id()
        +create_placeholder()
        +update_with_metadata()
        +delete_image()
    }
    
    class Service {
        +process_image()
        +generate_tags()
        +extract_exif()
    }
    
    class Model {
        +Image
        +Metadata
        +Tag
    }
    
    class Database {
        +SessionLocal
        +engine
    }
    
    Router --> CRUD : uses
    CRUD --> Model : queries
    CRUD --> Database : session
    Router --> Service : calls
    Service --> CRUD : uses
```

---

This comprehensive architecture documentation provides visual clarity on every aspect of PhotoStack AI's design. Use these diagrams in presentations, documentation, and technical discussions! 🚀
