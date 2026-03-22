'use client'

import { useVoting } from '@/hooks/useVoting'
import Header from './Header'
import AdminPanel from './AdminPanel'
import VoterPanel from './VoterPanel'
import PublicResults from './PublicResults'
import { Vote, ShieldCheck, LockKeyhole, Activity, CheckCircle, ShieldAlert } from 'lucide-react'

export default function VotingDashboard() {
  const { address, owner, voterInfo, workflowStatus } = useVoting()

  const isAdmin = address && owner && address.toLowerCase() === owner.toLowerCase()
  const isVoter = voterInfo?.isRegistered

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        {!address ? (
          <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative mb-8 mt-12">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white p-6 rounded-[2rem] shadow-xl border border-indigo-50 shadow-indigo-500/10">
                <Vote className="w-20 h-20 text-indigo-600" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 via-indigo-700 to-violet-800 leading-tight pb-2">
              L'Avenir du Vote<br />Décentralisé
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed">
              Une plateforme sécurisée, transparente et immuable. 
              Connectez votre portefeuille Web3 pour participer au processus décisionnel de manière fiable.
            </p>
            
            <div className="transform transition-transform hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/25 rounded-3xl">
               <appkit-button />
            </div>
            
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl">
               <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                 <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                   <ShieldCheck className="w-7 h-7 text-indigo-600" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-2">Sécurité Infaillible</h3>
                 <p className="text-slate-500 leading-relaxed">Vos votes sont enregistrés cryptographiquement et garantis par le smart contract.</p>
               </div>
               
               <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                 <div className="bg-violet-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                   <Activity className="w-7 h-7 text-violet-600" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-2">Temps Réel</h3>
                 <p className="text-slate-500 leading-relaxed">Suivez l'évolution du cycle de vote et les résultats avec une réactivité instantanée.</p>
               </div>
               
               <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                 <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                   <CheckCircle className="w-7 h-7 text-emerald-600" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-2">Transparence Totale</h3>
                 <p className="text-slate-500 leading-relaxed">L'ensemble de la procédure est public et auditable par tout le monde.</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {workflowStatus === 5 && <PublicResults />}

            {(workflowStatus !== 5 && !isAdmin && !isVoter) && (
              <div className="flex flex-col justify-center items-center py-16 px-4 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                <div className="bg-amber-100 p-5 rounded-full mb-6 text-amber-600 shadow-inner">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Accès Restreint</h3>
                <p className="text-slate-600 text-center max-w-md text-lg leading-relaxed">
                  Seuls les électeurs inscrits sur la liste blanche ou l'administrateur peuvent accéder à cette interface.
                </p>
                <div className="mt-8 flex items-center text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200/50">
                  <LockKeyhole className="w-4 h-4 mr-2" /> Veuillez contacter l'administrateur
                </div>
              </div>
            )}

            <div className="grid gap-8 items-start">
              {isAdmin && <AdminPanel />}
              {isVoter && workflowStatus !== 5 && <VoterPanel />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
