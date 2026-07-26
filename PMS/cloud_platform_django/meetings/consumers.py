import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Meeting, Attendee, ChatMessage, AudioCallSession
import logging
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent
import base64
import asyncio
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
            meeting = Meeting.objects.get(meeting_id=self.meeting_id)
            attendee = Attendee.objects.get(
                attendee_id=data['attendee_id'],
                meeting=meeting
            )
            
            message = ChatMessage.objects.create(
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
            session = AudioCallSession.objects.filter(
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
            meeting = Meeting.objects.get(meeting_id=self.meeting_id)
            sessions = AudioCallSession.objects.filter(
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


class TranscriptionHandler(TranscriptResultStreamHandler):
    """Handler for AWS Transcribe streaming results"""
    
    def __init__(self, consumer, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.consumer = consumer
        self.sequence = 0
        logger.info("TranscriptionHandler initialized")
    
    async def handle_transcript_event(self, transcript_event: TranscriptEvent):
        """Handle incoming transcription results"""
        logger.info(f"📥 Received transcript event from AWS")
        
        results = transcript_event.transcript.results
        logger.info(f"Number of results: {len(results)}")
        
        for result in results:
            logger.info(f"Result - is_partial: {result.is_partial}, has_alternatives: {len(result.alternatives) > 0}")
            
            if result.alternatives:
                transcript = result.alternatives[0].transcript
                
                logger.info(f"Transcript text: '{transcript}' (length: {len(transcript)})")
                
                if transcript.strip():  # Only process non-empty transcripts
                    is_final = not result.is_partial
                    
                    # Extract speaker label if available
                    speaker_label = "Speaker"
                    if hasattr(result, 'channel_id') and result.channel_id:
                        speaker_label = f"Speaker {result.channel_id}"
                    
                    # Check for speaker labels in items
                    if result.alternatives[0].items:
                        for item in result.alternatives[0].items:
                            if hasattr(item, 'speaker') and item.speaker:
                                speaker_label = f"spk_{item.speaker}"
                                break
                    
                    # Get confidence score
                    confidence = 0.0
                    if result.alternatives[0].items:
                        confidences = [
                            item.confidence 
                            for item in result.alternatives[0].items 
                            if hasattr(item, 'confidence') and item.confidence
                        ]
                        if confidences:
                            confidence = sum(confidences) / len(confidences)
                    
                    logger.info(f"✅ Sending caption: speaker={speaker_label}, text='{transcript}', is_final={is_final}, confidence={confidence}")
                    
                    # Save caption and send to client
                    await self.consumer.save_and_send_caption(
                        text=transcript,
                        speaker=speaker_label,
                        is_final=is_final,
                        confidence=confidence,
                        sequence=self.sequence
                    )
                    
                    self.sequence += 1
                else:
                    logger.debug("Skipping empty transcript")


class TranscriptionConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time transcription captions
    FIXED VERSION - Properly saves to database
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.transcribe_client = None
        self.stream = None
        self.handler = None
        self.is_transcribing = False
        self.meeting_id = None
    
    async def connect(self):
        """Accept WebSocket connection"""
        self.meeting_id = self.scope['url_route']['kwargs']['meeting_id']
        
        # Accept connection
        await self.accept()
        
        logger.info(f"✅ Client connected to transcription for meeting {self.meeting_id}")
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'meeting_id': self.meeting_id,
            'message': 'WebSocket connected successfully'
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnect"""
        if self.is_transcribing:
            await self.stop_transcription()
        
        logger.info(f"Client disconnected from transcription for meeting {self.meeting_id} (code: {close_code})")
    
    async def receive(self, text_data=None, bytes_data=None):
        """Receive audio data or commands from client"""
        try:
            # Handle JSON commands
            if text_data:
                data = json.loads(text_data)
                message_type = data.get('type')
                
                if message_type == 'start_transcription':
                    await self.start_transcription(data)
                
                elif message_type == 'stop_transcription':
                    await self.stop_transcription()
                
                elif message_type == 'audio_chunk':
                    # Audio sent as base64 in JSON
                    audio_base64 = data.get('audio')
                    if audio_base64:
                        audio_bytes = base64.b64decode(audio_base64)
                        await self.process_audio(audio_bytes)
                
                elif message_type == 'ping':
                    await self.send(text_data=json.dumps({
                        'type': 'pong',
                        'timestamp': data.get('timestamp')
                    }))
            
            # Handle binary audio data
            elif bytes_data:
                await self.process_audio(bytes_data)
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def start_transcription(self, data):
        """Initialize AWS Transcribe streaming"""
        try:
            if self.is_transcribing:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Transcription already active'
                }))
                return
            
            language_code = data.get('language', 'en-US')
            enable_speaker_id = data.get('enable_speaker_identification', True)
            
            logger.info(f"🎬 Starting transcription for meeting {self.meeting_id}")
            
            # Check if we should use mock mode (for testing without AWS)
            from django.conf import settings
            use_mock = getattr(settings, 'USE_MOCK_TRANSCRIPTION', False)
            
            if use_mock:
                logger.info("🎭 Using MOCK transcription mode (AWS not required)")
                self.is_transcribing = True
                
                await self.send(text_data=json.dumps({
                    'type': 'transcription_started',
                    'language': language_code,
                    'meeting_id': self.meeting_id,
                    'message': 'MOCK transcription ready - Audio will be simulated'
                }))
                
                # Start mock transcription
                asyncio.create_task(self.mock_transcription())
                return
            
            # Send status update
            await self.send(text_data=json.dumps({
                'type': 'status',
                'message': 'Initializing AWS Transcribe...'
            }))
            
            try:
                # Create Transcribe client
                logger.info("Creating Transcribe client...")
                self.transcribe_client = TranscribeStreamingClient(
                    region=getattr(settings, 'AWS_REGION', 'us-east-1')
                )
                
                logger.info("Starting stream transcription...")
                self.stream = await self.transcribe_client.start_stream_transcription(
                    language_code=language_code,
                    media_sample_rate_hz=16000,
                    media_encoding="pcm"
                )
                logger.info("✅ Stream transcription started successfully")
                
                logger.info("Setting up handler...")
                # Set up handler
                self.handler = TranscriptionHandler(self, self.stream.output_stream)
                
                # Start processing results in background
                logger.info("Starting event handler...")
                asyncio.create_task(self.handle_transcription_events())
                
                self.is_transcribing = True
                
                logger.info(f"✅ Transcription fully started for meeting {self.meeting_id}")
                
                await self.send(text_data=json.dumps({
                    'type': 'transcription_started',
                    'language': language_code,
                    'meeting_id': self.meeting_id,
                    'message': 'AWS Transcription is ready. Start speaking!'
                }))
                
            except ImportError as e:
                error_msg = "AWS Transcribe library not installed. Run: pip install amazon-transcribe"
                logger.error(error_msg)
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': error_msg
                }))
                
            except Exception as e:
                error_msg = f"AWS Transcribe initialization failed: {str(e)}"
                logger.error(error_msg, exc_info=True)
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': error_msg
                }))
            
        except Exception as e:
            logger.error(f"Error starting transcription: {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to start transcription: {str(e)}'
            }))
    
    async def stop_transcription(self):
        """Stop AWS Transcribe streaming"""
        try:
            logger.info(f"🛑 Stopping transcription for meeting {self.meeting_id}")
            
            if self.stream:
                await self.stream.input_stream.end_stream()
                self.stream = None
            
            self.transcribe_client = None
            self.handler = None
            self.is_transcribing = False
            
            # Finalize the transcript in database
            await self.finalize_transcript()
            
            logger.info(f"✅ Stopped transcription for meeting {self.meeting_id}")
            
            await self.send(text_data=json.dumps({
                'type': 'transcription_stopped',
                'meeting_id': self.meeting_id
            }))
            
        except Exception as e:
            logger.error(f"Error stopping transcription: {str(e)}", exc_info=True)
    
    async def process_audio(self, audio_bytes):
        """Send audio chunk to AWS Transcribe"""
        try:
            if not self.is_transcribing or not self.stream:
                logger.warning(f"Received audio but transcription not active")
                return
            
            logger.debug(f"Processing audio chunk: {len(audio_bytes)} bytes")
            
            # Send audio to Transcribe stream
            await self.stream.input_stream.send_audio_event(audio_chunk=audio_bytes)
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing audio: {str(e)}'
            }))
    
    async def save_and_send_caption(self, text, speaker, is_final, confidence, sequence):
        """
        FIXED: Save caption to database and send to client
        """
        try:
            logger.info(f"💬 Processing caption: text='{text}', is_final={is_final}")
            
            # IMPORTANT: Save to database using the fixed method
            caption_data = await self.save_caption_to_db(
                text=text,
                speaker=speaker,
                is_final=is_final,
                confidence=confidence,
                sequence=sequence
            )
            
            if caption_data:
                logger.info(f"✅ Caption saved to DB with ID: {caption_data.get('id')}")
            else:
                logger.error(f"❌ Failed to save caption to database!")
            
            # Prepare message for client
            message = {
                'type': 'caption',
                'caption': caption_data or {
                    'text': text,
                    'speaker': speaker,
                    'is_final': is_final,
                    'confidence': confidence,
                    'sequence': sequence
                }
            }
            
            # Send to client
            await self.send(text_data=json.dumps(message))
            logger.info(f"📤 Caption sent to client")
            
        except Exception as e:
            logger.error(f"❌ Error in save_and_send_caption: {str(e)}", exc_info=True)
    
    @database_sync_to_async
    def save_caption_to_db(self, text, speaker, is_final, confidence, sequence):
        """
        FIXED: Properly save caption to database
        This method creates/updates all necessary database records
        """
        try:
            from .models import LiveCaption, Meeting, MeetingTranscript, TranscriptSegment
            from django.utils import timezone
            
            logger.info(f"💾 Saving to database: meeting_id={self.meeting_id}, text='{text}'")
            
            # Step 1: Get or create Meeting
            meeting, created = Meeting.objects.get_or_create(
                meeting_id=self.meeting_id,
                defaults={
                    'title': f'Meeting {self.meeting_id}',
                    'status': 'active'
                }
            )
            
            if created:
                logger.info(f"✅ Created new meeting: {self.meeting_id}")
            else:
                logger.info(f"✅ Found existing meeting ID: {meeting.id}")
            
            # Step 2: Skip empty captions
            if not text or not text.strip():
                logger.warning(f"⚠️ Skipping empty caption")
                return None
            
            # Step 3: Save LiveCaption
            caption = LiveCaption.objects.create(
                meeting=meeting,
                text=text.strip(),
                speaker_label=speaker,
                is_final=is_final,
                confidence=confidence,
                sequence_number=sequence,
                timestamp=timezone.now()
            )
            
            logger.info(f"✅✅✅ LiveCaption SAVED! ID: {caption.id}, text: '{caption.text}'")
            
            # Step 4: If final, also save as TranscriptSegment
            if is_final:
                logger.info(f"📝 This is a final caption - saving as TranscriptSegment...")
                
                # Get or create MeetingTranscript
                transcript, transcript_created = MeetingTranscript.objects.get_or_create(
                    meeting=meeting,
                    defaults={
                        'status': 'processing',
                        'language': 'en-US',
                        'started_at': timezone.now()
                    }
                )
                
                if transcript_created:
                    logger.info(f"✅ Created new MeetingTranscript ID: {transcript.id}")
                else:
                    logger.info(f"✅ Using existing MeetingTranscript ID: {transcript.id}")
                
                # Calculate timing
                time_elapsed = (timezone.now() - transcript.started_at).total_seconds()
                
                # Get last segment to calculate start time
                last_segment = TranscriptSegment.objects.filter(
                    transcript=transcript
                ).order_by('-end_time').first()
                
                start_time = last_segment.end_time if last_segment else 0
                end_time = time_elapsed
                
                # Create TranscriptSegment
                segment = TranscriptSegment.objects.create(
                    transcript=transcript,
                    speaker_label=speaker,
                    text=text.strip(),
                    start_time=start_time,
                    end_time=end_time,
                    duration=end_time - start_time,
                    confidence=confidence,
                    words=[]
                )
                
                logger.info(f"✅✅✅ TranscriptSegment SAVED! ID: {segment.id}")
                
                # Update transcript statistics
                transcript.total_words += len(text.split())
                
                # Count unique speakers
                speaker_labels = TranscriptSegment.objects.filter(
                    transcript=transcript
                ).values_list('speaker_label', flat=True).distinct()
                transcript.total_speakers = len(set(speaker_labels))
                
                transcript.save()
                
                logger.info(f"✅ Updated transcript stats: {transcript.total_words} words, {transcript.total_speakers} speakers")
            
            # Step 5: Return caption data
            return {
                'id': caption.id,
                'text': caption.text,
                'speaker': caption.speaker_label,
                'is_final': caption.is_final,
                'confidence': caption.confidence,
                'sequence': caption.sequence_number,
                'timestamp': caption.timestamp.isoformat()
            }
            
        except Exception as e:
            import traceback
            logger.error(f"❌❌❌ DATABASE SAVE FAILED!")
            logger.error(f"Error: {str(e)}")
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            return None
    
    @database_sync_to_async
    def finalize_transcript(self):
        """Finalize transcript when transcription stops"""
        try:
            from .models import MeetingTranscript, Meeting, TranscriptSegment
            from django.utils import timezone
            
            logger.info(f"📋 Finalizing transcript for meeting {self.meeting_id}")
            
            meeting = Meeting.objects.get(meeting_id=self.meeting_id)
            transcript = MeetingTranscript.objects.filter(
                meeting=meeting,
                status='processing'
            ).first()
            
            if transcript:
                # Build full transcript text from segments
                segments = TranscriptSegment.objects.filter(
                    transcript=transcript
                ).order_by('start_time')
                
                full_text = []
                for segment in segments:
                    timestamp = self._format_timestamp(segment.start_time)
                    full_text.append(f"[{timestamp}] {segment.speaker_label}: {segment.text}")
                
                transcript.full_transcript = "\n\n".join(full_text)
                transcript.status = 'completed'
                transcript.completed_at = timezone.now()
                transcript.save()
                
                logger.info(f"✅ Finalized transcript ID: {transcript.id}")
                logger.info(f"   Total segments: {segments.count()}")
                logger.info(f"   Total words: {transcript.total_words}")
                
                # Trigger analysis (optional)
                try:
                    from .services import TranscriptionService
                    service = TranscriptionService()
                    service.extract_medical_keywords(transcript.id)
                    service.analyze_transcript(transcript.id)
                    logger.info(f"✅ Analysis completed for transcript {transcript.id}")
                except Exception as analysis_error:
                    logger.warning(f"⚠️ Analysis failed: {analysis_error}")
        
        except Exception as e:
            logger.error(f"Error finalizing transcript: {str(e)}", exc_info=True)
    
    def _format_timestamp(self, seconds):
        """Format seconds to HH:MM:SS"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    
    async def mock_transcription(self):
        """Mock transcription for testing without AWS"""
        logger.info("🎭 Starting mock transcription loop...")
        
        # Sample medical conversation phrases
        mock_phrases = [
            "Hello, how are you today?",
            "I'm experiencing some mild headache",
            "When did the symptoms start?",
            "About two days ago",
            "Any fever or nausea?",
            "No fever, just the headache",
            "Blood pressure is normal",
            "We'll prescribe some medication"
        ]
        
        phrase_index = 0
        
        try:
            # Wait a moment before starting
            await asyncio.sleep(2)
            
            while self.is_transcribing:
                phrase = mock_phrases[phrase_index % len(mock_phrases)]
                speaker = f"Speaker {(phrase_index % 2) + 1}"
                
                logger.info(f"🎭 Mock caption #{phrase_index + 1}: {phrase}")
                
                # Send partial caption first
                await self.save_and_send_caption(
                    text=phrase[:len(phrase)//2] + "...",
                    speaker=speaker,
                    is_final=False,
                    confidence=0.85,
                    sequence=phrase_index * 2
                )
                
                await asyncio.sleep(1.5)
                
                # Then send final caption
                await self.save_and_send_caption(
                    text=phrase,
                    speaker=speaker,
                    is_final=True,
                    confidence=0.95,
                    sequence=phrase_index * 2 + 1
                )
                
                phrase_index += 1
                
                # Wait before next caption
                await asyncio.sleep(3)
            
            logger.info("🎭 Mock transcription loop ended")
        
        except asyncio.CancelledError:
            logger.info("🎭 Mock transcription cancelled")
        except Exception as e:
            logger.error(f"❌ Error in mock transcription: {str(e)}", exc_info=True)
    
    async def handle_transcription_events(self):
        """Handle events from AWS Transcribe stream"""
        try:
            logger.info("🎧 Starting to listen for transcription events...")
            await self.handler.handle_events()
            logger.info("🎧 Event handler completed")
        except Exception as e:
            logger.error(f"❌ Error in event handler: {str(e)}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Transcription event handler error: {str(e)}'
            }))

            