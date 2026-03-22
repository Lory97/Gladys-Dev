// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting System Smart Contract
/// @notice This contract allows the owner to manage a voting session with registration, proposal, and voting phases.
/// @dev Inherits from Ownable. Includes multiple workflow statuses.
contract Voting is Ownable {
    /// @notice The ID of the winning proposal, populated after votes are tallied.
    uint public winningProposalID;

    /// @notice Structure representing a voter.
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /// @notice Structure representing a proposal.
    struct Proposal {
        string description;
        uint voteCount;
    }

    /// @notice Enumeration of the different statuses of the voting workflow.
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    WorkflowStatus public workflowStatus;
    Proposal[] proposalsArray;
    mapping(address => Voter) voters;

    /// @notice Event emitted when a new voter is successfully registered.
    /// @param voterAddress Address of the newly registered voter.
    event VoterRegistered(address voterAddress);

    /// @notice Event emitted when the voting workflow status changes.
    /// @param previousStatus The previous workflow status.
    /// @param newStatus The new workflow status.
    event WorkflowStatusChange(
        WorkflowStatus previousStatus,
        WorkflowStatus newStatus
    );

    /// @notice Event emitted when a new proposal is registered.
    /// @param proposalId ID of the newly registered proposal.
    event ProposalRegistered(uint proposalId);

    /// @notice Event emitted when a voter successfully casts a vote.
    /// @param voter Address of the voter who cast the vote.
    /// @param proposalId ID of the voted proposal.
    event Voted(address voter, uint proposalId);

    constructor() Ownable(msg.sender) {}

    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    // on peut faire un modifier pour les états

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Retrieves a specific voter's information.
    /// @dev Restricted to registered voters.
    /// @param _addr Address of the voter to retrieve.
    /// @return Voter memory struct containing voter details.
    function getVoter(
        address _addr
    ) external view onlyVoters returns (Voter memory) {
        return voters[_addr];
    }

    /// @notice Retrieves a specific proposal's details.
    /// @dev Restricted to registered voters.
    /// @param _id ID of the proposal to retrieve.
    /// @return Proposal memory struct containing proposal details.
    function getOneProposal(
        uint _id
    ) external view onlyVoters returns (Proposal memory) {
        return proposalsArray[_id];
    }

    // ::::::::::::: REGISTRATION ::::::::::::: //

    /// @notice Registers a new voter into the voting system.
    /// @dev Restricted to the administrator (Owner). Requires workflow status to be RegisteringVoters.
    /// @param _addr Address of the new voter to register.
    function addVoter(address _addr) external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Voters registration is not open yet"
        );
        require(voters[_addr].isRegistered != true, "Already registered");

        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    // ::::::::::::: PROPOSAL ::::::::::::: //

    /// @notice Allows a registered voter to submit a new proposal.
    /// @dev Restricted to registered voters. Requires workflow status to be ProposalsRegistrationStarted.
    /// @param _desc A brief description of the proposal.
    function addProposal(string calldata _desc) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Proposals are not allowed yet"
        );
        require(
            keccak256(abi.encode(_desc)) != keccak256(abi.encode("")),
            "Vous ne pouvez pas ne rien proposer"
        ); // facultatif
        // voir que desc est different des autres

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        // proposalsArray.push(Proposal(_desc,0));
        emit ProposalRegistered(proposalsArray.length - 1);
    }

    // ::::::::::::: VOTE ::::::::::::: //

    /// @notice Allows a registered voter to cast a vote for a proposal.
    /// @dev Restricted to registered voters who have not voted yet. Requires workflow status VotingSessionStarted.
    /// @param _id ID of the proposal to vote for.
    function setVote(uint _id) external onlyVoters {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        require(voters[msg.sender].hasVoted != true, "You have already voted");
        require(_id < proposalsArray.length, "Proposal not found"); // pas obligé, et pas besoin du >0 car uint

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;

        if (
            proposalsArray[_id].voteCount >
            proposalsArray[winningProposalID].voteCount
        ) {
            winningProposalID = _id;
        }

        emit Voted(msg.sender, _id);
    }

    // ::::::::::::: STATE ::::::::::::: //

    /// @notice Changes workflow status to ProposalsRegistrationStarted.
    /// @dev Restricted to administrator. Also creates a "GENESIS" proposal at ID 0.
    function startProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.RegisteringVoters,
            "Registering proposals cant be started now"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        Proposal memory proposal;
        proposal.description = "GENESIS";
        proposalsArray.push(proposal);

        emit WorkflowStatusChange(
            WorkflowStatus.RegisteringVoters,
            WorkflowStatus.ProposalsRegistrationStarted
        );
    }

    /// @notice Changes workflow status to ProposalsRegistrationEnded.
    /// @dev Restricted to administrator.
    function endProposalsRegistering() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationStarted,
            "Registering proposals havent started yet"
        );
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationStarted,
            WorkflowStatus.ProposalsRegistrationEnded
        );
    }

    /// @notice Changes workflow status to VotingSessionStarted.
    /// @dev Restricted to administrator.
    function startVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.ProposalsRegistrationEnded,
            "Registering proposals phase is not finished"
        );
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(
            WorkflowStatus.ProposalsRegistrationEnded,
            WorkflowStatus.VotingSessionStarted
        );
    }

    /// @notice Changes workflow status to VotingSessionEnded.
    /// @dev Restricted to administrator.
    function endVotingSession() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionStarted,
            "Voting session havent started yet"
        );
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionStarted,
            WorkflowStatus.VotingSessionEnded
        );
    }

    /// @notice Changes workflow status to VotesTallied.
    /// @dev Restricted to administrator.
    function tallyVotes() external onlyOwner {
        require(
            workflowStatus == WorkflowStatus.VotingSessionEnded,
            "Current status is not voting session ended"
        );
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(
            WorkflowStatus.VotingSessionEnded,
            WorkflowStatus.VotesTallied
        );
    }
}
