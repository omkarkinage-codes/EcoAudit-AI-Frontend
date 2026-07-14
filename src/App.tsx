// @ts-nocheck
import React, { useState, useEffect } from "react";
import { 
  Recycle, Store, MessageSquare, BarChart3, User, LogOut, 
  ChevronRight, ChevronLeft, Menu, X, Sun, Moon
} from "lucide-react";
import { motion } from "motion/react";

import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import Marketplace from "./components/Marketplace";
import ChatInterface from "./components/ChatInterface";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import { Listing, Message, AuditLog, PlatformStats } from "./types";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase Client directly using environment variables
const supabase = createClient(
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) || 
    (import.meta as any).env?.VITE_SUPABASE_URL || 
    "",
  (typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) || 
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
    ""
);

export default function App() {
  // Authentication & session routing states
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "",
    email: "",
    location: "",
    role: ""
  });

  // Dark Mode switching engine
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Database listings and transactional state engines
  const [listings, setListings] = useState<Listing[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  
  // Settings configs
  const [webhookUrl, setWebhookUrl] = useState("");
  const [preselectedListingId, setPreselectedListingId] = useState<string | null>(null);
  const [preselectedSellerName, setPreselectedSellerName] = useState<string | null>(null);

  // Platform statuses derived from config
  const [platformStatus, setPlatformStatus] = useState({
    db: true,
    ai: true,
    n8n: false,
    marketplace: true
  });

  // Track read messages to compute unread count in real-time
  const [readMessageIds, setReadMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("readMessageIds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("readMessageIds", JSON.stringify(readMessageIds));
  }, [readMessageIds]);

  const markMessagesAsRead = (ids: string[]) => {
    setReadMessageIds((prev: string[]) => {
      const next = [...prev];
      let changed = false;
      ids.forEach(id => {
        if (!next.includes(id)) {
          next.push(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  };

  const unreadMessagesCount = React.useMemo(() => {
    if (!currentUser?.name) return 0;
    const currentNameLower = currentUser.name.toLowerCase();
    return messages.filter(
      (msg: Message) => msg.receiver && msg.receiver.toLowerCase() === currentNameLower && !readMessageIds.includes(msg.id)
    ).length;
  }, [messages, currentUser, readMessageIds]);

  // Auto-mark all received messages as read when viewing chat page
  useEffect(() => {
    if (currentPage === "chat" && currentUser?.name && messages.length > 0) {
      const receivedMsgIds = messages
        .filter((msg: Message) => msg.receiver && msg.receiver.toLowerCase() === currentUser.name.toLowerCase())
        .map((msg: Message) => msg.id);
      
      if (receivedMsgIds.length > 0) {
        markMessagesAsRead(receivedMsgIds);
      }
    }
  }, [currentPage, messages, currentUser]);

  // Fetch full state from Supabase on startup
  const fetchData = async () => {
    try {
      // 1. Fetch listings from Supabase instead of the local API
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;
      
      const cleanListings = listingsData || [];
      setListings(cleanListings);

      // 2. Calculate and update stats locally using the live data
      const activeCount = cleanListings.filter((l: any) => l.status === "Active" || l.status === "Pending").length;
      setStats({
        totalListings: cleanListings.length,
        activeListings: activeCount,
        complianceRate: 96 
      });

      // 3. Fallback mock state arrays for messages and logs
      setMessages([]);
      setLogs([]);
      setWebhookUrl("");

    } catch (err) {
      console.error("Error communicating with Supabase:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPlatformStatus(prev => ({
      ...prev,
      n8n: !!webhookUrl
    }));
  }, [webhookUrl]);

  // Auth logins & Signups
  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setLoggedIn(true);
    setCurrentPage("dashboard");
    fetchData();
  };

  const handleRegisterSuccess = (company: any) => {
    setWebhookUrl(""); 
    fetchData();
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out of EcoAudit AI?");
    if (confirmLogout) {
      setLoggedIn(false);
      setCurrentPage("dashboard");
    }
  };

  // Add listing with real-time database appraisal
  const handleAddListing = async (listingData: any) => {
    try {
      const { error } = await supabase
        .from('listings')
        .insert([
          {
            title: listingData.title,
            category: listingData.category,
            quantity: listingData.quantity,
            price: listingData.price,
            location: listingData.location,
            description: listingData.description,
            status: listingData.status || "Active",
            compliance: listingData.compliance || "Pending"
          }
        ]);

      if (error) throw error;
      await fetchData(); 
    } catch (err) {
      console.error("Post listing failed:", err);
      throw err;
    }
  };

  // Delete listing from Supabase
  const handleDeleteListing = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this material listing? This action cannot be undone.");
    if (!confirmDelete) return;
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData(); 
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete listing.");
    }
  };

  // Send message framework placeholder
  const handleSendMessage = async (messageData: any) => {
    try {
      console.log("Sending message data:", messageData);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Update dynamic webhook url
  const handleUpdateWebhook = async (url: string) => {
    try {
      setWebhookUrl(url);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleNavigateToChat = (listingId: string, sellerName: string) => {
    setPreselectedListingId(listingId);
    setPreselectedSellerName(sellerName);
    setCurrentPage("chat");
  };

  // --- RENDERING ROUTER GATEWAYS ---

  // Phase 1: Pre-Authentication View
  if (!loggedIn) {
    return (
      <Home 
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        listings={listings}
      />
    );
  }

  // Phase 2: Post-Authentication View
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans relative">
      
      {/* Background neon light accents (Very subtle for light mode) */}
      <div className="absolute top-1/4 left-1/4 w-[35%] h-[35%] rounded-full bg-emerald-500/[0.02] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35%] h-[35%] rounded-full bg-blue-500/[0.02] blur-[150px] pointer-events-none" />

      {/* Left Custom Sidebar Container - High Polish Sleek Dark Slate */}
      <aside className={`fixed md:relative top-0 bottom-0 left-0 z-30 transition-transform duration-300 md:transition-all ${sidebarExpanded ? "w-64 p-5" : "w-16 px-2 py-5"} ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} border-r border-slate-800 bg-slate-900 flex flex-col justify-between flex-shrink-0 text-slate-100`}>
        
        {/* Upper Brand Info & Links */}
        <div className="space-y-7">
          <div className={`flex ${sidebarExpanded ? "items-center justify-between" : "flex-col items-center gap-4"} border-b border-slate-800/60 pb-4`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-emerald-500 rounded-xl border border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex-shrink-0">
                <Recycle className="h-5 w-5 text-white animate-spin-slow" />
              </div>
              {sidebarExpanded && (
                <div className="truncate">
                  <span className="text-lg font-bold tracking-tight text-white block truncate">
                    EcoAudit AI
                  </span>
                  <p className="text-[9px] text-slate-400 tracking-wider uppercase font-mono font-semibold">Waste Marketplace</p>
                </div>
              )}
            </div>
            
            {/* Theme Toggle button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-750 flex items-center justify-center"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-blue-400" />
              )}
            </button>

            {/* Collapse/Expand toggle button */}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="hidden md:block p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-750"
              title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {sidebarExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Mobile close sidebar button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 mt-4 text-xs font-semibold">
            <button
              onClick={() => { setCurrentPage("dashboard"); setPreselectedListingId(null); setPreselectedSellerName(null); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center ${sidebarExpanded ? "gap-3 px-3" : "justify-center px-1"} py-2 rounded-lg transition-all ${currentPage === "dashboard" ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              title="Dashboard"
            >
              <Recycle className="h-4.5 w-4.5 flex-shrink-0" />
              {sidebarExpanded && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => { setCurrentPage("marketplace"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center ${sidebarExpanded ? "gap-3 px-3" : "justify-center px-1"} py-2 rounded-lg transition-all ${currentPage === "marketplace" ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              title="Marketplace"
            >
              <Store className="h-4.5 w-4.5 flex-shrink-0" />
              {sidebarExpanded && <span>Marketplace</span>}
            </button>

            <button
              onClick={() => { setCurrentPage("chat"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center ${sidebarExpanded ? "gap-3 px-3" : "justify-center px-1"} py-2 rounded-lg transition-all ${currentPage === "chat" ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              title="Chat Inbox"
            >
              <div className="relative flex-shrink-0">
                <MessageSquare className="h-4.5 w-4.5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              {sidebarExpanded && <span>Chat Inbox</span>}
            </button>

            {!(currentUser?.role?.toLowerCase() === "buyer" || currentUser?.role?.toLowerCase() === "recycler") && (
              <button
                onClick={() => { setCurrentPage("analytics"); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center ${sidebarExpanded ? "gap-3 px-3" : "justify-center px-1"} py-2 rounded-lg transition-all ${currentPage === "analytics" ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                title="Analytics"
              >
                <BarChart3 className="h-4.5 w-4.5 flex-shrink-0" />
                {sidebarExpanded && <span>Analytics</span>}
              </button>
            )}

            <button
              onClick={() => { setCurrentPage("profile"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center ${sidebarExpanded ? "gap-3 px-3" : "justify-center px-1"} py-2 rounded-lg transition-all ${currentPage === "profile" ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              title="My Account"
            >
              <User className="h-4.5 w-4.5 flex-shrink-0" />
              {sidebarExpanded && <span>My Account</span>}
            </button>
          </nav>

          {/* User Status Card */}
          <div className={`${sidebarExpanded ? "p-3 bg-slate-800/50 border border-slate-800/80 rounded-xl" : "flex justify-center"} text-left mt-auto`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div 
                className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : "US"}
              </div>
              {sidebarExpanded && (
                <div className="text-xs min-w-0">
                  <p className="font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono capitalize truncate">{currentUser.role}</p>
                </div>
              )}
            </div>
            {sidebarExpanded && (
              <div className="text-[10px] text-slate-400 font-mono space-y-0.5 border-t border-slate-800/60 pt-1.5 mt-1.5">
                <p className="truncate">📍 {currentUser.location}</p>
                <p className="truncate">✉ {currentUser.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lower Status lists and logouts */}
        <div className="space-y-4">
          
          {/* Platform status monitoring */}
          {sidebarExpanded && (
            <div className="p-3 bg-slate-800/40 border border-slate-800/60 rounded-xl space-y-2 text-xs">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Platform Status</span>
              
              <div className="space-y-1 font-mono text-[10px] font-semibold">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database</span>
                  <span className="text-emerald-400 flex items-center gap-1">Connected ●</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AI Engine</span>
                  <span className="text-emerald-400 flex items-center gap-1">Active ●</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Marketplace</span>
                  <span className="text-emerald-400 flex items-center gap-1">Live ●</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarExpanded ? "justify-center gap-2 px-3" : "justify-center px-1"} py-2.5 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 hover:bg-red-500/10 hover:border-red-500/20 text-red-400 transition-all cursor-pointer`}
            title="Logout"
          >
            <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
            {sidebarExpanded && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-25 md:hidden" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main viewport area */}
      <main className="flex-1 overflow-hidden flex flex-col relative z-10 bg-slate-50 text-slate-900">
        
        {/* Mobile App Bar */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
              <Recycle className="h-4 w-4 animate-spin-slow" />
            </div>
            <span className="text-sm font-bold text-slate-900">EcoAudit AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-blue-500" />
              )}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {currentPage === "dashboard" && (
          <Dashboard 
            user={currentUser}
            onNavigate={setCurrentPage}
            listings={listings}
            messages={messages}
            stats={stats}
            onDeleteListing={handleDeleteListing}
            onLogout={handleLogout}
            platformStatus={platformStatus}
            readMessageIds={readMessageIds}
            onMarkMessagesAsRead={markMessagesAsRead}
            onSendMessage={handleSendMessage}
          />
        )}

        {currentPage === "marketplace" && (
          <Marketplace 
            user={currentUser}
            listings={listings}
            onAddListing={handleAddListing}
            onDeleteListing={handleDeleteListing}
            onNavigateToChat={handleNavigateToChat}
          />
        )}

        {currentPage === "chat" && (
          <ChatInterface 
            user={currentUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            preselectedListingId={preselectedListingId}
            preselectedSellerName={preselectedSellerName}
          />
        )}

        {currentPage === "analytics" && (
          <Analytics 
            user={currentUser}
            listings={listings}
            stats={stats} 
            messages={messages}
          />
        )}

        {currentPage === "profile" && (
          <Profile 
            user={currentUser}
            listings={listings}
            messages={messages}
            onDeleteListing={handleDeleteListing}
            onNavigate={setCurrentPage}
          />
        )}
      </main>

    </div>
  );
}