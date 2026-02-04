"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { LogOut, User } from "lucide-react"

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

export default function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()

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
      } else {
        console.error('Failed to fetch conversations:', response.statusText)
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

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <aside className="w-[360px] border-r border-gray-200 bg-white flex flex-col shadow-sm">
      <div className="h-16 px-6 flex items-center border-b border-gray-200 bg-white">
        <h1 className="text-xl font-bold text-primary">
          mlh CRM
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        {loading ? (
          <div className="p-6 text-center text-secondary">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-secondary">No conversations yet</div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className={`block mb-2 px-4 py-3 rounded-xl border transition-all hover:shadow-sm ${
                  !conv.is_read 
                    ? 'bg-white border-primary/20 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src={conv.customers.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.customers.name)}&background=1A3668&color=fff&size=128`}
                      alt={conv.customers.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {conv.customers.name}
                      </p>
                      {conv.last_message_at && (
                        <span className="text-xs text-secondary flex-shrink-0 font-medium">
                          {formatTime(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary truncate leading-relaxed">
                      {conv.last_message || 'No messages yet'}
                    </p>
                    {!conv.is_read && (
                      <div className="mt-2 inline-flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-xs text-primary font-medium">New</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-secondary">Yönetici</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  )
}