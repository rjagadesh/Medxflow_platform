import os
import tempfile
from datetime import datetime

import google.generativeai as genai
from django.conf import settings
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

# Configure Gemini using the project setting
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


def _read_document_from_uploaded(uploaded_file):
    """Read content from an uploaded .txt or .docx file and return text."""
    name = (getattr(uploaded_file, "name", "") or "").lower()

    # Write to a temp file so python-docx can read it
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(name)[1] or "") as tmp:
        for chunk in uploaded_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        if name.endswith(".txt"):
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        elif name.endswith(".docx"):
            doc = Document(tmp_path)
            return "\n".join(p.text for p in doc.paragraphs)
        else:
            raise ValueError("Unsupported file format. Use .txt or .docx")
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


def _generate_mom_with_gemini(transcript_text: str) -> str:
    """Generate Minutes of Meeting text using Gemini API (adapted from your script)."""
    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    prompt = f"""
    Analyze the meeting transcript and create a SIMPLE and PRECISE Minutes of Meeting with EXACTLY 5 sections.

    Format EXACTLY like this:

    TITLE: [Meeting Topic – Brief Description]


    1. Purpose of the Meeting
    [1-2 sentences only - be clear and specific]

    2. Key Discussion Points
    2.1 [Topic Name]
    * [Point 1]
    * [Point 2]

    2.2 [Topic Name]
    * [Point 1]
    * [Point 2]

    3. Discussion on [Specific Topic]
    * [Key point 1]
    * [Key point 2]


    4. Conclusion
    * [Takeaway 1]
    * [Takeaway 2]
    * [Takeaway 3]

    CRITICAL RULES:
    - Keep it SIMPLE and PRECISE - no long paragraphs
    - Use ONLY 5 main sections (numbered 1-5)
    - Use * for bullet points, numbers for action items
    - Maximum 2-3 sub-sections under "Key Discussion Points"
    - Each point should be one clear sentence
    - NO markdown formatting, plain text only
    - Be specific, extract real names and details from transcript

    Transcript:
    {transcript_text}
    """

    resp = model.generate_content(prompt)
    try:
        return resp.text
    except AttributeError:
        return resp.candidates[0].content.parts[0].text


def _create_professional_document(mom_content: str, file_name: str) -> str:
    """Create a professionally formatted Word document and return its relative media path."""
    media_subdir = "minutes_of_meetings/input/"
    output_dir = os.path.join(settings.MEDIA_ROOT, media_subdir)
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, file_name)

    doc = Document()

    # Set margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Default font
    style = doc.styles["Normal"]
    font = style.font
    font.name = "Calibri"
    font.size = Pt(11)

    # Remove markdown formatting
    mom_content = mom_content.replace("**", "").replace("*", "*")  # keep bullets, drop bold markers

    lines = mom_content.split("\n")
    current_section = None
    in_action_items = False

    for raw_line in lines:
        original_line = raw_line
        line = raw_line.strip()
        if not line:
            continue

        # Title
        if line.startswith("TITLE:"):
            title_text = line.replace("TITLE:", "").strip()
            p = doc.add_paragraph()
            run = p.add_run(title_text)
            run.font.size = Pt(16)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0, 0, 0)
            p.paragraph_format.space_after = Pt(6)

        # Main numbered sections
        elif line.startswith(("1. ", "2. ", "3. ", "4. ", "5. ")):
            doc.add_paragraph()
            p = doc.add_paragraph()
            run = p.add_run(line)
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0, 0, 0)
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)

            if "1." in line or "Purpose" in line:
                current_section = "purpose"
                in_action_items = False
            elif "4." in line or "Conclusion" in line:
                current_section = "conclusion"
                in_action_items = False
            else:
                current_section = "content"
                in_action_items = False

        # Subsections like 2.1, 2.2
        elif len(line) > 3 and line[0].isdigit() and line[1] == "." and line[2].isdigit():
            p = doc.add_paragraph()
            run = p.add_run(line)
            run.font.bold = True
            run.font.size = Pt(11)
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.left_indent = Inches(0)

        # Action items numbered 1., 2., etc.
        elif in_action_items and len(line) > 2 and line[0].isdigit() and line[1] == "." and line[2] == " ":
            text = line[2:].strip()
            p = doc.add_paragraph(style="List Bullet")
            p.add_run(text)
            p.paragraph_format.left_indent = Inches(0.5)
            p.paragraph_format.space_after = Pt(3)

        # Regular bullets/content
        elif current_section in ["content", "action_items"]:
            leading_spaces = len(original_line) - len(original_line.lstrip())
            if line and not line.startswith(("TITLE", "DATE", "PARTICIPANTS", "For ")):
                p = doc.add_paragraph(style="List Bullet")
                p.add_run(line)
                if leading_spaces > 4:
                    p.paragraph_format.left_indent = Inches(0.5)
                else:
                    p.paragraph_format.left_indent = Inches(0.25)
                p.paragraph_format.space_after = Pt(3)

        # Purpose/Conclusion paragraphs
        elif current_section in ["purpose", "conclusion"]:
            if line and not line.startswith(("TITLE", "DATE", "PARTICIPANTS", "1.", "2.", "3.", "4.", "5.")):
                p = doc.add_paragraph()
                p.add_run(line)
                p.paragraph_format.left_indent = Inches(0)
                p.paragraph_format.space_after = Pt(6)
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Footer
    doc.add_paragraph()
    footer_para = doc.add_paragraph()
    footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer_run = footer_para.add_run(
        f"Generated on {datetime.now().strftime('%B %d, %Y')}"
    )
    footer_run.font.size = Pt(9)
    footer_run.font.color.rgb = RGBColor(128, 128, 128)
    footer_run.italic = True
    footer_para.paragraph_format.space_before = Pt(12)

    doc.save(output_path)

    # Return relative media path so you can build a URL
    return f"{media_subdir}/{os.path.basename(output_path)}"


def process_minutes_of_meeting(transcript_text: str = None, uploaded_file=None):
    """High-level helper: get transcript text, call Gemini, create DOCX.

    Returns (mom_text, relative_docx_path).
    """
    if not transcript_text and not uploaded_file:
        raise ValueError("Either transcript_text or uploaded_file must be provided")

    if not transcript_text and uploaded_file is not None:
        transcript_text = _read_document_from_uploaded(uploaded_file)

    mom_text = _generate_mom_with_gemini(transcript_text)

    file_name = f"MOM_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.docx"
    relative_path = _create_professional_document(mom_text, file_name)

    return mom_text, relative_path
