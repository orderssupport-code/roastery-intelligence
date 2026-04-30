import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Coffee,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertOctagon,
  DollarSign,
  ShoppingBag,
  Users,
  Sun,
  Moon,
  Filter,
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  Activity,
  Target,
  ChevronRight,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Building2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
// ─────────────────────────────────────────────────────────────────────────────
// DATA LOADER — fetches /data.json (served as a static asset).
// In production, the host (GitHub Pages / Vercel / Netlify) gzips this
// automatically, so transfer is ~130 KB even though the file is ~1.1 MB.
// ─────────────────────────────────────────────────────────────────────────────
async function loadData() {
  // import.meta.env.BASE_URL works for Vite; falls back to "/" otherwise.
  const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";
  const res = await fetch(`${base}data.json`);
  if (!res.ok) throw new Error(`Failed to load data.json (HTTP ${res.status})`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtMoney = (n) => {
  if (n == null || isNaN(n)) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};
const fmtMoneyFull = (n) =>
  `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtPct = (n) =>
  n == null || isNaN(n) ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const monthName = (m) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    m - 1
  ];

const weekKey = (y, w) => `${y}-W${String(w).padStart(2, "0")}`;
const cmpWeek = (a, b) => (a.y !== b.y ? a.y - b.y : a.w - b.w);

// Build ordered list of weeks present in the data
function buildWeekOrder(weekly) {
  const set = new Map();
  for (const r of weekly) set.set(weekKey(r.y, r.w), { y: r.y, w: r.w });
  return Array.from(set.values()).sort(cmpWeek);
}

// Linear regression — returns { slope, intercept, predict(x) }
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const [x, y] of points) {
    sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x) => slope * x + intercept };
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────
const useTheme = () => {
  const [dark, setDark] = useState(true);
  return { dark, toggle: () => setDark((d) => !d) };
};

// Reusable tokens (Tailwind classes)
const t = (dark) => ({
  bg: dark ? "bg-slate-950" : "bg-slate-50",
  panel: dark ? "bg-slate-900/60" : "bg-white",
  panelSolid: dark ? "bg-slate-900" : "bg-white",
  border: dark ? "border-slate-800" : "border-slate-200",
  borderStrong: dark ? "border-slate-700" : "border-slate-300",
  text: dark ? "text-slate-100" : "text-slate-900",
  textMuted: dark ? "text-slate-400" : "text-slate-500",
  textSubtle: dark ? "text-slate-500" : "text-slate-400",
  input: dark
    ? "bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400",
  hover: dark ? "hover:bg-slate-800/60" : "hover:bg-slate-100",
  accentText: "text-sky-400",
  emerald: "text-emerald-400",
  rose: "text-rose-400",
  amber: "text-amber-400",
});

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE BITS
// ─────────────────────────────────────────────────────────────────────────────
function Card({ dark, className = "", children }) {
  const T = t(dark);
  return (
    <div
      className={`${T.panel} ${T.border} border rounded-2xl backdrop-blur-sm shadow-lg shadow-black/5 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ dark, icon: Icon, title, subtitle, accent = "sky" }) {
  const T = t(dark);
  const accents = {
    sky: "from-sky-500/20 to-sky-500/0 text-sky-400",
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/0 text-rose-400",
    violet: "from-violet-500/20 to-violet-500/0 text-violet-400",
  };
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className={`p-2.5 rounded-xl bg-gradient-to-br ${accents[accent]} ring-1 ring-inset ${
          dark ? "ring-white/5" : "ring-black/5"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className={`text-base font-semibold tracking-tight ${T.text}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-xs mt-0.5 ${T.textMuted}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function Pill({ children, tone = "neutral", dark }) {
  const tones = {
    neutral: dark
      ? "bg-slate-800 text-slate-300 ring-slate-700"
      : "bg-slate-100 text-slate-600 ring-slate-200",
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    sky: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
    violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Animated counter (count-up)
function AnimatedNumber({ value, format = (v) => v, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);
  const toRef = useRef(value);

  useEffect(() => {
    fromRef.current = display;
    toRef.current = value;
    startRef.current = null;
    let raf;
    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{format(display)}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { dark, toggle } = useTheme();
  const T = t(dark);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setLoadError(String(e)); });
    return () => { cancelled = true; };
  }, []);

  if (loadError) {
    return (
      <div className={`min-h-screen ${T.bg} ${T.text} flex items-center justify-center p-8`}>
        <div className="max-w-md text-center">
          <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto mb-4" />
          <h1 className="text-lg font-semibold">Failed to load dataset</h1>
          <p className={`text-sm ${T.textMuted} mt-2`}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen ${T.bg} ${T.text} flex items-center justify-center`}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
          <span className="text-sm tracking-wide">Decoding sales archive…</span>
        </div>
      </div>
    );
  }

  return <DashboardInner data={data} dark={dark} toggleTheme={toggle} />;
}

function DashboardInner({ data, dark, toggleTheme }) {
  const T = t(dark);

  // Order of weeks present
  const weekOrder = useMemo(() => buildWeekOrder(data.weekly), [data.weekly]);
  const weekMetaArr = useMemo(
    () =>
      weekOrder.map(({ y, w }) => {
        const meta = data.weekMeta[weekKey(y, w)];
        return { y, w, key: weekKey(y, w), ...meta };
      }),
    [weekOrder, data.weekMeta]
  );

  // ── FILTER STATE ──
  const [brand, setBrand] = useState("All");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  // Selected week defaults to most recent week with data
  const latestWeek = weekMetaArr[weekMetaArr.length - 1];
  const [selectedWeekKey, setSelectedWeekKey] = useState(latestWeek?.key);

  // ── DERIVED FILTERED RECORDS ──
  // Note: search is applied on the church-alerts/customer scope, but global KPIs ignore search empty string
  const filteredWeekly = useMemo(() => {
    return data.weekly.filter((r) => {
      if (brand !== "All" && r.b !== brand) return false;
      if (yearFilter !== "All" && r.y !== Number(yearFilter)) return false;
      if (search && !r.c.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data.weekly, brand, yearFilter, search]);

  const filteredMonthly = useMemo(() => {
    return data.monthly.filter((r) => {
      if (brand !== "All" && r.b !== brand) return false;
      if (yearFilter !== "All" && r.y !== Number(yearFilter)) return false;
      if (search && !r.c.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data.monthly, brand, yearFilter, search]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const totalRevenue = filteredWeekly.reduce((s, r) => s + r.r, 0);
    // Each row = one (customer, brand, year-week) bucket of orders.
    // Use that as proxy "order group" count for AOV
    const orderGroups = filteredWeekly.length;
    const aov = orderGroups ? totalRevenue / orderGroups : 0;
    const activeCustomers = new Set(filteredWeekly.map((r) => r.c)).size;
    return { totalRevenue, aov, activeCustomers };
  }, [filteredWeekly]);

  // ── TOP ACCOUNTS PER BRAND ──
  const topAccounts = useMemo(() => {
    const map = new Map(); // brand -> Map(customer -> revenue)
    for (const r of filteredWeekly) {
      if (!map.has(r.b)) map.set(r.b, new Map());
      const inner = map.get(r.b);
      inner.set(r.c, (inner.get(r.c) || 0) + r.r);
    }
    const result = {};
    for (const [b, inner] of map.entries()) {
      const arr = Array.from(inner.entries())
        .map(([customer, revenue]) => ({ customer, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      result[b] = arr;
    }
    return result;
  }, [filteredWeekly]);

  // ── CHURN ALERTS for SELECTED WEEK vs PREVIOUS WEEK + YoY ──
  const churnRows = useMemo(() => {
    if (!selectedWeekKey) return [];
    const idx = weekMetaArr.findIndex((wm) => wm.key === selectedWeekKey);
    if (idx <= 0) return [];
    const cur = weekMetaArr[idx];
    const prev = weekMetaArr[idx - 1];

    // Build customer×brand revenue maps for cur and prev weeks (respecting brand filter)
    const inScope = (r) => brand === "All" || r.b === brand;
    const curMap = new Map();
    const prevMap = new Map();
    const yoyMap = new Map();
    for (const r of data.weekly) {
      if (!inScope(r)) continue;
      const key = `${r.c}||${r.b}`;
      if (r.y === cur.y && r.w === cur.w) curMap.set(key, (curMap.get(key) || 0) + r.r);
      if (r.y === prev.y && r.w === prev.w) prevMap.set(key, (prevMap.get(key) || 0) + r.r);
      if (r.y === cur.y - 1 && r.w === cur.w) yoyMap.set(key, (yoyMap.get(key) || 0) + r.r);
    }

    const rows = [];
    // Iterate keys present in current week (active customers)
    for (const [key, curRev] of curMap.entries()) {
      const prevRev = prevMap.get(key) || 0;
      const yoyRev = yoyMap.get(key);
      const [customer, b] = key.split("||");
      if (search && !customer.toLowerCase().includes(search.toLowerCase())) continue;

      let alertLevel = null;
      let wowPct = null;
      if (prevRev > 0) {
        wowPct = ((curRev - prevRev) / prevRev) * 100;
        if (wowPct <= -20) alertLevel = "critical";
        else if (wowPct <= -15 && wowPct > -20) alertLevel = "warning";
      }

      let yoyPct = null;
      let yoyStatus = "no_prior";
      if (yoyRev != null && yoyRev > 0) {
        yoyPct = ((curRev - yoyRev) / yoyRev) * 100;
        yoyStatus = yoyPct >= 0 ? "growth" : "decline";
      }

      rows.push({
        customer,
        brand: b,
        curRev,
        prevRev,
        wowPct,
        alertLevel,
        yoyPct,
        yoyStatus,
        yoyRev,
      });
    }

    // Sort: critical first, then warning, then by abs WoW drop
    rows.sort((a, bb) => {
      const order = { critical: 0, warning: 1, null: 2 };
      const oa = order[a.alertLevel ?? "null"];
      const ob = order[bb.alertLevel ?? "null"];
      if (oa !== ob) return oa - ob;
      return (a.wowPct ?? 0) - (bb.wowPct ?? 0);
    });

    return { rows, cur, prev };
  }, [data.weekly, weekMetaArr, selectedWeekKey, brand, search]);

  // ── BRAND HEALTH (last 8 weeks) ──
  const brandHealth = useMemo(() => {
    const last8 = weekMetaArr.slice(-8);
    if (last8.length === 0) return { weeks: [], series: [], rankings: [] };
    const lastKeys = new Set(last8.map((w) => w.key));
    const map = new Map(); // brand -> Map(weekKey -> rev)
    for (const r of data.weekly) {
      const k = weekKey(r.y, r.w);
      if (!lastKeys.has(k)) continue;
      if (!map.has(r.b)) map.set(r.b, new Map());
      const inner = map.get(r.b);
      inner.set(k, (inner.get(k) || 0) + r.r);
    }
    // Build chart-friendly rows
    const series = last8.map((w) => {
      const row = { week: `W${w.w}`, fullKey: w.key, year: w.y };
      for (const b of data.brands) {
        row[b] = (map.get(b)?.get(w.key)) || 0;
      }
      return row;
    });
    // Compute trend per brand: compare last 4 weeks vs prior 4 weeks
    const rankings = data.brands
      .map((b) => {
        const vals = last8.map((w) => (map.get(b)?.get(w.key)) || 0);
        const total = vals.reduce((s, v) => s + v, 0);
        const recent = vals.slice(4).reduce((s, v) => s + v, 0);
        const prior = vals.slice(0, 4).reduce((s, v) => s + v, 0);
        let pct = null;
        if (prior > 0) pct = ((recent - prior) / prior) * 100;
        return { brand: b, total, recent, prior, pct };
      })
      .sort((a, b) => b.total - a.total);
    return { weeks: last8, series, rankings };
  }, [data.weekly, data.brands, weekMetaArr]);

  // ── 6-MONTH FORECAST ──
  // Aggregates filtered monthly revenue into a single time series, then linear regression
  const forecast = useMemo(() => {
    // build monthly totals
    const totals = new Map(); // key "y-m" -> rev
    for (const r of filteredMonthly) {
      const k = `${r.y}-${String(r.m).padStart(2, "0")}`;
      totals.set(k, (totals.get(k) || 0) + r.r);
    }
    const ordered = Array.from(totals.entries()).sort();
    if (ordered.length < 3) return null;
    // Use last 24 months for stability
    const last = ordered.slice(-24);
    const points = last.map(([_, v], i) => [i, v]);
    const reg = linearRegression(points);

    // Start month = first key in last
    const [firstY, firstM] = last[0][0].split("-").map(Number);
    const baseDate = new Date(firstY, firstM - 1, 1);

    const historical = last.map(([k, v], i) => {
      const [y, m] = k.split("-").map(Number);
      return {
        idx: i,
        label: `${monthName(m)} '${String(y).slice(2)}`,
        actual: v,
        forecast: null,
      };
    });
    const projection = [];
    if (reg) {
      // Continuity: last historical point also includes regression value to connect lines visually
      const lastIdx = historical.length - 1;
      historical[lastIdx].forecast = Math.max(0, reg.predict(lastIdx));

      for (let i = 1; i <= 6; i++) {
        const idx = historical.length - 1 + i;
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + idx);
        projection.push({
          idx,
          label: `${monthName(d.getMonth() + 1)} '${String(d.getFullYear()).slice(2)}`,
          actual: null,
          forecast: Math.max(0, reg.predict(idx)),
        });
      }
    }

    const all = [...historical, ...projection];
    // Trend: based on slope vs mean
    const mean =
      points.reduce((s, [_, v]) => s + v, 0) / points.length || 1;
    const trendPct = reg ? (reg.slope / mean) * 100 : 0;
    return {
      data: all,
      trendPct,
      positive: trendPct >= 0,
      projectionTotal: projection.reduce((s, r) => s + (r.forecast || 0), 0),
    };
  }, [filteredMonthly]);

  // ── CUSTOM TOOLTIPS ──
  const tooltipStyle = dark
    ? "bg-slate-900 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";

  const CustomTooltip = ({ active, payload, label, valueFmt = fmtMoneyFull }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className={`${tooltipStyle} border rounded-lg px-3 py-2 shadow-xl text-xs min-w-[140px]`}
      >
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: p.color || p.stroke }}
              />
              <span className="opacity-80">{p.name}</span>
            </span>
            <span className="font-mono font-medium">
              {p.value == null ? "—" : valueFmt(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ── BRAND COLOR PALETTE ──
  const brandColors = {
    Talitha: "#38bdf8",
    WB: "#10b981",
    InterCo: "#a78bfa",
    Lofty: "#f59e0b",
    Unknown: "#64748b",
  };

  return (
    <div className={`min-h-screen ${T.bg} ${T.text} font-sans transition-colors`}
         style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 -left-20 w-[40rem] h-[40rem] rounded-full blur-3xl ${
            dark ? "bg-sky-500/10" : "bg-sky-300/20"
          }`}
        />
        <div
          className={`absolute -bottom-32 -right-20 w-[40rem] h-[40rem] rounded-full blur-3xl ${
            dark ? "bg-emerald-500/5" : "bg-emerald-300/20"
          }`}
        />
      </div>

      <div className="relative">
        {/* HEADER */}
        <header
          className={`sticky top-0 z-20 backdrop-blur-xl ${
            dark ? "bg-slate-950/70" : "bg-slate-50/80"
          } border-b ${T.border}`}
        >
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <Coffee className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight">
                  Roastery Intelligence
                </h1>
                <p className={`text-[10px] uppercase tracking-[0.18em] ${T.textSubtle}`}>
                  B2B Customer Success · v4.26
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {/* Brand selector */}
              <div className="flex items-center gap-1">
                <Filter className={`w-3.5 h-3.5 ${T.textMuted}`} />
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={`text-xs ${T.input} border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/40`}
                >
                  <option value="All">All Brands</option>
                  {data.brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Year filter */}
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className={`text-xs ${T.input} border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/40`}
              >
                <option value="All">All Years</option>
                {data.yearRange.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {/* Week selector */}
              <select
                value={selectedWeekKey || ""}
                onChange={(e) => setSelectedWeekKey(e.target.value)}
                className={`text-xs ${T.input} border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/40 max-w-[260px]`}
                title="Select reference week (Mon–Sun)"
              >
                {weekMetaArr.slice().reverse().map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.y} · W{w.w} ({w.start} → {w.end})
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${T.textMuted}`} />
                <input
                  type="text"
                  placeholder="Search customer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`text-xs ${T.input} border rounded-lg pl-8 pr-3 py-1.5 w-52 focus:outline-none focus:ring-2 focus:ring-sky-500/40`}
                />
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`p-1.5 rounded-lg ${T.border} border ${T.hover} transition-all`}
                title={dark ? "Light mode" : "Dark mode"}
              >
                {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
          {/* ── KPIs ── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <KpiCard
              dark={dark}
              icon={DollarSign}
              accent="sky"
              label="Total Revenue"
              value={kpis.totalRevenue}
              format={(v) => fmtMoneyFull(v)}
              caption={`Across ${
                brand === "All" ? "all brands" : brand
              }${yearFilter !== "All" ? ` · ${yearFilter}` : ""}`}
            />
            <KpiCard
              dark={dark}
              icon={ShoppingBag}
              accent="emerald"
              label="Average Order Value"
              value={kpis.aov}
              format={(v) => fmtMoneyFull(v)}
              caption="Mean revenue per customer-week"
            />
            <KpiCard
              dark={dark}
              icon={Users}
              accent="violet"
              label="Active Customers"
              value={kpis.activeCustomers}
              format={(v) => Math.round(v).toLocaleString()}
              caption="Unique accounts in scope"
            />
          </section>

          {/* ── CHURN + TOP ACCOUNTS ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Churn alerts */}
            <Card dark={dark} className="lg:col-span-2 p-5 animate-fade-in-delay-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <SectionTitle
                  dark={dark}
                  icon={AlertOctagon}
                  title="Early Churn Alerts"
                  subtitle={
                    churnRows.cur
                      ? `Comparing W${churnRows.cur.w} ${churnRows.cur.y} (${churnRows.cur.start} → ${churnRows.cur.end}) vs previous week · YoY vs ${churnRows.cur.y - 1}`
                      : "Select a week with prior history"
                  }
                  accent="rose"
                />
                <div className="flex gap-2 mb-3">
                  <Pill tone="amber" dark={dark}>
                    <AlertTriangle className="w-3 h-3" /> 15–19.9% drop
                  </Pill>
                  <Pill tone="rose" dark={dark}>
                    <AlertOctagon className="w-3 h-3" /> ≥20% drop
                  </Pill>
                </div>
              </div>

              <div className={`overflow-x-auto -mx-2 px-2`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`text-left ${T.textMuted} border-b ${T.border}`}>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Customer</th>
                      <th className="py-2 pr-3 font-medium">Brand</th>
                      <th className="py-2 pr-3 font-medium text-right">Current</th>
                      <th className="py-2 pr-3 font-medium text-right">Previous</th>
                      <th className="py-2 pr-3 font-medium text-right">WoW</th>
                      <th className="py-2 pr-3 font-medium text-right">YoY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(churnRows.rows || []).slice(0, 18).map((r, idx) => (
                      <tr
                        key={`${r.customer}-${r.brand}`}
                        className={`border-b ${T.border} ${T.hover} transition-colors`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <td className="py-2.5 pr-3">
                          {r.alertLevel === "critical" ? (
                            <Pill tone="rose" dark={dark}>
                              <AlertOctagon className="w-3 h-3" /> Critical
                            </Pill>
                          ) : r.alertLevel === "warning" ? (
                            <Pill tone="amber" dark={dark}>
                              <AlertTriangle className="w-3 h-3" /> Warning
                            </Pill>
                          ) : (
                            <Pill tone="neutral" dark={dark}>
                              <Activity className="w-3 h-3" /> Stable
                            </Pill>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 font-medium">{r.customer}</td>
                        <td className="py-2.5 pr-3">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                            style={{ background: brandColors[r.brand] || "#64748b" }}
                          />
                          <span className={T.textMuted}>{r.brand}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono">
                          {fmtMoneyFull(r.curRev)}
                        </td>
                        <td className={`py-2.5 pr-3 text-right font-mono ${T.textMuted}`}>
                          {fmtMoneyFull(r.prevRev)}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-mono">
                          {r.wowPct == null ? (
                            <span className={T.textSubtle}>—</span>
                          ) : (
                            <span
                              className={
                                r.wowPct < -15
                                  ? "text-rose-400"
                                  : r.wowPct < 0
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }
                            >
                              {fmtPct(r.wowPct)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          {r.yoyStatus === "no_prior" ? (
                            <Pill tone="neutral" dark={dark}>
                              <Minus className="w-3 h-3" /> No Prior Data
                            </Pill>
                          ) : r.yoyStatus === "growth" ? (
                            <Pill tone="emerald" dark={dark}>
                              <ArrowUpRight className="w-3 h-3" />
                              {fmtPct(r.yoyPct)}
                            </Pill>
                          ) : (
                            <Pill tone="rose" dark={dark}>
                              <ArrowDownRight className="w-3 h-3" />
                              {fmtPct(r.yoyPct)}
                            </Pill>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!churnRows.rows || churnRows.rows.length === 0) && (
                      <tr>
                        <td colSpan={7} className={`py-10 text-center ${T.textMuted}`}>
                          No customer activity in the selected week.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {churnRows.rows && churnRows.rows.length > 18 && (
                <p className={`text-[11px] mt-3 ${T.textSubtle}`}>
                  Showing top 18 of {churnRows.rows.length} accounts (sorted by alert severity).
                </p>
              )}
            </Card>

            {/* Top accounts per brand */}
            <Card dark={dark} className="p-5 animate-fade-in-delay-2">
              <SectionTitle
                dark={dark}
                icon={Crown}
                title="Top Accounts"
                subtitle="Leaders per brand · current filters"
                accent="amber"
              />
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {Object.entries(topAccounts)
                  .filter(([_, arr]) => arr.length > 0)
                  .sort(
                    ([, a], [, b]) =>
                      (b.reduce((s, r) => s + r.revenue, 0)) -
                      (a.reduce((s, r) => s + r.revenue, 0))
                  )
                  .map(([b, list]) => {
                    const max = list[0]?.revenue || 1;
                    return (
                      <div key={b}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: brandColors[b] || "#64748b" }}
                            />
                            <span className="text-xs font-semibold tracking-wide">{b}</span>
                          </div>
                          <span className={`text-[10px] ${T.textSubtle}`}>
                            Top {Math.min(list.length, 5)}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {list.slice(0, 5).map((row, i) => (
                            <li key={row.customer} className="relative">
                              <div className="flex items-center justify-between text-[11px] gap-2 py-1">
                                <span className="truncate flex items-center gap-1.5">
                                  <span className={`${T.textMuted} font-mono w-3 text-right`}>
                                    {i + 1}
                                  </span>
                                  <span className="truncate">{row.customer}</span>
                                </span>
                                <span className="font-mono font-medium tabular-nums">
                                  {fmtMoney(row.revenue)}
                                </span>
                              </div>
                              <div className={`h-1 rounded-full ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                                <div
                                  className="h-1 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${(row.revenue / max) * 100}%`,
                                    background: brandColors[b] || "#64748b",
                                    opacity: 0.85,
                                  }}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            </Card>
          </section>

          {/* ── BRAND HEALTH ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card dark={dark} className="lg:col-span-2 p-5 animate-fade-in-delay-2">
              <SectionTitle
                dark={dark}
                icon={Building2}
                title="Brand Health · Last 8 Weeks"
                subtitle="Weekly revenue per brand — watch for sustained declines"
                accent="emerald"
              />
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={brandHealth.series}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={dark ? "#1e293b" : "#e2e8f0"}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                      stroke={dark ? "#334155" : "#cbd5e1"}
                    />
                    <YAxis
                      tickFormatter={(v) => fmtMoney(v)}
                      tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                      stroke={dark ? "#334155" : "#cbd5e1"}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: dark ? "#1e293b40" : "#cbd5e140" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 10 }}
                      iconType="circle"
                      iconSize={6}
                    />
                    {data.brands
                      .filter((b) => brand === "All" || b === brand)
                      .map((b) => (
                        <Bar
                          key={b}
                          dataKey={b}
                          stackId="a"
                          fill={brandColors[b] || "#64748b"}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card dark={dark} className="p-5 animate-fade-in-delay-2">
              <SectionTitle
                dark={dark}
                icon={Activity}
                title="Brand Trajectory"
                subtitle="Last 4 weeks vs prior 4"
                accent="violet"
              />
              <ul className="space-y-3">
                {brandHealth.rankings.map((r) => {
                  const trending =
                    r.pct == null
                      ? "neutral"
                      : r.pct >= 5
                      ? "up"
                      : r.pct <= -5
                      ? "down"
                      : "flat";
                  return (
                    <li
                      key={r.brand}
                      className={`p-3 rounded-xl ${
                        dark ? "bg-slate-800/40" : "bg-slate-100/60"
                      } border ${T.border} flex items-center gap-3`}
                    >
                      <div
                        className="w-1 h-10 rounded-full"
                        style={{ background: brandColors[r.brand] || "#64748b" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">{r.brand}</span>
                          {r.pct == null ? (
                            <Pill tone="neutral" dark={dark}>—</Pill>
                          ) : trending === "up" ? (
                            <Pill tone="emerald" dark={dark}>
                              <TrendingUp className="w-3 h-3" /> {fmtPct(r.pct)}
                            </Pill>
                          ) : trending === "down" ? (
                            <Pill tone="rose" dark={dark}>
                              <TrendingDown className="w-3 h-3" /> {fmtPct(r.pct)}
                            </Pill>
                          ) : (
                            <Pill tone="amber" dark={dark}>
                              <Minus className="w-3 h-3" /> {fmtPct(r.pct)}
                            </Pill>
                          )}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${T.textMuted}`}>
                          {fmtMoneyFull(r.total)} · 8w total
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>

          {/* ── FORECAST + CHATBOT ── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card dark={dark} className="lg:col-span-2 p-5 animate-fade-in-delay-2">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <SectionTitle
                  dark={dark}
                  icon={Target}
                  title="6-Month Revenue Forecast"
                  subtitle={`Linear regression on monthly history · ${
                    brand === "All" ? "All brands" : brand
                  }${search ? ` · "${search}"` : ""}`}
                  accent="sky"
                />
                {forecast && (
                  <div className="flex items-center gap-2">
                    {forecast.positive ? (
                      <Pill tone="emerald" dark={dark}>
                        <TrendingUp className="w-3 h-3" /> Positive Trend ↗ {fmtPct(forecast.trendPct)}
                      </Pill>
                    ) : (
                      <Pill tone="rose" dark={dark}>
                        <TrendingDown className="w-3 h-3" /> Negative Trend ↘ {fmtPct(forecast.trendPct)}
                      </Pill>
                    )}
                    <Pill tone="sky" dark={dark}>
                      <Sparkles className="w-3 h-3" /> Projected 6m: {fmtMoney(forecast.projectionTotal)}
                    </Pill>
                  </div>
                )}
              </div>
              {!forecast ? (
                <p className={`text-xs ${T.textMuted} py-12 text-center`}>
                  Not enough monthly data to compute a forecast for the current scope.
                </p>
              ) : (
                <div style={{ width: "100%", height: 290 }}>
                  <ResponsiveContainer>
                    <AreaChart data={forecast.data}>
                      <defs>
                        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={dark ? "#1e293b" : "#e2e8f0"}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                        stroke={dark ? "#334155" : "#cbd5e1"}
                      />
                      <YAxis
                        tickFormatter={(v) => fmtMoney(v)}
                        tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                        stroke={dark ? "#334155" : "#cbd5e1"}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke="#38bdf8"
                        strokeWidth={2.2}
                        fill="url(#actualGrad)"
                        dot={false}
                        connectNulls={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="forecast"
                        name="Forecast"
                        stroke="#a78bfa"
                        strokeWidth={2.2}
                        strokeDasharray="6 4"
                        fill="url(#forecastGrad)"
                        dot={false}
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <ChatPanel dark={dark} data={data} />
          </section>

          <footer className={`text-[10px] ${T.textSubtle} text-center pt-4 pb-8`}>
            Data scope: {data.weekly.length.toLocaleString()} customer-week buckets · {data.customers.length} accounts ·
            ISO weeks (Mon–Sun) · Status = Fulfilled
          </footer>
        </main>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out both; }
        .animate-fade-in-delay-1 { animation: fadeIn 0.6s 0.08s ease-out both; }
        .animate-fade-in-delay-2 { animation: fadeIn 0.7s 0.16s ease-out both; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ dark, icon: Icon, label, value, format, caption, accent }) {
  const T = t(dark);
  const accents = {
    sky: "from-sky-500/20 via-sky-500/0 text-sky-400",
    emerald: "from-emerald-500/20 via-emerald-500/0 text-emerald-400",
    violet: "from-violet-500/20 via-violet-500/0 text-violet-400",
  };
  return (
    <Card dark={dark} className="p-5 relative overflow-hidden group">
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${accents[accent]} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] uppercase tracking-[0.18em] font-medium ${T.textMuted}`}>
            {label}
          </span>
          <div
            className={`p-1.5 rounded-lg ${
              dark ? "bg-slate-800/80" : "bg-slate-100"
            } ${accents[accent].split(" ").pop()}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          <AnimatedNumber value={value} format={format} />
        </p>
        <p className={`text-[11px] mt-1 ${T.textSubtle}`}>{caption}</p>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT PANEL — keyword-based natural language assistant over the dataset
// ─────────────────────────────────────────────────────────────────────────────
function ChatPanel({ dark, data }) {
  const T = t(dark);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi — I'm your Roastery Data Assistant. Ask me about a customer or brand, e.g. \"How is Barona Resort doing in the last 3 months?\" or \"Show me Talitha's last 6 months\".",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const reply = answer(q, data);
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "assistant", text: reply },
    ]);
    setInput("");
  };

  return (
    <Card dark={dark} className="p-0 overflow-hidden flex flex-col animate-fade-in-delay-2 h-[440px]">
      <div className={`px-5 py-3 border-b ${T.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500/20 to-sky-500/0 text-sky-400 ring-1 ring-inset ring-white/5">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-tight">Data Assistant</p>
            <p className={`text-[10px] ${T.textSubtle}`}>Natural language queries</p>
          </div>
        </div>
        <Pill tone="emerald" dark={dark}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
        </Pill>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 text-xs leading-relaxed ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                m.role === "user"
                  ? "bg-sky-500 text-white rounded-br-sm"
                  : dark
                  ? "bg-slate-800 text-slate-100 rounded-bl-sm"
                  : "bg-slate-100 text-slate-900 rounded-bl-sm"
              }`}
              dangerouslySetInnerHTML={{ __html: m.text }}
            />
            {m.role === "user" && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-slate-200" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`p-3 border-t ${T.border}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about a customer or brand…"
            className={`flex-1 text-xs ${T.input} border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40`}
          />
          <button
            onClick={send}
            className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            "Top customer for Talitha",
            "How is the first customer doing in the last 3 months?",
            "WB last 6 months",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className={`text-[10px] px-2 py-0.5 rounded-md ${
                dark ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-100 hover:bg-slate-200"
              } ${T.textMuted} transition-colors`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT ANSWER LOGIC
// ─────────────────────────────────────────────────────────────────────────────
function answer(rawQ, data) {
  const q = rawQ.toLowerCase();

  // 1. Detect a timeframe in months (default 3)
  const monthMatch = q.match(/(\d+)\s*month/);
  let months = monthMatch ? parseInt(monthMatch[1], 10) : 3;
  if (q.includes("year") && !monthMatch) months = 12;
  if (q.includes("quarter") && !monthMatch) months = 3;
  if (q.includes("half") && !monthMatch) months = 6;
  months = Math.max(1, Math.min(months, 36));

  // 2. Determine reference month = latest month in dataset
  const allMonthly = data.monthly;
  const latest = allMonthly.reduce(
    (acc, r) => {
      const cur = r.y * 12 + r.m;
      return cur > acc ? cur : acc;
    },
    0
  );
  const cutoffStart = latest - months + 1;
  const prevCutoffEnd = latest - months;
  const prevCutoffStart = latest - 2 * months + 1;

  // 3. Detect brand
  const brandMatch = data.brands.find((b) => q.includes(b.toLowerCase()));

  // 4. Detect customer (substring match, longest first to prefer specific)
  const sortedCustomers = [...data.customers].sort((a, b) => b.length - a.length);
  let customerMatch = null;
  for (const c of sortedCustomers) {
    if (c.length < 3) continue;
    if (q.includes(c.toLowerCase())) {
      customerMatch = c;
      break;
    }
  }

  // 5. Top customer for [brand]?
  if ((q.includes("top") || q.includes("best") || q.includes("biggest")) && brandMatch) {
    const totals = new Map();
    for (const r of data.weekly) {
      if (r.b !== brandMatch) continue;
      totals.set(r.c, (totals.get(r.c) || 0) + r.r);
    }
    const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!ranked.length) return `I couldn't find any orders for <b>${brandMatch}</b>.`;
    const list = ranked
      .map(([c, v], i) => `${i + 1}. <b>${c}</b> — ${fmtMoneyFull(v)}`)
      .join("<br/>");
    return `Top customers for <b>${brandMatch}</b> (all-time):<br/>${list}`;
  }

  // 6. Customer-specific timeframe analysis
  if (customerMatch) {
    const recentRows = allMonthly.filter(
      (r) => r.c === customerMatch && r.y * 12 + r.m >= cutoffStart && r.y * 12 + r.m <= latest
    );
    const priorRows = allMonthly.filter(
      (r) =>
        r.c === customerMatch &&
        r.y * 12 + r.m >= prevCutoffStart &&
        r.y * 12 + r.m <= prevCutoffEnd
    );
    const recentTotal = recentRows.reduce((s, r) => s + r.r, 0);
    const priorTotal = priorRows.reduce((s, r) => s + r.r, 0);
    if (recentTotal === 0 && priorTotal === 0) {
      return `I found <b>${customerMatch}</b> in the database but no recent activity in the last ${months} months.`;
    }
    let trendStr;
    if (priorTotal === 0) {
      trendStr = `with no comparable activity in the prior ${months} months (new or reactivated account)`;
    } else {
      const pct = ((recentTotal - priorTotal) / priorTotal) * 100;
      const dir = pct >= 0 ? "positive" : "negative";
      trendStr = `representing a <b>${dir}</b> trend of <b>${fmtPct(pct)}</b> compared to the previous ${months}-month period (which generated ${fmtMoneyFull(priorTotal)}).`;
    }
    return `<b>${customerMatch}</b> has generated <b>${fmtMoneyFull(recentTotal)}</b> in the last ${months} months, ${trendStr}`;
  }

  // 7. Brand-only timeframe analysis
  if (brandMatch) {
    const recentRows = allMonthly.filter(
      (r) => r.b === brandMatch && r.y * 12 + r.m >= cutoffStart && r.y * 12 + r.m <= latest
    );
    const priorRows = allMonthly.filter(
      (r) =>
        r.b === brandMatch &&
        r.y * 12 + r.m >= prevCutoffStart &&
        r.y * 12 + r.m <= prevCutoffEnd
    );
    const recentTotal = recentRows.reduce((s, r) => s + r.r, 0);
    const priorTotal = priorRows.reduce((s, r) => s + r.r, 0);
    const activeCustomers = new Set(recentRows.map((r) => r.c)).size;
    let trendStr;
    if (priorTotal === 0) {
      trendStr = `with no comparable activity in the prior period.`;
    } else {
      const pct = ((recentTotal - priorTotal) / priorTotal) * 100;
      const dir = pct >= 0 ? "positive" : "negative";
      trendStr = `a <b>${dir}</b> trend of <b>${fmtPct(pct)}</b> versus the previous ${months}-month period (${fmtMoneyFull(priorTotal)}).`;
    }
    return `Brand <b>${brandMatch}</b> generated <b>${fmtMoneyFull(recentTotal)}</b> across <b>${activeCustomers}</b> active customers in the last ${months} months — ${trendStr}`;
  }

  // 8. Fallback: portfolio overview
  const recentRows = allMonthly.filter((r) => r.y * 12 + r.m >= cutoffStart && r.y * 12 + r.m <= latest);
  const total = recentRows.reduce((s, r) => s + r.r, 0);
  const customers = new Set(recentRows.map((r) => r.c)).size;
  return `I couldn't pin a specific customer or brand from your question. Across the entire portfolio, the last ${months} months generated <b>${fmtMoneyFull(total)}</b> from <b>${customers}</b> active customers. Try mentioning a specific customer name (e.g. "${data.customers[0]}") or a brand (Talitha, WB, InterCo, Lofty).`;
}
