# Tests Unitaires - Smart Contract Voting

Ce projet contient la suite de tests unitaires pour le smart contract `Voting.sol`. Les tests sont écrits en **TypeScript** en utilisant l'environnement **Hardhat**, **Ethers.js (v6)** et **Chai**.

## 🛠 Prérequis et Installation

Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé sur votre machine.

1. Cloner le dépôt.
2. Installer les dépendances du projet :
   ```bash
   npm install
   ```
3. Compiler les contrats :
    ```bash
    npx hardhat compile
    ```
4. Lancer la suite de tests
    ```bash
    npx hardhat test
    ```

## 📊 Couverture et Architecture des Tests

Le fichier de test (Voting.ts) simule le cycle de vie complet d'une élection. Il est structuré de manière logique pour vérifier les permissions, les transitions d'états et la logique métier.

1. Déploiement (Deployment)
Vérifie que le déployeur est bien assigné comme administrateur (owner).

Vérifie que le statut initial du contrat est bien RegisteringVoters.

2. Enregistrement des Votants (addVoter)
Sécurité : Seul l'administrateur (owner) peut ajouter un votant (vérification de l'erreur OwnableUnauthorizedAccount).

Chronologie : L'ajout est bloqué si la phase RegisteringVoters est fermée.

Unicité : Un votant ne peut pas être enregistré deux fois.

Événement : L'événement VoterRegistered est correctement émis.

3. Enregistrement des Propositions (addProposal)
Accès : Seuls les votants préalablement enregistrés peuvent faire une proposition.

Chronologie : Les propositions sont bloquées en dehors de la phase ProposalsRegistrationStarted.

Validité : Les descriptions vides ("") sont rejetées.

Intégrité : La proposition est correctement stockée et l'événement ProposalRegistered est émis.

4. Session de Vote (setVote)
Accès : Réservé aux votants enregistrés.

Chronologie : Le vote est impossible en dehors de la phase VotingSessionStarted.

Règle de l'élection : Un votant ne peut voter qu'une seule fois.

Cohérence : Impossible de voter pour un ID de proposition inexistant.

Enregistrement : Le vote incrémente le compteur de la proposition, met à jour le profil du votant et émet l'événement Voted.

5. Transitions d'États et Dépouillement (Workflow transitions)
Les tests s'assurent du bon déroulement séquentiel imposé par l'administrateur :

Début de l'enregistrement des propositions : Vérifie l'émission de l'événement et valide l'insertion automatique de la proposition par défaut GENESIS à l'index 0.

Fin de l'enregistrement des propositions : Vérification de la restriction du statut précédent.

Début de la session de vote : Vérification du passage au statut VotingSessionStarted.

Fin de la session de vote : Vérification de la clôture des votes.

Dépouillement (tallyVotes) :

N'est exécutable qu'à la toute fin (VotingSessionEnded).

Détermine avec précision la proposition gagnante en fonction du décompte des voix et met à jour la variable winningProposalID.