# 📸 PhotoStack AI - Intelligent Digital Asset Management

> **Transform chaos into order.** Your personal AI-powered photo library that understands, organizes, and surfaces your memories—automatically.

[![Built with FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Powered by Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 🌟 Why PhotoStack AI?

PhotoStack AI isn't just another photo gallery—it's an **intelligent digital asset management system** that combines cutting-edge AI with a beautiful, intuitive interface. Built for photographers, content creators, and anyone with thousands of photos drowning in disorganization.

### 🎯 What Makes It Special

#### 🤖 **AI-First Architecture**
- **Visual Understanding**: Google Gemini 2.0 Flash analyzes every image, understanding content, context, and composition
- **Natural Language Search**: Ask questions like *"sunset photos from the beach in 2023"* and get exactly what you need
- **Smart Suggestions**: AI recommends albums, tags, and search queries based on your collection
- **Two-Tier Search Intelligence**: Structured semantic search backed by fuzzy keyword matching ensures you always find your photos

#### 🗄️ **Enterprise-Grade Database Design**
- **PostgreSQL Backend**: Industrial-strength relational database with optimized query performance
- **Smart Schema**: Many-to-many relationships for tags and albums, one-to-many for metadata and locations
- **Perceptual Hashing**: Automatic duplicate detection using pHash algorithms
- **Metadata Preservation**: Full EXIF data extraction and storage including camera settings, GPS, and timestamps

#### 📱 **Modern Format Support**
- **HEIC/HEIF Ready**: Seamlessly handles iPhone and modern Android photos
- **Automatic Conversion**: Server-side WebP generation for fast loading and universal compatibility
- **Smart Thumbnails**: Multi-resolution preview generation (thumbnails, medium, large)
- **RAW Aware**: Preserves EXIF data from professional camera formats

#### 🗺️ **Location Intelligence**
- **Automatic Geotagging**: Extracts GPS coordinates from image metadata
- **Reverse Geocoding**: Converts coordinates to human-readable addresses using Nominatim
- **Interactive Map**: Visualize your photography journey with clustered markers
- **Location-Based Search**: Find all photos from specific places instantly

---

## 🏗️ Technical Architecture

### **Backend Stack**
```
FastAPI (Python 3.11+)
├── LangChain + Google Gemini 2.0 Flash      # AI Engine
├── SQLAlchemy + PostgreSQL                   # Database ORM
├── Pillow + pillow-heif                      # Image Processing
├── ExifRead                                  # Metadata Extraction
├── ImageHash                                 # Duplicate Detection
├── Geopy (Nominatim)                        # Reverse Geocoding
└── Pydantic V2                              # Data Validation
```

### **Frontend Stack**
```
React 18 + TypeScript
├── Vite                                     # Build Tool
├── TailwindCSS                              # Styling
├── Leaflet                                  # Interactive Maps
└── React Router                             # SPA Routing
```

### **Key Design Patterns**
- **Repository Pattern**: Clean separation between data access (CRUD) and business logic (services)
- **Background Processing**: Images are processed asynchronously to maintain UI responsiveness
- **Structured Outputs**: LangChain's structured output ensures reliable AI responses
- **Connection Pooling**: Optimized database connections with pool size management

---

## ✨ Core Features

### 🎨 **Intelligent Gallery**
- **Infinite Scroll**: Smooth, paginated loading of thousands of images
- **Multi-Select**: Batch operations for tags, albums, favorites, and deletion
- **Advanced Filtering**: Filter by date, camera model, location, tags, and favorites
- **View Modes**: Grid, masonry, and list views with persistent preferences
- **Dark/Light Themes**: Beautiful UI that adapts to your preference

### 🏷️ **AI-Powered Tagging**
- **Automatic Tag Generation**: Gemini analyzes images and generates relevant tags (objects, scenes, colors, emotions)
- **Tag-Based Search**: Click any tag to see all related images
- **Tag Statistics**: See your most common tags and their frequencies
- **Manual Override**: Add or remove tags as needed

### 📅 **Smart Albums**
- **Auto-Chronological Grouping**: Images automatically organized by month and year
- **AI Album Suggestions**: Get creative album ideas based on your collection
- **Custom Albums**: Create manual albums for events, projects, or themes
- **Album Previews**: Beautiful cover images with photo counts

### 🔍 **Advanced Search**

#### **Natural Language AI Search**
```
"Show me sunset pictures from California in 2023"
"Find photos of my dog playing in the garden"
"Beach photos taken with my Canon camera"
```

The AI understands context, extracts structured filters, and falls back to keyword matching when needed.

#### **Structured Filters**
- Date ranges (relative: "last summer" or absolute: "2023-06-15")
- Camera models and lens information
- Locations and addresses
- ISO, aperture, shutter speed
- Favorites and processing status

### 🧬 **Duplicate Detection**
- **Perceptual Hashing**: Detects near-duplicates even with slight edits
- **Visual Grouping**: See all duplicates side-by-side
- **Batch Cleanup**: Delete duplicates while keeping the best version

### 📊 **Analytics Dashboard**
- **Storage Stats**: Total images, file sizes, and growth trends
- **Camera Analytics**: Top cameras and lens usage
- **Location Heatmap**: Most photographed places
- **Upload Patterns**: Monthly upload trends
- **Processing Status**: Real-time tracking of image processing queue

---

## 🚀 Quick Start

### **Prerequisites**
- Docker & Docker Compose
- Google Gemini API Key ([Get one free](https://ai.google.dev/))

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/photostack-ai.git
cd photostack-ai
```

2. **Configure environment**
```bash
# Copy the template
cp env.txt .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_api_key_here
```

3. **Launch with Docker**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

### **Development Setup**

#### Backend
```bash
cd api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
photostack-ai/
├── api/                          # FastAPI Backend
│   ├── routers/                 # API Endpoints
│   │   ├── images.py           # Image CRUD operations
│   │   ├── search.py           # AI-powered search
│   │   ├── suggestions.py      # AI album/search suggestions
│   │   ├── duplicates.py       # Duplicate detection
│   │   ├── batch.py            # Batch operations
│   │   └── ...
│   ├── services/                # Business Logic
│   │   ├── ai_search.py        # LangChain + Gemini search
│   │   ├── ai_suggestions.py   # AI recommendation engine
│   │   ├── image_processing.py # EXIF, thumbnails, pHash
│   │   └── geocoding.py        # Reverse geocoding
│   ├── models.py               # SQLAlchemy ORM models
│   ├── crud.py                 # Database operations
│   ├── schemas.py              # Pydantic validation schemas
│   ├── database.py             # DB connection & session
│   └── config.py               # Application configuration
├── frontend/                    # React + TypeScript
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Route pages
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Utilities & API client
│   └── ...
└── uploads/                     # Image storage
    ├── thumbnails/             # 400px WebP thumbnails
    └── previews/               # 1920px WebP previews
```

---

## 🧠 AI & Machine Learning Features

### **Image Understanding Pipeline**
1. **Upload**: User uploads HEIC/JPG/PNG images
2. **EXIF Extraction**: Camera settings, GPS, timestamps extracted
3. **Thumbnail Generation**: Multi-resolution WebP images created
4. **pHash Calculation**: Perceptual hash generated for duplicate detection
5. **AI Analysis**: Image sent to Gemini 2.0 Flash for content analysis
6. **Tag Generation**: Relevant tags extracted and normalized
7. **Geocoding**: GPS coordinates reverse geocoded to addresses
8. **Indexing**: All metadata indexed for fast searching

### **Search Intelligence**

#### **Tier 1: Structured AI Search**
```python
# User query: "sunset photos from California last summer"
# AI extracts:
{
  "tags": ["sunset"],
  "location": "California",
  "date_query": "2024-03-01 to 2024-06-30"  # India context: summer = Mar-Jun
}
```

#### **Tier 2: Keyword Fallback**
If structured search yields no results, falls back to fuzzy matching across tags and locations.

### **AI Models Used**
- **Google Gemini 2.0 Flash**: Fast, cost-effective multimodal model
- **LangChain Structured Output**: Ensures reliable, schema-compliant AI responses
- **Temperature Tuning**: 0.8 for creative suggestions, lower for search extraction

---

## 🔒 Privacy & Security

- **Self-Hosted**: Your photos never leave your infrastructure
- **No Tracking**: Zero analytics, telemetry, or third-party data sharing
- **API Key Security**: Gemini API key stored in environment variables
- **Database Isolation**: PostgreSQL credentials configurable per deployment

---

## 📈 Performance Highlights

- **Fast Search**: Optimized SQL queries with eager loading and joins
- **Efficient Storage**: WebP compression reduces storage by ~30-50% vs JPG
- **Connection Pooling**: Pool size 20, max overflow 10 for concurrent requests
- **Background Processing**: Non-blocking image processing maintains UI responsiveness
- **Smart Pagination**: Infinite scroll with limit/skip for large collections

---

## 📚 **Documentation**

This project includes comprehensive documentation for all skill levels:

### **For Everyone**
- 🏠 **[Landing Page](index.md)** - Overview and quick start (GitHub Pages ready)

### **For Developers**
- 📐 **[Interactive Architecture](docs/architecture.html)** - Visual system diagrams with Mermaid
- ✍️ **[Technical Blog Post](docs/BLOG_POST.md)** - Complete walkthrough of building the system
- 📖 **[Markdown Architecture](docs/ARCHITECTURE.md)** - Architecture diagrams in Markdown format

### **Access Documentation**
- **Locally**: Open `docs/architecture.html` in your browser
- **GitHub Pages**: Enable Pages in repo settings, access at `https://yourusername.github.io/photostack-ai/`

---

## 🛠️ API Examples

### **Upload Image**
```bash
curl -X POST "http://localhost:8000/api/v1/images/upload" \
  -F "file=@photo.jpg"
```

### **Natural Language Search**
```bash
curl -X POST "http://localhost:8000/api/v1/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "beach sunset photos from last year"}'
```

### **Get AI Suggestions**
```bash
curl "http://localhost:8000/api/v1/suggestions/albums"
```

---

## 🌍 Use Cases

- **Photographers**: Organize thousands of RAW/HEIC files with automatic EXIF preservation
- **Content Creators**: Tag and search stock photos with AI-powered semantic search
- **Travelers**: Visualize your journey on an interactive world map
- **Families**: Rediscover old memories with chronological albums and smart search
- **Enterprises**: Self-hosted DAM solution with API-first architecture

---

## 🤝 Contributing

We welcome contributions! This project showcases modern AI/ML integration patterns and is perfect for learning:
- LangChain structured outputs
- FastAPI + SQLAlchemy best practices
- React + TypeScript component architecture
- PostgreSQL schema design for media libraries

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Inspired by the excellent open-source projects:
- [PhotoPrism](https://www.photoprism.app/) - Go-based photo management
- [PhotoView](https://photoview.github.io/) - Media organization platform

PhotoStack AI brings these concepts to the Python/AI ecosystem with a modern, LangChain-powered approach.

---

## 📞 Support

- **Documentation**: [Full API Docs](http://localhost:8000/api/v1/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/photostack-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/photostack-ai/discussions)

---

<div align="center">

**Built with ❤️ using FastAPI, Google Gemini AI, and React**

*From a college project to a portfolio-ready AI application*

[⭐ Star us on GitHub](https://github.com/yourusername/photostack-ai) | [🚀 Deploy Your Own](docs/deployment.md) | [📖 Read the Docs](docs/)

</div>
