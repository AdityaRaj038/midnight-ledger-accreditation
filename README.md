# Midnight Ledger — Accreditation (Zeed)

[![Midnight Project CI/CD](https://github.com/AdityaRaj038/midnight-ledger-accreditation/actions/workflows/ci.yml/badge.svg)](https://github.com/AdityaRaj038/midnight-ledger-accreditation/actions)

Confidential DeFi & investor accreditation fundraising platform on Midnight

## Initial Product Idea

Midnight Ledger — Accreditation addresses critical privacy requirements in Web3 applications by leveraging Midnight's zero-knowledge selective disclosure framework. The system allows users and institutions to prove compliance, eligibility, and state transitions without exposing sensitive underlying records or private inputs to the public blockchain.

## Privacy Model (Public State vs. Private Witness)

* **Public State (On-Chain Anchor)**:
  * Contract state commitments, Merkle roots, and update counters stored immutably on Midnight Preprod.
  * Zero-knowledge proof verification tokens enabling anyone to independently verify valid operations.
* **Private Witness (Off-Chain Data)**:
  * Full medical details, identity attributes, financial amounts, and internal policy rules remain local on the user's client device.
  * Nullifiers and commitments ensure single-use proof integrity without revealing user identity or payload data.

## Verified Contract Deployment

* **Network**: Midnight Preprod Testnet
* **Contract Address**: `0x021774c88219e9947192847561288b812a44`
* **Live Demo Link**: [https://midnight-ledger-accreditation.vercel.app](https://midnight-ledger-accreditation.vercel.app)
* **Product X Profile**: [https://x.com/midnightledger](https://x.com/midnightledger)

## Requirements & Setup Instructions

### Prerequisites
* Node.js v20+ & npm / pnpm
* Compact CLI v0.5.1+
* Midnight Lace Wallet (Preprod extension)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/AdityaRaj038/midnight-ledger-accreditation.git
cd midnight-ledger-accreditation

# 2. Install dependencies
npm install

# 3. Run contract compilation
npm run compile-contracts

# 4. Run test suite (3+ tests passing)
npm test

# 5. Launch local dev environment
npm run dev
```
