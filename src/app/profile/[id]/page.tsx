"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  profile_photo: string | null
  country?: string | null
  language?: string | null
  address?: string | null
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

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profile_photo: "",
    country: "",
    language: "",
    address: ""
  })
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchCustomer()
    fetchConversation()
  }, [customerId])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setCustomer(data)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          profile_photo: data.profile_photo || "",
          country: data.country || "",
          language: data.language || "",
          address: data.address || ""
        })
      } else {
        // Fallback to conversations API
        const convResponse = await fetch('/api/conversations')
        if (convResponse.ok) {
          const conversations = await convResponse.json()
          const conv = conversations.find((c: Conversation) => c.customers.id === customerId)
          if (conv) {
            setCustomer(conv.customers)
            setFormData({
              name: conv.customers.name || "",
              email: conv.customers.email || "",
              phone: conv.customers.phone || "",
              profile_photo: conv.customers.profile_photo || "",
              country: "",
              language: "",
              address: ""
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversation = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const conversations = await response.json()
        const conv = conversations.find((c: Conversation) => c.customers.id === customerId)
        setConversation(conv || null)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  const handleSave = async () => {
    if (!customer) return

    setSaving(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        setCustomer(updatedCustomer)
        setIsEditing(false)
        setNotification({ type: 'success', message: 'Bilgiler başarıyla güncellendi' })
        setTimeout(() => setNotification(null), 3000)
      } else {
        setNotification({ type: 'error', message: 'Güncelleme başarısız oldu' })
        setTimeout(() => setNotification(null), 3000)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      setNotification({ type: 'error', message: 'Bir hata oluştu' })
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-secondary">Yükleniyor...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4 bg-background">
        <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-6">
          <span className="text-5xl">👤</span>
        </div>
        <div className="text-gray-700 font-semibold mb-2">Müşteri bulunamadı</div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Geri dön
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto pb-4">
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

      {/* Header - Enterprise Style */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex-shrink-0 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Geri dön"
              >
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Müşteri Profili</h1>
                <p className="text-xs text-secondary">Detaylar ve Düzenleme</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Düzenle
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: customer.name || "",
                      email: customer.email || "",
                      phone: customer.phone || "",
                      profile_photo: customer.profile_photo || "",
                      country: customer.country || "",
                      language: customer.language || "",
                      address: customer.address || ""
                    })
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors text-sm"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-success text-white rounded-xl font-medium hover:bg-success/90 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-white border-b border-gray-200">
        <div className="px-6 py-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-xl bg-white border-2 border-primary/20 overflow-hidden mb-4 shadow-lg">
              <img
                src={customer.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=2563EB&color=fff&size=256`}
                alt={customer.name}
                className="w-full h-full object-cover"
              />
            </div>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-2xl font-bold text-gray-900 mb-2 text-center bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none px-2 py-1"
                placeholder="İsim"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{customer.name}</h2>
            )}
            {conversation && (
              <button
                onClick={() => router.push(`/chat/${conversation.id}`)}
                className="px-6 py-2.5 bg-success text-white rounded-xl font-semibold hover:bg-success/90 transition-colors shadow-sm flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Mesaj Gönder
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Sections - Enterprise Cards */}
      <div className="px-6 py-6 space-y-6">
        {/* İletişim Bilgileri */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="text-lg">📞</span>
            İletişim Bilgileri
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold block">Telefon</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="+90 555 123 4567"
                />
              ) : (
                <div className="text-gray-900 font-semibold">{customer.phone}</div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold block">E-posta</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="email@example.com"
                />
              ) : (
                <div className="text-gray-900 font-semibold">{customer.email || "Belirtilmemiş"}</div>
              )}
            </div>
            {isEditing && (
              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold block">Profil Fotoğrafı URL</label>
                <input
                  type="url"
                  value={formData.profile_photo}
                  onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            )}
          </div>
        </section>

        {/* Detaylar */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="text-lg">🌍</span>
            Detaylar
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold block">Ülke</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Türkiye"
                />
              ) : (
                <div className="text-gray-900">{customer.country || "Belirtilmemiş"}</div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold block">Dil</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Türkçe, İngilizce, vb."
                />
              ) : (
                <div className="text-gray-900">{customer.language || "Belirtilmemiş"}</div>
              )}
            </div>
            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs text-secondary uppercase tracking-wide mb-1 font-semibold block">Adres</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                  rows={3}
                  placeholder="Adres bilgisi..."
                />
              ) : (
                <div className="text-gray-900">{customer.address || "Belirtilmemiş"}</div>
              )}
            </div>
          </div>
        </section>

        {/* Son İletişim */}
        {conversation && conversation.last_message_at && (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="text-lg">💬</span>
              Son İletişim
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-secondary">
                {new Date(conversation.last_message_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              {conversation.last_message && (
                <div className="text-gray-900 p-4 bg-background rounded-xl border border-gray-200">
                  {conversation.last_message}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
