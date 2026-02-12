"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { ProtectedPage } from "@/components/protected-page"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Plus, PiggyBank } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

interface Pocket {
  id: string
  name: string
  dailyContribution: string
  multiplier: string
  saved: string
  progress: number
  targetAmount: string // Added for edit
}

function SaverPocketsPageContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pockets, setPockets] = useState<Pocket[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPocketId, setEditingPocketId] = useState<string | null>(null) // New state
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
          // Map backend data to frontend interface
          const mappedPockets = (data.data || []).map((p: any) => ({
            id: p._id,
            name: p.name,
            dailyContribution: p.dailyAmount?.toString() || '0',
            multiplier: p.multiplier?.toString() || '1',
            saved: p.currentAmount?.toString() || '0',
            progress: p.targetAmount ? Math.min(100, (p.currentAmount / p.targetAmount) * 100) : 0,
            targetAmount: p.targetAmount?.toString() || '0'
          }))
          setPockets(mappedPockets)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token');
      const url = editingPocketId
        ? `/api/saver-pockets/${editingPocketId}`
        : '/api/saver-pockets';

      const method = editingPocketId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        const savedPocket = data.data.pocket || data.data; // Handle possibly wrapped response

        // Map it back to frontend format
        const mappedPocket: Pocket = {
          id: savedPocket._id,
          name: savedPocket.name,
          dailyContribution: savedPocket.dailyAmount?.toString() || '0',
          multiplier: savedPocket.multiplier?.toString() || '1',
          saved: savedPocket.currentAmount?.toString() || '0',
          progress: savedPocket.targetAmount ? Math.min(100, (savedPocket.currentAmount / savedPocket.targetAmount) * 100) : 0,
          targetAmount: savedPocket.targetAmount?.toString() || '0'
        };

        if (editingPocketId) {
          setPockets(pockets.map(p => p.id === editingPocketId ? mappedPocket : p));
          toast({ title: "Success!", description: "Bucket updated successfully" });
        } else {
          setPockets([mappedPocket, ...pockets]); // Add to top
          toast({ title: "Success!", description: "Savings bucket created successfully" });
        }

        setFormData({ name: '', dailyAmount: '', multiplier: '1', targetAmount: '' })
        setIsModalOpen(false)
        setEditingPocketId(null)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save bucket",
        })
      }
    } catch (error) {
      console.error('Error saving bucket:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (pocket: Pocket) => {
    setEditingPocketId(pocket.id)
    setFormData({
      name: pocket.name,
      dailyAmount: pocket.dailyContribution,
      multiplier: pocket.multiplier,
      targetAmount: pocket.targetAmount
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!editingPocketId || !confirm("Are you sure you want to delete this bucket and return all funds to your wallet?")) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/saver-pockets/${editingPocketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPockets(pockets.filter(p => p.id !== editingPocketId));
        toast({ title: "Deleted", description: "Savings bucket removed successfully" });
        setIsModalOpen(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete bucket" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete bucket" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFund = async (pocketId: string) => {
    const amount = prompt("How much would you like to add from your wallet?");
    if (!amount || isNaN(parseFloat(amount))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/saver-pockets/${pocketId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedPocket = data.data.pocket || data.data;
        setPockets(pockets.map(p => p.id === pocketId ? {
          ...p,
          saved: updatedPocket.currentAmount.toString(),
          progress: updatedPocket.targetAmount ? Math.min(100, (updatedPocket.currentAmount / updatedPocket.targetAmount) * 100) : 0
        } : p));
        toast({ title: "Funds Added!", description: `Successfully added ${formatCurrency(parseFloat(amount))}` });
      } else {
        const err = await response.json();
        toast({ variant: "destructive", title: "Error", description: err.error || "Insufficient funds" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fund bucket" });
    }
  }

  const handleNewClick = () => {
    setEditingPocketId(null);
    setFormData({ name: '', dailyAmount: '', multiplier: '1', targetAmount: '' });
    setIsModalOpen(true);
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
                onClick={handleNewClick}
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
                    <p className="text-xs md:text-sm text-slate-500 mt-1">Daily Contribution: <span className="font-bold text-slate-700">{formatCurrency(parseFloat(pocket.dailyContribution) * parseInt(pocket.multiplier))}</span> ({pocket.multiplier === '1' ? 'Normal' : `x${pocket.multiplier}`})</p>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-green rounded-full" style={{ width: `${pocket.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs md:text-sm font-medium text-slate-600">Saved: <span className="font-bold text-brand-green">{formatCurrency(parseFloat(pocket.saved))} / {formatCurrency(parseFloat(pocket.targetAmount))}</span></p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleFund(pocket.id)}
                          className="text-xs md:text-sm font-bold text-brand-green hover:underline"
                        >
                          Fund
                        </button>
                        <button
                          onClick={() => handleEditClick(pocket)}
                          className="text-xs md:text-sm font-bold text-slate-400 hover:text-slate-600 hover:underline"
                        >
                          Edit Goal
                        </button>
                      </div>
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
            <DialogTitle>{editingPocketId ? 'Edit Pocket' : 'Create New Pocket'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <option key="1" value="1">x1 (Normal)</option>
                <option key="2" value="2">x2 (Double)</option>
                <option key="3" value="3">x3 (Triple)</option>
                <option key="4" value="4">x4 (Quadruple)</option>
                <option key="5" value="5">x5 (5x)</option>
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
              {editingPocketId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
              <div className="flex-1 flex gap-3">
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
                  {isSubmitting ? 'Saving...' : (editingPocketId ? 'Update' : 'Create')}
                </button>
              </div>
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

