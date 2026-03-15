import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Contract address hasil deploy Anvil tadi
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI — fungsi yang mau kita pakai dari contract
const ABI = [
  "function deposit() external payable",
  "function getPoolBalance() external view returns (uint256)",
  "function submitClaim(uint256 _amount, string calldata _receiptHash) external",
  "function approveClaim(uint256 _claimId) external",
  "function remainingQuota(address _user) public view returns (uint256)",
  "function getMonthlyInfo(address _user) external view returns (uint256, uint256, uint256)",
  "function currentMonth() external view returns (uint256)",
  "event Deposited(address indexed by, uint256 amount, uint256 month)",
  "event ClaimSubmitted(uint256 indexed claimId, address by, uint256 amount)",
  "event ClaimPaid(uint256 indexed claimId, address to, uint256 amount)",
];

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [poolBalance, setPoolBalance] = useState("0");
  const [remainingQuota, setRemainingQuota] = useState("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimId, setClaimId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Connect wallet
  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("❌ MetaMask / Rabby tidak ditemukan!");
      return;
    }

    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _account = await _signer.getAddress();
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, _signer);

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setAccount(_account);
      setStatus("✅ Wallet connected!");

      await fetchData(_contract, _account);
    } catch (err) {
      setStatus("❌ " + err.message);
    }
  }

  // Fetch data dari contract
  async function fetchData(_contract, _account) {
    try {
      const balance = await _contract.getPoolBalance();
      setPoolBalance(ethers.formatEther(balance));

      const quota = await _contract.remainingQuota(_account);
      setRemainingQuota(ethers.formatEther(quota));
    } catch (err) {
      console.error(err);
    }
  }

  // Deposit
  async function handleDeposit() {
    if (!contract || !depositAmount) return;
    setLoading(true);
    try {
      const tx = await contract.deposit({
        value: ethers.parseEther(depositAmount),
      });
      setStatus("⏳ Menunggu konfirmasi...");
      await tx.wait();
      setStatus("✅ Deposit berhasil!");
      await fetchData(contract, account);
    } catch (err) {
      setStatus("❌ " + err.message);
    }
    setLoading(false);
  }

  // Submit Claim
  async function handleSubmitClaim() {
    if (!contract || !claimAmount) return;
    setLoading(true);
    try {
      const tx = await contract.submitClaim(
        ethers.parseEther(claimAmount),
        "ipfs://placeholder"
      );
      setStatus("⏳ Menunggu konfirmasi...");
      await tx.wait();
      setStatus("✅ Klaim berhasil disubmit!");
      await fetchData(contract, account);
    } catch (err) {
      setStatus("❌ " + err.message);
    }
    setLoading(false);
  }

  // Approve Claim
  async function handleApproveClaim() {
    if (!contract || claimId === "") return;
    setLoading(true);
    try {
      const tx = await contract.approveClaim(Number(claimId));
      setStatus("⏳ Menunggu konfirmasi...");
      await tx.wait();
      setStatus("✅ Klaim diapprove & dana dikirim!");
      await fetchData(contract, account);
    } catch (err) {
      setStatus("❌ " + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#00d4ff" }}>
          🤝 splitpool
        </h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          Urunan adil tanpa drama
        </p>
      </div>

      {/* Connect Wallet */}
      {!account ? (
        <button
          onClick={connectWallet}
          style={{
            width: "100%",
            padding: "14px",
            background: "#00d4ff",
            color: "#000",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div
          style={{
            background: "#1e293b",
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 13, color: "#64748b" }}>Connected</p>
          <p style={{ fontSize: 14, fontFamily: "monospace", color: "#00d4ff" }}>
            {account}
          </p>
        </div>
      )}

      {/* Status */}
      {status && (
        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 14,
          }}
        >
          {status}
        </div>
      )}

      {account && (
        <>
          {/* Pool Info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: 20,
                textAlign: "center",
              }}
            >
              <p style={{ color: "#64748b", fontSize: 13 }}>Pool Balance</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#00d4ff" }}>
                {poolBalance} ETH
              </p>
            </div>
            <div
              style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: 20,
                textAlign: "center",
              }}
            >
              <p style={{ color: "#64748b", fontSize: 13 }}>Sisa Jatah</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>
                {remainingQuota} ETH
              </p>
            </div>
          </div>

          {/* Deposit */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: 10,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>💰 Deposit</h3>
            <input
              type="number"
              placeholder="Jumlah ETH (contoh: 0.01)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 14,
                marginBottom: 10,
              }}
            />
            <button
              onClick={handleDeposit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#00d4ff",
                color: "#000",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Loading..." : "Deposit"}
            </button>
          </div>

          {/* Submit Claim */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: 10,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>🧾 Submit Klaim</h3>
            <input
              type="number"
              placeholder="Jumlah ETH yang diklaim"
              value={claimAmount}
              onChange={(e) => setClaimAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 14,
                marginBottom: 10,
              }}
            />
            <button
              onClick={handleSubmitClaim}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Loading..." : "Submit Klaim"}
            </button>
          </div>

          {/* Approve Claim */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: 10,
              padding: 20,
            }}
          >
            <h3 style={{ marginBottom: 12, fontSize: 16 }}>✅ Approve Klaim</h3>
            <input
              type="number"
              placeholder="Claim ID (0, 1, 2, ...)"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 14,
                marginBottom: 10,
              }}
            />
            <button
              onClick={handleApproveClaim}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#10b981",
                color: "#000",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Loading..." : "Approve Klaim"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}