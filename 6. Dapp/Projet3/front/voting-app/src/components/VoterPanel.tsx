'use client'

import { useState, useEffect } from 'react'
import { useVoting } from '@/hooks/useVoting'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Vote, FileSignature, CheckSquare, Search } from 'lucide-react'
import { useReadContract, useAccount, usePublicClient } from 'wagmi'
import { votingContractConfig } from '@/constants/contract'
import { parseAbiItem } from 'viem'

export default function VoterPanel() {
  const { workflowStatus, voterInfo, executeAction, isPending, refetchVoter, address } = useVoting()
  const [proposalDesc, setProposalDesc] = useState('')
  const [refreshProposals, setRefreshProposals] = useState(0)

  const handleAddProposal = async () => {
    if (!proposalDesc) return toast.error("Description requise")
    const { success, error } = await executeAction('addProposal', [proposalDesc])
    if (success) {
      toast.success("Proposition enregistrée !")
      setProposalDesc('')
      setRefreshProposals(prev => prev + 1)
    } else {
      toast.error(error as string)
    }
  }

  const handleVote = async (id: bigint) => {
    const { success, error } = await executeAction('setVote', [id])
    if (success) {
      toast.success("A voté !")
      refetchVoter()
    } else {
      toast.error(error as string)
    }
  }
  if (!voterInfo?.isRegistered) {
    return null;
  } return (
    <Card className="w-full max-w-3xl mx-auto mt-8 border border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white rounded-3xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-white pb-6 border-b border-slate-100 px-8 pt-8">
        <CardTitle className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl">
            <Vote className="w-6 h-6 text-emerald-600" />
          </div>
          Espace Électeur
        </CardTitle>
        <CardDescription className="text-slate-500 text-base mt-2">
          Participez au processus de vote selon la phase actuelle du cycle.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {workflowStatus === 1 ? (
          <div className="space-y-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                Soumettre une proposition
              </h3>
              <div className="flex gap-4">
                <Input
                  className="h-12 border-slate-200 focus-visible:ring-indigo-500 bg-white rounded-xl"
                  placeholder="Ex: Améliorer l'interface utilisateur..."
                  value={proposalDesc}
                  onChange={e => setProposalDesc(e.target.value)}
                  disabled={isPending}
                />
                <Button
                  onClick={handleAddProposal}
                  disabled={!proposalDesc || isPending}
                  className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 font-medium"
                >
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Proposer"}
                </Button>
              </div>
            </div>

            <MyProposalsList address={address} refreshTrigger={refreshProposals} />
          </div>
        ) : workflowStatus === 3 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
              <CheckSquare className="w-6 h-6 text-indigo-600" />
              Sélectionnez une proposition
            </h3>
            {voterInfo.hasVoted ? (
              <div className="flex flex-col sm:flex-row items-center justify-center text-emerald-700 bg-emerald-50 p-8 rounded-2xl border border-emerald-100/50 shadow-sm space-y-4 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
                <div className="bg-emerald-100 p-3 rounded-full shrink-0">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <span className="font-semibold text-lg">Votre vote pour la proposition n°{voterInfo.votedProposalId.toString()} est bien enregistré.</span>
              </div>
            ) : (
              <AllProposalsToVote onVote={handleVote} isPending={isPending} />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white text-slate-300 rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-100">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-slate-600 font-semibold text-lg text-center max-w-sm">
              Aucune action n'est disponible pour le moment.
            </p>
            <p className="text-sm text-slate-400 mt-2 bg-white px-3 py-1 rounded-full border border-slate-100">
              Statut actuel : {workflowStatus}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AllProposalsToVote({ onVote, isPending }: { onVote: (id: bigint) => void, isPending: boolean }) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [proposals, setProposals] = useState<{ id: bigint; desc: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAllProposals = async () => {
      if (!publicClient || !address) return
      setLoading(true)
      try {
        const logs = await publicClient.getLogs({
          address: votingContractConfig.address,
          event: parseAbiItem('event ProposalRegistered(uint256 proposalId)'),
          fromBlock: BigInt(10499067),
          toBlock: 'latest'
        })

        const allProposalIds = logs.map(log => (log.args as any).proposalId as bigint)
        const uniqueIds = Array.from(new Set(allProposalIds.map(id => id.toString()))).map(BigInt)
        uniqueIds.sort((a, b) => Number(a) - Number(b))

        const detailedProposals = await Promise.all(
          uniqueIds.map(async (id) => {
            const data: any = await publicClient.readContract({
              address: votingContractConfig.address,
              abi: votingContractConfig.abi,
              functionName: 'getOneProposal',
              args: [id],
              account: address as `0x${string}`
            })
            return { id, desc: data.description }
          })
        )

        setProposals(detailedProposals)
      } catch (err) {
        console.error("Error fetching all proposals:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAllProposals()
  }, [publicClient, address])

  if (!address) return null

  return (
    <div className="space-y-4 mt-2">
      {loading ? (
        <div className="flex items-center justify-center p-8 text-sm text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin text-indigo-600" /> Chargement des propositions...</div>
      ) : proposals.length > 0 ? (
        <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {proposals.map((p) => (
            <div key={p.id.toString()} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow transition-all group">
              <div className="flex flex-col max-w-full md:max-w-[70%]">
                <span className="font-bold text-indigo-600 text-sm tracking-wide uppercase">Proposition #{p.id.toString()}</span>
                <span className="text-slate-700 font-medium text-lg mt-1 break-words">{p.desc}</span>
              </div>
              <Button
                onClick={() => onVote(p.id)}
                disabled={isPending}
                className="mt-4 md:mt-0 w-full md:w-auto h-11 px-8 rounded-xl font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 transition-colors group-hover:shadow-md"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sélectionner"}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 italic">Aucune proposition disponible pour le vote.</p>
        </div>
      )}
    </div>
  )
}

function MyProposalsList({ address, refreshTrigger }: { address?: string, refreshTrigger: number }) {
  const publicClient = usePublicClient()
  const [proposals, setProposals] = useState<{ id: bigint; desc: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMyProposals = async () => {
      if (!publicClient || !address) return
      setLoading(true)
      try {
        const logs = await publicClient.getLogs({
          address: votingContractConfig.address,
          event: parseAbiItem('event ProposalRegistered(uint256 proposalId)'),
          fromBlock: BigInt(10499067),
          toBlock: 'latest'
        })

        const userProposalIds: bigint[] = []

        await Promise.all(logs.map(async (log) => {
          if (!log.transactionHash) return;
          const tx = await publicClient.getTransaction({ hash: log.transactionHash })
          if (tx.from.toLowerCase() === address.toLowerCase()) {
            userProposalIds.push((log.args as any).proposalId)
          }
        }))

        userProposalIds.sort((a, b) => Number(a) - Number(b))

        const detailedProposals = await Promise.all(
          userProposalIds.map(async (id) => {
            const data: any = await publicClient.readContract({
              address: votingContractConfig.address,
              abi: votingContractConfig.abi,
              functionName: 'getOneProposal',
              args: [id],
              account: address as `0x${string}`
            })
            return { id, desc: data.description }
          })
        )

        setProposals(detailedProposals)

      } catch (err) {
        console.error("Error fetching proposals:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMyProposals()
  }, [publicClient, address, refreshTrigger])

  if (!address) return null

  return (
    <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
      <h4 className="font-bold text-slate-800 text-lg mb-4">Vos propositions soumises ({proposals.length})</h4>
      {loading ? (
        <div className="flex items-center text-sm text-slate-500"><Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-600" /> Chargement...</div>
      ) : proposals.length > 0 ? (
        <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {proposals.map((p) => (
            <div key={p.id.toString()} className="flex flex-col bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-700 font-medium text-base mt-1 break-words">{p.desc}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-100 text-center shadow-sm">
          <p className="text-sm text-slate-500 italic">Vous n'avez soumis aucune proposition.</p>
        </div>
      )}
    </div>
  )
}
