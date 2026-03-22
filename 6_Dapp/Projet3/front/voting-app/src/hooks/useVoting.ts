import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { votingContractConfig } from '@/constants/contract'
import { VotingFunctionName } from '@/types/VotingFunctionName'

export function useVoting() {
  const { address } = useAccount()

  const { data: owner } = useReadContract({
    ...votingContractConfig,
    functionName: 'owner',
  })

  const { data: workflowStatus, refetch: refetchStatus } = useReadContract({
    ...votingContractConfig,
    functionName: 'workflowStatus',
  })

  const { data: winningProposalID } = useReadContract({
    ...votingContractConfig,
    functionName: 'winningProposalID',
  })

  const { data: voterInfo, refetch: refetchVoter } = useReadContract({
    ...votingContractConfig,
    functionName: 'getVoter',
    args: address ? [address] : undefined,
    account: address,
    query: {
      enabled: !!address,
    }
  })

  const { writeContractAsync, isPending, error } = useWriteContract()

  // Helper method for actions to have a unified signature
  const executeAction = async (functionName: VotingFunctionName, args: any[] = []) => {
    try {
      const hash = await writeContractAsync({
        ...votingContractConfig,
        functionName,
        args,
      } as any)
      return { success: true, hash }
    } catch (err: any) {
      console.error(`Error executing ${functionName}:`, err)
      
      let errorMessage = err.message || 'Transaction failed'
      
      if (err.shortMessage) {
        errorMessage = err.shortMessage
      }
      
      if (errorMessage.includes('Already registered') || err.message?.includes('Already registered')) {
        errorMessage = 'Ce votant est déjà enregistré sur la liste blanche.'
      } else if (errorMessage.includes('Voters registration is not open yet') || err.message?.includes('Voters registration is not open yet')) {
        errorMessage = 'L\'enregistrement des électeurs n\'est pas ouvert.'
      } else if (errorMessage.includes("You're not a voter") || err.message?.includes("You're not a voter")) {
        errorMessage = "Vous n'êtes pas reconnu comme un électeur inscrit."
      } else if (errorMessage.includes("Proposals are not allowed yet") || err.message?.includes("Proposals are not allowed yet")) {
        errorMessage = "L'enregistrement des propositions n'est pas autorisé actuellement."
      } else if (errorMessage.includes("You have already voted") || err.message?.includes("You have already voted")) {
        errorMessage = "Vous avez déjà voté."
      } else if (errorMessage.includes("Voting session havent started yet") || err.message?.includes("Voting session havent started yet")) {
        errorMessage = "La session de vote n'a pas encore commencé."
      } else if (errorMessage.includes("Registering proposals phase is not finished") || err.message?.includes("Registering proposals phase is not finished")) {
        errorMessage = "La phase d'enregistrement des propositions n'est pas terminée."
      } else if (errorMessage.includes("User denied transaction signature") || err.message?.includes("User denied transaction signature")) {
        errorMessage = "Transaction annulée par l'utilisateur."
      }

      return { success: false, error: errorMessage }
    }
  }

  return {
    address,
    owner: owner as string | undefined,
    workflowStatus: workflowStatus as number | undefined,
    winningProposalID: winningProposalID as bigint | undefined,
    voterInfo: voterInfo as { isRegistered: boolean; hasVoted: boolean; votedProposalId: bigint } | undefined,
    isPending,
    error,
    executeAction,
    refetchStatus,
    refetchVoter
  }
}
