from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet)
router.register(r'context', views.ChatbotContextViewSet)
router.register(r'settings', views.ChatbotSettingsViewSet, basename='chatbot-settings')

app_name = 'chatbot'

urlpatterns = [
    path('', include(router.urls)),
    path('message/', views.chatbot_message, name='chatbot_message'),
    path('messages/', views.get_conversation_messages, name='get_conversation_messages'),
]
