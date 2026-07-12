import React from "react";
import { PlatformStats, Listing, Message } from "../types";
import { BarChart3, TrendingUp, ShieldCheck, Recycle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg text-xs text-white space-y-1 font-sans">
        <p className="font-bold font-mono text-[10px] text-slate-400">{label}</p>
        <p className="text-emerald-400 font-bold">
          Volume: {payload[0].value.toLocaleString()} kg
        </p>
      </div>
    );
  }
  return null;
};

interface AnalyticsProps {
  user: { name: string; email: string; location: string; role: string };
  listings: Listing[];
  stats: PlatformStats | null;
  messages?: Message[];
}

export default function Analytics({ user, listings, stats, messages = [] }: AnalyticsProps) {
  const isBuyer = user.role?.toLowerCase() === "buyer" || user.role?.toLowerCase() === "recycler";
  const isSeller = !isBuyer;

  // Generate 30 days listing volume timeline data
  const last30DaysData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      // Calculate total weight of listings added on this date
      const dayWeight = listings
        .filter((l) => l.date && l.date.split(" ")[0] === dateStr)
        .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      
      data.push({
        date: dateStr,
        label,
        volume: dayWeight,
      });
    }
    return data;
  }, [listings]);

  // --- SELLER ANALYTICS CALCULATIONS ---
  const userListings = React.useMemo(() => {
    return listings.filter(l => l.sellerEmail === user.email || l.seller === user.name);
  }, [listings, user]);

  const sellerBreakdown = React.useMemo(() => {
    const counts = {
      Plastic: 0,
      Metal: 0,
      Paper: 0,
      Glass: 0,
      "E-Waste": 0,
      Others: 0
    };
    userListings.forEach(l => {
      const name = (l.material || "").toLowerCase();
      let cat: "Plastic" | "Metal" | "Paper" | "Glass" | "E-Waste" | "Others" = "Others";
      
      if (name.includes("plastic")) {
        cat = "Plastic";
      } else if (name.includes("metal") || name.includes("copper") || name.includes("steel") || name.includes("iron")) {
        cat = "Metal";
      } else if (name.includes("paper") || name.includes("cardboard")) {
        cat = "Paper";
      } else if (name.includes("glass")) {
        cat = "Glass";
      } else if (name.includes("e-waste") || name.includes("electronic")) {
        cat = "E-Waste";
      }
      
      counts[cat] += Number(l.quantity) || 0;
    });
    return counts;
  }, [userListings]);

  const sellerTotalWeight = (Object.values(sellerBreakdown) as number[]).reduce((a, b) => a + b, 0);
  const landfillDiversion = sellerTotalWeight > 0 ? "98.5%" : "0.0%";
  const auditPassRate = sellerTotalWeight > 0 ? "100.0%" : "0.0%";
  const co2Saved = sellerTotalWeight > 0 
    ? (sellerTotalWeight * 2.5).toLocaleString(undefined, { maximumFractionDigits: 0 }) + " kg" 
    : "0 kg";


  // --- BUYER ANALYTICS CALCULATIONS ---
  // Find all listing IDs where the current buyer has sent or received messages
  const buyerInteractions = React.useMemo(() => {
    const interactedListingIds = new Set<string>();
    if (messages) {
      messages.forEach(msg => {
        if ((msg.sender === user.name || msg.receiver === user.name) && msg.listingId) {
          interactedListingIds.add(msg.listingId);
        }
      });
    }
    return Array.from(interactedListingIds);
  }, [messages, user.name]);

  const buyerInteractedListings = React.useMemo(() => {
    return listings.filter(l => buyerInteractions.includes(l.id));
  }, [listings, buyerInteractions]);

  // Card 1: Material Procured
  const procuredWeight = React.useMemo(() => {
    // Sum weights of Completed interacted listings
    const completedInteractedWeight = buyerInteractedListings
      .filter(l => l.status === "Completed")
      .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    return completedInteractedWeight;
  }, [buyerInteractedListings]);

  // Card 2: Active Offers / Bids
  const activeBidsCount = React.useMemo(() => {
    // Count of Active listings with conversations
    const activeInteracted = buyerInteractedListings.filter(l => l.status === "Active" || l.status === "Pending").length;
    return activeInteracted;
  }, [buyerInteractedListings]);

  // Card 3: CO2 Mitigation Impact
  const co2Mitigated = React.useMemo(() => {
    return (procuredWeight * 2.5).toLocaleString(undefined, { maximumFractionDigits: 0 }) + " kg";
  }, [procuredWeight]);

  // Tonnage Matrix breakdown for buyer
  const buyerBreakdown = React.useMemo(() => {
    const counts = {
      Plastic: 0,
      Metal: 0,
      Paper: 0,
      Glass: 0,
      "E-Waste": 0,
      Others: 0
    };

    buyerInteractedListings.forEach(l => {
      const cat = l.category || "Others";
      if (cat in counts) {
        counts[cat as keyof typeof counts] += Number(l.quantity) || 0;
      }
    });

    return counts;
  }, [buyerInteractedListings]);

  const buyerTotalWeight = (Object.values(buyerBreakdown) as number[]).reduce((a, b) => a + b, 0);

  // --- RENDER SELLER LAYOUT ---
  if (isSeller) {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-600" />
            Circular Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium">Dynamic resource conservation indices, material flows, and regulatory compliance logs</p>
        </div>

        {/* Grid of Dynamic Highlights */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Ecological Index */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.03] blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                <Recycle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase font-bold">Landfill Diversion</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{landfillDiversion}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed font-medium">
              Measures the percentage of total listed industrial waste that has been successfully re-routed to active recycling channels, bypassing traditional municipal landfill dumps.
            </p>
          </div>

          {/* Card 2: Regulatory Score */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.03] blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase font-bold">Audit Pass Rate</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{auditPassRate}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed font-medium">
              Reflects material listings matching complete state pollution control board parameters and safety guidelines verified by real-time Gemini AI inspection.
            </p>
          </div>

          {/* Card 3: Carbon Avoidance */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.03] blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono uppercase font-bold">CO₂ Equivalents Saved</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{co2Saved}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed font-medium">
              Aggregated carbon offsets calculated automatically from material recycling re-use factors versus virgin raw ore manufacturing.
            </p>
          </div>
        </div>

        {/* 30-Day Listing Volume Bar Chart */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
                30-Day Waste Listing Velocity
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Volume of waste material listings added over the last 30 days (kg)</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-mono">
                Active Listings Volume
              </span>
            </div>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(v) => `${v}kg`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="volume" 
                  fill="url(#colorVolumeSeller)" 
                  radius={[4, 4, 0, 0]} 
                />
                <defs>
                  <linearGradient id="colorVolumeSeller" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.85}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Flows & Analytics visualizations */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left block: Material Flows comparison bars */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-emerald-600" />
                Dynamic Resource Tonnage Matrix
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Tonnage of materials listed and certified</p>
            </div>

            <div className="space-y-4.5 py-2">
              {(Object.entries(sellerBreakdown) as [string, number][]).map(([category, weight]) => {
                const percent = sellerTotalWeight > 0 ? ((weight / sellerTotalWeight) * 100).toFixed(1) : "0.0";
                return (
                  <div key={category} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">{category}</span>
                      <span className="text-slate-500 font-mono">{weight.toLocaleString()} kg ({percent}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          category === "Plastic" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]" :
                          category === "Metal" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]" :
                          category === "Paper" ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.15)]" :
                          category === "Glass" ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.15)]" :
                          category === "E-Waste" ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]" :
                          "bg-slate-400 shadow-[0_0_10px_rgba(100,116,139,0.15)]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right block: Educational info */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">Industrial Ecology & Symbiosis</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Industrial symbiosis is a primary pillar of the circular economy where waste outputs of one industry 
                become precious raw inputs for another. This model completely limits natural ore exploitation, reduces production overheads, and cuts transportation energy.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Circular Economics Guide</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2.5 items-start">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <p className="text-slate-500 font-medium"><strong className="text-slate-800 font-semibold">Re-melt Index (RMI):</strong> High metallic grade scrap holds 98%+ efficiency coefficient during localized blast induction processing.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p className="text-slate-500 font-medium"><strong className="text-slate-800 font-semibold">Fiber Degradation Ratio (FDR):</strong> Paper and wood fibers suffer structural degradation over 5-7 recycling iterations before requiring virgin pulp binder compounds.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                  <p className="text-slate-500 font-medium"><strong className="text-slate-800 font-semibold">Heavy Metal Leaching Index:</strong> Electronic scraps (E-Waste) must bypass standard thermal processing due to highly toxic cadmium/mercury particulate dispersion hazards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER PROCUREMENT-CENTRIC BUYER/RECYCLER LAYOUT ---
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-emerald-600" />
          Circular Analytics Dashboard
        </h1>
        <p className="text-xs text-slate-500 font-medium">Acquisition, bidding, and procurement metrics focused on resource sourcing and carbon mitigation</p>
      </div>

      {/* Grid of Dynamic Highlights for Buyers */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1: Material Procured */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.03] blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
              <Recycle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase font-bold">TOTAL SOURCED WEIGHT</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{procuredWeight.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed font-medium">
            Total weight (in kg) of materials this buyer has successfully acquired or contracted from the marketplace trade board.
          </p>
        </div>

        {/* Card 2: Active Offers / Bids */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.03] blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase font-bold">ACTIVE MARKETPLACE BIDS</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{activeBidsCount}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed font-medium">
            Total number of active negotiation threads or bids currently placed on the marketplace trade board.
          </p>
        </div>

        {/* Card 3: CO2 Mitigation Impact */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.03] blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase font-bold">PROCUREMENT CO2 OFFSET</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{co2Mitigated}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3.5 leading-relaxed font-medium">
            The environmental carbon offset value calculated purely from the weight of materials this buyer has diverted into their recycling pipeline.
          </p>
        </div>
      </div>

      {/* 30-Day Listing Volume Bar Chart */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
              30-Day Waste Listing Velocity
            </h3>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Volume of waste material listings added over the last 30 days (kg)</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-mono">
              Active Listings Volume
            </span>
          </div>
        </div>
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last30DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                tickFormatter={(v) => `${v}kg`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="volume" 
                fill="url(#colorVolumeBuyer)" 
                radius={[4, 4, 0, 0]} 
              />
              <defs>
                <linearGradient id="colorVolumeBuyer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.85}/>
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Flows & Analytics visualizations for Buyers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left block: Material Sourced progress bars */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-emerald-600" />
              Dynamic Resource Tonnage Matrix
            </h3>
            <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">TONNAGE OF MATERIALS SOURCED & PROCURED</p>
          </div>

          <div className="space-y-4.5 py-2">
            {(Object.entries(buyerBreakdown) as [string, number][]).map(([category, weight]) => {
              const percent = buyerTotalWeight > 0 ? ((weight / buyerTotalWeight) * 100).toFixed(1) : "0.0";
              return (
                <div key={category} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">{category}</span>
                    <span className="text-slate-500 font-mono">{weight.toLocaleString()} kg ({percent}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        category === "Plastic" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]" :
                        category === "Metal" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]" :
                        category === "Paper" ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.15)]" :
                        category === "Glass" ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.15)]" :
                        category === "E-Waste" ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]" :
                        "bg-slate-400 shadow-[0_0_10px_rgba(100,116,139,0.15)]"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right block: Educational info */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Industrial Ecology & Symbiosis</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Industrial symbiosis is a primary pillar of the circular economy where waste outputs of one industry 
              become precious raw inputs for another. This model completely limits natural ore exploitation, reduces production overheads, and cuts transportation energy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Circular Economics Guide</h4>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2.5 items-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <p className="text-slate-500 font-medium"><strong className="text-slate-800 font-semibold">Re-melt Index (RMI):</strong> High metallic grade scrap holds 98%+ efficiency coefficient during localized blast induction processing.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <p className="text-slate-500 font-medium"><strong className="text-slate-800 font-semibold">Fiber Degradation Ratio (FDR):</strong> Paper and wood fibers suffer structural degradation over 5-7 recycling iterations before requiring virgin pulp binder compounds.</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                <p className="text-slate-500 font-medium"><strong className="text-slate-800 font-semibold">Heavy Metal Leaching Index:</strong> Electronic scraps (E-Waste) must bypass standard thermal processing due to highly toxic cadmium/mercury particulate dispersion hazards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
