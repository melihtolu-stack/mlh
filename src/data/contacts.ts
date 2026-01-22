export interface Contact {
  id: string;
  name: string;
  phone: string;
  country: string;
  language: string;
  sector: string;
  lastContactDate: string;
  profilePhoto: string;
  orderHistoryCount: number;
  hasCommercialHistory: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
}

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Ahmed Al-Mansouri",
    phone: "+971 50 123 4567",
    country: "UAE",
    language: "Arabic",
    sector: "Construction",
    lastContactDate: "2024-01-15",
    profilePhoto: "/api/placeholder/40/40",
    orderHistoryCount: 12,
    hasCommercialHistory: true,
    lastMessage: "Hello, I'm interested in your products",
    lastMessageTime: "10:30 AM",
  },
  {
    id: "2",
    name: "Maria Rodriguez",
    phone: "+34 612 345 678",
    country: "Spain",
    language: "Spanish",
    sector: "Retail",
    lastContactDate: "2024-01-14",
    profilePhoto: "/api/placeholder/40/40",
    orderHistoryCount: 5,
    hasCommercialHistory: true,
    lastMessage: "When can we schedule a meeting?",
    lastMessageTime: "Yesterday",
  },
  {
    id: "3",
    name: "Jean-Pierre Dubois",
    phone: "+33 6 12 34 56 78",
    country: "France",
    language: "French",
    sector: "Manufacturing",
    lastContactDate: "2024-01-13",
    profilePhoto: "/api/placeholder/40/40",
    orderHistoryCount: 8,
    hasCommercialHistory: true,
    lastMessage: "Merci pour votre réponse",
    lastMessageTime: "2 days ago",
  },
  {
    id: "4",
    name: "John Smith",
    phone: "+1 555 123 4567",
    country: "USA",
    language: "English",
    sector: "Technology",
    lastContactDate: "2024-01-12",
    profilePhoto: "/api/placeholder/40/40",
    orderHistoryCount: 3,
    hasCommercialHistory: false,
    lastMessage: "Looking forward to your proposal",
    lastMessageTime: "3 days ago",
  },
  {
    id: "5",
    name: "Anna Kowalski",
    phone: "+48 512 345 678",
    country: "Poland",
    language: "Polish",
    sector: "Healthcare",
    lastContactDate: "2024-01-11",
    profilePhoto: "/api/placeholder/40/40",
    orderHistoryCount: 15,
    hasCommercialHistory: true,
    lastMessage: "Dziękuję za informacje",
    lastMessageTime: "4 days ago",
  },
];
