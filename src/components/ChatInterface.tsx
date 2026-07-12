import React, { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import { 
  Cpu, Send, Upload, Recycle, ShieldCheck, 
  User, CheckCircle2, AlertTriangle, ChevronRight, MessageSquare, FileImage
} from "lucide-react";

interface ChatInterfaceProps {
  user: { name: string; email: string; location: string; role: string };
  messages: Message[];
  onSendMessage: (messageData: any) => Promise<void>;
  preselectedListingId?: string | null;
  preselectedSellerName?: string | null;
}

export default function ChatInterface({ 
  user, 
  messages, 
  onSendMessage,
  preselectedListingId,
  preselectedSellerName
}: ChatInterfaceProps) {
  // LLM AI Chat state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Negotiation thread states
  const [selectedThreadPartner, setSelectedThreadPartner] = useState<string>("");
  const [negotiationText, setNegotiationText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Group messages into threads by conversational partner
  const threads: { [partner: string]: Message[] } = {};
  messages.forEach(msg => {
    const partner = msg.sender === user.name ? msg.receiver : msg.sender;
    if (!threads[partner]) {
      threads[partner] = [];
    }
    threads[partner].push(msg);
  });

  const threadPartners = Object.keys(threads);

  // Automatically select thread partner
  useEffect(() => {
    if (preselectedSellerName) {
      setSelectedThreadPartner(preselectedSellerName);
    } else if (threadPartners.length > 0 && !selectedThreadPartner) {
      setSelectedThreadPartner(threadPartners[0]);
    }
  }, [preselectedSellerName, messages]);

  // Scroll to bottom of active chat thread
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThreadPartner, messages]);

  // Handle AI analysis evaluation
  const handleAIEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt && !attachedImage) return;

    const promptToSend = aiPrompt;
    const imageToSend = attachedImage;

    // Clear prompt and staged image automatically so the input box is empty and ready for next message
    setAiPrompt("");
    setAttachedImage(null);

    setAiLoading(true);
    setAiResponse("");

    try {
      const response = await fetch("/api/chat/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          base64Image: imageToSend
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.reply || "No response received.");
      } else {
        const errData = await response.json();
        setAiResponse(`Failed to analyze: ${errData.error || "Unknown server error"}`);
      }
    } catch (err) {
      setAiResponse("Connection error occurred. Please verify model configuration.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle sending negotiation chat
  const handleSendNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiationText || !selectedThreadPartner) return;

    setSendingMessage(true);
    try {
      await onSendMessage({
        sender: user.name,
        senderRole: user.role,
        receiver: selectedThreadPartner,
        text: negotiationText,
        listingId: preselectedListingId || undefined
      });
      setNegotiationText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden px-6 py-6 flex flex-col md:grid md:grid-cols-12 gap-6 h-[calc(100vh-5rem)]">
      
      {/* LEFT PANEL: AI Classification Brain (5 columns) */}
      <div className="md:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl p-5 overflow-hidden justify-between h-full shadow-sm">
        
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
              <Cpu className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Gemini AI Compliance Analyzer</h2>
              <p className="text-[10px] text-slate-400 font-mono font-bold">Multimodal regulatory expert system</p>
            </div>
          </div>
 
          {/* AI Response Display area */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/85 text-xs text-slate-700 space-y-4 max-h-[50vh] overflow-y-auto font-sans font-medium">
            {aiLoading ? (
              <div className="space-y-3 py-4 text-center">
                <span className="h-6 w-6 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin inline-block" />
                <p className="text-[11px] text-emerald-600 font-mono animate-pulse">Running advanced chemical composition audit & FDA check...</p>
              </div>
            ) : aiResponse ? (
              <div className="prose prose-xs text-xs space-y-3 leading-relaxed text-slate-700">
                {aiResponse.split("\n\n").map((para, i) => {
                  if (para.startsWith("-") || para.startsWith("*")) {
                    return (
                      <ul key={i} className="list-disc pl-4 space-y-1 text-slate-600">
                        {para.split("\n").map((item, idx) => (
                          <li key={idx}>{item.replace(/^[-*]\s*/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i}>{para}</p>;
                })}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <Recycle className="h-8 w-8 text-slate-300 mx-auto animate-spin-slow" />
                <p className="italic">Type a query or upload an image to audit hazardous compositions, recyclability, and chemical handling regulations.</p>
              </div>
            )}
          </div>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleAIEvaluation} className="pt-4 border-t border-slate-100 space-y-3">
          {attachedImage && (
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <FileImage className="h-4 w-4 text-emerald-600" />
                <span className="text-slate-500 truncate text-[10px] font-semibold">Image staged</span>
              </div>
              <button 
                type="button" 
                onClick={() => setAttachedImage(null)} 
                className="text-red-600 hover:text-red-700 text-[10px] font-bold"
              >
                ✕ Remove
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Attach visual scrap image"
            >
              <Upload className="h-4.5 w-4.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageAttach}
              className="hidden"
            />
            
            <input
              type="text"
              required={!attachedImage}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Audit disposal standards for PVC medical tubing scrap"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
            />

            <button
              type="submit"
              disabled={aiLoading}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:opacity-95 transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>

      </div>

      {/* RIGHT PANEL: Corporate Negotiations (7 columns) */}
      <div className="md:col-span-7 flex flex-col bg-white border border-slate-200 rounded-2xl p-5 overflow-hidden justify-between h-full shadow-sm">
        
        {/* Threads navigation & Chat body */}
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Active partners horizontal bar */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg flex-shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            
            <div className="flex gap-1.5 flex-1 overflow-x-auto">
              {threadPartners.length > 0 ? (
                threadPartners.map(partner => (
                  <button
                    key={partner}
                    onClick={() => setSelectedThreadPartner(partner)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 border cursor-pointer ${selectedThreadPartner === partner ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-transparent text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <User className="h-3.5 w-3.5" />
                    {partner}
                  </button>
                ))
              ) : (
                <div className="text-xs text-slate-400 font-semibold italic px-2">No negotiations launched yet.</div>
              )}
            </div>
          </div>

          {/* Active thread conversation screen */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            {selectedThreadPartner ? (
              (threads[selectedThreadPartner] || []).map((msg) => {
                const isMe = msg.sender === user.name;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono font-bold mb-1 px-1">
                      <span className="text-slate-500">{msg.sender}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    
                    <div className={`p-3 rounded-2xl text-xs max-w-sm leading-relaxed shadow-xs ${isMe ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-none font-medium"}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6">
                <p className="text-xs text-slate-400 font-semibold italic">Select an enterprise thread above or click &ldquo;Inquire&rdquo; on any Trade board listing to initiate negotiations.</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

        </div>

        {/* Negotiation message inputs */}
        <form onSubmit={handleSendNegotiation} className="pt-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            required
            disabled={!selectedThreadPartner}
            value={negotiationText}
            onChange={(e) => setNegotiationText(e.target.value)}
            placeholder={selectedThreadPartner ? `Type message to ${selectedThreadPartner}...` : "Please select a partner thread first"}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 disabled:opacity-40 font-medium"
          />
          <button
            type="submit"
            disabled={!selectedThreadPartner || sendingMessage}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(59,130,246,0.15)] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            Transmit
          </button>
        </form>

      </div>

    </div>
  );
}
