# 🤝 splitpool

> For anyone tired of the _"kamu duluan deh"_ & _"I forgot my wallet"_ conversation.
> Urunan adil tanpa drama — split tagihan, validasi nota pakai AI, duit nganggur tetap cuan. Trustless & automated on Ethereum. 🤝

---

## ✨ Features

- **Shared Expense Pool** — deposit iuran bulanan bersama ke satu smart contract
- **Spending Limit per User** — setiap user hanya bisa klaim maksimal sebesar deposit mereka sendiri
- **Claim & Refund** — ajukan pengeluaran, upload bukti nota, dapat refund otomatis setelah diapprove
- **AI Receipt Validation** _(coming soon)_ — AI cek otomatis kevalidan nota: tanggal, nominal, bukti transfer
- **No-Loss Protocol** _(coming soon)_ — saldo idle di-deposit ke Aave, dapat yield, pokok tetap aman
- **Monthly Reset** — jatah spending reset tiap bulan baru

---

## 🏗️ Architecture

```
[User1 + User2]
      │
      ▼ deposit ETH/USDC
[SharedPool.sol]
      │
      ├──▶ [No-Loss Protocol - Aave] ← yield on idle funds
      │
      └──▶ [Claim Flow]
                │
                ▼
          User upload nota → AI validasi (Gemini)
                │
                ▼
          Smart contract auto-transfer ke user
                │
                ▼
          Sisa saldo → tetap di pool (tabungan)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity ^0.8.19 |
| Contract Framework | Foundry (forge, anvil, cast) |
| Frontend | React + Vite |
| Wallet Integration | ethers.js v6 + MetaMask |
| AI Validation | Google Gemini API (free tier) |
| Testnet | Ethereum Sepolia |
| Storage | IPFS (receipt images) |

---

## 📂 Project Structure

```
splitpool/
├── src/
│   └── SharedPool.sol        # Main smart contract
├── test/
│   └── SharedPool.t.sol      # Foundry tests
├── script/
│   └── Deploy.s.sol          # Deploy script
├── frontend/                 # React app (coming soon)
│   ├── src/
│   │   ├── App.jsx
│   │   └── hooks/
│   │       └── useContract.js
│   └── package.json
├── foundry.toml
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

- [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) (Windows users)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js v20+](https://nodejs.org/)

### Installation

```bash
# Clone repo
git clone git@github.com:VincenImanuell/splitpool.git
cd splitpool

# Install Foundry dependencies
forge install
```

### Run Tests

```bash
# Run all tests
forge test

# Verbose output
forge test -vvv
```

### Deploy Locally (Anvil)

```bash
# Terminal 1 — start local testnet
anvil

# Terminal 2 — deploy contract
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Deploy to Sepolia

```bash
# Copy env example
cp .env.example .env
# Fill in your PRIVATE_KEY and SEPOLIA_RPC_URL

forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

---

## 📜 Smart Contract Breakdown

### `SharedPool.sol`

| Function | Description |
|---|---|
| `deposit()` | User deposit iuran bulanan ke pool |
| `submitClaim(amount, receiptHash)` | Ajukan klaim pengeluaran + bukti nota |
| `approveClaim(claimId)` | Member lain approve klaim (auto-transfer setelah approve) |
| `startNewMonth()` | Reset jatah spending bulan baru (dipanggil manual) |
| `remainingQuota(address)` | Cek sisa jatah klaim user bulan ini |
| `getMonthlyInfo(address)` | Info lengkap deposited/spent/remaining bulan ini |
| `getPoolBalance()` | Total saldo pool saat ini |

### Spending Limit Logic

```
Jatah user = total deposit user bulan ini
Klaim disetujui hanya jika: spent + amount <= deposited

Contoh:
- User1 deposit 0.01 ETH → jatah = 0.01 ETH
- User1 klaim 0.006 ETH → sisa jatah = 0.004 ETH
- User1 klaim lagi 0.006 ETH → ❌ DITOLAK (melebihi jatah)
- Solusi: top up dulu berdua
```

---

## 🗺️ Roadmap

- [x] Smart contract dasar (deposit, claim, spending limit)
- [x] Foundry tests
- [ ] Deploy script + Sepolia deployment
- [ ] React frontend + MetaMask integration
- [ ] AI receipt validation (Gemini)
- [ ] No-loss protocol (Aave Sepolia)
- [ ] Multi-member pool (lebih dari 2 orang)
- [ ] Custom split percentage (bukan hanya 50/50)

---

## ⚠️ Disclaimer

This project is for learning purposes. Not audited. Do not use with real funds.

---

## 👨‍💻 Made by

[Vincen Imanuel](https://github.com/VincenImanuell) & Claude (Anthropic) 🤝
