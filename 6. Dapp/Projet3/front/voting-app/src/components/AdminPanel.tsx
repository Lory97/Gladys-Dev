'use client'

import { useState, useEffect } from 'react'
import { useVoting } from '@/hooks/useVoting'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, UserPlus, FileText, CheckSquare, Flag, Check, Wallet } from 'lucide-react'
import { VotingFunctionName } from '@/types/VotingFunctionName'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { votingContractConfig } from '@/constants/contract'
import { parseAbiItem } from 'viem'

export default function AdminPanel() {
  const { workflowStatus, executeAction, isPending, refetchStatus } = useVoting()
  const [address, setAddress] = useState('')
  const [votersList, setVotersList] = useState<string[]>([])
  const publicClient = usePublicClient()

  useEffect(() => {
    const fetchVoters = async () => {
      if (!publicClient) return
      try {
        const logs = await publicClient.getLogs({
          address: votingContractConfig.address,
          event: parseAbiItem('event VoterRegistered(address voterAddress)'),
          fromBlock: BigInt(10499067),
          toBlock: 'latest'
        })
        const addresses = logs.map(log => log.args.voterAddress as string)
        setVotersList([...new Set(addresses)])
      } catch (err) {
        console.error("Error fetching past voters:", err)
      }
    }
    fetchVoters()
  }, [publicClient])

  useWatchContractEvent({
    ...votingContractConfig,
    eventName: 'VoterRegistered',
    onLogs(logs) {
      const newAddresses = logs.map(log => (log.args as any).voterAddress as string)
      setVotersList(prev => [...new Set([...prev, ...newAddresses])])
    },
  })

  const handleAction = async (functionName: VotingFunctionName, args: any[] = [], successMessage: string) => {
    const { success, error } = await executeAction(functionName, args)
    if (success) {
      toast.success(successMessage)
      refetchStatus()
    } else {
      toast.error(error as string)
    }
  }

  const handleAddVoter = () => {
    if (!address) return toast.error("Veuillez entrer une adresse")
    handleAction('addVoter', [address], `Voter ajouté avec succès.`)
    setAddress('')
  }

  const phases = [
    {
      id: 0,
      title: "Inscription des électeurs",
      icon: UserPlus,
      isActive: workflowStatus === 0,
      isPast: (workflowStatus ?? 0) > 0,
      action: {
        label: "Démarrer l'enregistrement des propositions",
        onClick: () => handleAction('startProposalsRegistering', [], "Enregistrement des propositions démarré."),
        show: workflowStatus === 0,
        variant: "default" as const
      }
    },
    {
      id: 1,
      title: "Enregistrement des propositions",
      icon: FileText,
      isActive: workflowStatus === 1 || workflowStatus === 2,
      isPast: (workflowStatus ?? 0) > 2,
      action: workflowStatus === 1 ? {
        label: "Terminer l'enregistrement",
        onClick: () => handleAction('endProposalsRegistering', [], "Enregistrement des propositions arrêté."),
        show: true,
        variant: "destructive" as const
      } : {
        label: "Démarrer la session de vote",
        onClick: () => handleAction('startVotingSession', [], "Session de vote démarrée."),
        show: workflowStatus === 2,
        variant: "default" as const
      }
    },
    {
      id: 3,
      title: "Session de vote",
      icon: CheckSquare,
      isActive: workflowStatus === 3 || workflowStatus === 4,
      isPast: (workflowStatus ?? 0) > 4,
      action: workflowStatus === 3 ? {
        label: "Terminer la session de vote",
        onClick: () => handleAction('endVotingSession', [], "Session de vote arrêtée."),
        show: true,
        variant: "destructive" as const
      } : {
        label: "Comptabiliser les votes",
        onClick: () => handleAction('tallyVotes', [], "Votes comptabilisés avec succès."),
        show: workflowStatus === 4,
        variant: "default" as const
      }
    },
    {
      id: 5,
      title: "Résultats publiés",
      icon: Flag,
      isActive: workflowStatus === 5,
      isPast: false,
      action: { show: false }
    }
  ]

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 border border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-white pb-6 border-b border-slate-100 px-8 pt-8">
        <CardTitle className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <div className="bg-indigo-100 p-2.5 rounded-xl">
            <UserPlus className="w-6 h-6 text-indigo-600" />
          </div>
          Panneau Administrateur
        </CardTitle>
        <CardDescription className="text-slate-500 text-base mt-2">
          Gérez l'inscription des électeurs et contrôlez les différentes phases du cycle de vote.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-12">
        {/* Section 1: Electeurs */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
            <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            Liste Blanche des Électeurs
          </h3>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex gap-4 mb-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  className="pl-10 border-slate-200 focus-visible:ring-indigo-500 bg-white h-12 rounded-xl"
                  placeholder="Adresse Ethereum (0x...)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  disabled={workflowStatus !== 0 || isPending}
                />
              </div>
              <Button
                onClick={handleAddVoter}
                className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                disabled={workflowStatus !== 0 || isPending || !address}
              >
                {isPending && workflowStatus === 0 ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Ajouter"}
              </Button>
            </div>

            {workflowStatus !== 0 && (
              <p className="text-sm text-amber-600 mt-3 font-medium flex items-center gap-1.5 bg-amber-50 p-2 px-3 rounded-lg border border-amber-100 w-fit">
                L'enregistrement des électeurs est désormais clos.
              </p>
            )}

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Électeurs inscrits ({votersList.length})</h4>
              </div>

              {votersList.length > 0 ? (
                <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {votersList.map((addr) => (
                      <div key={addr} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0 border border-indigo-200/50">
                          <UserPlus className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="text-sm font-mono text-slate-600 truncate">{addr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 italic">Aucun électeur sur la liste blanche pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Cycle Timeline */}
        <section>
          <h3 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-8 flex items-center gap-2">
            <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            Gestion du Cycle de Vote
          </h3>

          <div className="pl-4">
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 pb-4">
              {phases.map((phase) => (
                <div key={phase.id} className="relative pl-10">
                  {/* Timeline Node */}
                  <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm
                    ${phase.isActive ? 'bg-indigo-600 shadow-indigo-500/30' : phase.isPast ? 'bg-emerald-500' : 'bg-slate-200'}
                    transition-colors duration-500`}
                  >
                    {phase.isPast ? <Check className="w-4 h-4 text-white font-bold" /> : <phase.icon className={`w-4 h-4 ${phase.isActive ? 'text-white' : 'text-slate-400'}`} />}
                  </div>

                  {/* Content */}
                  <div className={`flex flex-col gap-3 transition-opacity duration-300 ${phase.isActive ? 'opacity-100' : phase.isPast ? 'opacity-70' : 'opacity-40'}`}>
                    <h4 className={`text-lg font-bold ${phase.isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {phase.title}
                      {phase.isActive && <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">En cours</span>}
                    </h4>

                    {/* Action Button */}
                    {phase.action?.show && (
                      <div className="mt-1">
                        <Button
                          variant={phase.action.variant}
                          onClick={phase.action.onClick}
                          disabled={isPending}
                          className={`h-11 px-6 rounded-xl font-medium shadow-sm ${phase.action.variant === 'default' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : ''}`}
                        >
                          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          {phase.action.label}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
