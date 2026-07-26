import base64
import uuid
import re
from lxml import html
from io import BytesIO

def extract_images_and_replace_sources(html_content):
    """
    Parses HTML content, finds img tags with base64 src,
    extracts the image data as attachments, and replaces the src with a CID.
    
    Returns:
        tuple: (modified_html_content, attachments_list)
    """
    if not html_content:
        return "", []

    try:
        # Parse HTML
        # wrapped in a div to ensure we have a root element if content is just text or multiple tags
        tree = html.fromstring(f"<div>{html_content}</div>")
    except Exception:
        # If parsing fails, return original content and no attachments
        return html_content, []

    attachments = []
    
    # XPath to find all img tags
    # We are looking for img tags where src starts with 'data:image/'
    images = tree.xpath('//img[starts-with(@src, "data:image/")]')
    
    for img in images:
        src = img.get('src')
        if not src:
            continue
            
        try:
            # Parse base64 string
            # Format: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAU...
            header, encoded = src.split(',', 1)
            content_type = header.split(':')[1].split(';')[0]
            extension = content_type.split('/')[1]
            
            # Generate a unique Content-ID
            cid = f"img_{uuid.uuid4().hex}"
            file_name = f"{cid}.{extension}"
            
            # Decode base64
            image_data = base64.b64decode(encoded)
            
            # Create attachment dictionary for MS Graph
            # For inline images, we need isInline=True and contentId
            attachment = {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": file_name,
                "contentType": content_type,
                "contentBytes": base64.b64encode(image_data).decode('utf-8'),
                "contentId": cid,
                "isInline": True
            }
            attachments.append(attachment)
            
            # Replace src with cid
            img.set('src', f"cid:{cid}")
            
        except Exception as e:
            # If extraction fails, skip this image
            print(f"Error processing image: {e}")
            continue
            
    # Serialize back to string
    # method='html' produces HTML, encoding='unicode' returns a string
    # We strip the outer <div> we added
    modified_html = html.tostring(tree, encoding='unicode', method='html')
    
    # Remove the wrapper div if it exists (it should)
    if modified_html.startswith('<div>') and modified_html.endswith('</div>'):
        modified_html = modified_html[5:-6]
        
    return modified_html, attachments
