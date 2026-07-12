import React from "react";
import { Settings, Globe, Mail, MapPin, Building, Recycle, Calendar, Trash2, ArrowRight } from "lucide-react";
import { Listing, Message } from "../types";

interface ProfileProps {
  user: { name: string; email: string; location: string; role: string };
  listings: Listing[];
  messages?: Message[];
  onDeleteListing: (id: string) => void;
  onNavigate: (page: string) => void;
}

export default function Profile({ user, listings, messages = [], onDeleteListing, onNavigate }: ProfileProps) {
  // Filter listings posted by this specific user
  const myListings = listings.filter(
    (listing) =>
      listing.seller.toLowerCase() === user.name.toLowerCase() ||
      listing.sellerEmail.toLowerCase() === user.email.toLowerCase()
  );

  // Filter messages that represent bid offers sent by this user
  const myBids = React.useMemo(() => {
    return messages.filter(
      (msg) => 
        msg.sender.toLowerCase() === user.name.toLowerCase() && 
        (msg.text.includes("PROPOSED BID OFFER") || msg.text.includes("Bid Offer"))
    );
  }, [messages, user.name]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
      
      {/* Title Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-600" />
          Enterprise Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 font-medium">Verify corporate identity information, active operational yard locations, and verified security credentials</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600 shadow-sm">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{user.name}</h3>
                <p className="text-xs font-mono text-emerald-600 capitalize font-bold">{user.role} Member</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Registered Entity</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Filing Email of Record</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Operational Yards</p>
                  <p className="text-slate-800 font-semibold mt-0.5">{user.location || "Pune, Maharashtra, India"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">Logistics Status</p>
                  <p className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified Enterprise (Active)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Section based on role */}
        <div className="lg:col-span-7 space-y-6">
          
          {user?.role !== 'Buyer' && user?.role !== 'Recycler' && (
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-emerald-600" />
                    My Posted Listings
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Manage and track your materials active in the marketplace</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {myListings.length} Listings
                </span>
              </div>

              {myListings.length === 0 ? (
                <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400">
                    <Recycle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">No materials posted yet</p>
                    <p className="text-[11px] text-slate-400">Post your scrap, polymer or industrial secondary materials to begin compliance audits.</p>
                  </div>
                  <button
                    onClick={() => onNavigate("marketplace")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Create Your First Listing
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {myListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-800 truncate">{listing.material}</span>
                          <span className="text-[9px] font-mono font-bold bg-white text-slate-500 border border-slate-200 px-1.5 py-0.2 rounded">
                            {listing.category}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm ${
                            listing.status === "Active" 
                              ? "bg-emerald-500/10 text-emerald-700" 
                              : listing.status === "Completed" 
                              ? "bg-blue-500/10 text-blue-700" 
                              : "bg-yellow-500/10 text-yellow-700"
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 flex-wrap">
                          <span className="font-semibold text-slate-600 font-mono">
                            {listing.quantity} {listing.unit}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {listing.location}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Calendar className="h-3 w-3" />
                            {listing.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDeleteListing(listing.id)}
                          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-500 transition-colors shadow-xs cursor-pointer"
                          title="Delete listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(user?.role === 'Buyer' || user?.role === 'Recycler') && (
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-emerald-600" />
                    Sourcing Interests & Bidding History
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Manage and track your active marketplace bids and raw materials sourcing interests</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Active Sourcing Targets</h4>
                  <div className="flex flex-wrap gap-2">
                    {["PET Plastic", "HDPE Flakes", "Copper Scrap", "Corrugated Cardboard", "Aluminium Cans"].map((interest) => (
                      <span key={interest} className="text-[10px] font-mono font-bold bg-white text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md shadow-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">Recently Placed Bids & Interactions</h4>
                  
                  {myBids.length > 0 ? (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {myBids.map((bid, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-800">Bid Offer sent to {bid.receiver}</span>
                            <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 font-medium">
                            {bid.text}
                          </p>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Listing ID: {bid.listingId || "N/A"}</span>
                            <span>{bid.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-700">No active bids submitted yet</p>
                      <p className="text-[10px] text-slate-400">Browse the marketplace and use the "Place Bid / Offer" option to engage with industrial material sellers.</p>
                      <button
                        onClick={() => onNavigate("marketplace")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer mt-1"
                      >
                        Explore Active Marketplace
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
