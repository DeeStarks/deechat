from django.urls import path

from .views import ChatConsumer, AcknowledgementConsumer, TokenView

ws_urlpatterns = [
    path('ws/chat/<str:token>', ChatConsumer.as_asgi()),
    path('ws/ack/<str:token>', AcknowledgementConsumer.as_asgi()),
]

urlpatterns = [
    path('tokens/<str:sender>/<str:receiver>', TokenView.as_view()),
]
