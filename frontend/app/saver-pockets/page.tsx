"use client"

import { useState, useEffect } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Plus, PiggyBank } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface Pocket {
  id: string
  name: string
  dailyContribution: string
  multiplier: string
  saved: string
  progress: number
}

function SaverPocketsPageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pockets, setPockets] = useState<Pocket[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dailyAmount: '',
    multiplier: '1',
    targetAmount: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchPockets = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/saver-pockets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setPockets(data.data.pockets || [])
        }
      } catch (error) {
        console.error('Error fetching pockets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPockets()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreatePocket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/saver-pockets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          dailyAmount: parseFloat(formData.dailyAmount),
          multiplier: parseInt(formData.multiplier),
          targetAmount: parseFloat(formData.targetAmount),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newPocket = data.data.pocket || data.data;
        setPockets([...pockets, newPocket])
        setFormData({ name: '', dailyAmount: '', multiplier: '1', targetAmount: '' })
        setIsModalOpen(false)
        toast({
          title: "Success!",
          description: "Savings pocket created successfully",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create pocket",
        })
      }
    } catch (error) {
      console.error('Error creating pocket:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <DashboardHeader title="Saver Pockets" onMenuClick={() => setIsSidebarOpen(true)} showMobileTitle={false} />
        <div className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              {/* Mobile-only Title - Integrated with button row */}
              <h1 className="lg:hidden text-2xl font-bold text-slate-900">Saver Pockets</h1>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-brand-green hover:bg-emerald-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 md:w-5 h-4 md:h-5" />
                New Pocket
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {pockets.map((pocket) => (
                <div key={pocket.id} className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-lg md:rounded-xl flex items-center justify-center shrink-0">
                      <PiggyBank className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    </div>
                    <div className="bg-emerald-50 text-brand-green px-2 md:px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 whitespace-nowrap">
                      {pocket.multiplier} Multiplier
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-800">{pocket.name}</h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Daily Contribution: </p>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-green rounded-full" style={{ width: `${pocket.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs md:text-sm font-medium text-slate-600">Saved: </p>
                      <button className="text-xs md:text-sm font-bold text-brand-green hover:underline">Edit Goal</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Pocket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePocket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pocket Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Vacation, New Car"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Daily Contribution ($)
              </label>
              <input
                type="number"
                name="dailyAmount"
                value={formData.dailyAmount}
                onChange={handleInputChange}
                placeholder="27.40"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Multiplier
              </label>
              <select
                name="multiplier"
                value={formData.multiplier}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="1">x1 (Normal)</option>
                <option value="2">x2 (Double)</option>
                <option value="3">x3 (Triple)</option>
                <option value="4">x4 (Quadruple)</option>
                <option value="5">x5 (5x)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Target Amount ($)
              </label>
              <input
                type="number"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleInputChange}
                placeholder="1000.00"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Pocket'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function SaverPocketsPage() {
  return (
    <ProtectedPage>
      <SaverPocketsPageContent />
    </ProtectedPage>
  )
}
