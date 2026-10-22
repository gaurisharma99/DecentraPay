# DecentraPay

**A Blockchain-Based Secure Cryptocurrency Transaction System Using Smart Contracts**

A Web3 peer-to-peer ETH payment DApp built with React, Ethers.js, Solidity, and Hardhat. This project is the implementation of the B.Tech project synopsis (Project Id: 2023CSEPID47).

## What it does

DecentraPay lets users send cryptocurrency (ETH) to anyone with an Ethereum wallet. A Solidity smart contract **validates, executes, and records** every transfer on-chain in a **single transaction**, so the sender only signs once via MetaMask. Each payment carries an optional message and is permanently stored in an immutable, transparent ledger.

## Tech Stack

**Active frontend** (`Web3_smart_transaction/client/`)
- React 17 + Vite 2 (original adrianhajdin/Krypt UI, kept as-is)
- Tailwind CSS 2
- ethers.js v5
- react-icons
- Wired to the **DecentraPay** contract (single payable `sendPayment`)

**Legacy frontend** (`frontend/`) — kept for reference
- React 18 + Vite 5
- Tailwind CSS 3
- Framer Motion
- ethers.js v6

**Backend** (`backend/`)
- Solidity 0.8.19
- Hardhat 2
- @nomicfoundation/hardhat-ethers + hardhat-chai-matchers

**Blockchain**: Ethereum · **Wallet**: MetaMask

## Demo Login (temporary)

The app is currently gated behind a **demo login screen** for presentation access:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `decentrapay2026` |

Credentials live in `frontend/src/utils/credentials.js` — change them there.

> **Note:** the demo login gate lives in the **legacy** `frontend/` only. The
> active frontend (`Web3_smart_transaction/client/`) has no login screen — it
> connects the wallet directly.

> ⚠️ **This is not real authentication.** Client-side credentials are visible in
> browser dev tools, so this gate is cosmetic only. The real access control for
> DecentraPay is the user's MetaMask wallet and the smart contract. The login
> state persists in `localStorage`; use **Logout** in the navbar to reset.

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or another web3 wallet

### 1. Install dependencies

```bash
# Install backend (smart contract) dependencies
cd backend
npm install

# Install the active frontend dependencies
cd ../Web3_smart_transaction/client
npm install
```

To run the legacy frontend instead, `cd frontend && npm install`.

### 2. Start a local blockchain

```bash
cd backend
npx hardhat node
```

Keep this terminal running. It will print 20 test accounts with private keys.

### 3. Deploy the contract (new terminal)

```bash
cd backend
npx hardhat run scripts/deploy.js --network localhost
```

> Note: use `--network localhost` while the hardhat node from step 2 is running.
> Deploying to the in-process `hardhat` network works too, but the state is lost
> when the command exits, so the frontend won't see it.

Copy the deployed contract address and update
`Web3_smart_transaction/client/src/utils/constants.js` (and
`frontend/src/utils/constants.js` if you run the legacy frontend):

```js
export const contractAddress = 'YOUR_DEPLOYED_ADDRESS';
```

### 4. Import a test account to MetaMask

From the Hardhat node output, copy one of the private keys and import it to MetaMask:
- Network: Localhost 31337 (Chain ID: 31337)
- Or use the Hardhat network in MetaMask with RPC URL: http://127.0.0.1:8545

### 5. Run the frontend

```bash
cd Web3_smart_transaction/client
npm run dev
```

Open http://localhost:3000

> The legacy frontend runs on port 5173 instead (`cd frontend && npm run dev`).

## Project Structure

```
decentrapay/
├── backend/
│   ├── contracts/
│   │   └── DecentraPay.sol      # Validates, executes & records ETH transfers
│   ├── scripts/
│   │   └── deploy.js            # Deployment script
│   ├── test/
│   │   └── DecentraPay.test.js  # 11 tests: execution, validation, events
│   └── hardhat.config.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx         # Demo login screen
│   │   │   ├── Navbar.jsx       # Nav + wallet status + logout
│   │   │   ├── Hero.jsx         # Payment form (address, amount, message)
│   │   │   ├── Features.jsx
│   │   │   ├── PaymentHistory.jsx  # On-chain transaction history
│   │   │   ├── Footer.jsx
│   │   │   └── Loader.jsx
│   │   ├── context/
│   │   │   ├── PaymentsContext.jsx  # Web3 state management
│   │   │   └── AuthContext.jsx      # Demo login state
│   │   ├── utils/
│   │   │   ├── constants.js     # Contract ABI & address
│   │   │   ├── credentials.js   # Demo login credentials (cosmetic gate)
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
│
└── README.md
```

## Smart Contract API

**DecentraPay.sol**

| Function | Description |
|----------|-------------|
| `sendPayment(receiver, message)` *(payable)* | Validate, execute the ETH transfer, and record it on-chain in one call |
| `fetchAllPayments()` | Get all recorded payments |
| `totalPayments()` | Get the count of payments |
| `getContractBalance()` | Contract ETH balance (always 0 — funds are forwarded) |

**Events**
- `PaymentRecorded(from, to, amount, message, timestamp)`

**Built-in validation**
- Rejects the zero address as receiver
- Rejects payments to yourself
- Rejects zero-value transfers
- Rejects messages longer than 256 characters

## How It Works

1. User opens the DecentraPay application
2. User connects the MetaMask wallet (wallet connection status shown in the navbar)
3. User enters the receiver's wallet address, the amount, and an optional message
4. User confirms the transaction through **one** MetaMask prompt
5. The smart contract validates the request, executes the ETH transfer, and records the details on-chain
6. The updated transaction history is displayed to the user

## Running the Tests

### Smart contract tests

```bash
cd backend
npx hardhat test
```

Covers: ETH execution to the receiver, contract holds no funds, payment storage, empty messages, event emission, and all four validation reverts.

### Browser end-to-end test

Drives the real frontend in headless Chrome: logs in through the demo gate
(checks both wrong- and correct-password paths), connects the wallet, submits a
payment through the form, and independently verifies the on-chain result.

```bash
# Start the node, deploy, and run the frontend first (steps 2, 3, 5 above), then:
cd e2e
npm install
npm test
```

Requires Google Chrome installed. It injects a lightweight wallet provider that
proxies to the local Hardhat node (in place of MetaMask) and asserts 15 checks,
including that the receiver's ETH balance actually increases and that
self-payment is blocked.

There is also a wrong-network test that simulates MetaMask being on the wrong
chain and asserts the app shows a banner with a one-click switch:

```bash
npm run test:network
```

## MetaMask Behaviour

- **Wrong network** — if MetaMask is on any chain other than Hardhat Local
  (31337), a banner appears with a **Switch network** button, and the send
  button becomes **Switch to Hardhat Network**. Payments are blocked until the
  network is correct. The switch uses `wallet_switchEthereumChain`, falling back
to `wallet_addEthereumChain` if the network isn't added yet.
- **No wallet** — if MetaMask isn't installed, a banner links to the download page.
- **Live sync** — the app listens for MetaMask's `accountsChanged` and
  `chainChanged` events, so switching account or network updates the UI
  immediately (and disconnecting clears the session).

## Deploying to Sepolia Testnet

1. Create a `.env` file in `backend/`:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

2. Uncomment the sepolia config in `backend/hardhat.config.js`

3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. Update the contract address in `frontend/src/utils/constants.js`

5. Get Sepolia ETH from a faucet for testing

## Future Enhancements

- Multi-chain blockchain support
- Integration with DeFi services
- QR code-based cryptocurrency payments
- Mobile application development
- Layer-2 solutions for reduced fees and improved scalability

## License

MIT
