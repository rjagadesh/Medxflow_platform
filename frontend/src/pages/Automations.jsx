/**
 * Automation Studio (#8, visual) — a node-based workflow builder.
 *
 * Left: a palette of every activity (workflow skill). Right: a canvas "play
 * area" (React Flow) where you drag activities in and connect them into a flow
 * chart. Each workflow (nodes + edges) is saved to an Automation's `graph`.
 * Legacy trigger→action automations open as a ready-made two-node flow.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

import api from "../api/client.js";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const nid = () => "n-" + Math.random().toString(36).slice(2, 9);

/* A single activity node with input (left) + output (right) connection points. */
function ActivityNode({ data }) {
  return (
    <div className={`flow-node flow-node--${data.kind || "skill"}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <span className="flow-node__kind">{data.kind === "trigger" ? "Trigger" : "Activity"}</span>
      <span className="flow-node__title">{data.label}</span>
      <Handle type="source" position={Position.Right} className="flow-handle" />
    </div>
  );
}
const nodeTypes = { activity: ActivityNode };

function Studio() {
  const [skills, setSkills] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [current, setCurrent] = useState(null);
  const [name, setName] = useState("Untitled workflow");
  const [active, setActive] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rf, setRf] = useState(null);
  const [saved, setSaved] = useState("");
  const wrapRef = useRef(null);

  usePageHeader("Automation Studio", "Drag activities onto the canvas and connect them into a workflow.");

  useEffect(() => {
    api.get("/skills/").then(({ data }) => setSkills(data));
    loadAutomations();
  }, []);

  function loadAutomations() {
    api.get("/automations/").then(({ data }) => setAutomations(data));
  }
  const skillName = (slug) => skills.find((s) => s.slug === slug)?.name || slug;

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/eirim");
      if (!raw || !rf) return;
      const item = JSON.parse(raw);
      const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setNodes((nds) =>
        nds.concat({
          id: nid(),
          type: "activity",
          position,
          data: { label: item.name, slug: item.slug, kind: nds.length === 0 ? "trigger" : "skill" },
        })
      );
      setSaved("");
    },
    [rf, setNodes]
  );

  function onDragStart(e, item) {
    e.dataTransfer.setData("application/eirim", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
  }

  function newWorkflow() {
    setCurrent(null);
    setName("Untitled workflow");
    setActive(true);
    setNodes([]);
    setEdges([]);
    setSaved("");
  }

  function openAutomation(a) {
    if (!a) return newWorkflow();
    setCurrent(a.id);
    setName(a.name);
    setActive(a.active);
    setSaved("");
    const g = a.graph && a.graph.nodes?.length ? a.graph : synthGraph(a);
    setNodes(g.nodes || []);
    setEdges(g.edges || []);
  }

  // Build a two-node flow from a legacy trigger->action automation.
  function synthGraph(a) {
    if (!a.trigger_skill && !a.action_skill) return { nodes: [], edges: [] };
    const n1 = { id: "n1", type: "activity", position: { x: 60, y: 140 },
      data: { label: skillName(a.trigger_skill), slug: a.trigger_skill, kind: "trigger" } };
    const n2 = { id: "n2", type: "activity", position: { x: 420, y: 140 },
      data: { label: skillName(a.action_skill), slug: a.action_skill, kind: "skill" } };
    return { nodes: [n1, n2], edges: [{ id: "e1-2", source: "n1", target: "n2", animated: true }] };
  }

  async function save() {
    // Strip transient React Flow fields before persisting.
    const cleanNodes = nodes.map(({ id, type, position, data }) => ({ id, type, position, data }));
    const cleanEdges = edges.map(({ id, source, target, animated }) => ({ id, source, target, animated }));
    const payload = { name: name || "Untitled workflow", active, graph: { nodes: cleanNodes, edges: cleanEdges } };
    if (cleanEdges[0]) {
      payload.trigger_skill = nodes.find((n) => n.id === cleanEdges[0].source)?.data?.slug || "";
      payload.action_skill = nodes.find((n) => n.id === cleanEdges[0].target)?.data?.slug || "";
    }
    if (current) await api.patch(`/automations/${current}/`, payload);
    else {
      const { data } = await api.post("/automations/", payload);
      setCurrent(data.id);
    }
    setSaved("Saved ✓");
    loadAutomations();
  }

  async function remove() {
    if (!current) return newWorkflow();
    if (!window.confirm("Delete this workflow?")) return;
    await api.delete(`/automations/${current}/`);
    newWorkflow();
    loadAutomations();
  }

  return (
    <>
      <div className="studio-bar">
        <select
          className="field__input" style={{ width: "auto" }}
          value={current || ""}
          onChange={(e) => openAutomation(automations.find((a) => a.id === Number(e.target.value)))}
        >
          <option value="">＋ New workflow</option>
          {automations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="field__input" style={{ maxWidth: 240 }} value={name}
          onChange={(e) => setName(e.target.value)} placeholder="Workflow name" />
        <label className="devtoggle" title="Active">
          <span className="devtoggle__label">Active</span>
          <input type="checkbox" className="devtoggle__input" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span className="devtoggle__track"><span className="devtoggle__thumb" /></span>
        </label>
        <div style={{ flex: 1 }} />
        {saved && <span className="muted">{saved}</span>}
        <button className="btn btn--ghost btn--sm" onClick={newWorkflow}>New</button>
        {current && <button className="btn btn--danger-ghost btn--sm" onClick={remove}>Delete</button>}
        <button className="btn btn--primary btn--sm" onClick={save}>Save workflow</button>
      </div>

      <div className="studio">
        <aside className="studio__palette">
          <div className="studio__palette-head">Activities</div>
          <p className="studio__hint">Drag onto the canvas, then drag between the dots to connect.</p>
          {skills.map((s) => (
            <div key={s.slug} className="palette-item" draggable
              onDragStart={(e) => onDragStart(e, { name: s.name, slug: s.slug })}>
              <span className="palette-item__grip">⋮⋮</span>
              {s.name}
            </div>
          ))}
        </aside>

        <div className="studio__canvas" ref={wrapRef} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onInit={setRf}
            nodeTypes={nodeTypes} fitView
            defaultEdgeOptions={{ animated: true }}
          >
            <Background gap={18} color="#d7e2f0" />
            <Controls />
            <MiniMap pannable zoomable nodeColor="#86b7de" />
          </ReactFlow>
          {nodes.length === 0 && (
            <div className="studio__empty">Drag an activity here to start building your workflow</div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Automations() {
  return (
    <ReactFlowProvider>
      <Studio />
    </ReactFlowProvider>
  );
}
