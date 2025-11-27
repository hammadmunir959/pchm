# Prestige Car Hire Management

A comprehensive web application for managing accident replacement vehicle rentals and car sales.

## Features

- **Admin Dashboard**: Complete CMS with analytics and reporting
- **Vehicle Management**: Fleet management and booking system
- **Car Sales**: Listing and purchase request management
- **Customer Portal**: Claim submission and inquiry system
- **AI Chatbot**: GROQ-powered customer support
- **Newsletter**: Subscriber management and campaigns
- **Gallery**: Image management with advanced filtering
- **Analytics**: Visitor tracking and insights
- **Automated Backups**: Daily backups with 30-day retention

## Tech Stack

- **Backend**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **File Storage**: Local file system (configurable for S3)
- **Email**: SMTP (Gmail, etc.)
- **AI Chatbot**: GROQ API
- **Documentation**: OpenAPI/Swagger
- **Task Queue**: Celery + Redis

## Installation

### Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis (for Celery)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prestige-car-hire-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Database setup**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

## Environment Variables

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# Database
DB_NAME=prestige_cars
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_PORT=587
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-email@gmail.com

# AI Chatbot
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=mixtral-8x7b-32768

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# reCAPTCHA
RECAPTCHA_PUBLIC_KEY=your-recaptcha-public-key
RECAPTCHA_PRIVATE_KEY=your-recaptcha-private-key

# Redis/Celery
REDIS_URL=redis://localhost:6379/0

# File Storage (optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=us-east-1

# Backup settings
BACKUP_ENABLED=True
BACKUP_RETENTION_DAYS=30
```

## API Documentation

- **Swagger UI**: `/api/schema/swagger-ui/`
- **ReDoc**: `/api/schema/redoc/`
- **OpenAPI Schema**: `/api/schema/`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register admin user
- `POST /api/auth/login/` - Login admin user
- `POST /api/auth/verify-otp/` - Verify email with OTP

### Vehicles
- `GET /api/vehicles/` - List vehicles
- `POST /api/vehicles/` - Create vehicle (admin)
- `GET /api/vehicles/{id}/` - Get vehicle details

### Bookings
- `POST /api/claims/` - Submit claim
- `GET /api/claims/` - List claims (admin)
- `PATCH /api/claims/{id}/approve/` - Approve claim (admin)

### Analytics
- `GET /api/analytics/dashboard/summary/` - Dashboard summary
- `GET /api/analytics/dashboard/booking-trends/` - Booking trends
- `GET /api/analytics/dashboard/vehicle-usage/` - Vehicle usage stats

### Chatbot
- `POST /api/chatbot/message/` - Send message to chatbot
- `POST /api/chatbot/submit-lead/` - Submit lead from chatbot

### Newsletter
- `POST /api/newsletter/subscribe/` - Subscribe to newsletter
- `POST /api/newsletter/unsubscribe/` - Unsubscribe from newsletter

### Gallery
- `GET /api/gallery/images/` - List gallery images
- `POST /api/gallery/images/` - Upload image (admin)

## Testing

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
```

## Backup & Restore

### Automated Backups
The system includes automated daily backups when Celery beat is running.

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

## Deployment

### Production Checklist

- [ ] Set `DEBUG = False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set strong `SECRET_KEY`
- [ ] Configure PostgreSQL
- [ ] Set up Redis
- [ ] Configure email settings
- [ ] Set up SSL certificate
- [ ] Configure static/media file serving
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backup system

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is proprietary software.

## Support

For support, please contact the development team or create an issue in the repository.
