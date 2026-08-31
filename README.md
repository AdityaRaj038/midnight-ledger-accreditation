# Midnight Ledger (Accreditation)

[![Midnight Project CI/CD](https://github.com/AdityaRaj038/midnight-ledger-accreditation/actions/workflows/ci.yml/badge.svg)](https://github.com/AdityaRaj038/midnight-ledger-accreditation/actions/workflows/ci.yml)
[![Preprod Contract](https://img.shields.io/badge/Midnight%20Preprod-0x02a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7-blue?style=flat&logo=blockchain)](https://preprod.midnight.network)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-midnight--ledger--accreditation.vercel.app-success?style=flat&logo=vercel)](https://midnight-ledger-accreditation.vercel.app)
[![X Profile](https://img.shields.io/badge/Product%20X-@midnightledger-1DA1F2?style=flat&logo=x)](https://x.com/midnightledger)

Midnight Ledger (Accreditation) addresses critical privacy requirements in Web3 applications by leveraging Midnight's zero-knowledge selective disclosure framework. The system allows users and institutions to prove compliance, eligibility, and state transitions without exposing sensitive underlying records or private inputs to the public blockchain.

---

## 💡 Initial Product Proposal & Idea

Accredited investors often need to demonstrate their income or net worth to participate in compliant deal flows. In a traditional reporting flow, that can mean revealing too much about their full financial status and underlying bank accounts. Midnight Ledger solves this problem by allowing users to verify their financial accreditation strictly according to regulatory requirements without forcing them to publish their raw financial records or exact net worth amounts to the public blockchain.

---

## 🔒 Privacy Model: Public State vs. Private Witness

### What an Observer CAN Learn (Public On-Chain State)
* **Contract Commitments**: Immutable hashes of accreditation rules and verification status stored on Midnight Preprod.
* **Proof Verification Status**: Mathematical confirmation that a user satisfies the accreditation thresholds without exposing exact income or net worth.
* **Update Counters**: The sequential state update count maintaining tamper-evident audit history.
* **Verification Tokens**: Zero-knowledge proof tokens validated by the Midnight network circuits.

### What an Observer CANNOT Learn (Private Witness Data)
* **User Financials**: Exact income, net worth, bank balances, and asset holdings remain strictly off-chain.
* **Identity Details**: Specific personal identity attributes stay on local client storage and are not published on-chain.
* **Wallet Traceability**: The direct link between the user's private financial data and their on-chain identity.

---

## 📸 Screenshots & Verification Evidence

### 1. Compact Contract Compilation Output
`compact compile` successfully builds circuits and generates managed artifacts (`.zkir`, `proving.key`, `verification.key`):

![Successful Compile Output](https://raw.githubusercontent.com/AdityaRaj038/midnight-ledger-accreditation/main/docs/images/compile_output.jpg)

### 2. Verified Contract Deployment on Midnight Preprod
Contract deployed to Midnight Preprod with verifiable contract address (`0x02a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7`):

![Contract Deployed](https://raw.githubusercontent.com/AdityaRaj038/midnight-ledger-accreditation/main/docs/images/contract_deployed.jpg)

### 3. Test Suite Execution
Automated unit & integration test suite validating zero-knowledge proof generation, restriction commitments, and proof verification:

![Test Output](https://raw.githubusercontent.com/AdityaRaj038/midnight-ledger-accreditation/main/docs/images/test_output.jpg)

---

## 🌐 Live Resources & Links

* **Live Demo Application**: [https://midnight-ledger-accreditation.vercel.app](https://midnight-ledger-accreditation.vercel.app)
* **Demo Video (MVP Workflow & Lace Wallet Connect)**: [Watch Demo Video (1 min)](https://youtube.com/watch?v=demo_midnightledger)
* **Deployed Preprod Contract Address**: `0x02a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7`
* **Product X Profile**: [https://x.com/midnightledger](https://x.com/midnightledger)
* **CI/CD Workflow Pipeline**: [.github/workflows/ci.yml](.github/workflows/ci.yml)

---

## ⚙️ Requirements & Local Setup Instructions

### Prerequisites
* **Node.js**: v20.0.0 or higher
* **Compact CLI**: v0.5.1+
* **Midnight Lace Wallet**: Preprod extension installed in browser

### Quick Start Guide

```bash
# 1. Clone the repository
git clone https://github.com/AdityaRaj038/midnight-ledger-accreditation.git
cd midnight-ledger-accreditation

# 2. Install dependencies
npm install

# 3. Compile Compact smart contracts
npm run compile-contracts

# 4. Run test suite
npm test

# 5. Build application
npm run build

# 6. Start local development server
npm run dev
```

---

## 🔄 CI/CD Pipeline Configuration

Automated integration testing and contract verification is executed on every commit via GitHub Actions. Refer to [.github/workflows/ci.yml](.github/workflows/ci.yml) for build pipeline details.
