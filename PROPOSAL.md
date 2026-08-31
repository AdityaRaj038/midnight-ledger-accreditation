# PROPOSAL: Midnight Ledger Accreditation

## 1. What the product is and who uses it
Midnight Ledger Accreditation is a confidential DeFi and investor accreditation platform. It allows users (investors) to seamlessly prove their accredited status (by income, net worth, or entity status) without revealing their underlying sensitive financial data. The primary users are everyday investors who want to participate in regulated DeFi platforms, and the DeFi platforms themselves (dApps) which need to verify accreditation status legally.

## 2. Why Midnight specifically?
Midnight provides the perfect balance of programmable data protection and transparency. To perform accreditation, we must verify highly sensitive user data (like exact net worth or income). On a public ledger, this data would be exposed to the world, creating severe privacy and security risks. On Midnight, we can use zero-knowledge proofs via the Compact language to prove that a user meets the financial thresholds for accreditation, while keeping the actual financial figures completely private. Only the *proof* of accreditation is recorded on the public ledger.

## 3. Data Model (Public State, Private Witness, Disclosure)
- **Public State**: The ledger stores a mapping of user addresses to their current accreditation status (e.g., `is_accredited: true`, `accreditation_type`, and `expiry_date`).
- **Private Witness**: The user's actual financial data, such as their exact income, net worth, or asset holdings, remains off-chain in their local wallet/storage. This data acts as the private witness during the zero-knowledge circuit execution.
- **Disclosure**: The zero-knowledge circuit consumes the private witness and outputs a boolean/status indicating whether the user meets the accreditation threshold. The application discloses the result of this computation to the network without disclosing the underlying numbers.

## 4. Scope Feasibility for Mainnet by Level 6
The scope of this MVP is highly feasible for Mainnet deployment by Level 6. The core business logic relies on a relatively straightforward set of zero-knowledge checks (e.g., comparing private income against a public threshold). We have already implemented the foundational Compact contracts and state transitions. The remaining work involves finalizing the frontend SDK integration (Lace wallet connect, local proof generation) and conducting thorough testnet deployments, which easily fits within the timeline.
