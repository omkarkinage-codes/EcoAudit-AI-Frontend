import React, { useState, useRef } from "react";
import { Listing } from "../types";
import { 
  Search, Filter, Plus, ShieldCheck, Recycle, MapPin, 
  Trash2, Upload, FileImage, Clipboard, CheckCircle2, 
  ArrowLeft, Info, HelpCircle, User, MessageSquare, Store
} from "lucide-react";

interface MarketplaceProps {
  user: { name: string; email: string; location: string; role: string };
  listings: Listing[];
  onAddListing: (listingData: any) => Promise<void>;
  onDeleteListing: (id: string) => void;
  onNavigateToChat: (listingId: string, sellerName: string) => void;
}

export default function Marketplace({ 
  user, 
  listings, 
  onAddListing, 
  onDeleteListing,
  onNavigateToChat
}: MarketplaceProps) {
  const isBuyer = user.role?.toLowerCase() === "buyer" || user.role?.toLowerCase() === "recycler";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Bidding states
  const [biddingListing, setBiddingListing] = useState<Listing | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidTerms, setBidTerms] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidSuccess, setBidSuccess] = useState("");

  // Listing Form State
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [location, setLocation] = useState(user.location || "Pune, Maharashtra");
  const [category, setCategory] = useState("Plastic");
  const [description, setDescription] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  // File upload drag & drop states
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for image conversion to base64
  const handleImageFile = (file: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("File size exceeds 8MB. Please upload a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

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

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bidMessage)
      });

      if (response.ok) {
        setBidSuccess(`Your offer of ₹${bidPrice}/kg has been successfully logged and sent to ${biddingListing.seller}!`);
        setBidPrice("");
        setBidTerms("");
        setTimeout(() => {
          setBiddingListing(null);
          setBidSuccess("");
        }, 2500);
      } else {
        alert("Failed to submit bid offer.");
      }
    } catch (err) {
      console.error("Failed to place bid:", err);
      alert("Error placing bid.");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material || !quantity || !location) return;

    setIsSubmitting(true);

    try {
      // Submit listing to local state/listings board via primary secure pipeline
      await onAddListing({
        material,
        quantity: parseFloat(quantity),
        unit: "kg",
        location: location,
        category: category as any,
        description,
        base64Image: null,
        seller: user.name,
        sellerEmail: user.email
      });

      // Clear Form state
      setMaterial("");
      setQuantity("");
      setDescription("");
      setIsFormOpen(false);
      
      setSuccessMsg("Listing successfully created and securely transmitted!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to post listing securely:", err);
      // Fallback message but with correct local state update
      try {
        await onAddListing({
          material,
          quantity: parseFloat(quantity),
          unit: "kg",
          location: location,
          category: category as any,
          description,
          base64Image: null,
          seller: user.name,
          sellerEmail: user.email
        });
        setMaterial("");
        setQuantity("");
        setDescription("");
        setIsFormOpen(false);
        setSuccessMsg("Submitted listing! (Backend transmitted securely to local instance)");
        setTimeout(() => setSuccessMsg(""), 4000);
      } catch (innerErr) {
        setSuccessMsg("Error submitting listing. Please try again.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter((l) => {
    const matchesSearch = l.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          l.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (l.seller && l.seller.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === "All" || l.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      
      {/* Title Header with interactive listing creation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-emerald-600" />
            Industrial Trade Board
          </h1>
          <p className="text-xs text-slate-500 font-medium">Classified raw manufacturing surplus & recyclable scrap</p>
        </div>

        {(user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'generator') && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-xs text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:opacity-95 transition-opacity flex items-center gap-2 cursor-pointer"
          >
            {isFormOpen ? (
              <>
                <ArrowLeft className="h-4 w-4" /> Back to Board
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Publish Waste Listing
              </>
            )}
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {isFormOpen && !isBuyer ? (
        /* Create New Listing Multi-Modal Uploader View */
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Create Material Listing</h2>
            <p className="text-xs text-slate-500 font-medium">Submit your industrial scrap properties. Your data will be transmitted to the backend automation engine.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade A PET Plastic Flakes"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Quantity (kg) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Plastic">Plastic</option>
                  <option value="Metal">Metal</option>
                  <option value="Paper">Paper</option>
                  <option value="Glass">Glass</option>
                  <option value="E-Waste">E-Waste</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                placeholder="List contamination percentages, moisture ratios, or thickness grades..."
                value={description}
                rows={4}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Listing...
                  </>
                ) : (
                  <>
                    <Recycle className="h-4 w-4" /> Submit Listing
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Regular Listings View */
        <div className="space-y-6">
          
          {/* Search, Filter Bar row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials, locations, or sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 shadow-sm font-medium"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full shadow-sm">
              {["All", "Plastic", "Metal", "Paper", "Glass", "E-Waste", "Others"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${selectedCategory === cat ? "bg-emerald-500/10 text-emerald-700 border border-emerald-100" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout of Waste Listings */}
          <div className="grid sm:grid-cols-2 gap-6">
            {filteredListings.map((listing) => (
              <div 
                key={listing.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all group"
              >
                
                {/* Banner / Category header */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <Recycle className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-800">{listing.material}</span>
                      <p className="text-[9px] text-slate-400 font-mono font-bold tracking-wider">LISTING ID: {listing.id}</p>
                    </div>
                  </div>
                  
                  {/* Category Pill */}
                  <span className="text-[9px] font-mono font-bold bg-white text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-xs">
                    {listing.category}
                  </span>
                </div>

                <div className="p-5 space-y-4 flex-1">
                  
                  {/* Weight, Location block */}
                  <div className="grid grid-cols-2 gap-4 pb-3.5 border-b border-slate-100 text-xs">
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Tonnage</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{listing.quantity} {listing.unit}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Operational Location</p>
                      <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {listing.location}
                      </p>
                    </div>
                  </div>

                  {/* AI Recyclability section */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Recyclability Analysis</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">{listing.recyclability}</p>
                  </div>

                  {/* AI Compliance section */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <Clipboard className="h-3.5 w-3.5 text-cyan-600" />
                      <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider font-mono">Compliance Check</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">{listing.compliance}</p>
                  </div>

                  {/* Seller info block */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono font-semibold">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{listing.seller}</span>
                    </div>
                    <span>{listing.date}</span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  
                  {/* Delete or Chat option */}
                  {(listing.sellerEmail === user.email || listing.seller === user.name) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 font-bold">Your Listing</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onNavigateToChat(listing.id, listing.seller)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-bold text-[11px] transition-colors flex items-center gap-1.5 border border-emerald-100 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Inquire
                      </button>

                      {isBuyer && (
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
                      )}
                    </div>
                  )}

                  {(listing.sellerEmail === user.email || listing.seller === user.name) && (
                    <button
                      onClick={() => onDeleteListing(listing.id)}
                      className="p-2 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-colors cursor-pointer"
                      title="Remove from board"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

              </div>
            ))}

            {filteredListings.length === 0 && (
              <div className="col-span-2 py-16 text-center text-slate-500 space-y-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="italic text-slate-400 font-medium">No surplus material matching search parameters found.</p>
                <button 
                  onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}
                  className="text-xs text-emerald-600 hover:underline font-bold"
                >
                  Clear search and filter criteria
                </button>
              </div>
            )}
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
