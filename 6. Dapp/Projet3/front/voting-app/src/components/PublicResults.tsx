'use client'

import { useVoting } from '@/hooks/useVoting'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useReadContract } from 'wagmi'
import { votingContractConfig } from '@/constants/contract'
import { Trophy, Award } from 'lucide-react'

export default function PublicResults() {
  const { workflowStatus, winningProposalID, voterInfo, address } = useVoting()

  // getOneProposal is restricted to onlyVoters in the contract
  const { data: winningProposal, isError } = useReadContract({
    ...votingContractConfig,
    functionName: 'getOneProposal',
    args: winningProposalID !== undefined ? [winningProposalID] : undefined,
    account: address,
    query: {
      enabled: workflowStatus === 5 && winningProposalID !== undefined && !!voterInfo?.isRegistered,
    }
  })

  if (workflowStatus !== 5) return null

  return (
    <Card className="w-full max-w-4xl mx-auto mt-12 border border-indigo-200 shadow-2xl shadow-indigo-500/20 bg-gradient-to-br from-white to-indigo-50 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-white/50 backdrop-blur-sm pb-8 pt-12 border-b border-indigo-100/50">
        <CardTitle className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-violet-600 flex items-center justify-center gap-4">
          <Trophy className="w-10 h-10 md:w-12 md:h-12 text-amber-500 drop-shadow-sm" />
          Résultats de l'Élection
          <Trophy className="w-10 h-10 md:w-12 md:h-12 text-amber-500 drop-shadow-sm" />
        </CardTitle>
        <CardDescription className="text-center text-slate-500 text-lg md:text-xl mt-4 font-medium">
          La session de vote est terminée. La décision démocratique est rendue.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-12 pb-16 flex flex-col items-center justify-center px-6 md:px-12">
        {winningProposalID !== undefined ? (
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-700">
            <div className="flex flex-col items-center bg-white p-8 md:p-12 rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-100/50 relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Award className="w-64 h-64" />
              </div>
              
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-5 rounded-full mb-8 text-amber-600 shadow-inner z-10 border border-amber-200/50 transform transition-transform hover:scale-110 duration-500">
                 <Award className="w-12 h-12 md:w-16 md:h-16" />
              </div>
              
              <h3 className="text-lg md:text-xl font-bold text-indigo-900 mb-6 uppercase tracking-[0.2em] z-10 bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100">
                Proposition Gagnante
              </h3>
              
              {winningProposal && !isError ? (
                <div className="z-10 flex flex-col items-center w-full">
                  {/* @ts-ignore */}
                  <p className="text-4xl md:text-5xl font-black text-slate-800 leading-tight break-words max-w-full">
                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">
                      {winningProposal.description}
                    </span>
                  </p>
                  
                  <div className="mt-10 flex flex-col items-center">
                    <div className="flex items-center text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-3xl px-8 py-4 shadow-sm transform transition-all hover:scale-105 hover:bg-indigo-600 hover:text-white cursor-default group">
                      <span className="font-extrabold text-3xl md:text-4xl">
                        {/* @ts-ignore */}
                        {winningProposal.voteCount.toString()}
                      </span>
                      <span className="ml-3 text-lg font-bold opacity-80 uppercase tracking-widest">
                        votes
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="z-10 flex flex-col items-center">
                  <p className="text-4xl md:text-5xl font-black text-slate-800">Proposition #{winningProposalID.toString()}</p>
                </div>
              )}
              
              <div className="z-10 mt-12 text-center w-full">
                 <div className="inline-flex items-center justify-center bg-slate-50 text-slate-400 text-sm font-mono px-5 py-2 rounded-full border border-slate-200">
                   ID d'enregistrement : {winningProposalID.toString()}
                 </div>
                 {!winningProposal && !voterInfo?.isRegistered && (
                   <p className="text-amber-600 text-sm md:text-base mt-6 max-w-md mx-auto font-medium bg-amber-50 p-4 rounded-2xl border border-amber-100/50 shadow-sm">
                     Les détails de la proposition sont protégés par le contrat intelligent et lisibles uniquement par les électeurs inscrits.
                   </p>
                 )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 my-12">
             <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
             <p className="text-indigo-600 font-bold text-lg animate-pulse tracking-wide">Décompte des résultats en cours...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
