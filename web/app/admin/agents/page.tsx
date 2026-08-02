"use client"

import { getApiUrl } from '@/lib/get-api-url'
import { useState, useEffect, useCallback } from 'react'

import { useAuth } from '@/components/auth/auth-guard'
import {
  User, Check, X, Search, Loader2,
  ChevronRight, Trash2, Ban
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/lib/hooks/use-debounce'
import toast from 'react-hot-toast'

interface Agent {
  id: string
  username: string
  email: string
  role: string
  status: string
  rejectionReason?: string
  createdAt: string
  fullName?: string
  gender?: string
  dateOfBirth?: string
  nationality?: string
  preferredLanguage?: string
  ethPhone?: string
  safaricomPhone?: string
  region?: string
  city?: string
  woreda?: string
  kebele?: string
  fullAddress?: string
  faydaFront?: string
  faydaBack?: string
  selfieFayda?: string
  passportPhoto?: string
  highestEducation?: string
  educationCertificate?: string
  agentExperience?: string
  companyName?: string
  officeAddress?: string
  businessLicenseNumber?: string
  businessLicenseFile?: string
  tinNumber?: string
}

export default function AdminAgentsPage() {
  const { getToken } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const debouncedSearch = useDebounce(search, 300)

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [getToken])

  async function fetchAgents() {
    setLoading(true)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${getApiUrl()}/api/admin/agents?search=${debouncedSearch}&status=${statusFilter}`, {
        headers: { ...authHeaders },
      })
      const data = await res.json()
      setAgents(data.agents || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [debouncedSearch, statusFilter, getAuthHeaders])

  async function handleAction(action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete', agentId: string) {
    setSubmittingAction(true)
    try {
      const authHeaders = await getAuthHeaders()
      const body: Record<string, any> = { action, id: agentId }
      if (action === 'reject') {
        body.rejectionReason = rejectionReason
      }
      
      const res = await fetch(`${getApiUrl()}/api/admin/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success('Agent status updated successfully')
        setShowRejectForm(false)
        setRejectionReason('')
        if (selectedAgent && selectedAgent.id === agentId) {
          const updatedStatus = action === 'approve' || action === 'reactivate' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Suspended'
          setSelectedAgent(prev => prev ? { ...prev, status: updatedStatus, rejectionReason: body.rejectionReason || '' } : null)
        }
        fetchAgents()
      } else {
        const errData = await res.json()
        toast.error(errData.message || 'Action failed.')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setSubmittingAction(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Agent Verification Management</h1>
          <p className="text-sm text-slate-500">Review onboarding applications, verify identity documents, and approve real estate agents.</p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name or email..."
            className="pl-10 rounded-xl"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {['all', 'Pending', 'Approved', 'Rejected', 'Suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? 'border-orange-500 bg-orange-50 text-orange-950 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-start">
        {/* Agent List */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]">
          <h2 className="font-bold text-slate-900 mb-4">Agent Catalog</h2>
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-2" />
              <span>Fetching agents list...</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <User className="h-10 w-10 opacity-30 mb-2" />
              <span>No agents match the current filter criteria.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`py-4 px-3 flex items-center justify-between gap-4 cursor-pointer transition rounded-2xl ${selectedAgent?.id === agent.id ? 'bg-orange-50/50' : 'hover:bg-slate-50/70'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold">
                      {(agent.fullName || agent.username).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{agent.fullName || agent.username}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{agent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={agent.status} />
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agent Verification Detail Panel */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px] lg:sticky lg:top-24">
          <h2 className="font-bold text-slate-900 mb-4">Verification Panel</h2>
          {selectedAgent ? (
            <div className="space-y-6">
              {/* Header profile info */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedAgent.fullName || selectedAgent.username}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedAgent.email}</p>
                  <div className="mt-2">
                    <StatusBadge status={selectedAgent.status} />
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold text-lg">
                  {(selectedAgent.fullName || selectedAgent.username).charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 border-t border-b border-slate-100 py-4">
                {selectedAgent.status === 'Pending' && (
                  <>
                    <Button
                      onClick={() => handleAction('approve', selectedAgent.id)}
                      disabled={submittingAction}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold py-1.5"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      disabled={submittingAction}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold py-1.5"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {selectedAgent.status === 'Approved' && (
                  <Button
                    onClick={() => handleAction('suspend', selectedAgent.id)}
                    disabled={submittingAction}
                    className="w-full bg-slate-800 hover:bg-slate-950 text-white rounded-xl text-xs font-semibold py-1.5"
                  >
                    <Ban className="h-3.5 w-3.5 mr-1" /> Suspend Agent Account
                  </Button>
                )}
                {selectedAgent.status === 'Suspended' && (
                  <Button
                    onClick={() => handleAction('reactivate', selectedAgent.id)}
                    disabled={submittingAction}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold py-1.5"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Reactivate Account
                  </Button>
                )}
                {selectedAgent.status === 'Rejected' && (
                  <div className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-1">
                    <p className="font-semibold">Rejection Details</p>
                    <p className="text-slate-600">Reason: {selectedAgent.rejectionReason || 'No reason specified'}</p>
                    <button
                      onClick={() => handleAction('reactivate', selectedAgent.id)}
                      className="mt-2 block font-bold text-red-600 hover:underline"
                    >
                      Re-evaluate & Approve Account
                    </button>
                  </div>
                )}
              </div>

              {/* Rejection input box */}
              {showRejectForm && (
                <div className="space-y-3 p-4 rounded-2xl border border-red-100 bg-red-50/50 text-xs">
                  <Label className="font-bold text-slate-800 text-xs">Provide Reason for Rejection</Label>
                  <Input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Fayda ID photo is blurred. Please re-upload clear photos."
                    className="rounded-xl text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction('reject', selectedAgent.id)}
                      disabled={submittingAction || !rejectionReason.trim()}
                      className="flex-1 bg-red-600 text-white rounded-lg py-1 hover:bg-red-700 text-xs"
                    >
                      Submit Rejection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setShowRejectForm(false); setRejectionReason('') }}
                      className="flex-1 rounded-lg py-1 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Submitted Details Fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-2">Onboarding Information</h4>
                  <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-3">
                    <p><span className="text-slate-400">Gender:</span> <span className="font-semibold text-slate-700">{selectedAgent.gender || '-'}</span></p>
                    <p><span className="text-slate-400">Date of Birth:</span> <span className="font-semibold text-slate-700">{selectedAgent.dateOfBirth || '-'}</span></p>
                    <p><span className="text-slate-400">Nationality:</span> <span className="font-semibold text-slate-700">{selectedAgent.nationality || '-'}</span></p>
                    <p><span className="text-slate-400">Language:</span> <span className="font-semibold text-slate-700">{selectedAgent.preferredLanguage || '-'}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-2">Contact Details</h4>
                  <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-3">
                    <p className="col-span-2"><span className="text-slate-400">Eth Phone:</span> <span className="font-bold text-slate-700">{selectedAgent.ethPhone || '-'}</span></p>
                    <p className="col-span-2"><span className="text-slate-400">Safaricom:</span> <span className="font-semibold text-slate-700">{selectedAgent.safaricomPhone || '-'}</span></p>
                    <p className="col-span-2"><span className="text-slate-400">Address:</span> <span className="font-semibold text-slate-700">{selectedAgent.fullAddress || `${selectedAgent.city || ''}, ${selectedAgent.region || ''}`}</span></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-2">Education & Professional</h4>
                  <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 pb-3">
                    <p className="col-span-2"><span className="text-slate-400">Education:</span> <span className="font-semibold text-slate-700">{selectedAgent.highestEducation || '-'}</span></p>
                    <p><span className="text-slate-400">Experience:</span> <span className="font-semibold text-slate-700">{selectedAgent.agentExperience || '-'}</span></p>
                    <p><span className="text-slate-400">Company:</span> <span className="font-semibold text-slate-700">{selectedAgent.companyName || '-'}</span></p>
                    <p className="col-span-2"><span className="text-slate-400">TIN Number:</span> <span className="font-semibold text-slate-700">{selectedAgent.tinNumber || '-'}</span></p>
                  </div>
                </div>

                {/* Uploaded Documents with Image Previews */}
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] text-orange-500 mb-2">Uploaded Verification Files</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Fayda Front', file: selectedAgent.faydaFront },
                      { name: 'Fayda Back', file: selectedAgent.faydaBack },
                      { name: 'Selfie with ID', file: selectedAgent.selfieFayda },
                      { name: 'Passport Photo', file: selectedAgent.passportPhoto },
                      { name: 'Certificate', file: selectedAgent.educationCertificate },
                      { name: 'Business License', file: selectedAgent.businessLicenseFile },
                    ].map((doc, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                        <span className="font-semibold text-slate-500 text-[10px]">{doc.name}</span>
                        {doc.file ? (
                          <a href={doc.file} target="_blank" rel="noreferrer" className="block mt-1.5 group">
                            <img
                              src={doc.file}
                              alt={doc.name}
                              className="w-full h-28 rounded-lg object-cover border border-slate-200 group-hover:border-orange-400 transition"
                            />
                            <span className="font-bold text-orange-600 hover:underline inline-block text-[10px] mt-1">Open full size</span>
                          </a>
                        ) : (
                          <div className="w-full h-28 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center mt-1.5">
                            <span className="text-slate-400 text-[10px]">Not Provided</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center text-slate-400 text-center px-4">
              <User className="h-10 w-10 opacity-30 mb-2" />
              <p className="text-xs">Select an agent catalog card to view verification details and toggle status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

