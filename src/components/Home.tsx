import React, { useState } from "react";
import { Leaf, Recycle, ShieldCheck, Zap, Mail, MapPin, Building, Lock, ArrowRight, UserPlus, LogIn, ChevronRight, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { Listing } from "../types";

interface HomeProps {
  onLoginSuccess: (user: { name: string; email: string; location: string; role: string }) => void;
  onRegisterSuccess: (company: { name: string; email: string; location: string; type: string }) => void;
  listings?: Listing[];
}

export default function Home({ onLoginSuccess, onRegisterSuccess, listings = [] }: HomeProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register">("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regType, setRegType] = useState("Seller");
  const [regPassword, setRegPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState("");

  // Interactive UI Widget states
  const [selectedCircularMaterial, setSelectedCircularMaterial] = useState<"PET Plastic" | "Scrap Iron" | "Corrugated Cardboard">("PET Plastic");

  // Real-time statistical computations from listed data
  const totalWeight = listings.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  let formattedWeight = "0 kg";
  if (totalWeight >= 1000) {
    formattedWeight = `${(totalWeight / 1000).toFixed(1)} tons`;
  } else if (totalWeight > 0) {
    formattedWeight = `${totalWeight} kg`;
  }

  const activeListings = listings.filter(l => l.status === "Active" || l.status === "Pending");
  const passedListings = activeListings.filter(l => l.compliance && l.compliance.toLowerCase().includes("pass"));
  const complianceRate = activeListings.length > 0 
    ? Math.round((passedListings.length / activeListings.length) * 100) 
    : 100;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please provide email and password");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess({
          name: data.company.name,
          email: data.company.email,
          location: data.company.location,
          role: data.company.type
        });
        setLoading(false);
        setIsLoginModalOpen(false);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || "Authentication failed");
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg("Failed to communicate with authentication server");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCompany || !regEmail || !regPassword) {
      setErrorMsg("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setRegisterSuccessMsg("");

    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: regCompany,
          email: regEmail,
          operational_hub: regLocation || "Global",
          entity_role: regType,
          secure_password: regPassword
        })
      });

      if (response.ok) {
        setRegisterSuccessMsg("Enterprise registration successfully submitted!");
        
        onRegisterSuccess({
          name: regCompany,
          email: regEmail,
          location: regLocation,
          type: regType
        });

        // Delay the login success redirect to let the user see the success message
        setTimeout(() => {
          onLoginSuccess({
            name: regCompany,
            email: regEmail,
            location: regLocation || "Global",
            role: regType
          });
          setLoading(false);
          setRegisterSuccessMsg("");
          setIsLoginModalOpen(false);
        }, 1500);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || "Registration failed");
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg("Failed to communicate with authorization server");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative flex flex-col justify-between">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/[0.03] blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
              <Recycle className="h-6 w-6 text-emerald-600 animate-spin-slow" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                EcoAudit AI
              </span>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-mono font-bold">Industrial Waste Hub</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Platform Features</a>
            <a href="#circular" className="hover:text-emerald-600 transition-colors">Circular Economy</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => { setModalTab("login"); setIsLoginModalOpen(true); }}
              className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={() => { setModalTab("register"); setIsLoginModalOpen(true); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-sm font-bold text-white shadow-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              Register Enterprise
            </button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 md:hidden hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-6 space-y-4 shadow-lg">
            <nav className="flex flex-col gap-4 text-sm font-semibold text-slate-600">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)} 
                className="hover:text-emerald-600 transition-colors py-1.5 border-b border-slate-50"
              >
                Platform Features
              </a>
              <a 
                href="#circular" 
                onClick={() => setMobileMenuOpen(false)} 
                className="hover:text-emerald-600 transition-colors py-1.5 border-b border-slate-50"
              >
                Circular Economy
              </a>
            </nav>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => { setModalTab("login"); setIsLoginModalOpen(true); setMobileMenuOpen(false); }}
                className="w-full py-3 text-sm font-bold text-center text-slate-600 hover:text-emerald-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => { setModalTab("register"); setIsLoginModalOpen(true); setMobileMenuOpen(false); }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-sm font-bold text-center text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
              >
                Register Enterprise
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-24 grid md:grid-cols-12 gap-12 items-center flex-grow">
        <div className="md:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-mono font-bold">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Enterprise Circular Automation Engine
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-none">
            Turning Industrial Waste <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Into a Sustainable Future
            </span>
          </h1>

          <p className="text-lg text-slate-500 max-w-xl leading-relaxed font-medium">
            EcoAudit AI bridges the gap between industrial waste generators and premium recyclers. Leveraging 
            advanced Gemini AI compliance scoring to power industrial ecology.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <button
              onClick={() => { setModalTab("register"); setIsLoginModalOpen(true); }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 font-bold text-white shadow-md hover:opacity-95 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              List Material Scrap Now
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setModalTab("login"); setIsLoginModalOpen(true); }}
              className="px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              Access Marketplace
            </button>
          </div>

          {/* Mini-Stats Trust Grid */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200">
            <div>
              <p className="text-2xl font-black text-slate-900">{formattedWeight}</p>
              <p className="text-xs text-slate-400 font-semibold font-mono uppercase">Industrial waste listed</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{activeListings.length} Active</p>
              <p className="text-xs text-slate-400 font-semibold font-mono uppercase">Materials Listed</p>
            </div>
            <div>
              <p className="text-2xl font-black text-cyan-600">{complianceRate}%</p>
              <p className="text-xs text-slate-400 font-semibold font-mono uppercase">AI Compliance Rate</p>
            </div>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="md:col-span-5 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-3xl blur-3xl pointer-events-none" />
          <div className="relative rounded-3xl border border-slate-200 bg-white p-3 overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.01]">
            <img 
              src="/ecoaudit_hero_banner_1783428187955.jpg" 
              alt="EcoAudit Circular Services Hub" 
              className="w-full h-auto rounded-2xl object-cover shadow-inner"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </main>

      {/* Grid Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full border-t border-slate-200 bg-white scroll-mt-24">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Engineered For Industrial Symbiosis</h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium">Three core pillars driving full-scale circular economy compliance, classification, and trade logistics.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 hover:bg-white transition-all space-y-4 shadow-xs">
            <div className="p-3 w-fit rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
              <Recycle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">AI Classification</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Upload images or text specifications. Gemini immediately identifies material subcategories and estimates processing suitability index.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 hover:bg-white transition-all space-y-4 shadow-xs">
            <div className="p-3 w-fit rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Regulatory Auditing</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Checks toxic constituents, chemical safety requirements, and local regulations (EPA, FDA, or state regulations) to ensure full compliance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-slate-300 hover:bg-white transition-all space-y-4 shadow-xs">
            <div className="p-3 w-fit rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs">
              <Building className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Collaborative Bidding</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              A private real-time negotiation terminal allows sellers to interact directly with industrial recyclers, securing direct circular procurement.
            </p>
          </div>
        </div>
      </section>

      {/* Circular Economy Interactive Showcase */}
      <section id="circular" className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full border-t border-slate-200 bg-white scroll-mt-24">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-mono font-bold">
              <Leaf className="h-3.5 w-3.5" />
              Circular Metrics Sandbox
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Industrial Circular Economy
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Every raw material or scrap batch has its own unique recycling lifecycle, purification cost, and carbon offsets. Use our interactive calculator to see how we evaluate secondary market values.
            </p>

            {/* Material selector buttons */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-mono">Select Scrap Material Class:</span>
              <div className="flex flex-col gap-2">
                {(["PET Plastic", "Scrap Iron", "Corrugated Cardboard"] as const).map((mat) => (
                  <button
                    key={mat}
                    onClick={() => setSelectedCircularMaterial(mat)}
                    className={`px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      selectedCircularMaterial === mat
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                        : "bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <span>{mat}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 text-slate-100 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 pointer-events-none" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">LIFECYCLE VERDICT</span>
                  <h3 className="font-bold text-base text-white">{selectedCircularMaterial} Appraisal</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">Circular Score</span>
                  <p className="text-2xl font-black text-emerald-400">
                    {selectedCircularMaterial === "PET Plastic" ? "9.4/10" : selectedCircularMaterial === "Scrap Iron" ? "9.8/10" : "8.7/10"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Circular Processing Route</span>
                  <p className="text-xs font-bold text-slate-200 mt-1">
                    {selectedCircularMaterial === "PET Plastic"
                      ? "Mechanical granulation, color segregation, pellet extruded polymer compounds"
                      : selectedCircularMaterial === "Scrap Iron"
                      ? "Secondary electric arc furnace melting, blast impurity removal, billets creation"
                      : "Hydro-pulping fibers refining, chemical bleaching removal, virgin-mesh lining"}
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Estimated Carbon Reduction</span>
                  <p className="text-lg font-black text-emerald-400 mt-1">
                    {selectedCircularMaterial === "PET Plastic" ? "84.5% CO₂ Saved" : selectedCircularMaterial === "Scrap Iron" ? "92.1% CO₂ Saved" : "74.8% CO₂ Saved"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Compared to virgin raw material procurement</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">Compliance Standard Audit Checklist</span>
                <div className="space-y-1 text-xs text-left">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">EPA Subtitle D non-hazardous industrial solid waste compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">Secondary processing chemical purity safety verified (&gt; 99.4%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">Circular market buy-back safety approved for manufacturing reuse</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-mono">Simulated under EcoAudit Industrial Standards</span>
                <button
                  onClick={() => { setModalTab("register"); setIsLoginModalOpen(true); }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Join & Run Real Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Interactive Multi-Line Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200 bg-slate-50 text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
            {/* Column 1: Brand & Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-emerald-600 animate-pulse" />
                <span className="text-base font-extrabold text-slate-900 tracking-tight">EcoAudit AI</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Empowering circular workspaces by bridging the gap between industrial waste generators and premium recyclers with real-time AI compliance audits.
              </p>
              <div className="pt-1 text-xs font-semibold text-slate-400">
                Created by <span className="text-slate-700">Omkar V. Kinage</span>
              </div>
            </div>

            {/* Column 2: Material Categories */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Materials Ecosystem</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-500">
                <li className="hover:text-emerald-600 transition-colors">PET Plastic & Polymers</li>
                <li className="hover:text-emerald-600 transition-colors">Scrap Iron & Structural Steel</li>
                <li className="hover:text-emerald-600 transition-colors">Corrugated Cardboard & Paper</li>
                <li className="hover:text-emerald-600 transition-colors">Industrial E-Waste & Circuitry</li>
                <li className="hover:text-emerald-600 transition-colors">Glass & Inert Byproducts</li>
              </ul>
            </div>

            {/* Column 3: Platform & Capabilities */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Platform Capabilities</h4>
              <ul className="space-y-2 text-xs font-medium text-slate-500">
                <li className="hover:text-emerald-600 transition-colors">Automated Cognitive AI Audit</li>
                <li className="hover:text-emerald-600 transition-colors">Secure Audit Ledger stream</li>
                <li className="hover:text-emerald-600 transition-colors">Real-time Trust Statistics</li>
                <li className="hover:text-emerald-600 transition-colors">Dynamic n8n Automation Hooks</li>
                <li className="hover:text-emerald-600 transition-colors">EPA & OSHA Compliance Engine</li>
              </ul>
            </div>

            {/* Column 4: Location & Contact */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">CONTACT US</h4>
              <div className="space-y-3 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <a href="mailto:ecoauditai@gmail.com" className="hover:text-emerald-600 transition-colors">
                    ecoauditai@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
            <p>&copy; 2026 EcoAudit AI. Built for Circular Industrial Workspaces. Empowered by Gemini.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur click wrapper */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsLoginModalOpen(false)} />
          
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            {/* Logo inside Modal */}
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
              <Recycle className="h-5 w-5 text-emerald-600" />
              <span className="text-lg font-bold text-slate-900">EcoAudit AI</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 mb-6">
              <button
                type="button"
                onClick={() => { setModalTab("login"); setErrorMsg(""); }}
                className={`flex-1 pb-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${modalTab === "login" ? "text-emerald-600 border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-800"}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setModalTab("register"); setErrorMsg(""); }}
                className={`flex-1 pb-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${modalTab === "register" ? "text-emerald-600 border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-800"}`}
              >
                Register Enterprise
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-mono font-bold">
                {errorMsg}
              </div>
            )}

            {/* Success Message */}
            {registerSuccessMsg && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {registerSuccessMsg}
              </div>
            )}

            {/* FORM BODY */}
            {modalTab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block uppercase font-mono">Corporate Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                      placeholder="info@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block uppercase font-mono">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-4.5 w-4.5" />
                      Authenticate Account
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block uppercase font-mono">Enterprise Name</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                      placeholder="e.g. Omkar Materials Corp"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block uppercase font-mono">Corporate Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                      placeholder="info@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 block uppercase font-mono">Operational Hub</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={regLocation}
                        onChange={(e) => setRegLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                        placeholder="location"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label className="text-xs font-bold text-slate-500 block uppercase font-mono">Entity Role</label>
                    <select
                      value={regType}
                      onChange={(e) => setRegType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      <option value="Seller">Seller (Generator)</option>
                      <option value="Buyer">Buyer (Recycler)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block uppercase font-mono">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4.5 w-4.5" />
                      Register & Issue JWT
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
