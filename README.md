# Prestige Car Hire Management (PCHM)

A comprehensive full-stack web application for managing accident replacement vehicle rentals, car sales, and customer support. Built with Django REST Framework backend and React TypeScript frontend, featuring an AI-powered chatbot, analytics dashboard, and complete CMS.

![License](https://img.shields.io/badge/license-Proprietary-red)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Django](https://img.shields.io/badge/django-5.2-green)
![React](https://img.shields.io/badge/react-18.3-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.8-blue)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
  - [Docker (Recommended)](#docker-recommended)
  - [Local Development](#local-development)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## ✨ Features

### Core Functionality
- **🚗 Vehicle Management**: Complete fleet management system with booking capabilities
- **📋 Booking System**: Accident replacement vehicle booking and management
- **💰 Car Sales**: Vehicle listing and purchase request management
- **📞 Customer Inquiries**: Inquiry submission and tracking system
- **📰 Content Management**: Blog/news management with rich text editor
- **💬 Testimonials**: Customer testimonial collection and display

### Advanced Features
- **🤖 AI Chatbot**: GROQ-powered intelligent customer support chatbot with ReAct agent
- **📊 Analytics Dashboard**: Visitor tracking, booking trends, and business insights
- **📧 Newsletter**: Subscriber management and email campaigns
- **🖼️ Gallery**: Image management with advanced filtering
- **🎨 Theme Management**: Dynamic theme customization system
- **👥 Staff Management**: Multi-level admin and staff access control
- **🔐 Authentication**: JWT-based authentication with OTP verification
- **📱 Responsive Design**: Mobile-first responsive UI built with Tailwind CSS

### Admin Features
- **📈 Analytics & Reporting**: Comprehensive dashboard with metrics
- **🔍 Search & Filtering**: Advanced search across all modules
- **📤 Export Functionality**: Excel export for data analysis
- **🔄 Automated Backups**: Daily database and media backups with 30-day retention
- **📝 Activity Logging**: Complete audit trail of admin actions

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 5.2.8
- **API**: Django REST Framework 3.16.1
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL 16
- **Task Queue**: Celery 5.5.3 + Redis 7
- **AI/ML**: GROQ API, LangGraph, LangChain
- **Documentation**: drf-spectacular (OpenAPI/Swagger)
- **Image Processing**: Pillow
- **Rich Text Editor**: django-ckeditor-5

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.8
- **Build Tool**: Vite 5.4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM 6.30
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Gunicorn
- **Static Files**: WhiteNoise
- **Monitoring**: Sentry SDK

## 📦 Prerequisites

- **Docker** (20.10+) and **Docker Compose** (2.0+) - for Docker setup
- **Python** 3.12+ - for local development
- **Node.js** 20+ and **npm** - for frontend development
- **PostgreSQL** 16+ - for database (if not using Docker)
- **Redis** 7+ - for Celery (if not using Docker)

## 🚀 Quick Start

### Using Docker (Recommended)

The fastest way to get started:

```bash
# Clone the repository
git clone <repository-url>
cd pchm

# Pull the Docker image
docker pull hammadmunir959/pchm:latest

# Create docker-compose.yml (see DOCKER_USAGE_GUIDE.md)
# Create .env file with your configuration

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

For detailed Docker setup instructions, see [DOCKER_USAGE_GUIDE.md](./DOCKER_USAGE_GUIDE.md).

## 📥 Installation

### Docker (Recommended)

1. **Create project directory and files**:
   ```bash
   mkdir pchm-project && cd pchm-project
   ```

2. **Create `docker-compose.yml`** (see [DOCKER_USAGE_GUIDE.md](./DOCKER_USAGE_GUIDE.md) for complete configuration)

3. **Create `.env` file**:
   ```bash
   # Database
   DB_NAME=pchm_db
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   
   # Django
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Redis/Celery
   REDIS_URL=redis://redis:6379/0
   CELERY_BROKER_URL=redis://redis:6379/0
   CELERY_RESULT_BACKEND=redis://redis:6379/0
   ```

4. **Start services**:
   ```bash
   docker pull hammadmunir959/pchm:latest
   docker compose up -d
   ```

5. **Create superuser**:
   ```bash
   docker compose exec app python manage.py createsuperuser
   ```

### Local Development

#### Backend Setup

1. **Clone and navigate**:
   ```bash
   git clone <repository-url>
   cd pchm/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Setup database**:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Collect static files**:
   ```bash
   python manage.py collectstatic --noinput
   ```

7. **Run development server**:
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   Create `.env.local`:
   ```bash
   VITE_API_URL=http://localhost:8000
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

#### Celery Setup (for background tasks)

1. **Start Redis**:
   ```bash
   redis-server
   ```

2. **Start Celery Worker**:
   ```bash
   celery -A config.celery worker --loglevel=info
   ```

3. **Start Celery Beat** (for scheduled tasks):
   ```bash
   celery -A config.celery beat --loglevel=info
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Django Core
SECRET_KEY=your-secret-key-here-generate-a-strong-one
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# Database
DB_NAME=pchm_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost  # Use 'db' for Docker
DB_PORT=5432

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_PORT=587
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-email@gmail.com

# AI Chatbot (GROQ)
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=mixtral-8x7b-32768

# Google Services
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
RECAPTCHA_PUBLIC_KEY=your-recaptcha-public-key
RECAPTCHA_PRIVATE_KEY=your-recaptcha-private-key

# Redis/Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# AWS S3 (Optional - for production media storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1

# Backup Settings
BACKUP_ENABLED=True
BACKUP_RETENTION_DAYS=30
```

### Generate Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 📖 Usage

### Accessing the Application

- **Frontend**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: 
  - Swagger UI: http://localhost:8000/api/schema/swagger-ui/
  - ReDoc: http://localhost:8000/api/schema/redoc/
  - OpenAPI Schema: http://localhost:8000/api/schema/

### Creating Admin User

```bash
# Docker
docker compose exec app python manage.py createsuperuser

# Local
python manage.py createsuperuser
```

### Running Management Commands

```bash
# Docker
docker compose exec app python manage.py <command>

# Local
python manage.py <command>
```

### Common Tasks

- **Run migrations**: `python manage.py migrate`
- **Create migrations**: `python manage.py makemigrations`
- **Collect static files**: `python manage.py collectstatic`
- **Create superuser**: `python manage.py createsuperuser`
- **Django shell**: `python manage.py shell`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register/` - Register admin user
- `POST /api/auth/login/` - Login admin user
- `POST /api/auth/verify-otp/` - Verify email with OTP
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - Logout user

### Vehicle Management

- `GET /api/vehicles/` - List all vehicles
- `POST /api/vehicles/` - Create vehicle (admin)
- `GET /api/vehicles/{id}/` - Get vehicle details
- `PATCH /api/vehicles/{id}/` - Update vehicle (admin)
- `DELETE /api/vehicles/{id}/` - Delete vehicle (admin)

### Booking/Claims

- `POST /api/claims/` - Submit claim
- `GET /api/claims/` - List claims (admin)
- `GET /api/claims/{id}/` - Get claim details
- `PATCH /api/claims/{id}/approve/` - Approve claim (admin)
- `PATCH /api/claims/{id}/reject/` - Reject claim (admin)

### Car Sales

- `GET /api/car-sales/` - List vehicles for sale
- `POST /api/car-sales/` - Create listing (admin)
- `POST /api/car-sales/{id}/purchase-request/` - Submit purchase request
- `GET /api/purchase-requests/` - List purchase requests (admin)

### Chatbot

- `POST /api/chatbot/message/` - Send message to chatbot
- `POST /api/chatbot/submit-lead/` - Submit lead from chatbot
- `GET /api/chatbot/sessions/` - Get chat sessions (admin)
- `GET /api/chatbot/sessions/{id}/` - Get session details

### Analytics

- `GET /api/analytics/dashboard/summary/` - Dashboard summary
- `GET /api/analytics/dashboard/booking-trends/` - Booking trends
- `GET /api/analytics/dashboard/vehicle-usage/` - Vehicle usage stats
- `GET /api/analytics/visitors/` - Visitor analytics

### Newsletter

- `POST /api/newsletter/subscribe/` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe/` - Unsubscribe from newsletter
- `GET /api/newsletter/subscribers/` - List subscribers (admin)

For complete API documentation, visit the Swagger UI at `/api/schema/swagger-ui/`.

## 📁 Project Structure

```
pchm/
├── backend/                 # Django backend
│   ├── accounts/            # User authentication
│   ├── analytics/           # Analytics and tracking
│   ├── blog/                # Blog/news management
│   ├── bookings/            # Booking/claim management
│   ├── car_sales/           # Car sales module
│   ├── chatbot/             # AI chatbot integration
│   ├── cms/                 # Content management
│   ├── config/              # Django settings
│   ├── gallery/             # Image gallery
│   ├── inquiries/           # Customer inquiries
│   ├── newsletter/          # Newsletter management
│   ├── testimonials/        # Testimonials
│   ├── theming/             # Theme management
│   ├── vehicles/            # Vehicle management
│   ├── utils/               # Utility functions
│   ├── manage.py
│   └── requirements.txt
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker image definition
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── DOCKER_USAGE_GUIDE.md   # Docker usage guide
```

## 💻 Development

### Code Style

- **Python**: Follow PEP 8, use Black for formatting
- **TypeScript/React**: Follow ESLint rules, use Prettier

### Running Linters

```bash
# Backend
black backend/
flake8 backend/
isort backend/

# Frontend
cd frontend
npm run lint
```

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/your-feature`
5. Create a Pull Request

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test chatbot
python manage.py test analytics

# Run with coverage
pip install coverage
coverage run manage.py test
coverage report
coverage html  # Generate HTML report
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Set strong `SECRET_KEY`
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for Celery
- [ ] Configure email settings
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure static/media file serving (S3 recommended)
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backup system
- [ ] Set up domain and DNS
- [ ] Configure firewall rules
- [ ] Set up log aggregation

### Docker Deployment

The application is containerized and ready for deployment. See [DOCKER_USAGE_GUIDE.md](./DOCKER_USAGE_GUIDE.md) for detailed instructions.

### Environment-Specific Settings

The project uses environment-based settings:
- `config.settings.development` - Development
- `config.settings.production` - Production
- `config.settings.testing` - Testing

Set `DJANGO_SETTINGS_MODULE` environment variable accordingly.

### Static Files

For production, configure static file serving:

```python
# Use WhiteNoise for static files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Or use S3
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'
```

## 🔄 Backup & Restore

### Automated Backups

The system includes automated daily backups when Celery beat is running. Backups are stored in the `backups/` directory with 30-day retention.

### Manual Backup

```python
from utils.backup import backup_database, backup_media_files

# Backup database
db_path = backup_database()

# Backup media files
media_path = backup_media_files()
```

### Restore

```python
from utils.backup import restore_database, restore_media_files

# Restore database
restore_database('/path/to/backup.dump')

# Restore media files
restore_media_files('/path/to/media.tar.gz')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure backward compatibility when possible

## 📞 Support

For support and questions:

- **Issues**: Create an issue in the repository
- **Documentation**: Check the [DOCKER_USAGE_GUIDE.md](./DOCKER_USAGE_GUIDE.md) for Docker-specific help
- **API Docs**: Visit `/api/schema/swagger-ui/` for API documentation

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ using Django, React, and modern web technologies.**

For detailed Docker usage instructions, see [DOCKER_USAGE_GUIDE.md](./DOCKER_USAGE_GUIDE.md).

