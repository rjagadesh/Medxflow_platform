from rest_framework import viewsets
from .models import Document
from .serializers import DocumentSerializer
from .models import FAQ
from .serializers import FAQSerializer
from rest_framework.pagination import PageNumberPagination
from django.contrib.postgres.search import TrigramSimilarity
from .models import FAQ
from django.shortcuts import render
from django.db.models import Q
import mimetypes, re
from django.http import StreamingHttpResponse, FileResponse, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
def stream_faq_video(request, pk):
    faq = get_object_or_404(FAQ, pk=pk)
    f = faq.video_file
    if not f:
        return HttpResponse(status=404)
    f.open('rb')
    file_size = f.size
    content_type = mimetypes.guess_type(f.name)[0] or 'application/octet-stream'

    range_header = request.headers.get('Range') or request.META.get('HTTP_RANGE')
    if not range_header:
        resp = FileResponse(f, content_type=content_type)
        resp['Accept-Ranges'] = 'bytes'
        resp['Content-Length'] = str(file_size)
        return resp

    m = re.match(r'bytes=(\d*)-(\d*)', range_header)
    if not m:
        return HttpResponse(status=416, headers={'Content-Range': f'bytes */{file_size}'})

    start_str, end_str = m.groups()
    if start_str == '' and end_str == '':
        return HttpResponse(status=416, headers={'Content-Range': f'bytes */{file_size}'})

    if start_str == '':
        # suffix-byte-range-spec: last N bytes
        length = int(end_str)
        if length <= 0:
            return HttpResponse(status=416, headers={'Content-Range': f'bytes */{file_size}'})
        start = max(file_size - length, 0)
        end = file_size - 1
    else:
        start = int(start_str)
        end = int(end_str) if end_str else file_size - 1

    if start >= file_size or end < start:
        return HttpResponse(status=416, headers={'Content-Range': f'bytes */{file_size}'})

    end = min(end, file_size - 1)
    chunk_size = 8192

    def file_iterator(_f, _start, _end, _chunk):
        try:
            _f.seek(_start)
            remaining = _end - _start + 1
            while remaining > 0:
                data = _f.read(min(_chunk, remaining))
                if not data:
                    break
                yield data
                remaining -= len(data)
        finally:
            try:
                _f.close()
            except Exception:
                pass

    resp = StreamingHttpResponse(file_iterator(f, start, end, chunk_size), status=206, content_type=content_type)
    resp['Content-Range'] = f'bytes {start}-{end}/{file_size}'
    resp['Accept-Ranges'] = 'bytes'
    resp['Content-Length'] = str(end - start + 1)
    return resp



class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Document.objects.all()
    def get_queryset(self):
        user = self.request.user
 
        queryset = Document.objects.filter(
            user=user
        ).order_by('-created_at')
 
        name = self.request.query_params.get('name')
 
        if name:
            queryset = queryset.filter(name__iexact=name)
 
        return queryset
 
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FAQPagination(PageNumberPagination):
    page_size = 10  # Set the number of items per page
    page_size_query_param = 'page_size'  # Allows the client to set the page size via query params
    max_page_size = 100  # Set a maximum limit for page size (optional)

def faq_search(request):
    query = request.GET.get('q', '')

    if query:
        # Fuzzy search on title and description
        faqs = FAQ.objects.annotate(
            title_similarity=TrigramSimilarity('title', query),
            description_similarity=TrigramSimilarity('description', query)
        ).filter(
            Q(title_similarity__gt=0.1) | Q(description_similarity__gt=0.1)
        ).order_by('-title_similarity', '-description_similarity')
    else:
        faqs = FAQ.objects.all()

    return render(request, 'faq_list.html', {'faqs': faqs})


class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.all().order_by('-created_at')
    serializer_class = FAQSerializer
    pagination_class = FAQPagination 
    
    def get_queryset(self):
        query = self.request.query_params.get('q', None)

        if query:
            faqs = FAQ.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )
        else:
            faqs = FAQ.objects.all()

        return faqs

