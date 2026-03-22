'use client'

import React, { ReactNode } from 'react'
import { wagmiAdapter, projectId, networks } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'

const queryClient = new QueryClient()

if (!projectId) throw new Error('Project ID is not defined')

const metadata = {
  name: 'Voting App',
  description: 'Alyra Voting DApp',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [networks[0]],
  metadata: metadata,
  themeMode: 'light',
  features: {
    analytics: true
  }
})

export default function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = typeof window !== 'undefined' ? undefined : wagmiAdapter.wagmiConfig.state
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
