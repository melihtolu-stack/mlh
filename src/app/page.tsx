"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import BottomNav from "@/components/BottomNav"

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

export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchConversations()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Şimdi'
    if (minutes < 60) return `${minutes} dk`
    if (hours < 24) return `${hours} sa`
    if (days === 1) return 'Dün'
    if (days < 7) return `${days} gün`
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Bu konuşmayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    setDeletingId(conversationId)
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId))
        setNotification({ type: 'success', message: 'Konuşma başarıyla silindi' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: 'Konuşma silinirken bir hata oluştu' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      setNotification({ type: 'error', message: 'Bir hata oluştu' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setDeletingId(null)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customers.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customers.phone?.includes(searchQuery) ||
      conv.customers.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChannel =
      channelFilter === 'all' ||
      (channelFilter === 'email' && conv.channel === 'email') ||
      (channelFilter === 'whatsapp' && conv.channel === 'whatsapp')
    return matchesSearch && matchesChannel
  })

  return (
    <div className="h-full flex flex-col bg-background pb-16 overflow-hidden">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
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

      {/* Enterprise Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-xl">💼</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">mlh CRM</h1>
                <p className="text-xs text-secondary">Müşteri Yönetimi</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
              <span className="text-xl">🔔</span>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar - Enterprise Style */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="relative">
          <div className="relative bg-background border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
            <input
              type="text"
              placeholder="Müşteri, e-posta, telefon veya mesaj ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-sm placeholder:text-secondary text-gray-900 rounded-xl"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-lg bg-gray-200 text-secondary flex items-center justify-center text-xs hover:bg-gray-300 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Enterprise Style */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold">Toplam</div>
            <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold">Yeni</div>
            <div className="text-2xl font-bold text-primary">{conversations.filter(c => !c.is_read).length}</div>
          </div>
        </div>
        {/* Kanal filtresi: Tümü | E-posta | WhatsApp */}
        <div className="flex gap-2 mt-4">
          {(['all', 'email', 'whatsapp'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                channelFilter === ch
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-secondary hover:bg-gray-200'
              }`}
            >
              {ch === 'all' ? 'Tümü' : ch === 'email' ? 'E-posta' : 'WhatsApp'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List - Enterprise Cards */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-secondary">Yükleniyor...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="text-gray-700 font-semibold text-lg text-center mb-1">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz konuşma yok'}
            </div>
            <div className="text-sm text-secondary text-center">
              {searchQuery ? 'Farklı bir arama deneyin' : 'N8N webhook\'undan veri gönderin'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${
                  !conv.is_read 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Link href={`/chat/${conv.id}`} className="block">
                  <div className="flex items-center gap-4">
                    {/* Profile Photo */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
                        <img
                          src={conv.customers.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.customers.name)}&background=2563EB&color=fff&size=256&bold=true`}
                          alt={conv.customers.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!conv.is_read && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate text-base">
                          {conv.customers.name}
                        </h3>
                        {conv.last_message_at && (
                          <span className="text-xs text-secondary flex-shrink-0 font-medium">
                            {formatTime(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-secondary truncate leading-relaxed mb-2">
                        {conv.last_message || 'Henüz mesaj yok'}
                      </p>
                      {conv.channel && (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                            conv.channel === 'email' 
                              ? 'bg-blue-100 text-blue-700' 
                              : conv.channel === 'whatsapp'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-secondary'
                          }`}>
                            {conv.channel === 'whatsapp' ? 'WhatsApp' : conv.channel === 'email' ? 'Email' : conv.channel}
                          </span>
                          {!conv.is_read && (
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-lg font-semibold">
                              Yeni
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        disabled={deletingId === conv.id}
                        className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Konuşmayı Sil"
                      >
                        {deletingId === conv.id ? (
                          <div className="w-5 h-5 border-2 border-danger border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                      <div className="text-gray-300 group-hover:text-primary transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
