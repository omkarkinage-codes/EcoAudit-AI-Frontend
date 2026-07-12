export interface Listing {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  location: string;
  seller: string;
  sellerEmail: string;
  date: string;
  category: "Plastic" | "Metal" | "Paper" | "Glass" | "E-Waste" | "Others";
  recyclability: string;
  compliance: string;
  status: "Active" | "Completed" | "Pending";
  imageUrl?: string;
}

export interface Message {
  id: string;
  sender: string;
  senderRole: string;
  receiver: string;
  text: string;
  timestamp: string;
  listingId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  type: "AUTH" | "LISTING" | "AI_AUDIT" | "N8N_WEBHOOK";
  details: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
}

export interface PlatformStats {
  totalListings: number;
  registeredCompanies: number;
  totalMessages: number;
  totalWasteWeight: number;
  categoryBreakdown: {
    Plastic: number;
    Metal: number;
    Paper: number;
    Glass: number;
    "E-Waste": number;
    Others: number;
  };
}
