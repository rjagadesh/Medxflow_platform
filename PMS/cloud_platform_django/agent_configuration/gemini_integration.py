from .prompt import prompt
from django.conf import settings
import google.generativeai as genai
import tempfile
import os
import mimetypes
from pathlib import Path

# make sure you've already configured your API key somewhere:
# genai.configure(api_key=settings.GEMINI_API_KEY)

def _upload_django_files_to_gemini(files):
    """
    Accepts a list of Django UploadedFile objects.
    Returns a list of genai File refs (attachments) and cleans up temp files.
    """
    uploaded_refs = []
    temp_paths = []

    try:
        for f in files:
            # Try to use Django-provided content type; fall back to guess by filename; then octet-stream
            mime = getattr(f, "content_type", None) or mimetypes.guess_type(getattr(f, "name", ""))[0] or "application/octet-stream"

            # Keep original extension so mime/clients can infer if needed
            suffix = Path(getattr(f, "name", "")).suffix or ""

            # Some uploads may be TemporaryUploadedFile (already on disk)
            # Prefer the existing disk path if available
            tmp_path = None
            if hasattr(f, "temporary_file_path"):
                try:
                    tmp_path = f.temporary_file_path()
                except Exception:
                    tmp_path = None

            # Otherwise write chunks to a NamedTemporaryFile
            if not tmp_path:
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    for chunk in f.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name
                    temp_paths.append(tmp_path)  # only our own files need cleanup

            # Upload with explicit MIME and a nice display_name
            uploaded = genai.upload_file(
                path=tmp_path,
                mime_type=mime,
                display_name=getattr(f, "name", Path(tmp_path).name),
            )
            uploaded_refs.append(uploaded)

        return uploaded_refs
    finally:
        # Clean up only temp files we created
        for p in temp_paths:
            try:
                os.unlink(p)
            except OSError:
                pass


def run_gemini_process(data, files=None):
    attachments = _upload_django_files_to_gemini(files) if files else []

    final_prompt = prompt(data)
    print("final_prompt", final_prompt)

    model = genai.GenerativeModel(model_name="gemini-2.0-flash")

    # ✅ Use generate_content directly
    if attachments:
        resp = model.generate_content(
            [
                final_prompt,
                *attachments
            ]
        )
    else:
        resp = model.generate_content(final_prompt)

    # Some SDK versions use .text, others use .candidates[0].content.parts[0].text
    try:
        response_text = resp.text
    except AttributeError:
        response_text = resp.candidates[0].content.parts[0].text

    return response_text, final_prompt




