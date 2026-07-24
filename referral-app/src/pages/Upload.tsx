import { useRef, useState } from "react";
import { UploadCloud, FileText, X, CheckCircle2, Trash2 } from "lucide-react";
import { Card } from "../components/ui/primitives";

interface Item { id: string; name: string; sizeKb: number; progress: number; }

export default function Upload() {
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function add(files: FileList | null) {
    if (!files) return;
    const next: Item[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${f.name}`, name: f.name, sizeKb: Math.round(f.size / 1024), progress: 0,
    }));
    setItems((cur) => [...cur, ...next]);
  }
  function upload() {
    setItems((cur) => cur.map((i) => ({ ...i, progress: 100 })));
  }
  function clearDone() { setItems((cur) => cur.filter((i) => i.progress < 100)); }
  function remove(id: string) { setItems((cur) => cur.filter((i) => i.id !== id)); }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">{items.length} file(s) queued · supports PDF, TIFF, PNG, JPG</span>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost btn-sm" onClick={clearDone}><Trash2 size={14} /> Clear completed</button>
          <button className="btn-primary btn-sm" onClick={upload} disabled={!items.length}><UploadCloud size={15} /> Upload</button>
        </div>
      </div>

      <Card>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 transition ${drag ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10" : "border-slate-300 dark:border-slate-700"}`}>
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <UploadCloud size={26} />
          </span>
          <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-200">Drag &amp; drop files here, or click to browse</p>
          <p className="mt-1 text-sm text-slate-400">PDF, TIFF and image formats · multiple files supported</p>
          <input ref={inputRef} type="file" hidden multiple accept=".pdf,.tif,.tiff,.png,.jpg,.jpeg" onChange={(e) => add(e.target.files)} />
        </div>
      </Card>

      {items.length > 0 && (
        <Card>
          <div className="section-title mb-3">Queue</div>
          <div className="space-y-2">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                <FileText size={18} className="text-brand-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{i.name}</span>
                    <span className="text-xs text-slate-400">{i.sizeKb} KB</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${i.progress}%` }} />
                  </div>
                </div>
                {i.progress === 100
                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                  : <button onClick={() => remove(i.id)} className="text-slate-400 hover:text-rose-500"><X size={16} /></button>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
