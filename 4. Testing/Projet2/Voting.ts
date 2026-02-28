import { expect } from "chai";
import { network } from "hardhat";
import { type Voting } from "../types/ethers-contracts/Voting.js";
import { type HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";

const { ethers, networkHelpers } = await network.connect();

async function deployVotingContract() {
    const [owner, voter1, voter2] = await ethers.getSigners();
    const voting = await ethers.deployContract("Voting");
    return { voting, owner, voter1, voter2 };
}

describe("Voting", function () {
    let voting: Voting;
    let owner: HardhatEthersSigner;
    let voter1: HardhatEthersSigner;
    let voter2: HardhatEthersSigner;

    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    beforeEach(async function () {
        ({ voting, owner, voter1, voter2 } = await networkHelpers.loadFixture(deployVotingContract));
    });

    describe("Deployment", function () {
        it("deploys with the deployer as owner and starts in RegisteringVoters", async function () {
            expect(await voting.owner()).to.equal(owner.address);
            const status = await voting.workflowStatus();
            expect(status).to.equal(WorkflowStatus.RegisteringVoters);
        });
    });

    describe("addVoter", function () {
        it("should revert if workflow status is not RegisteringVoters", async function () {
            await voting.startProposalsRegistering();
            await expect(voting.addVoter(voter1.address)).to.be.revertedWith("Voters registration is not open yet");
        });

        it("should revert if the sender is not the owner", async function () {
            await expect(voting.connect(voter1).addVoter(voter2.address)).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount").withArgs(voter1.address);
        });

        it("should revert when adding the same voter twice", async function () {
            await voting.addVoter(voter1.address);
            await expect(voting.addVoter(voter1.address)).to.be.revertedWith("Already registered");
        });

        it("allow the owner to add a voter", async function () {
            await expect(voting.addVoter(voter1.address)).to.emit(voting, "VoterRegistered").withArgs(voter1.address);
        });
    });

    describe("addProposal", function () {
        it("should revert if workflow status is not ProposalsRegistrationStarted", async function () {
            await voting.addVoter(voter1.address);
            await expect(voting.connect(voter1).addProposal("Proposal 1")).to.be.revertedWith("Proposals are not allowed yet");
        });

        it("should revert if the sender is not a registered voter", async function () {
            await voting.startProposalsRegistering();
            await expect(voting.connect(voter1).addProposal("Proposal 1")).to.be.revertedWith("You're not a voter");
        });

        it("should revert if the proposal description is empty", async function () {
            await voting.addVoter(voter1.address);
            await voting.startProposalsRegistering();
            await expect(voting.connect(voter1).addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
        });

        it("allow registered voters to add proposals", async function () {
            await voting.addVoter(voter1.address);
            await voting.startProposalsRegistering();
            await expect(voting.connect(voter1).addProposal("Proposal 1")).to.emit(voting, "ProposalRegistered").withArgs(1);
            expect((await voting.connect(voter1).getOneProposal(1)).description).to.equal("Proposal 1");

        });
    });

    describe("setVote", function () {
        it("should revert if workflow status is not VotingSessionStarted", async function () {
            await voting.addVoter(voter1.address);
            await voting.startProposalsRegistering();
            await voting.connect(voter1).addProposal("Proposal 1");
            await expect(voting.connect(voter1).setVote(1)).to.be.revertedWith("Voting session havent started yet");
        });

        it("should revert if the sender is not a registered voter", async function () {
            await voting.addVoter(voter1.address);
            await voting.startProposalsRegistering();
            await voting.connect(voter1).addProposal("Proposal 1");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await expect(voting.connect(voter2).setVote(1)).to.be.revertedWith("You're not a voter");
        });

        it("should revert if the voter has already voted", async function () {
            await voting.addVoter(voter1.address);
            await voting.startProposalsRegistering();
            await voting.connect(voter1).addProposal("Proposal 1");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await voting.connect(voter1).setVote(1);
            await expect(voting.connect(voter1).setVote(1)).to.be.revertedWith("You have already voted");
        });

        it("should revert if the proposal ID is invalid", async function () {
            await voting.addVoter(voter1.address);
            await voting.startProposalsRegistering();
            await voting.connect(voter1).addProposal("Proposal 1");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await expect(voting.connect(voter1).setVote(999)).to.be.revertedWith("Proposal not found");
        });

        it("allow registered voters to vote", async function () {
            await voting.addVoter(voter1.address);
            await voting.startProposalsRegistering();
            await voting.connect(voter1).addProposal("Proposal 1");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await expect(voting.connect(voter1).setVote(1)).to.emit(voting, "Voted").withArgs(voter1.address, 1);
            expect((await voting.connect(voter1).getVoter(voter1.address)).votedProposalId).to.equal(1);
            expect((await voting.connect(voter1).getVoter(voter1.address)).hasVoted).to.equal(true);
        });
    });

    // ::::::::::::: STATE ::::::::::::: //
    describe("Workflow transitions", function () {

        describe("startProposalsRegistering", function () {

            it("should transition to ProposalsRegistrationStarted", async function () {
                await expect(voting.startProposalsRegistering()).to.emit(voting, "WorkflowStatusChange").withArgs(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
            });

            it("should push the GENESIS proposal", async function () {
                await voting.addVoter(voter1.address);
                await voting.startProposalsRegistering();
                const proposal = await voting.connect(voter1).getOneProposal(0);
                expect(proposal.description).to.equal("GENESIS");
                expect(proposal.voteCount).to.equal(0);
            });
        });

        describe("endProposalsRegistering", function () {

            it("should transition to ProposalsRegistrationEnded", async function () {
                await voting.startProposalsRegistering();
                await expect(voting.endProposalsRegistering()).to.emit(voting, "WorkflowStatusChange").withArgs(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
            });

            it("should revert if workflow status is not ProposalsRegistrationStarted", async function () {
                await expect(voting.endProposalsRegistering()).to.be.revertedWith("Registering proposals havent started yet");
            });
        });
        
        describe("startVotingSession", function () {

            it("should transition to VotingSessionStarted", async function () {
                await voting.startProposalsRegistering();
                await voting.endProposalsRegistering();
                await expect(voting.startVotingSession()).to.emit(voting, "WorkflowStatusChange").withArgs(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
            });

            it("should revert if workflow status is not ProposalsRegistrationEnded", async function () {
                await expect(voting.startVotingSession()).to.be.revertedWith("Registering proposals phase is not finished");
            });
        });

        describe("endVotingSession", function () {

            it("should transition to VotingSessionEnded", async function () {
                await voting.startProposalsRegistering();
                await voting.endProposalsRegistering();
                await voting.startVotingSession();
                await expect(voting.endVotingSession()).to.emit(voting, "WorkflowStatusChange").withArgs(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
            });

            it("should revert if workflow status is not VotingSessionStarted", async function () {
                await expect(voting.endVotingSession()).to.be.revertedWith("Voting session havent started yet");
            });
        });

        describe("tallyVotes", function () {
            it("should revert if workflow status is not VotingSessionEnded", async function () {
                await expect(voting.tallyVotes()).to.be.revertedWith("Current status is not voting session ended");
            });

            it("should correctly tally votes and determine the winning proposal", async function () {
                await voting.addVoter(voter1.address);
                await voting.addVoter(voter2.address);
                await voting.startProposalsRegistering();
                await voting.connect(voter1).addProposal("Proposal 1");
                await voting.connect(voter2).addProposal("Proposal 2");
                await voting.endProposalsRegistering();
                await voting.startVotingSession();
                await voting.connect(voter1).setVote(1);
                await voting.connect(voter2).setVote(1);
                await voting.endVotingSession();
                await expect(voting.tallyVotes()).to.emit(voting, "WorkflowStatusChange").withArgs(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
                expect(await voting.winningProposalID()).to.equal(1); // Assuming Proposal 1 wins with 2 vote
            });
        });
    })

});