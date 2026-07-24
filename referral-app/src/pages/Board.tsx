import { useState } from "react";
import {
  DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  DragOverlay, type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useStore } from "../lib/store";
import { STATUSES, STATUS_COLOR, canTransition } from "../lib/constants";
import { Tag } from "../components/ui/primitives";
import type { Referral, Status } from "../types";

export default function Board() {
  const { referrals, moveStatus } = useStore();
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [dragId, setDragId] = useState<number | null>(null);
  const [toast, setToast] = useState<string>("");

  const active = referrals.find((r) => r.id === dragId) || null;

  function onDragStart(e: DragStartEvent) { setDragId(Number(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setDragId(null);
    const ref = referrals.find((r) => r.id === Number(e.active.id));
    const to = e.over?.id as Status | undefined;
    if (!ref || !to || ref.status === to) return;
    if (canTransition(ref.status, to)) {
      moveStatus(ref.id, to);
    } else {
      setToast(`Invalid transition: ${ref.status} → ${to}`);
      setTimeout(() => setToast(""), 2600);
    }
  }

  return (
    <div className="relative">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white shadow-lg">
          <AlertTriangle size={16} /> {toast}
        </div>
      )}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="scroll-thin flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <Column key={status} status={status}
              items={referrals.filter((r) => r.status === status)}
              onOpen={(id) => navigate(`/referrals/${id}`)} validFrom={active?.status} />
          ))}
        </div>
        <DragOverlay>{active && <CardBody r={active} dragging />}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, items, onOpen, validFrom }: { status: Status; items: Referral[]; onOpen: (id: number) => void; validFrom?: Status }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const droppable = validFrom ? canTransition(validFrom, status) : true;
  return (
    <div ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-xl border bg-slate-50 dark:bg-slate-900/50 ${isOver && droppable ? "border-brand-400 ring-2 ring-brand-400/30" : isOver ? "border-rose-300" : "border-slate-200 dark:border-slate-800"} ${validFrom && !droppable ? "opacity-50" : ""}`}
      style={{ borderTop: `3px solid ${STATUS_COLOR[status]}` }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{status}</span>
        <span className="rounded-full bg-white px-1.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{items.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2" style={{ maxHeight: "calc(100vh - 220px)" }}>
        {items.map((r) => <DraggableCard key={r.id} r={r} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function DraggableCard({ r, onOpen }: { r: Referral; onOpen: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: r.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      onClick={() => onOpen(r.id)}
      className={`${isDragging ? "opacity-30" : ""}`}>
      <CardBody r={r} />
    </div>
  );
}

function CardBody({ r, dragging }: { r: Referral; dragging?: boolean }) {
  const overdue = new Date(r.slaDue) < new Date("2026-07-20T12:00:00Z") && r.status !== "Completed";
  return (
    <div className={`cursor-grab rounded-lg border border-slate-200 bg-white p-2.5 shadow-soft dark:border-slate-700 dark:bg-slate-800 ${dragging ? "rotate-2 shadow-card" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-100">{r.patientName}</span>
        {overdue && <span className="rounded bg-rose-100 px-1 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">OVERDUE</span>}
      </div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.specialty} · {r.source}</div>
      <div className="mt-2 flex items-center gap-1.5">
        <Tag>{r.docType}</Tag>
        <span className="text-[10px] font-mono text-slate-400">#{r.id}</span>
      </div>
    </div>
  );
}
