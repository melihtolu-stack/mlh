"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { RefreshCw } from "lucide-react"

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
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp' | 'web'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  // Pull-to-refresh state
  const [pullStartY, setPullStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()

    // Subscribe to realtime updates (try/catch: placeholder Supabase local'de crash etmesin)
    try {
      const channel = supabase
        .channel('conversations-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'conversations' },
          () => fetchConversations()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          () => fetchConversations()
        )
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    } catch {
      return () => {}
    }
  }, [])

  // Sekmeye donuldugunde veya Supabase'den disaridan silme yapildiysa liste yenilensin
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') fetchConversations()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  const fetchConversations = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    setFetchError(null)
    try {
      const response = await fetch('/api/conversations', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(Array.isArray(data) ? data : [])
      } else {
        const t = await response.text()
        let msg = `HTTP ${response.status}`
        try {
          const j = JSON.parse(t)
          msg = (j.error || j.details || msg) as string
        } catch { /* ignore */ }
        setFetchError(msg)
        setConversations([])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setFetchError('Baglanti hatasi')
      setConversations([])
    } finally {
      setLoading(false)
      if (isManualRefresh) setRefreshing(false)
    }
  }

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer && scrollContainer.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return
    
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer && scrollContainer.scrollTop === 0) {
      const currentY = e.touches[0].clientY
      const distance = currentY - pullStartY
      
      if (distance > 0 && distance < 150) {
        setPullDistance(distance)
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      fetchConversations(true)
    }
    setIsPulling(false)
    setPullDistance(0)
    setPullStartY(0)
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
      (channelFilter === 'whatsapp' && conv.channel === 'whatsapp') ||
      (channelFilter === 'web' && conv.channel === 'web')
    return matchesSearch && matchesChannel
  })

  return (
    <div className="h-full flex flex-col bg-white pb-16 overflow-hidden">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
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

      {/* Pull-to-refresh indicator */}
      {isPulling && pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 flex items-center justify-center bg-white z-40 transition-all"
          style={{ height: `${Math.min(pullDistance, 80)}px` }}
        >
          <RefreshCw 
            className={`text-primary transition-transform ${pullDistance > 80 ? 'pull-refresh-spinner' : ''}`}
            size={24}
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      )}

      {/* Fixed Header - Only Title and Refresh Button */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 header-shadow z-50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <span className="text-xl">💼</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">MLH CRM</h1>
                <p className="text-xs text-secondary">Bilgi Yönetim Sistemi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchConversations(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Listeyi yenile"
              aria-label="Refresh"
            >
              <RefreshCw 
                className={`${refreshing ? 'animate-spin' : ''}`}
                size={20}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[64px]"></div>

      {/* Scrollable Content Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Search Bar - Finance App Style */}
        <div className="px-6 py-4 bg-white">
          <div className="relative">
            <div className="relative bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
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

        {/* Stats Cards - Finance App Style */}
        <div className="px-6 py-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-xs text-secondary uppercase tracking-wide mb-2 font-semibold">Toplam</div>
              <div className="text-3xl font-bold text-gray-900">{conversations.length}</div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-white border border-primary/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-xs text-primary uppercase tracking-wide mb-2 font-semibold">Yeni</div>
              <div className="text-3xl font-bold text-primary">{conversations.filter(c => !c.is_read).length}</div>
            </div>
          </div>
          {/* Kanal filtresi: Tümü | E-posta | WhatsApp | Web */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {(['all', 'email', 'whatsapp', 'web'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                  channelFilter === ch
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-50 text-secondary hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {ch === 'all' ? 'Tümü' : ch === 'email' ? 'E-posta' : ch === 'whatsapp' ? 'WhatsApp' : 'Web'}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List - Modern Cards */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-secondary">Yükleniyor...</div>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-gray-700 font-semibold text-lg text-center mb-1">Veriler yüklenemedi</div>
              <div className="text-sm text-red-600 text-center mb-4">{fetchError}</div>
              <button
                type="button"
                onClick={() => fetchConversations(true)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 shadow-md"
              >
                Tekrar dene
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
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
                  className={`group bg-white border rounded-2xl p-4 shadow-md hover:shadow-xl transition-all ${
                    !conv.is_read 
                      ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-white ring-2 ring-primary/10' 
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <Link href={`/chat/${conv.id}`} className="block">
                    <div className="flex items-center gap-4">
                      {/* Profile Photo */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-gray-200 overflow-hidden shadow-sm">
                          <img
                            src={conv.customers.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.customers.name)}&background=1a365d&color=fff&size=256&bold=true`}
                            alt={conv.customers.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {!conv.is_read && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-white shadow-md"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-gray-900 truncate text-base">
                            {conv.customers.name}
                          </h3>
                          {conv.last_message_at && (
                            <span className="text-xs text-secondary flex-shrink-0 font-medium">
                              {formatTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-secondary truncate leading-relaxed mb-2.5">
                          {conv.last_message || 'Henüz mesaj yok'}
                        </p>
                        {conv.channel && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold shadow-sm ${
                              conv.channel === 'email' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : conv.channel === 'whatsapp'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : conv.channel === 'web'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-gray-50 text-secondary border border-gray-200'
                            }`}>
                              {conv.channel === 'whatsapp' ? 'WhatsApp' : conv.channel === 'email' ? 'Email' : conv.channel === 'web' ? 'Web' : conv.channel}
                            </span>
                            {!conv.is_read && (
                              <span className="text-xs px-2.5 py-1 bg-primary text-white rounded-lg font-bold shadow-sm">
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
                          className="p-2 text-danger hover:bg-danger/10 rounded-xl transition-colors disabled:opacity-50"
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
      </div>
    </div>
  )
}
