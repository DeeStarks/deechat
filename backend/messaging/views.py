import datetime
import json
import jwt
import uuid

from channels.generic.websocket import AsyncWebsocketConsumer
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views import View

# Create your views here.
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # the token is a JWT that contains the user's API key and the room/receiver 
        # of the message
        token = self.scope['url_route']['kwargs']['token']
        try:
            decoded = jwt.decode(token, 'insecure_secret', algorithms=['HS256'])
        except jwt.exceptions.DecodeError:
            self.close()
            return
        
        # check that the token hasn't expired
        if datetime.datetime.utcnow() > datetime.datetime.fromtimestamp(decoded['exp']):
            self.close()
            return

        if 'snd' not in decoded or 'rcv' not in decoded or 'exp' not in decoded:
            self.close()
            return
        
        self.room_name = decoded['rcv']
        # sort the sender and receiver so that the room group name is always the same
        # regardless of who is sending the message
        # e.g. if the sender is 'user1' and the receiver is 'user2', the room group name
        # will be 'chat__user1_user2'
        # if the sender is 'user2' and the receiver is 'user1', the room group name
        # will still be 'chat__user1_user2'
        group_name = sorted([decoded['snd'], decoded['rcv']])
        self.room_group_name = f'chat__{group_name[0]}_{group_name[1]}'

        # join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender = data['sender']

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'chat_message',
            'id': str(uuid.uuid4()),
            'sender': sender,
            'message': message,
            'timestamp': timezone.now().isoformat()
        })

    async def chat_message(self, event):
        id = event['id']
        message = event['message']
        sender = event['sender']
        timestamp = event['timestamp']

        await self.send(text_data=json.dumps({
            'id': id,
            'message': message,
            'sender': sender,
            'timestamp': timestamp
        }))

class AcknowledgementConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope['url_route']['kwargs']['token']
        try:
            decoded = jwt.decode(token, 'insecure_secret', algorithms=['HS256'])
        except jwt.exceptions.DecodeError:
            self.close()
            return
        
        if datetime.datetime.utcnow() > datetime.datetime.fromtimestamp(decoded['exp']):
            self.close()
            return

        if 'snd' not in decoded or 'rcv' not in decoded or 'exp' not in decoded:
            self.close()
            return
        
        self.room_name = decoded['snd']
        group_name = sorted([decoded['snd'], decoded['rcv']])
        self.room_group_name = f'ack__{group_name[0]}_{group_name[1]}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_id = data['message_id']
        read_by = data['read_by']

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'ack_message',
            'read_by': read_by,
            'message_id': message_id,
        })

    async def ack_message(self, event):
        read_by = event['read_by']
        message_id = event['message_id']

        await self.send(text_data=json.dumps({
            'read_by': read_by,
            'message_id': message_id,
        }))

class TokenView(View):
    """This view is used to exchange a user's API key for a short-lived token that can 
    be used to connect to the websocket.

    To connect to the websocket, the user must first make a POST request to this view, 
    passing their API key in the body of the request. The view will then return a token 
    that can be used to connect to the websocket.

    We'll use a static API key of ABC123456789 for this assessment. In a real application, 
    we would use a more secure method of authentication.

    Also for this assessment, the API key will be checked here in the view layer. In a 
    real application, we would use a middleware to check the API key.
    """

    def _allow_cors(self, response):
        """Adds CORS headers to the response. Normally we would use a middleware to do this.

        Args:
            response (HttpResponse): The response object.

        Returns:
            HttpResponse: The updated response object with CORS headers.
        """
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'OPTIONS, POST'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Api-Key'
        return response

    def post(self, request, sender, receiver):
        """Exchanges a user's API key for a short-lived token.

        Args:
            request (HttpRequest): The request object.
            sender (str): The sender of the message.
            receiver (str): The receiver of the message.

        Returns:
            HttpResponse: The response object.
        """
        api_key = request.headers.get('Api-Key')
        if api_key != 'ABC123456789':
            return JsonResponse({'error': 'Invalid API key.'}, status=401)

        # the token will expire in 1 hour
        exp = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        
        encoded = jwt.encode({
            'snd': sender,
            'rcv': receiver,
            'exp': exp

        }, 'insecure_secret', algorithm='HS256')

        response = JsonResponse({'token': encoded}, status=200)
        return self._allow_cors(response)

    def options(self, request, sender, receiver):
        """Handles preflight requests.

        Args:
            request (HttpRequest): The request object.
            sender (str): The sender of the message.
            receiver (str): The receiver of the message.

        Returns:
            HttpResponse: The response object.
        """
        response = JsonResponse({}, status=200)
        return self._allow_cors(response)
