"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Send } from "lucide-react"

interface Message {
  id: string
  conversation_id: string
  sender: string
  content: string
  is_read: boolean
  sent_at: string
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  profile_photo: string | null
}

interface Conversation {
  id: string
  customer_id: string
  channel: string
  last_message: string | null
  is_read: boolean
  last_message_at: string | null
  customers: Customer
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const [input, setInput] = useState("")
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!conversationId) return

    fetchConversation()
    fetchMessages()

    // Subscribe to realtime updates for messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
          scrollToBottom()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        () => {
          fetchConversation()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const fetchConversation = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const conversations = await response.json()
        const conv = conversations.find((c: Conversation) => c.id === conversationId)
        setConversation(conv || null)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return

    const messageContent = input.trim()
    setInput("")
    setSending(true)
    setNotification(null)

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: messageContent,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const newMessage = result
        
        // Debug: Log email_sent status
        console.log('Message send result:', { 
          email_sent: result.email_sent, 
          channel: conversation?.channel,
          message_id: result.id 
        })
        
        setMessages((prev) => [...prev, newMessage])
        scrollToBottom()
        fetchConversation()
        
        // Show success notification
        if (conversation?.channel === 'email') {
          if (result.email_sent === true) {
            setNotification({ type: 'success', message: 'Mesaj gönderildi ve e-posta ile iletildi' })
          } else {
            setNotification({ type: 'error', message: 'Mesaj kaydedildi ancak e-posta gönderilemedi. Lütfen SMTP ayarlarını kontrol edin.' })
          }
        } else if (conversation?.channel === 'whatsapp') {
          setNotification({ type: 'success', message: 'WhatsApp mesajı iletildi' })
        } else {
          setNotification({ type: 'success', message: 'Mesaj gönderildi' })
        }
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Mesaj gönderilemedi' }))
        setNotification({ type: 'error', message: errorData.error || 'Mesaj gönderilemedi' })
        setInput(messageContent)
        setTimeout(() => setNotification(null), 5000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setNotification({ type: 'error', message: 'Bağlantı hatası. Lütfen tekrar deneyin.' })
      setInput(messageContent)
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    // If same day, show time. Otherwise show date.
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  const customer = conversation.customers

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <svg 
            className={`w-5 h-5 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {notification.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
          <span className="text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Fixed Header - Finance App Style */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 header-shadow z-40">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex-shrink-0 p-2 -ml-2 hover:bg-primary/10 rounded-xl transition-colors"
              aria-label="Geri dön"
            >
              <ArrowLeft className="text-primary" size={20} strokeWidth={2.5} />
            </button>

            <Link href={`/profile/${customer.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                <img
                  src={customer.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=1a365d&color=fff&size=128`}
                  alt={customer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-base sm:text-lg text-gray-900 truncate">{customer.name}</h1>
                <p className="text-xs text-secondary truncate">
                  {conversation.channel === 'email' && customer.email
                    ? customer.email
                    : conversation.channel === 'whatsapp'
                    ? customer.phone
                    : conversation.channel === 'web' && customer.email
                    ? customer.email
                    : 'Konuşma'}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header - responsive height */}
      <div className="h-[60px] sm:h-[72px]"></div>

      {/* Messages - Panel Style with proper padding */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-4 sm:px-6 sm:pt-16 sm:pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-secondary">Mesajlar yükleniyor...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-gray-700 font-semibold text-center mb-1">Henüz mesaj yok</div>
              <div className="text-sm text-secondary text-center">İlk mesajınızı gönderin</div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md border ${
                      msg.sender === 'agent'
                        ? 'bg-primary text-white border-primary/20'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300 transition-colors'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <span className={`text-xs mt-2 block ${msg.sender === 'agent' ? 'text-right opacity-90' : 'text-secondary'}`}>
                      {formatTime(msg.sent_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input - Finance App Style with better mobile support */}
      <div className="bg-white border-t border-gray-200 shadow-lg safe-area-pb">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 min-h-[44px] flex items-center focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all shadow-sm">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900"
                placeholder="Mesaj yazın..."
                disabled={sending}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="bg-primary text-white p-2.5 sm:p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex-shrink-0 shadow-md"
              aria-label="Mesaj gönder"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
