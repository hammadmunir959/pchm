from django.urls import path
from theming import views

app_name = 'theming'

urlpatterns = [
    path('active-theme/', views.active_theme_api, name='active-theme'),
    path('preview-theme/', views.preview_theme_api, name='preview-theme'),
    path('themes/', views.list_themes_api, name='list-themes'),  # GET - list all, POST - create
    path('themes/<str:theme_key>/', views.get_theme_api, name='get-theme'),  # GET - get one, PATCH - update
    path('events/', views.list_events_api, name='list-events'),  # GET - list all, POST - create
    path('events/<int:event_id>/', views.update_event_api, name='update-event'),  # PATCH - update, DELETE - delete
]

