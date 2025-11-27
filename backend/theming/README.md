# Theming App

Dynamic event-based theming system that automatically changes UI elements (colors, banners, icons, animations, popups) based on active events.

## Overview

The theming system allows you to:
- Create events with associated themes
- Automatically apply themes based on date ranges
- Preview themes before making them active
- Support recurring yearly events
- Handle overlapping events with priority

## Features

- **Event-Based Theming**: Themes are activated based on event date ranges
- **Priority System**: When events overlap, higher priority events take precedence
- **Recurring Events**: Support for yearly recurring events (e.g., Christmas every year)
- **Preview Mode**: Admins can preview themes without affecting other users
- **Caching**: Efficient caching for theme resolution
- **Admin Interface**: Easy-to-use admin interface for managing events and themes

## Installation

The theming app is already installed in `INSTALLED_APPS`. No additional installation required.

## Configuration

### Theme Configuration

Themes are defined in `backend/config/themes.py`. Each theme includes:
- `name`: Display name
- `primary_color`: Primary theme color (hex)
- `secondary_color`: Secondary theme color (hex)
- `banner`: Path to banner image
- `icons_path`: Path to icons directory
- `animations`: List of animation types
- `popup`: Popup configuration (title, content) or None

### Available Themes

- `christmas`: Christmas theme
- `valentine`: Valentine's Day theme
- `eid`: Eid theme
- `black_friday`: Black Friday theme
- `new_year`: New Year theme
- `default`: Default theme (always available)

## Usage

### Creating Events

1. Go to Django Admin → Theming → Events
2. Click "Add Event"
3. Fill in:
   - **Name**: Event name (e.g., "Christmas 2024")
   - **Slug**: URL-friendly identifier
   - **Start Date**: When the event starts
   - **End Date**: When the event ends
   - **Theme**: Select a theme
   - **Priority**: Higher priority wins when events overlap
   - **Active**: Enable/disable the event
   - **Recurring Yearly**: Check if event should repeat each year

### Preview Mode

1. Go to Django Admin → Theming → Events
2. Click "🎨 Theme Selector" button
3. Click "Preview Theme" on any theme card
4. Visit the frontend to see the preview
5. Only your session will see the preview

### Management Commands

#### Warm Theme Cache

```bash
python manage.py update_theme_cache
```

Options:
- `--clear`: Clear cache before warming
- `--days N`: Pre-cache themes for next N days

Example:
```bash
# Warm cache for today and next 7 days
python manage.py update_theme_cache --days 7
```

## API Endpoints

### Get Active Theme

**Endpoint**: `GET /api/theming/active-theme/`

**Response**:
```json
{
  "theme_key": "christmas",
  "theme": {
    "name": "Christmas",
    "primary_color": "#C4122E",
    "secondary_color": "#0B6B3A",
    "banner": "themes/christmas/banner.jpg",
    "icons_path": "themes/christmas/icons/",
    "animations": ["snow", "string-lights"],
    "popup": {
      "title": "Merry Christmas!",
      "content": "Enjoy our festive offers 🎄"
    }
  },
  "event": {
    "name": "Christmas 2024",
    "slug": "christmas-2024"
  }
}
```

## Adding New Themes

1. **Add theme configuration** in `backend/config/themes.py`:
```python
"new_theme": {
    "name": "New Theme",
    "primary_color": "#FF0000",
    "secondary_color": "#00FF00",
    "banner": "themes/new_theme/banner.jpg",
    "icons_path": "themes/new_theme/icons/",
    "animations": ["sparkles"],
    "popup": {
        "title": "New Theme!",
        "content": "Welcome to the new theme"
    }
}
```

2. **Add theme choice** in `backend/theming/models.py`:
```python
THEME_CHOICES = [
    # ... existing themes
    ('new_theme', 'New Theme'),
]
```

3. **Create static assets**:
   - Banner: `backend/staticfiles/themes/new_theme/banner.jpg`
   - Icons: `backend/staticfiles/themes/new_theme/icons/`

4. **Run migrations** (if needed):
```bash
python manage.py makemigrations theming
python manage.py migrate theming
```

## Frontend Integration

The frontend automatically:
- Fetches active theme on page load
- Applies CSS variables for theme colors
- Displays theme banner
- Shows theme animations
- Displays theme popup (once per session)

### CSS Variables

The theme system sets these CSS variables:
- `--theme-primary`: Primary theme color
- `--theme-secondary`: Secondary theme color

Use in your CSS:
```css
.my-element {
  color: var(--theme-primary);
  background: var(--theme-secondary);
}
```

### Theme Classes

The body element gets a class based on the active theme:
- `theme-christmas`
- `theme-valentine`
- `theme-eid`
- etc.

Use in your CSS:
```css
.theme-christmas .my-element {
  /* Christmas-specific styles */
}
```

## Testing

### Backend Tests

```bash
python manage.py test theming
```

Tests cover:
- Event model validation
- Theme resolution logic
- Priority handling
- Recurring events
- Cache functionality
- API endpoints

### Frontend Tests

```bash
npm test
```

Tests cover:
- Theme API service
- Theme context/provider
- Theme components

## Feature Flag

The theming system can be disabled via feature flag:

```python
# In settings/base.py
THEMING_ENABLED = False  # Disable theming
```

When disabled, the system always returns the default theme.

## Troubleshooting

### Theme not applying

1. Check if an event is active and covers today's date
2. Verify the event is marked as "Active"
3. Check cache: `python manage.py update_theme_cache --clear`
4. Verify theme exists in `config/themes.py`

### Preview not working

1. Ensure you're logged in as staff/admin
2. Check session storage in browser
3. Clear browser cache and cookies

### Cache issues

Clear cache manually:
```bash
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

## Performance

- Theme resolution is cached for 5 minutes
- Cache key: `active_theme_event_{date}`
- Use management command to pre-warm cache
- Frontend refreshes theme every 5 minutes

## Security

- Theme selector requires staff/admin access
- Preview mode is session-based (non-destructive)
- API endpoint is public (read-only)
- No sensitive data exposed

## Future Enhancements

- User-specific theme preferences
- A/B testing support
- Theme analytics
- Scheduled theme changes
- Multi-language theme support
- Theme templates/export system

## Support

For issues or questions, contact the development team or check the main project documentation.

