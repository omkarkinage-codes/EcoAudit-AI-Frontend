import React, { useState, useEffect } from "react";
import { 
  Recycle, Store, MessageSquare, BarChart3, User, LogOut, 
  PlusCircle, Search, TrendingUp, Settings, Trash2, Edit3, 
  ExternalLink, Bell, Mail, ShieldCheck, CheckCircle2, AlertTriangle, Cpu,
  MapPin, Filter, ArrowRight, FileText, Check
} from "lucide-react";
import { Listing, PlatformStats, Message } from "../types";

// Import the generated image asset path statically
const HERO_BANNER_SRC = "/src/assets/images/ecoaudit_hero_banner_1783428187955.jpg";

interface DashboardProps {
  user: { name: string; email: string; location: string; role: string };
  onNavigate: (page: string) => void;
  listings: Listing[];
  messages: Message[];
  stats: PlatformStats | null;
  onDeleteListing: (id: string) => void;
  onLogout: () => void;
  platformStatus: { db: boolean; ai: boolean; marketplace: boolean };
  readMessageIds?: string[];
  onMarkMessagesAsRead?: (ids: string[]) => void;
  onSendMessage?: (messageData: any) => Promise<void>;
}

export default function Dashboard({ 
  user, 
  onNavigate, 
  listings, 
  messages,
  stats, 
  onDeleteListing, 
  onLogout,
  platformStatus,
  readMessageIds = [],
  onMarkMessagesAsRead,
  onSendMessage
}: DashboardProps) {
  const [selectedAuditListing, setSelectedAuditListing] = useState<Listing | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  // Buyer-centric search, filter and bidding states
  const [buyerSearch, setBuyerSearch] = useState("");
  const [buyerCategory, setBuyerCategory] = useState("All");
  const [buyerMinWeight, setBuyerMinWeight] = useState("");
  const [biddingListing, setBiddingListing] = useState<Listing | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidTerms, setBidTerms] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // User notifications: welcome message + personal listing success notifications only
  const notifications = React.useMemo(() => {
    const list = [
      {
        id: "welcome",
        text: `Welcome, ${user.name}! Your account is active. Welcome to EcoAudit AI.`,
        time: "Just now"
      }
    ];

    const userListings = listings.filter(l => l.sellerEmail === user.email || l.seller === user.name);
    userListings.forEach((l, index) => {
      list.push({
        id: `listing-${l.id}`,
        text: `Material listed successfully: "${l.material}" of ${l.quantity} ${l.unit} published and compliance certified.`,
        time: `${index + 1}h ago`
      });
    });

    return list.map(n => ({
      ...n,
      read: readIds.includes(n.id)
    }));
  }, [user, listings, readIds]);

  // Compute exact real-time stats directly from listings and messages to bypass fake/hardcoded numbers
  const totalListings = listings.length;
  const registeredCount = stats?.registeredCompanies ?? 2;

  // Real-time unique peoples/companies messaging to active user
  const directMessagesToMe = messages.filter(msg => msg.receiver === user.name && msg.sender !== user.name);
  const uniqueSendersToMe = new Set(directMessagesToMe.map(msg => msg.sender));
  const totalMessagesCount = uniqueSendersToMe.size;

  // Real-time dynamic unread messages count and previews
  const unreadMessagesCount = React.useMemo(() => {
    if (!user?.name) return 0;
    const currentNameLower = user.name.toLowerCase();
    return messages.filter(
      msg => msg.receiver && msg.receiver.toLowerCase() === currentNameLower && !readMessageIds.includes(msg.id)
    ).length;
  }, [messages, user.name, readMessageIds]);

  const previewMsgs = React.useMemo(() => {
    if (!user?.name) return [];
    const currentNameLower = user.name.toLowerCase();
    const myReceivedMessages = messages.filter(
      msg => msg.receiver && msg.receiver.toLowerCase() === currentNameLower
    );
    return [...myReceivedMessages].reverse().slice(0, 4);
  }, [messages, user.name]);
  
  // Real-time weights formatting
  const totalWasteWeight = listings.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const formattedWeight = totalWasteWeight.toLocaleString();

  // Real-time breakdown of current listing weights
  const breakdown = React.useMemo(() => {
    const counts = {
      Plastic: 0,
      Metal: 0,
      Paper: 0,
      Glass: 0,
      "E-Waste": 0,
      Others: 0
    };
    listings.forEach(l => {
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
  }, [listings]);

  // Compute if active user is a Buyer
  const isBuyer = user.role.toLowerCase() === "buyer" || user.role.toLowerCase() === "recycler";

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingListing || !bidPrice) return;
    setIsSubmittingBid(true);
    setBidSuccess("");
    try {
      const bidMessage = {
        sender: user.name,
        senderRole: user.role,
        receiver: biddingListing.seller,
        listingId: biddingListing.id,
        text: `PROPOSED BID OFFER: ₹${bidPrice}/kg | Special Terms: ${bidTerms || "None specified."}`
      };

      if (onSendMessage) {
        await onSendMessage(bidMessage);
      } else {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bidMessage)
        });
        if (!response.ok) {
          throw new Error("Failed to submit bid offer.");
        }
      }

      setBidSuccess(`Your offer of ₹${bidPrice}/kg has been successfully logged and sent to ${biddingListing.seller}!`);
      setBidPrice("");
      setBidTerms("");
      setTimeout(() => {
        setBiddingListing(null);
        setBidSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Failed to place bid:", err);
      alert("Error placing bid.");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Filtered listings for the buyer search/filter panel on the dashboard
  const buyerFilteredListings = React.useMemo(() => {
    return listings.filter(l => {
      const matchesSearch = l.material.toLowerCase().includes(buyerSearch.toLowerCase()) ||
                            l.location.toLowerCase().includes(buyerSearch.toLowerCase());
      const matchesCat = buyerCategory === "All" || l.category === buyerCategory;
      const matchesWeight = !buyerMinWeight || (Number(l.quantity) >= Number(buyerMinWeight));
      return matchesSearch && matchesCat && matchesWeight;
    });
  }, [listings, buyerSearch, buyerCategory, buyerMinWeight]);

  // Percentages computed dynamically
  const sumWeights = (Object.values(breakdown) as number[]).reduce((a, b) => a + b, 0) || totalWasteWeight || 1;
  
  const getPercentage = (val: number) => {
    return ((val / sumWeights) * 100).toFixed(1);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      
      {/* Dynamic Header row matching layout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {getGreeting()}, {user.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm text-slate-500 font-medium">Here's what's happening on EcoAudit AI today.</p>
        </div>

        {/* Floating notifications / user button */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          
          {/* Notification Menu popover wrapper */}
          <div className="relative">
            <button 
              onClick={() => { setIsNotificationOpen(!isNotificationOpen); setIsMailOpen(false); }}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors relative shadow-sm cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {isNotificationOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsNotificationOpen(false)} />
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-40 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 font-sans">Notifications</span>
                    <button 
                      onClick={() => {
                        setReadIds(notifications.map(n => n.id));
                      }}
                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 border border-slate-100/80 transition-colors flex gap-2.5">
                        <div className="mt-0.5">
                          <span className={`block w-2 h-2 rounded-full mt-1 ${notif.read ? "bg-slate-300" : "bg-emerald-500 animate-pulse"}`} />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs text-slate-700 font-medium leading-normal">{notif.text}</p>
                          <span className="text-[9px] text-slate-400 font-mono block">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Mail / Inbox Preview menu wrapper */}
          <div className="relative">
            <button 
              onClick={() => { setIsMailOpen(!isMailOpen); setIsNotificationOpen(false); }}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors relative shadow-sm cursor-pointer"
            >
              <Mail className="h-5 w-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold font-mono animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {isMailOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsMailOpen(false)} />
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-40 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 font-sans">Direct Messages</span>
                    {unreadMessagesCount > 0 ? (
                      <button 
                        onClick={() => {
                          const userReceivedIds = messages
                            .filter(m => m.receiver && m.receiver.toLowerCase() === user.name.toLowerCase())
                            .map(m => m.id);
                          onMarkMessagesAsRead?.(userReceivedIds);
                        }}
                        className="text-[10px] text-emerald-600 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">All read</span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {previewMsgs.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic text-center py-4">No recent messages</p>
                    ) : (
                      previewMsgs.map((msg, index) => {
                        const isUnread = msg.id && !readMessageIds.includes(msg.id);
                        return (
                          <div 
                            key={msg.id || index} 
                            onClick={() => {
                              setIsMailOpen(false);
                              if (msg.id) {
                                onMarkMessagesAsRead?.([msg.id]);
                              }
                              onNavigate("chat");
                            }}
                            className={`p-2.5 rounded-xl transition-all flex flex-col cursor-pointer gap-1 border ${isUnread ? "bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50" : "bg-slate-50 hover:bg-slate-100/80 border-slate-100/80"}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                {msg.sender}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">Recent</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate font-medium">{msg.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setIsMailOpen(false);
                      onNavigate("chat");
                    }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                  >
                    Open Active Chat Interface
                  </button>
                </div>
              </>
            )}
          </div>

          <div 
            onClick={() => onNavigate("profile")}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            title="Open My Account"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-600">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-bold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-mono capitalize font-semibold">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner Grid Card */}
      <div className="relative rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950">
        {/* Background image from generated asset with modern container width and dark overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={HERO_BANNER_SRC} 
            alt="EcoAudit Dynamic Background" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-20 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-8 grid md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3.5">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {isBuyer ? "Discover Premium Waste Surplus" : "Turning Industrial Waste"} <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {isBuyer ? "Secure Audited Materials" : "Into a Sustainable Future"}
              </span>
            </h2>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              {isBuyer 
                ? "Search, inspect, and purchase fully audited industrial scrap and secondary materials with verified regulatory compliance checks."
                : "AI-Powered. Connected. Sustainable. Connect with global recyclers and check your material classification compliance instantly."}
            </p>
          </div>
          
          <div className="md:col-span-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5 space-y-2 self-stretch flex flex-col justify-center backdrop-blur-md">
            <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase font-bold">Our Mission</span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              Reduce landfill waste, minimize carbon emissions, and promote a circular industrial economy through fast compliance automation and smart trading channels.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Listings */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">{isBuyer ? "Available Batches" : "Total Listings"}</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight font-sans">
            {totalListings}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400">
            <Recycle className="h-3 w-3 text-emerald-500" />
            <span>{isBuyer ? "Active surplus listings" : "Active raw waste boards"}</span>
          </div>
        </div>

        {/* Registered Companies */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-purple-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">{isBuyer ? "Verified Sellers" : "Registered Companies"}</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight font-sans">
            {registeredCount}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400">
            <Store className="h-3 w-3 text-purple-500" />
            <span>{isBuyer ? "Validated raw waste generators" : "Verified global buyers/sellers"}</span>
          </div>
        </div>

        {/* Total Messages */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">Inquiring Companies</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight font-sans">
            {totalMessagesCount}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400">
            <MessageSquare className="h-3 w-3 text-blue-500" />
            <span>Active negotiation threads</span>
          </div>
        </div>

        {/* Waste Listed Weight */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold font-sans">{isBuyer ? "Sourced Weight" : "Waste Listed"}</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight font-sans">
            {formattedWeight} <span className="text-xs text-slate-500 font-normal">kg</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-slate-400">
            <TrendingUp className="h-3 w-3 text-cyan-500" />
            <span>Circular economy diverted</span>
          </div>
        </div>
      </div>

      {isBuyer ? (
        /* ==================== REDESIGNED BUYER INTERFACE ==================== */
        <div className="grid md:grid-cols-12 gap-6">
          {/* Left Column: Interactive Search, Filters, and Distribution Donut Chart */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Search and Filters Box */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Filter className="h-4 w-4" />
                </span>
                Material Filter & Discovery Search
              </h3>

              <div className="space-y-3">
                {/* Search Text */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Search Text</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search material or location..."
                      value={buyerSearch}
                      onChange={(e) => setBuyerSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Category Selector Tabs */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Category</label>
                  <div className="flex flex-wrap gap-1">
                    {["All", "Plastic", "Metal", "Paper", "Glass", "E-Waste", "Others"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setBuyerCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${buyerCategory === cat ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minimum Weight Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Minimum Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={buyerMinWeight}
                    onChange={(e) => setBuyerMinWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Material Distribution Donut Chart */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  Marketplace Distribution
                </h3>
                <span className="text-[10px] font-mono font-semibold text-slate-400">Live Trade Weights</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                {/* SVG Custom Donut */}
                <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                    {(() => {
                      const categories = [
                        { name: "Plastic", color: "#10b981" },
                        { name: "Metal", color: "#3b82f6" },
                        { name: "Paper", color: "#a855f7" },
                        { name: "Glass", color: "#06b6d4" },
                        { name: "E-Waste", color: "#f59e0b" },
                        { name: "Others", color: "#94a3b8" }
                      ];
                      let cumulativePercent = 0;
                      return categories.map(cat => {
                        const weight = (breakdown[cat.name as keyof typeof breakdown] as number) || 0;
                        const percent = sumWeights > 0 ? (weight / sumWeights) * 100 : 0;
                        const strokeDasharray = `${(percent / 100) * 238.76} 238.76`;
                        const strokeDashoffset = `${- (cumulativePercent / 100) * 238.76}`;
                        cumulativePercent += percent;
                        return (
                          <circle 
                            key={cat.name}
                            cx="50" 
                            cy="50" 
                            r="38" 
                            fill="transparent" 
                            stroke={cat.color} 
                            strokeWidth="8" 
                            strokeDasharray={strokeDasharray} 
                            strokeDashoffset={strokeDashoffset} 
                            strokeLinecap="round" 
                            className="transition-all duration-500"
                            title={`${cat.name}: ${weight} kg (${percent.toFixed(1)}%)`}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-sm font-extrabold text-slate-900 leading-none">{formattedWeight}</span>
                    <span className="text-[8px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Total kg</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-2 w-full text-[11px]">
                  {(() => {
                    const categories = [
                      { name: "Plastic", color: "#10b981" },
                      { name: "Metal", color: "#3b82f6" },
                      { name: "Paper", color: "#a855f7" },
                      { name: "Glass", color: "#06b6d4" },
                      { name: "E-Waste", color: "#f59e0b" },
                      { name: "Others", color: "#94a3b8" }
                    ];
                    return categories.map(cat => {
                      const weight = (breakdown[cat.name as keyof typeof breakdown] as number) || 0;
                      const percent = sumWeights > 0 ? (weight / sumWeights) * 100 : 0;
                      return (
                        <div key={cat.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-slate-700 font-medium">{cat.name}</span>
                          </div>
                          <span className="text-slate-500 font-mono">
                            {weight.toLocaleString()} kg
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Marketplace Discovery Feed */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Store className="h-4 w-4" />
                  </span>
                  Marketplace Discovery Feed
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore listed surplus scrap batches and compliance grades</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                {buyerFilteredListings.length} Batches Found
              </span>
            </div>

            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              {buyerFilteredListings.map((listing) => (
                <div 
                  key={listing.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                        <Recycle className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{listing.material}</h4>
                        <span className="text-[9px] font-mono font-bold text-slate-400">ID: {listing.id}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                      {listing.category}
                    </span>
                  </div>

                  {/* Quantity and Location */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/55 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Total Weight</p>
                      <p className="text-sm font-extrabold text-slate-900">{listing.quantity} {listing.unit}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">Location</p>
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {listing.location}
                      </p>
                    </div>
                  </div>

                  {/* Automated Eco-Audit Verdict badge (recyclability & compliance standard) */}
                  <div className="p-3.5 rounded-xl border border-blue-100/85 bg-blue-50/20 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-wider">Automated Eco-Audit Verdict</span>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono text-slate-400 uppercase font-bold block">Recyclability Rating</span>
                        <p className="text-slate-600 font-medium">{listing.recyclability}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-mono text-slate-400 uppercase font-bold block">Compliance Standard</span>
                        <p className="text-slate-600 font-medium">{listing.compliance}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-300" />
                      {listing.seller}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedAuditListing(listing)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] font-sans transition-colors cursor-pointer border border-slate-200/50"
                      >
                        Inspect Audit
                      </button>
                      <button 
                        onClick={() => {
                          setBiddingListing(listing);
                          setBidPrice("");
                          setBidTerms("");
                          setBidSuccess("");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Place Bid / Offer
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {buyerFilteredListings.length === 0 && (
                <div className="py-16 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <p className="italic text-slate-400 font-medium">No raw surplus batches found matching filters.</p>
                  <button 
                    onClick={() => { setBuyerSearch(""); setBuyerCategory("All"); setBuyerMinWeight(""); }}
                    className="text-xs text-emerald-600 hover:underline font-bold"
                  >
                    Reset Filter Constraints
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== STANDARD SELLER INTERFACE ==================== */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Left: Material Distribution */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <BarChart3 className="h-4 w-4" />
                </span>
                Material Distribution
              </h3>
              <select className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium">
                <option>This Month</option>
                <option>Last Quarter</option>
                <option>Full Year</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              {/* SVG Custom Premium Donut Chart */}
              <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Ring */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  {(() => {
                    const categories = [
                      { name: "Plastic", color: "#10b981" },
                      { name: "Metal", color: "#3b82f6" },
                      { name: "Paper", color: "#a855f7" },
                      { name: "Glass", color: "#06b6d4" },
                      { name: "E-Waste", color: "#f59e0b" },
                      { name: "Others", color: "#94a3b8" }
                    ];
                    let cumulativePercent = 0;
                    return categories.map(cat => {
                      const weight = (breakdown[cat.name as keyof typeof breakdown] as number) || 0;
                      const percent = sumWeights > 0 ? (weight / sumWeights) * 100 : 0;
                      const strokeDasharray = `${(percent / 100) * 238.76} 238.76`;
                      const strokeDashoffset = `${- (cumulativePercent / 100) * 238.76}`;
                      cumulativePercent += percent;
                      return (
                        <circle 
                          key={cat.name}
                          cx="50" 
                          cy="50" 
                          r="38" 
                          fill="transparent" 
                          stroke={cat.color} 
                          strokeWidth="8" 
                          strokeDasharray={strokeDasharray} 
                          strokeDashoffset={strokeDashoffset} 
                          strokeLinecap="round" 
                          className="transition-all duration-500"
                          title={`${cat.name}: ${weight} kg (${percent.toFixed(1)}%)`}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-lg font-extrabold text-slate-900 leading-none">{formattedWeight}</span>
                  <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-1">Total Waste</span>
                </div>
              </div>

              {/* Legend list */}
              <div className="flex-1 space-y-2.5 w-full text-xs">
                {(() => {
                  const categories = [
                    { name: "Plastic", color: "#10b981" },
                    { name: "Metal", color: "#3b82f6" },
                    { name: "Paper", color: "#a855f7" },
                    { name: "Glass", color: "#06b6d4" },
                    { name: "E-Waste", color: "#f59e0b" },
                    { name: "Others", color: "#94a3b8" }
                  ];
                  return categories.map(cat => {
                    const weight = (breakdown[cat.name as keyof typeof breakdown] as number) || 0;
                    const percent = sumWeights > 0 ? (weight / sumWeights) * 100 : 0;
                    return (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-slate-700 font-medium">{cat.name}</span>
                        </div>
                        <span className="text-slate-500 font-mono">
                          {weight.toLocaleString()} kg ({percent.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Right: Recent Listings Table */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Store className="h-4 w-4" />
                </span>
                Recent Listings
              </h3>
              <button 
                onClick={() => onNavigate("marketplace")}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="min-w-[600px] w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-mono font-semibold pb-2">
                    <th className="py-2.5 font-semibold">Material</th>
                    <th className="py-2.5 font-semibold">Quantity</th>
                    <th className="py-2.5 font-semibold">Location</th>
                    <th className="py-2.5 font-semibold">Seller</th>
                    <th className="py-2.5 font-semibold">Date</th>
                    <th className="py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {listings.slice(0, 4).map((listing) => (
                    <tr key={listing.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 font-semibold text-slate-900">
                        <button 
                          onClick={() => setSelectedAuditListing(listing)}
                          className="text-left hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                        >
                          {listing.material}
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </button>
                      </td>
                      <td className="py-3 font-mono text-slate-800 font-medium">{listing.quantity} {listing.unit}</td>
                      <td className="py-3 text-slate-500">{listing.location}</td>
                      <td className="py-3 text-slate-500 truncate max-w-[100px]">{listing.seller}</td>
                      <td className="py-3 text-slate-500 font-mono">{listing.date}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setSelectedAuditListing(listing)}
                            title="Inspect AI Compliance Audit"
                            className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100/80 text-emerald-600 border border-emerald-100 transition-colors"
                          >
                            <Cpu className="h-3.5 w-3.5" />
                          </button>
                          {(listing.sellerEmail === user.email || listing.seller === user.name) && (
                            <button 
                              onClick={() => onDeleteListing(listing.id)}
                              title="Delete Listing"
                              className="p-1.5 rounded bg-red-50 hover:bg-red-100/80 text-red-600 border border-red-100 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {listings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic font-medium">No listings on the board. Create one to test!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Quick Actions Footer Box */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">Quick Actions</h3>
        
        <div className={`grid grid-cols-1 ${isBuyer ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-4 w-full`}>
          {!isBuyer && (
            <button 
              onClick={() => onNavigate("marketplace")}
              className="flex items-center p-4 w-full min-h-[80px] rounded-xl border border-emerald-100 bg-white hover:bg-slate-50/80 transition-all text-left shadow-sm hover:shadow gap-3"
            >
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">Create Listing</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Add waste for sale</p>
              </div>
            </button>
          )}

          <button 
            onClick={() => onNavigate("marketplace")}
            className="flex items-center p-4 w-full min-h-[80px] rounded-xl border border-blue-100 bg-white hover:bg-slate-50/80 transition-all text-left shadow-sm hover:shadow gap-3"
          >
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Browse Market</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Find materials</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate("chat")}
            className="flex items-center p-4 w-full min-h-[80px] rounded-xl border border-purple-100 bg-white hover:bg-slate-50/80 transition-all text-left shadow-sm hover:shadow gap-3"
          >
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Open Chat</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{isBuyer ? "Contact sellers" : "Message buyers"}</p>
            </div>
          </button>

          <button 
            onClick={() => onNavigate("profile")}
            className="flex items-center p-4 w-full min-h-[80px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all text-left shadow-sm hover:shadow gap-3"
          >
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">My Account</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium font-sans">Account settings</p>
            </div>
          </button>
        </div>
      </div>

      {/* AI COMPLIANCE AUDIT OVERLAY / DETAIL POPUP */}
      {selectedAuditListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedAuditListing(null)} />
          
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 z-10 space-y-4 max-h-[85vh] overflow-y-auto text-slate-800">
            <button 
              onClick={() => setSelectedAuditListing(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                <Recycle className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedAuditListing.material}</h3>
                <p className="text-xs text-slate-500 font-medium">Regulatory & Recyclability Appraisal (Gemini Audited)</p>
              </div>
            </div>

            {selectedAuditListing.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-slate-50">
                <img 
                  src={selectedAuditListing.imageUrl} 
                  alt={selectedAuditListing.material} 
                  referrerPolicy="no-referrer"
                  className="max-h-48 object-contain"
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block font-bold">Category</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit block font-mono">
                  {selectedAuditListing.category}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block font-bold pt-3">Operational Weight</span>
                <span className="text-sm font-bold text-slate-800">
                  {selectedAuditListing.quantity} {selectedAuditListing.unit}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block font-bold pt-3">Filing Location</span>
                <span className="text-sm font-medium text-slate-700">
                  {selectedAuditListing.location}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block font-bold">Seller of Record</span>
                <span className="text-sm font-bold text-slate-800">{selectedAuditListing.seller}</span>
                <span className="text-xs text-slate-500 block font-mono">{selectedAuditListing.sellerEmail}</span>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block font-bold pt-3">Publish Date</span>
                <span className="text-xs text-slate-500 block font-mono">{selectedAuditListing.date}</span>
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block font-bold pt-3">Audit Certificate</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> EcoAudit Secured
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono">AI Recyclability Classification</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-100 font-medium">
                {selectedAuditListing.recyclability}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">Regulatory Compliance Standard</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-100 font-medium">
                {selectedAuditListing.compliance}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setSelectedAuditListing(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors border border-slate-200/55"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {biddingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setBiddingListing(null)} />
          
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 z-10 space-y-4 text-slate-800">
            <button 
              onClick={() => setBiddingListing(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Place Bid Offer</h3>
                <p className="text-xs text-slate-500 font-medium">For: {biddingListing.material} ({biddingListing.quantity} {biddingListing.unit})</p>
              </div>
            </div>

            {bidSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2 py-6">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto animate-bounce" />
                <p className="text-xs font-bold uppercase tracking-wide">Bid Logged Successfully</p>
                <p className="text-xs font-medium leading-relaxed">{bidSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Proposed Price (per kg) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 45"
                      value={bidPrice}
                      onChange={(e) => setBidPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Special Terms or Message (Optional)</label>
                  <textarea
                    placeholder="Describe logistics preferences, inspection requirements, or timeline..."
                    value={bidTerms}
                    rows={3}
                    onChange={(e) => setBidTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBiddingListing(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBid}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingBid ? (
                      <>
                        <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Logging Bid...
                      </>
                    ) : (
                      "Submit Bid / Offer"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
