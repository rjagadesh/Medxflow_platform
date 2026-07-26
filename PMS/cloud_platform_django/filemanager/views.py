from django.shortcuts import get_object_or_404
from django.http import JsonResponse, FileResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from datetime import datetime
from pathlib import Path
import os, base64, zipfile, io, json
from .models import FileManager
import shutil
import stat
from django.db.models import Q
from projects.serializers import AssetDetails
from minutesofmeetings.models import MinutesOfMeetings
from rest_framework.decorators import api_view, permission_classes


MEDIA_SUBFOLDER = "filemanager"


def get_user_folder(user_id):
    """Ensure user folder exists"""
    folder_path = Path(settings.MEDIA_ROOT) / MEDIA_SUBFOLDER / str(user_id)
    folder_path.mkdir(parents=True, exist_ok=True)
    return folder_path



def to_windows_path(file_path: str):
        if not file_path:
            return file_path

        # Strip surrounding spaces
        file_path = file_path.strip()

        # Normalize OS-style path first
        normalized = os.path.normpath(file_path)

        # Force Windows slashes
        windows_path = normalized.replace("/", "\\")
        return windows_path


def get_child_folder_id(file_ids: list):
    full_child_list = []

    for file_id in file_ids:
        childs = FileManager.objects.filter(data__parent=file_id).values_list("id", flat=True)

        if childs:
            # recursively get children of these
            child_ids = list(childs)
            full_child_list.extend(child_ids)
            full_child_list.extend(get_child_folder_id(child_ids))
    
    return full_child_list
    

class FileManagerUpload(APIView):
    permission_classes = [IsAuthenticated]

    def get_unique_file(self, file_path: Path):
        """Ensure files in the same directory do not overwrite each other."""
        if not file_path.exists():
            return file_path

        counter = 1
        stem = file_path.stem       # filename without extension
        suffix = file_path.suffix   # .jpg / .png / .pdf 

        while True:
            new_name = f"{stem} {counter}{suffix}"
            new_path = file_path.parent / new_name
            if not new_path.exists():
                return new_path
            counter += 1


    def post(self, request):
        user = request.user
        parent = request.data.get("parent", "root")
        uploaded_files = request.FILES.getlist("files")
        folders = request.data.getlist("folders")
        relative_paths = request.data.getlist("relativePath")

        if not uploaded_files and not folders:
            return JsonResponse({"error": "No files or folders provided"}, status=400)

        base_folder = Path(get_user_folder(user.id))
        saved_files = []

        # ✅ Resolve parent directory
        parent_obj = None
        if parent != "root":
            parent_obj = FileManager.objects.filter(
                id=parent, data__file_type="folder"
            ).first()
            parent_path = Path(parent_obj.file_path) if parent_obj else base_folder
        else:
            parent_path = base_folder

        # ✅ STEP 1 — Create folders with auto-rename
        folder_map = {"root": None}
        first_unique_folder_abs = None
        for folder_rel in folders:
            folder_abs = parent_path / folder_rel
            if folder_rel == folders[0]:
                base_path = folder_rel
                first_unique_folder_abs = self.get_unique_file(Path(folder_abs))
                

            # ✅ Auto rename duplicate folder
            unique_folder_abs = self.get_unique_file(folder_abs)
            if first_unique_folder_abs.name in  folder_abs.parts:
                pass
            else:
                new_path = Path(*[ first_unique_folder_abs.name if part == base_path else part for part in folder_abs.parts ])
                unique_folder_abs = new_path

            unique_folder_abs.mkdir(parents=True, exist_ok=True)

            # ✅ IMPORTANT: replace original relative path with new one
            unique_folder_rel = unique_folder_abs.relative_to(parent_path)

            # ✅ Create each level of nested folders in DB
            parts = Path(unique_folder_rel).parts

            for i in range(1, len(parts) + 1):
                sub_rel = Path(*parts[:i])
                sub_abs = parent_path / sub_rel

                folder_rec = FileManager.objects.filter(
                    created_by=user, file_path=str(sub_abs)
                ).first()

                if not folder_rec:
                    # parent ID mapping
                    if i == 1:
                        parent_id = parent_obj.id if parent_obj else None
                    else:
                        parent_id = folder_map.get(str(Path(*parts[:i-1])))

                    folder_rec = FileManager.objects.create(
                        created_by=user,
                        file_path=str(sub_abs),
                        data={
                            "file_name": sub_rel.name,
                            "file_type": "folder",
                            "file_size": 0,
                            "last_modified": datetime.now().isoformat(),
                            "parent": parent_id if parent_id else "root",
                        },
                    )

                folder_map[str(sub_rel)] = folder_rec.id

        # ✅ STEP 2 — Save files under correct (renamed) folders
        for i, f in enumerate(uploaded_files):
            if first_unique_folder_abs:
                if first_unique_folder_abs.name in  [path for path in relative_paths] :
                    pass
                else:
                    relative_paths = [ part.replace(base_path, first_unique_folder_abs.name) if part.split("/")[0] == base_path else part for part in relative_paths ]
            

            rel_path_str = relative_paths[i] if i < len(relative_paths) else f.name
            relative_path_obj = Path(rel_path_str)

            # ✅ Every path should now map correctly to renamed folder
            file_path = parent_path / relative_path_obj

            # ✅ Make sure folder exists
            file_path.parent.mkdir(parents=True, exist_ok=True)

            # ✅ Ensure unique filename
            file_path = self.get_unique_file(file_path)


            # ✅ Write file
            with open(file_path, "wb") as out:
                for chunk in f.chunks():
                    out.write(chunk)

            # ✅ Find parent folder in map (now includes renamed folders)
            parent_folder_rel = str(relative_path_obj.parent)
            parent_id = (
                folder_map.get(parent_folder_rel)
                or (parent_obj.id if parent_obj else "root")
            )

            record = FileManager.objects.create(
                created_by=user,
                file_path=str(file_path),
                data={
                    "file_name": file_path.name,
                    "file_type": f.content_type,
                    "file_size": f.size,
                    "last_modified": datetime.now().isoformat(),
                    "parent": parent_id,
                },
            )

            saved_files.append({
                "id": record.id,
                "name": file_path.name,
                "path": str(file_path.relative_to(parent_path)),
                "type": "file",
                "mime": f.content_type,
                "size": f.size,
                "modified": datetime.now().isoformat(),
                "parent": parent_id,
            })

        return JsonResponse({
            "message": "Files and folders uploaded successfully with auto-rename",
            "files": saved_files
        })



class FileManagerList(APIView):
    """List all files and folders in a folder"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        parent = request.query_params.get("parent", "root")
        user = request.user

        # Get all files/folders for this user
        items = FileManager.objects.filter(created_by=user)
        data = []

        def get_folder_size(path: Path) -> int:
            """Returns total size of all files in a folder (non-recursive or recursive)."""
            total = 0
            if not path.exists():
                return 0

            # ✅ Recursive size calculation (walk children folders too)
            for root, dirs, files in os.walk(path):
                for f in files:
                    fp = Path(root) / f
                    if fp.exists():
                        total += fp.stat().st_size
            return total


        for item in items:
            meta = item.data or {}
            meta_parent = meta.get("parent", "root")
            base_path = Path(item.file_path, "")

            if meta.get("file_type") == "folder":
                size = get_folder_size(base_path)
                item_type = "folder"
            else:
                # ✅ get actual file size from disk
                size = base_path.stat().st_size if base_path.exists() else 0
                item_type = "file"


            if  str(meta_parent) == str(parent):
                data.append({
                    "id": item.id,
                    "name": meta.get("file_name"),
                    "type": item_type,
                    "mime": meta.get("file_type"),
                    "size": size if meta.get("file_type") == "folder" else meta.get("file_size"),
                    "modified": meta.get("last_modified"),
                    "parent": meta.get("parent"),
                })

        # ✅ Optional: show folders first, then files
        data.sort(key=lambda x: (x["type"] != "folder", x["name"].lower()))

        return JsonResponse(data, safe=False)


class FileManagerDelete(APIView):
    """Delete a file or folder and all its children (both on disk and in DB)"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, file_id):
        user = request.user
        # Get the file or folder record
        file_obj = get_object_or_404(FileManager, id=file_id, created_by=user)
        target_path = Path(file_obj.file_path)

        try:

            if target_path.exists():

                if target_path.is_dir():
                    shutil.rmtree(target_path)
                else:
                    target_path.unlink()

            base = str(target_path).rstrip("/\\")  # clean trailing slash
            prefix = base + os.sep                # adds "\" on windows OR "/" on linux

            FileManager.objects.filter(
                created_by=user
            ).filter(
                Q(file_path=base) | Q(file_path__startswith=prefix)
            ).delete()
            
            # ✅ Finally, delete this record too
            file_obj.delete()

            return JsonResponse({
                "message": f"✅ '{target_path.name}' and its children deleted successfully."
            })

        except PermissionError:
            return JsonResponse({
                "error": f"Permission denied for '{target_path}'. Close any open files and try again."
            }, status=403)

        except Exception as e:
            return JsonResponse({
                "error": str(e)
            }, status=500)



class FileManagerDownload(APIView):
    """Download one or multiple files/folders"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        try:
            file_ids = request.data.getlist("file_id")
        except:
            file_ids = request.data.get("file_id")

        if not file_ids:
            return JsonResponse({"error": "file_id missing"}, status=400)

        # Ensure file_ids is always a list
        if not isinstance(file_ids, list):
            file_ids = [file_ids]

        # Fetch all requested files owned by the user
        files = FileManager.objects.filter(id__in=file_ids, created_by=user)
        if not files.exists():
            return JsonResponse({"error": "No matching files found"}, status=404)

        # 🧩 CASE 1: Only one item selected
        if len(files) == 1:
            file_obj = files[0]
            file_path = Path(file_obj.file_path)

            if not file_path.exists():
                return JsonResponse({"error": "File not found"}, status=404)

            # If folder, zip it
            if file_path.is_dir():
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
                    for subpath in file_path.rglob("*"):
                        if subpath.is_file():
                            arcname = subpath.relative_to(file_path.parent)
                            zipf.write(subpath, arcname=str(arcname))

                zip_buffer.seek(0)
                response = HttpResponse(zip_buffer, content_type="application/zip")
                response["Content-Disposition"] = f'attachment; filename="{file_path.name}.zip"'
                return response

            # Otherwise, return file directly
            response = FileResponse(open(file_path, "rb"))
            response["Content-Disposition"] = f'attachment; filename="{file_path.name}"'
            return response

        # 🧩 CASE 2: Multiple items → create one combined ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
            for f in files:
                file_path = Path(f.file_path)
                if not file_path.exists():
                    continue

                if file_path.is_file():
                    # Add individual file
                    zipf.write(file_path, arcname=file_path.name)
                elif file_path.is_dir():
                    # Add folder recursively
                    for subpath in file_path.rglob("*"):
                        if subpath.is_file():
                            arcname = subpath.relative_to(file_path.parent)
                            zipf.write(subpath, arcname=str(arcname))

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer, content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="files_download.zip"'
        return response


class FileManagerCreateFolder(APIView):
    """Create a new folder"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        parent = request.data.get("parent", "root")
        folder_name = request.data.get("name")

        if not folder_name:
            return JsonResponse({"error": "Folder name is required"}, status=400)

        folder = get_user_folder(user.id)
        new_folder_path = folder / folder_name

        # Check if folder already exists
        if new_folder_path.exists():
            return JsonResponse({"error": "Folder already exists"}, status=400)

        # Create folder on filesystem
        new_folder_path.mkdir(parents=True, exist_ok=True)

        # Save folder metadata to DB
        record = FileManager.objects.create(
            created_by=user,
            file_path=str(new_folder_path),
            data={
                "file_name": folder_name,
                "file_type": "folder",
                "file_size": 0,
                "last_modified": datetime.now().isoformat(),
                "parent": parent,
            },
        )

        return JsonResponse({
            "message": "Folder created successfully",
            "folder": {
                "id": record.id,
                "name": folder_name,
                "type": "folder",
                "mime": "folder",
                "size": 0,
                "modified": datetime.now().isoformat(),
                "parent": parent,
            }
        })



class FileManagerListAll(APIView):
    """List all files and folders in a folder"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all files/folders for this user
        items = FileManager.objects.filter(created_by=user)
        data = []

        for item in items:
            meta = item.data or {}
            if meta.get("file_type") != "folder":
                data.append({
                    "id": item.id,
                    "name": meta.get("file_name"),
                    "type": "folder" if meta.get("file_type") == "folder" else "file",
                    "mime": meta.get("file_type"),
                    "size": meta.get("file_size"),
                    "modified": meta.get("last_modified"),
                    "parent": meta.get("parent"),
                })

        # ✅ Optional: show folders first, then files
        data.sort(key=lambda x: (x["type"] != "folder", x["name"].lower()))

        return JsonResponse(data, safe=False)



class DownloadAll(APIView):
    
    def post(self, request):
        user = request.user
        file_paths = request.data.get("file_paths")

        user_folder = get_user_folder(user.id)
        file_paths = [os.path.join(user_folder,file) for file in file_paths]

        if not file_paths:
            return JsonResponse({"error": "file_paths missing"}, status=400)

        # Convert all to windows paths
        file_paths = [to_windows_path(path) for path in file_paths]

        # Fetch ALL requested files
        file_objs = FileManager.objects.filter(
            created_by=user, file_path__in=file_paths
        )

        if not file_objs.exists():
            return JsonResponse({"error": "Files not found"}, status=404)

        # Collect IDs
        file_ids = list(file_objs.values_list("id", flat=True))
        print(file_ids)

        download_view = FileManagerDownload.as_view()

        # Clone original request
        new_request = request._request
        new_request.POST = request.POST.copy()
        new_request.POST.setlist("file_id", file_ids)   
        return download_view(new_request)



class DownloadOnlyFiles(APIView):
    def post(self, request):
        user = request.user
        file_paths = request.data.get("file_paths")

        user_folder = get_user_folder(user.id)
        file_paths = [os.path.join(user_folder,file) for file in file_paths]

        if not file_paths:
            return JsonResponse({"error": "file_paths missing"}, status=400)

        # Convert all to windows paths
        file_paths = [to_windows_path(path) for path in file_paths]

        # Fetch ALL requested files
        file_objs = FileManager.objects.filter(
            created_by=user, file_path__in=file_paths
        )

        if not file_objs.exists():
            return JsonResponse({"error": "Files not found"}, status=404)
        
        file_ids = list(file_objs.values_list("id", flat=True))

        full_ids = get_child_folder_id(file_ids)
        
        #get only files not folders
        all_files = (
            FileManager.objects
            .filter(id__in=full_ids)
            .exclude(data__file_type="folder")
            .values_list("id", flat=True)
        )

        download_view = FileManagerDownload.as_view()

        # Clone original request
        new_request = request._request
        new_request.POST = request.POST.copy()
        new_request.POST.setlist("file_id", all_files)  

        return download_view(new_request)


class FileManagerListFolder(APIView):
    """List all files and folders in a folder"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        file_paths = request.data.get("file_paths")
        if not file_paths:
            file_paths = [""]
        user_folder = get_user_folder(user.id)
        file_paths = [os.path.join(user_folder,file) for file in file_paths]

        if not file_paths:
            return JsonResponse({"error": "file_paths missing"}, status=400)

        # ✅ Fetch the requested file(s)
        file_objs = FileManager.objects.filter(
            created_by=user,
            file_path__in=file_paths
        )

        if not file_objs.exists():
            return JsonResponse({"error": "Files not found"}, status=404)

        # ✅ Get the single file ID (not as list)
        file_id = file_objs.values_list("id", flat=True).first()

        # ✅ Now get that specific file/folder’s children (instead of itself)
        items = FileManager.objects.filter(created_by=user, data__parent=file_id)

        data = []
        for item in items:
            meta = item.data or {}
            data.append({
                "id": item.id,
                "name": meta.get("file_name"),
                "type": meta.get("file_type", "file"),
                "mime": meta.get("file_type"),
                "size": meta.get("file_size"),
                "modified": meta.get("last_modified"),
                "parent": meta.get("parent"),
            })

        # ✅ Optional: show folders first, then files
        data.sort(key=lambda x: (x["type"] != "folder", x["name"].lower()))

        return JsonResponse(data, safe=False)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_smart_driver_view_count(request):
    user = request.user
    assetCount = AssetDetails.objects.filter(user__client=user.client).count()
    minutesOfMeetingsCount = MinutesOfMeetings.objects.filter(client=user.client).count()
    filesManagerCount = FileManager.objects.filter(created_by=user).count()
    files = FileManager.objects.filter(created_by=user)
    file_mime_types = []
    overall_memory_used = 0
    for item in files:
        meta = item.data or {}
        if meta.get("file_type") != "folder":
            overall_memory_used += meta.get("file_size")
            file_mime_types.append(meta.get("file_type"))

    return JsonResponse([{
                    "name": "DocuSpace",
                    "length": filesManagerCount,
                    "memory_used": overall_memory_used,
                    "file_mime_types": file_mime_types
                },
                {
                    "name": "Assets",
                    "length": assetCount
                },
                {
                    "name": "Minutes of Meetings",
                    "length": minutesOfMeetingsCount
                }], safe=False)
