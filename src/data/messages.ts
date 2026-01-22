export interface Message {
  id: string;
  contactId: string;
  text: string;
  originalText?: string;
  isFromUs: boolean;
  timestamp: string;
}

export const messages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      contactId: "1",
      text: "مرحبا، أنا مهتم بمنتجاتك",
      originalText: "Hello, I'm interested in your products",
      isFromUs: false,
      timestamp: "2024-01-15T10:25:00Z",
    },
    {
      id: "m2",
      contactId: "1",
      text: "Thank you for your interest. I'd be happy to discuss our products with you. What specific items are you looking for?",
      isFromUs: true,
      timestamp: "2024-01-15T10:28:00Z",
    },
    {
      id: "m3",
      contactId: "1",
      text: "أبحث عن مواد بناء عالية الجودة",
      originalText: "I'm looking for high-quality building materials",
      isFromUs: false,
      timestamp: "2024-01-15T10:30:00Z",
    },
    {
      id: "m4",
      contactId: "1",
      text: "We have an excellent selection of building materials. Let me send you our latest catalog.",
      isFromUs: true,
      timestamp: "2024-01-15T10:32:00Z",
    },
  ],
  "2": [
    {
      id: "m5",
      contactId: "2",
      text: "Hola, ¿cuándo podemos programar una reunión?",
      originalText: "Hello, when can we schedule a meeting?",
      isFromUs: false,
      timestamp: "2024-01-14T14:20:00Z",
    },
    {
      id: "m6",
      contactId: "2",
      text: "I have availability this week. Would Wednesday afternoon work for you?",
      isFromUs: true,
      timestamp: "2024-01-14T14:25:00Z",
    },
  ],
  "3": [
    {
      id: "m7",
      contactId: "3",
      text: "Merci pour votre réponse",
      originalText: "Thank you for your response",
      isFromUs: false,
      timestamp: "2024-01-13T09:15:00Z",
    },
    {
      id: "m8",
      contactId: "3",
      text: "You're welcome! Is there anything specific you'd like to know about our services?",
      isFromUs: true,
      timestamp: "2024-01-13T09:18:00Z",
    },
  ],
  "4": [
    {
      id: "m9",
      contactId: "4",
      text: "Looking forward to your proposal",
      isFromUs: false,
      timestamp: "2024-01-12T16:45:00Z",
    },
    {
      id: "m10",
      contactId: "4",
      text: "I'll have the proposal ready by end of day tomorrow. I'll send it to your email.",
      isFromUs: true,
      timestamp: "2024-01-12T16:50:00Z",
    },
  ],
  "5": [
    {
      id: "m11",
      contactId: "5",
      text: "Dziękuję za informacje",
      originalText: "Thank you for the information",
      isFromUs: false,
      timestamp: "2024-01-11T11:30:00Z",
    },
    {
      id: "m12",
      contactId: "5",
      text: "Happy to help! If you have any questions, feel free to reach out anytime.",
      isFromUs: true,
      timestamp: "2024-01-11T11:35:00Z",
    },
  ],
};
