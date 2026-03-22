import { useVoting } from '@/hooks/useVoting'
import { Vote, ShieldCheck, User } from 'lucide-react'

export default function Header() {
  const { address, owner, voterInfo } = useVoting()

  const isAdmin = address && owner && address.toLowerCase() === owner.toLowerCase()
  const isVoter = voterInfo?.isRegistered

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 border-b border-border/40 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-indigo-600/30 shadow-lg">
          <Vote className="w-6 h-6 text-white" />
        </div>
        <div className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-600">
          Voting DApp
        </div>
      </div>

      <div className="flex items-center gap-4">
        {address && (
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-2 py-1.5 rounded-full border border-slate-200/60 shadow-inner">
            {isAdmin && (
              <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-100/80 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm border border-indigo-200 transition-transform hover:scale-105">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </div>
            )}
            {isVoter && !isAdmin && (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase shadow-sm border border-emerald-200 transition-transform hover:scale-105">
                <User className="w-3.5 h-3.5" />
                Électeur
              </div>
            )}
            {!isAdmin && !isVoter && (
              <div className="text-slate-500 px-3 py-1 text-xs font-semibold uppercase">
                Visiteur
              </div>
            )}
          </div>
        )}
        <div className="relative z-10 hover:opacity-90 transition-opacity">
          <appkit-button />
        </div>
      </div>
    </header>
  )
}
