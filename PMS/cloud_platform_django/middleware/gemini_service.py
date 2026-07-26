# app/services/gemini_service.py
import os
import time
import google.generativeai as genai
from django.conf import settings
from .models import ClientAIUsage
from PIL import Image
import tiktoken
import tempfile
import subprocess
import asyncio
import aiofiles
from django.http import StreamingHttpResponse
from asgiref.sync import sync_to_async

genai.configure(api_key=settings.GEMINI_API_KEY)

def gemini_response(client, input_text):
    """Handles text-only requests."""
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
    chat = model.start_chat()
    response = chat.send_message(input_text)

    # Estimate tokens/cost (example: adjust per pricing docs)
    encoding = tiktoken.get_encoding("cl100k_base")
    prompt_tokens = len(encoding.encode(input_text))
    response_tokens = len(encoding.encode(response.text))
    total_tokens = prompt_tokens + response_tokens

    # Cost calculation (adjust per Gemini pricing)
    cost = total_tokens * 0.00001  

    # Save usage
    ClientAIUsage.objects.create(
        client=client,
        request_type="text",
        # prompt=input_text,
        # response_text=response.text,
        tokens_used=total_tokens,
        cost=cost,
    )

    return response.text

def convert_to_pdf(input_path):
    """Convert .doc or .docx → .pdf using LibreOffice synchronously."""
    output_dir = tempfile.mkdtemp()
    process = subprocess.Popen(
        ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir", output_dir, input_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    stdout, stderr = process.communicate()
    if process.returncode != 0:
        raise RuntimeError(f"LibreOffice failed: {stderr.decode()}")
    pdf_name = os.path.splitext(os.path.basename(input_path))[0] + ".pdf"
    pdf_path = os.path.join(output_dir, pdf_name)
    if not os.path.exists(pdf_path):
        raise FileNotFoundError("LibreOffice failed to produce a PDF")
    return pdf_path


def gemini_vision_response(client, prompt_text, uploaded_files):
    """
    Synchronous version: gets full Gemini text response at once.
    Supports multiple attachments and DOC/DOCX → PDF conversion.
    """
    model = genai.GenerativeModel("gemini-2.0-flash")
    uploaded_gemini_files = []
    temp_paths = []
    total_response_text = ""

    try:
        # --- Handle all uploads ---
        for file_obj in uploaded_files:
            if isinstance(file_obj, Image.Image):
                uploaded_gemini_files.append(file_obj)
                continue

            suffix = os.path.splitext(file_obj.name)[1].lower()
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                tmp_file.write(file_obj.read())
                tmp_path = tmp_file.name
                temp_paths.append(tmp_path)

            if suffix in [".doc", ".docx"]:
                pdf_path = convert_to_pdf(tmp_path)
                temp_paths.append(pdf_path)
                tmp_path = pdf_path

            genai_file = genai.upload_file(path=tmp_path)
            while genai_file.state.name == "PROCESSING":
                time.sleep(1)
                genai_file = genai.get_file(genai_file.name)
            if genai_file.state.name == "FAILED":
                raise ValueError(f"Gemini failed to process {file_obj.name}")

            uploaded_gemini_files.append(genai_file)

        # --- Get full Gemini output ---
        response = model.generate_content([prompt_text] + uploaded_gemini_files)
        if response.candidates and response.candidates[0].content.parts:
            total_response_text = response.candidates[0].content.parts[0].text

        # --- Log usage ---
        encoding = tiktoken.get_encoding("cl100k_base")
        total_tokens = len(encoding.encode(prompt_text)) + len(encoding.encode(total_response_text))
        cost = total_tokens * 0.00002
        ClientAIUsage.objects.create(
            client=client, request_type="vision", tokens_used=total_tokens, cost=cost
        )

        # --- Cleanup ---
        for gem_file in uploaded_gemini_files:
            if hasattr(gem_file, "name"):
                genai.delete_file(gem_file.name)
        for path in temp_paths:
            try:
                os.remove(path)
            except Exception:
                pass

        return {"response": total_response_text}

    except Exception as e:
        # Cleanup on error
        for gem_file in uploaded_gemini_files:
            if hasattr(gem_file, "name"):
                try:
                    genai.delete_file(gem_file.name)
                except Exception:
                    pass
        for path in temp_paths:
            try:
                os.remove(path)
            except Exception:
                pass
        raise e