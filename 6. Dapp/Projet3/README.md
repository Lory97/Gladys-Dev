# Projet 3 - Voting DApp (Alyra)

Bienvenue sur le Projet 3 du cursus Développeur Blockchain d'Alyra. Ce projet consiste en la réalisation d'une application décentralisée (DApp) de vote complète, avec un smart contract Solidity en back-end et une interface utilisateur en front-end.

## 📋 Présentation du Projet

Cette DApp permet à un administrateur d'organiser un vote au sein d'une organisation de manière transparente et sécurisée sur la blockchain Ethereum (ou compatible EVM). Le processus de vote se déroule selon différentes étapes (workflow) contrôlées exclusivement par l'administrateur.

### Fonctionnalités Principales :
1. **Enregistrement des votants** (Whitelist) : Seules les adresses enregistrées par l'administrateur peuvent participer.
2. **Enregistrement des propositions** : Les votants peuvent soumettre des propositions pendant la session dédiée.
3. **Session de vote** : Les votants peuvent voter pour leur proposition préférée uniquement pendant la session de vote.
4. **Dépouillement** : L'administrateur clôture le vote et comptabilise la ou les propositions gagnantes de manière décentralisée.

---

## 🏗️ Architecture du Projet

Le dépôt est divisé en deux parties majeures :

### 1. `back` (Smart Contract & Environnement Hardhat)
- **Technologies** : Solidity, Hardhat, Ethers.js, Chai/Mocha
- **Description** : Contient le contrat `Voting.sol` et les scripts de déploiement (Ice/Ignition). Vous y trouverez la logique complète, les contraintes d'accès (`require`), ainsi que des tests unitaires complets garantissant la sécurité et le bon fonctionnement du contrat de vote.

### 2. `front/voting-app` (Interface Utilisateur)
- **Technologies** : React (Next.js v15/v14), Tailwind CSS, Wagmi v2/v3, Viem, Reown AppKit, ShadCN UI, Lucide React.
- **Description** : Application front-end moderne permettant l'interaction avec le contrat de vote. L'interface propose des vues dynamiques (Admin Panel & Voter Panel) qui s'adaptent conditionnellement selon le rôle de l'utilisateur détecté par sa connexion via Web3. L'UI a été récemment refondue pour offrir une expérience plus colorée et ergonomique.

---

## 🚀 Installation & Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (Version récente recommandée)
- Un wallet Web3 comme [MetaMask](https://metamask.io/) ou similaire configuré.

### Partie Back-end (Hardhat)

Si vous souhaitez exécuter le projet localement avec Hardhat :

1. Depuis la racine du projet, rendez-vous dans le répertoire `back` :
   ```bash
   cd back
   ```
2. Installez les dépendances nécessaires :
   ```bash
   npm install
   ```
3. Compilez les contrats intelligents :
   ```bash
   npx hardhat compile
   ```
4. Démarrez un nœud Hardhat local :
   ```bash
   npx hardhat node
   ```
5. Dans un nouveau terminal avec le nœud tournant en fond, déployez le contrat :
   ```bash
   npx hardhat ignition deploy ignition/modules/Voting.ts --network localhost
   ```
   *(Pensez à adapter le nom du script de déploiement s'il diffère et copiez l'adresse générée).*

### Partie Front-end (Interface React)

1. Rendez-vous dans le répertoire du front-end :
   ```bash
   cd front/voting-app
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configuration et Lancement :
   - Assurez-vous que l'adresse du contrat (dans `src/constants/contract.ts`) correspond bien à celle de votre contrat déployé sur le réseau ciblé (Localhost ou testnet comme Sepolia).
   - Lancez le serveur de développement local :
     ```bash
     npm run dev
     ```
4. Accédez à l'application depuis votre navigateur à l'adresse **`http://localhost:3000`** et connectez votre wallet.

---

## 🧪 Lancer les tests du contrat

Les tests unitaires du smart contract couvrent tous les cas d'utilisation possibles et vérifient l'intégrité de la logique et de la sécurité des fonctions.

Dans le répertoire `back`, exécutez la commande suivante pour lancer les tests :

```bash
npx hardhat test
```

Afin de vérifier le taux de couverture des tests (Coverage) :

```bash
npx hardhat coverage
```

---

## 💡 Choix Techniques et Améliorations
- **Refonte UI/UX** : L'interface utilisateur DApp a été modernisée, en passant d'un style brut à un design très soigné et très professionnel (couleurs vibrantes, gestion des états, animations) tout en utilisant des bibliothèques reconnues telles que **Shadcn** et **Tailwind**.
- **Wallet Connection** : Remplacement de bibliothèques basiques par du **Wagmi** + **Reown AppKit** offrant de meilleures performances, une compatibilité accrue avec différents portefeuilles et une expérience utilisateur Web3 fluide.
- **Organisation Modulaire** : Architecture claire séparant scrupuleusement le back-end de présentation avec Next.js, permettant un code beaucoup plus maintenable et lisible (utilisation active de TypeScript).

---

## 🤖 Prompt Antigravity Gemini 3.1 Pro
**Rôle et Contexte** : Tu es un Développeur Full Stack Web3 expert en React, Next.js et intégration de Smart Contracts. Ta mission est de créer les composants front-end d'une DApp de vote (voting-app) dans un dossier /components, en te basant sur le contrat intelligent Voting.sol présent dans mon espace de travail.
**Stack Technique et Règles** :
- **Framework** : Next.js (utiliser l'App Router) et TypeScript.
- **UI/Design** : Tailwind CSS et composants Shadcn. Le style global doit être clair, épuré, minimaliste et professionnel.
- **Web3** : Utiliser Reown pour la connexion du wallet (en s’appuyant sur la documentation : https://docs.reown.com/). Utiliser wagmi/viem pour interagir avec le contrat.
- **Architecture** : Respecter les bonnes pratiques React/Next.js en séparant la logique d'interaction blockchain (hooks) de l'affichage pur.
- **Fonctionnalités Requises** :
  - **Gestion de connexion** : Bouton de connexion Reown fonctionnel.
  - **Vues publiques** : N'importe quel utilisateur connecté doit pouvoir consulter le résultat final une fois le vote terminé.
  - **Actions Administrateur (Owner)** : Interface dédiée permettant d'enregistrer une liste blanche d'électeurs, de commencer/terminer la session d'enregistrement des propositions, de commencer/terminer la session de vote, et de comptabiliser les votes.
  - **Actions Électeurs (Whitelistés)** : Interface permettant d'enregistrer des propositions pendant la session adéquate, et de voter pour leur proposition préférée lors de la session de vote.
- **Expérience Utilisateur (UX)** :
  - **Prévoir des états de chargement (loaders)** pendant l'attente des validations de transactions sur la blockchain locale.
  - **Implémenter des retours visuels (toasts ou alertes via Shadcn)** pour confirmer le succès des actions ou afficher les erreurs (ex: "Vous avez déjà voté", "Non autorisé").


---

## 👨‍💻 Auteur
Projet réalisé dans le cadre de la certification Développeur d'Application Blockchains d'**Alyra**.
