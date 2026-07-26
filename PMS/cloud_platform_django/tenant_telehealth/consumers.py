import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import *
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.meeting_id = self.scope['url_route']['kwargs']['meeting_id']
        self.room_group_name = f'chat_{self.meeting_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected to meeting: {self.meeting_id}")
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket disconnected from meeting: {self.meeting_id}")
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'chat_message')
            
            if message_type == 'chat_message':
                # Save message to database
                message = await self.save_message(data)
                
                # Broadcast message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': {
                            'id': message.id,
                            'sender_name': message.sender_name,
                            'content': message.content,
                            'message_type': message.message_type,
                            'timestamp': message.timestamp.isoformat(),
                            'attendee_id': message.attendee.attendee_id if message.attendee else None
                        }
                    }
                )
            elif message_type == 'typing':
                # Broadcast typing indicator
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'attendee_name': data.get('attendee_name'),
                        'is_typing': data.get('is_typing', False)
                    }
                )
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'error': str(e)
            }))
    
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))
    
    async def typing_indicator(self, event):
        # Send typing indicator to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'attendee_name': event['attendee_name'],
            'is_typing': event['is_typing']
        }))
    
    async def system_message(self, event):
        # Send system message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'system_message',
            'message': event['message']
        }))
    
    @database_sync_to_async
    def save_message(self, data):
        try:
            meeting = TelehealthMeeting.objects.get(meeting_id=self.meeting_id)
            attendee = TelehealthAttendee.objects.get(
                attendee_id=data['attendee_id'],
                meeting=meeting
            )
            
            message = TelehealthChatMessage.objects.create(
                meeting=meeting,
                attendee=attendee,
                sender_name=data['sender_name'],
                content=data['content'],
                message_type=data.get('message_type', 'text'),
                file_url=data.get('file_url'),
                file_name=data.get('file_name')
            )
            return message
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            raise


class AudioCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.meeting_id = self.scope['url_route']['kwargs']['meeting_id']
        self.room_group_name = f'audio_call_{self.meeting_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"Audio call WebSocket connected to meeting: {self.meeting_id}")
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"Audio call WebSocket disconnected from meeting: {self.meeting_id}")
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            event_type = data.get('type')
            
            if event_type == 'mute_status':
                # Broadcast mute status change
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'mute_status_update',
                        'attendee_id': data.get('attendee_id'),
                        'attendee_name': data.get('attendee_name'),
                        'is_muted': data.get('is_muted')
                    }
                )
            
            elif event_type == 'audio_quality':
                # Update audio quality
                await self.update_audio_quality(
                    data.get('attendee_id'),
                    data.get('quality')
                )
                
            elif event_type == 'participant_joined':
                # Broadcast participant joined
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'participant_update',
                        'action': 'joined',
                        'attendee_id': data.get('attendee_id'),
                        'attendee_name': data.get('attendee_name')
                    }
                )
            
            elif event_type == 'participant_left':
                # Broadcast participant left
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'participant_update',
                        'action': 'left',
                        'attendee_id': data.get('attendee_id'),
                        'attendee_name': data.get('attendee_name')
                    }
                )
            
            elif event_type == 'request_participants':
                # Send current participants list
                participants = await self.get_active_participants()
                await self.send(text_data=json.dumps({
                    'type': 'participants_list',
                    'participants': participants
                }))
                
        except Exception as e:
            logger.error(f"Error in audio call receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def mute_status_update(self, event):
        # Send mute status update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'mute_status',
            'attendee_id': event['attendee_id'],
            'attendee_name': event['attendee_name'],
            'is_muted': event['is_muted']
        }))
    
    async def participant_update(self, event):
        # Send participant update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'participant_update',
            'action': event['action'],
            'attendee_id': event['attendee_id'],
            'attendee_name': event['attendee_name']
        }))
    
    async def audio_quality_update(self, event):
        # Send audio quality update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'audio_quality',
            'attendee_id': event['attendee_id'],
            'quality': event['quality']
        }))
    
    async def call_ended(self, event):
        # Send call ended notification
        await self.send(text_data=json.dumps({
            'type': 'call_ended',
            'message': event.get('message', 'Call has been ended'),
            'ended_by': event.get('ended_by')
        }))
    
    @database_sync_to_async
    def update_audio_quality(self, attendee_id, quality):
        try:
            session = TelehealthAudioCallSession.objects.filter(
                attendee__attendee_id=attendee_id,
                status='connected'
            ).first()
            
            if session:
                session.audio_quality = quality
                session.save()
        except Exception as e:
            logger.error(f"Error updating audio quality: {str(e)}")
    
    @database_sync_to_async
    def get_active_participants(self):
        try:
            meeting = TelehealthMeeting.objects.get(meeting_id=self.meeting_id)
            sessions = TelehealthAudioCallSession.objects.filter(
                meeting=meeting,
                status='connected'
            )
            
            participants = []
            for session in sessions:
                participants.append({
                    'attendee_id': session.attendee.attendee_id,
                    'attendee_name': session.attendee.attendee_name,
                    'is_muted': session.is_muted,
                    'audio_quality': session.audio_quality
                })
            
            return participants
        except Exception as e:
            logger.error(f"Error getting participants: {str(e)}")
            return []

