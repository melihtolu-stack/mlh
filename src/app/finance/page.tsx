"use client"

import { useEffect, useMemo, useState } from "react"
import BottomNav from "@/components/BottomNav"

type TransactionType = "in" | "out"

interface Transaction {
  id: string
  amount: number
  type: TransactionType
  description: string
  person: string
  createdAt: string
}

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value)
}

const getExpenseCategory = (description: string) => {
  const text = description.toLowerCase()
  if (text.includes("yakıt") || text.includes("benzin") || text.includes("mazot")) return "Yakıt"
  if (text.includes("kira")) return "Kira"
  if (text.includes("fatura") || text.includes("elektrik") || text.includes("su") || text.includes("doğalgaz")) {
    return "Faturalar"
  }
  if (text.includes("maaş") || text.includes("ucret") || text.includes("ücret")) return "Maaş"
  if (text.includes("pazarlama") || text.includes("reklam")) return "Pazarlama"
  return "Diğer"
}

const PieChart = ({
  title,
  data,
}: {
  title: string
  data: { label: string; value: number; color: string }[]
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const gradient = total
    ? `conic-gradient(${data
        .map((item, index) => {
          const start =
            (data.slice(0, index).reduce((sum, current) => sum + current.value, 0) / total) * 100
          const end = start + (item.value / total) * 100
          return `${item.color} ${start}% ${end}%`
        })
        .join(", ")})`
    : "conic-gradient(#e5e7eb 0% 100%)"

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="text-gray-900 font-semibold mb-4">{title}</div>
      <div className="flex items-center gap-6">
        <div
          className="w-32 h-32 rounded-full border border-gray-100 shadow-sm"
          style={{ background: gradient }}
          aria-label={title}
        />
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-700">{item.label}</span>
              </div>
              <span className="text-gray-900 font-medium">
                {total ? `${Math.round((item.value / total) * 100)}%` : "0%"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<TransactionType>("out")
  const [description, setDescription] = useState("")
  const [person, setPerson] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/finance/transactions")
        if (!response.ok) {
          throw new Error("Finans verileri yüklenemedi")
        }
        const data = await response.json()
        setTransactions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Finans verileri yüklenemedi")
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "in").reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "out").reduce((sum, t) => sum + t.amount, 0)
    const cashTotal = income - expense
    const companyDebt = transactions
      .filter((t) => t.type === "out" && t.description.toLowerCase().includes("borç"))
      .reduce((sum, t) => sum + t.amount, 0)
    const profitLoss = income - expense

    return { income, expense, cashTotal, companyDebt, profitLoss }
  }, [transactions])

  const expenseDistribution = useMemo(() => {
    const categories = new Map<string, number>()
    transactions
      .filter((t) => t.type === "out")
      .forEach((t) => {
        const category = getExpenseCategory(t.description)
        categories.set(category, (categories.get(category) || 0) + t.amount)
      })

    const palette = {
      Yakıt: "#f97316",
      Kira: "#6366f1",
      Faturalar: "#06b6d4",
      Maaş: "#10b981",
      Pazarlama: "#f43f5e",
      Diğer: "#9ca3af",
    }

    return Array.from(categories.entries()).map(([label, value]) => ({
      label,
      value,
      color: palette[label as keyof typeof palette] || "#9ca3af",
    }))
  }, [transactions])

  const overallDistribution = [
    { label: "Gelir", value: totals.income, color: "#10b981" },
    { label: "Gider", value: totals.expense, color: "#ef4444" },
  ]

  const addTransaction = async () => {
    const parsedAmount = Number(amount.replace(",", "."))
    if (!parsedAmount || parsedAmount <= 0 || !description.trim() || !person.trim()) return

    try {
      const response = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          type,
          description: description.trim(),
          person: person.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("İşlem kaydedilemedi")
      }

      const newTransaction = await response.json()
      setTransactions((prev) => [newTransaction, ...prev])
      setAmount("")
      setDescription("")
      setPerson("")
      setType("out")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem kaydedilemedi")
    }
  }

  return (
    <div className="h-full flex flex-col bg-background pb-16 overflow-hidden">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Finans</h1>
          <p className="text-xs text-secondary mt-1">Gelir / gider takibi</p>
        </div>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto min-h-0">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-secondary text-sm">
            Finans verileri yükleniyor...
          </div>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="text-xs text-secondary">Nakit Toplamı</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">{formatMoney(totals.cashTotal)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="text-xs text-secondary">Toplam Şirket Borcu</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">{formatMoney(totals.companyDebt)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="text-xs text-secondary">Kar / Zarar</div>
            <div className={`text-lg font-semibold mt-2 ${totals.profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatMoney(totals.profitLoss)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChart title="Genel Durum (Gelir / Gider)" data={overallDistribution} />
          <PieChart title="Gider Dağılımı" data={expenseDistribution.length ? expenseDistribution : [{ label: "Veri yok", value: 1, color: "#e5e7eb" }]} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="text-gray-900 font-semibold mb-4">Yeni İşlem</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-secondary">Tutar</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Örn: 12500"
                className="w-full mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-secondary">Çıkış / Giriş</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="out">Gider (Çıkış)</option>
                <option value="in">Gelir (Giriş)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary">Açıklama</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: Kira ödemesi"
                className="w-full mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-secondary">İşlemi Yapan</label>
              <input
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Örn: Ali"
                className="w-full mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={addTransaction}
              className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm hover:opacity-90"
            >
              İşlemi Kaydet
            </button>
          </div>
          <p className="text-xs text-secondary mt-3">
            Gider dağılımı açıklama metnindeki anahtar kelimelerle otomatik sınıflanır.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
