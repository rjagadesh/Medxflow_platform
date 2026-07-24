/**
 * DataChart — dependency-free SVG charts for the Decision Engine chat.
 * Renders a chart spec ({type, x, y[], title}) over query rows. Supports
 * bar, line and pie. Values are coerced to numbers; long series are capped.
 */
const PALETTE = ["#1a5dad", "#3b82f6", "#e0a020", "#c0392b", "#7c5cd6", "#17c3b2"];
const CAP = 24;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function Legend({ items }) {
  if (items.length < 2) return null;
  return (
    <div className="dchart__legend">
      {items.map((it, i) => (
        <span key={it} className="dchart__legend-item">
          <i style={{ background: PALETTE[i % PALETTE.length] }} />
          {it}
        </span>
      ))}
    </div>
  );
}

function AxisChart({ chart, rows, kind }) {
  const data = rows.slice(0, CAP);
  const cats = data.map((r) => String(r[chart.x] ?? ""));
  const series = chart.y;
  const max = Math.max(1, ...data.flatMap((r) => series.map((s) => num(r[s]))));
  const W = 720, H = 240, padL = 44, padB = 34, padT = 10;
  const iw = W - padL - 12, ih = H - padB - padT;
  const step = iw / Math.max(1, data.length);
  const y = (v) => padT + ih - (num(v) / max) * ih;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dchart__svg" preserveAspectRatio="xMidYMid meet">
      {/* y gridlines */}
      {[0, 0.5, 1].map((f) => {
        const gy = padT + ih - f * ih;
        return (
          <g key={f}>
            <line x1={padL} y1={gy} x2={W - 12} y2={gy} stroke="#e3ebf5" strokeWidth="1" />
            <text x={padL - 6} y={gy + 3} textAnchor="end" fontSize="10" fill="#8aa0b8">
              {Math.round(max * f).toLocaleString()}
            </text>
          </g>
        );
      })}
      {/* series */}
      {series.map((s, si) => {
        const color = PALETTE[si % PALETTE.length];
        if (kind === "line") {
          const pts = data.map((r, i) => `${padL + step * i + step / 2},${y(r[s])}`).join(" ");
          return (
            <g key={s}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" />
              {data.map((r, i) => (
                <circle key={i} cx={padL + step * i + step / 2} cy={y(r[s])} r="3" fill={color} />
              ))}
            </g>
          );
        }
        const bw = (step * 0.72) / series.length;
        return (
          <g key={s}>
            {data.map((r, i) => {
              const h = padT + ih - y(r[s]);
              const x = padL + step * i + step * 0.14 + si * bw;
              return <rect key={i} x={x} y={y(r[s])} width={bw} height={Math.max(0, h)} rx="2" fill={color} />;
            })}
          </g>
        );
      })}
      {/* x labels */}
      {data.map((r, i) => (
        <text key={i} x={padL + step * i + step / 2} y={H - padB + 16}
          textAnchor="middle" fontSize="10" fill="#5a7590">
          {cats[i].length > 10 ? cats[i].slice(0, 9) + "…" : cats[i]}
        </text>
      ))}
    </svg>
  );
}

function PieChart({ chart, rows }) {
  const s = chart.y[0];
  const data = rows.slice(0, 8).map((r) => ({ label: String(r[chart.x] ?? ""), value: num(r[s]) }))
    .filter((d) => d.value > 0);
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const cx = 120, cy = 120, R = 100;
  let acc = 0;
  const arc = (frac) => {
    const a = 2 * Math.PI * frac - Math.PI / 2;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  };
  return (
    <div className="dchart__pie">
      <svg viewBox="0 0 240 240" className="dchart__svg" style={{ maxWidth: 260 }}>
        {data.map((d, i) => {
          const start = acc / total; acc += d.value; const end = acc / total;
          const [x1, y1] = arc(start); const [x2, y2] = arc(end);
          const large = end - start > 0.5 ? 1 : 0;
          return (
            <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={PALETTE[i % PALETTE.length]} stroke="#fff" strokeWidth="1.5" />
          );
        })}
      </svg>
      <ul className="dchart__pielegend">
        {data.map((d, i) => (
          <li key={i}>
            <i style={{ background: PALETTE[i % PALETTE.length] }} />
            <span>{d.label}</span>
            <strong>{((d.value / total) * 100).toFixed(0)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DataChart({ chart, rows }) {
  if (!chart || !rows?.length) return null;
  return (
    <div className="dchart">
      {chart.title && <div className="dchart__title">{chart.title}</div>}
      {chart.type === "pie" ? (
        <PieChart chart={chart} rows={rows} />
      ) : (
        <>
          <AxisChart chart={chart} rows={rows} kind={chart.type} />
          <Legend items={chart.y} />
        </>
      )}
    </div>
  );
}
