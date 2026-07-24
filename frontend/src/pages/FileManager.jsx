/**
 * File Manager — browse a tenant's folder tree, create folders, upload files,
 * download and delete. Finder-style: switch between Tile and List views and
 * sort by name / size / date. The view choice is remembered across sessions.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import api from "../api/client.js";
import { FolderIcon, GridIcon, ListIcon } from "../components/icons.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

function humanSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}
const ext = (name) => (name.split(".").pop() || "?").slice(0, 4).toUpperCase();
const dateOf = (d) => new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function FileManager() {
  const [data, setData] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // Finder-style view + sort (view is persisted).
  const [view, setView] = useState(() => localStorage.getItem("eirim_fm_view") || "tile");
  const [sortKey, setSortKey] = useState("name");
  usePageHeader("File Manager", "Organise and store your team's files securely.");

  function changeView(v) {
    setView(v);
    localStorage.setItem("eirim_fm_view", v);
  }

  function load(id = folderId) {
    const q = id ? `?folder=${id}` : "";
    api.get(`/files/browse/${q}`).then(({ data }) => setData(data)).catch(() => setData(null));
  }
  useEffect(() => { load(folderId); }, [folderId]);

  const sorted = useMemo(() => {
    if (!data) return { folders: [], files: [] };
    const byKey = (a, b) => {
      if (sortKey === "size") return (b.size || 0) - (a.size || 0);
      if (sortKey === "date") return new Date(b.created_at) - new Date(a.created_at);
      return a.name.localeCompare(b.name);
    };
    return {
      folders: [...data.folders].sort(byKey),
      files: [...data.files].sort(byKey),
    };
  }, [data, sortKey]);

  async function createFolder(event) {
    event.preventDefault();
    if (!newName.trim()) return;
    setError("");
    try {
      await api.post("/files/folders/", { name: newName.trim(), parent: folderId });
      setNewName("");
      setCreating(false);
      load();
    } catch {
      setError("Could not create folder.");
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (folderId) form.append("folder", folderId);
      await api.post("/files/", form, { headers: { "Content-Type": "multipart/form-data" } });
      load();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteFile(id) {
    if (!window.confirm("Delete this file?")) return;
    await api.delete(`/files/${id}/`);
    load();
  }
  async function deleteFolder(id) {
    if (!window.confirm("Delete this folder and everything in it?")) return;
    await api.delete(`/files/folders/${id}/`);
    load();
  }

  if (!data) return <p className="muted">Loading files…</p>;

  const empty = sorted.folders.length === 0 && sorted.files.length === 0;

  return (
    <>
      <div className="page-actions">
        <button className="btn btn--ghost" onClick={() => setCreating((v) => !v)}>+ New folder</button>
        <button className="btn btn--primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <input ref={fileRef} type="file" hidden onChange={upload} />
      </div>

      {/* Toolbar: breadcrumb + sort + view switch */}
      <div className="fm__toolbar">
        <div className="crumbs">
          <button className="crumb" onClick={() => setFolderId(null)}>Home</button>
          {data.breadcrumb.map((c) => (
            <span key={c.id} className="crumb-wrap">
              <span className="crumb-sep">/</span>
              <button className="crumb" onClick={() => setFolderId(c.id)}>{c.name}</button>
            </span>
          ))}
        </div>

        <div className="fm__viewbar">
          <label className="fm__sort">
            <span>Sort</span>
            <select className="field__input" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="size">Size</option>
            </select>
          </label>
          <div className="segmented">
            <button className={`segmented__btn ${view === "tile" ? "is-active" : ""}`}
              onClick={() => changeView("tile")} title="Tile view" aria-label="Tile view">
              <GridIcon width={17} height={17} />
            </button>
            <button className={`segmented__btn ${view === "list" ? "is-active" : ""}`}
              onClick={() => changeView("list")} title="List view" aria-label="List view">
              <ListIcon width={17} height={17} />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {creating && (
        <form className="fm__newfolder" onSubmit={createFolder}>
          <input className="field__input" autoFocus placeholder="Folder name"
            value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn btn--primary btn--sm">Create</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCreating(false)}>Cancel</button>
        </form>
      )}

      {empty ? (
        <div className="empty">
          <div className="empty__icon"><FolderIcon width={38} height={38} /></div>
          <h3 className="empty__title">This folder is empty</h3>
          <p className="muted">Create a folder or upload a file to get started.</p>
        </div>
      ) : view === "tile" ? (
        <TileView
          folders={sorted.folders} files={sorted.files}
          onOpen={setFolderId} onDeleteFolder={deleteFolder} onDeleteFile={deleteFile}
        />
      ) : (
        <ListView
          folders={sorted.folders} files={sorted.files}
          onOpen={setFolderId} onDeleteFolder={deleteFolder} onDeleteFile={deleteFile}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------ Tile view --- */
function TileView({ folders, files, onOpen, onDeleteFolder, onDeleteFile }) {
  return (
    <div className="fm__grid">
      {folders.map((f) => (
        <div key={`folder-${f.id}`} className="fm__item fm__item--folder" onDoubleClick={() => onOpen(f.id)}>
          <button className="fm__open" onClick={() => onOpen(f.id)}><FolderIcon width={30} height={30} /></button>
          <div className="fm__info">
            <button className="fm__name" onClick={() => onOpen(f.id)}>{f.name}</button>
            <span className="fm__meta">{f.item_count} item{f.item_count === 1 ? "" : "s"}</span>
          </div>
          <button className="fm__x" onClick={() => onDeleteFolder(f.id)} title="Delete folder">✕</button>
        </div>
      ))}
      {files.map((file) => (
        <div key={`file-${file.id}`} className="fm__item">
          <span className="fm__filetype">{ext(file.name)}</span>
          <div className="fm__info">
            <a className="fm__name" href={file.url} target="_blank" rel="noreferrer">{file.name}</a>
            <span className="fm__meta">{humanSize(file.size)}</span>
          </div>
          <button className="fm__x" onClick={() => onDeleteFile(file.id)} title="Delete file">✕</button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ List view --- */
function ListView({ folders, files, onOpen, onDeleteFolder, onDeleteFile }) {
  return (
    <div className="table-wrap fm__listwrap">
      <table className="table fm__list">
        <thead>
          <tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th><th></th></tr>
        </thead>
        <tbody>
          {folders.map((f) => (
            <tr key={`folder-${f.id}`} className="fm__row fm__row--folder" onDoubleClick={() => onOpen(f.id)}>
              <td>
                <button className="fm__row-name" onClick={() => onOpen(f.id)}>
                  <FolderIcon width={18} height={18} className="fm__row-icon" />
                  {f.name}
                </button>
              </td>
              <td className="muted">Folder</td>
              <td className="muted">{f.item_count} item{f.item_count === 1 ? "" : "s"}</td>
              <td className="muted">{dateOf(f.created_at)}</td>
              <td><button className="fm__x fm__x--static" onClick={() => onDeleteFolder(f.id)}>✕</button></td>
            </tr>
          ))}
          {files.map((file) => (
            <tr key={`file-${file.id}`} className="fm__row">
              <td>
                <a className="fm__row-name" href={file.url} target="_blank" rel="noreferrer">
                  <span className="fm__row-badge">{ext(file.name)}</span>
                  {file.name}
                </a>
              </td>
              <td className="muted">{ext(file.name)} file</td>
              <td className="muted">{humanSize(file.size)}</td>
              <td className="muted">{dateOf(file.created_at)}</td>
              <td><button className="fm__x fm__x--static" onClick={() => onDeleteFile(file.id)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
