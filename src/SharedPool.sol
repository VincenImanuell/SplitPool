// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SharedPool {

    // ── STATE VARIABLES ──────────────────────────────
    address public owner1;
    address public owner2;
    uint256 public monthlyDue;
    uint256 public poolBalance;
    uint256 public claimCounter;
    uint256 public currentMonth;    // bulan ke-berapa (increment manual)

    // ── TRACKING PER BULAN ───────────────────────────
    // address => bulan => jumlah
    mapping(address => mapping(uint256 => uint256)) public depositedPerMonth;
    mapping(address => mapping(uint256 => uint256)) public spentPerMonth;

    // ── DATA STRUCTURES ──────────────────────────────
    struct Claim {
        uint256 id;
        address requester;
        uint256 amount;
        string receiptHash;
        bool approved;
        bool paid;
        uint256 month;      // klaim di bulan ke-berapa
    }

    mapping(uint256 => Claim) public claims;

    // ── EVENTS ───────────────────────────────────────
    event Deposited(address indexed by, uint256 amount, uint256 month);
    event ClaimSubmitted(uint256 indexed claimId, address by, uint256 amount);
    event ClaimApproved(uint256 indexed claimId);
    event ClaimPaid(uint256 indexed claimId, address to, uint256 amount);
    event NewMonthStarted(uint256 month);

    // ── CONSTRUCTOR ───────────────────────────────────
    constructor(address _owner1, address _owner2, uint256 _monthlyDue) {
        owner1 = _owner1;
        owner2 = _owner2;
        monthlyDue = _monthlyDue;
        currentMonth = 1;
    }

    // ── MODIFIERS ─────────────────────────────────────
    modifier onlyMembers() {
        require(
            msg.sender == owner1 || msg.sender == owner2,
            "Bukan anggota pool"
        );
        _;
    }

    modifier onlyOwner1() {
        require(msg.sender == owner1, "Hanya owner1");
        _;
    }

    // ── FUNCTIONS ─────────────────────────────────────

    // Mulai bulan baru (dipanggil manual oleh owner1)
    function startNewMonth() external onlyOwner1 {
        currentMonth++;
        emit NewMonthStarted(currentMonth);
    }

    // User deposit iuran bulanan
    function deposit() external payable onlyMembers {
        require(msg.value > 0, "Amount harus > 0");

        poolBalance += msg.value;
        depositedPerMonth[msg.sender][currentMonth] += msg.value;

        emit Deposited(msg.sender, msg.value, currentMonth);
    }

    // Cek jatah sisa user di bulan ini
    function remainingQuota(address _user) public view returns (uint256) {
        uint256 deposited = depositedPerMonth[_user][currentMonth];
        uint256 spent = spentPerMonth[_user][currentMonth];
        if (spent >= deposited) return 0;
        return deposited - spent;
    }

    // User ajukan klaim pengeluaran
    function submitClaim(uint256 _amount, string calldata _receiptHash)
        external onlyMembers
    {
        require(_amount > 0, "Amount harus > 0");
        require(_amount <= poolBalance, "Saldo pool tidak cukup");
        require(_amount <= remainingQuota(msg.sender), "Melebihi jatah bulan ini");

        claims[claimCounter] = Claim({
            id: claimCounter,
            requester: msg.sender,
            amount: _amount,
            receiptHash: _receiptHash,
            approved: false,
            paid: false,
            month: currentMonth
        });

        emit ClaimSubmitted(claimCounter, msg.sender, _amount);
        claimCounter++;
    }

    // Approve klaim (member lain yang approve)
    function approveClaim(uint256 _claimId) external onlyMembers {
        Claim storage claim = claims[_claimId];
        require(!claim.approved, "Sudah diapprove");
        require(claim.requester != msg.sender, "Tidak bisa approve klaim sendiri");

        claim.approved = true;
        emit ClaimApproved(_claimId);

        _payClaim(_claimId);
    }

    // Internal: transfer dana ke requester
    function _payClaim(uint256 _claimId) internal {
        Claim storage claim = claims[_claimId];
        require(claim.approved, "Belum diapprove");
        require(!claim.paid, "Sudah dibayar");
        require(poolBalance >= claim.amount, "Saldo tidak cukup");

        claim.paid = true;
        poolBalance -= claim.amount;
        spentPerMonth[claim.requester][claim.month] += claim.amount;

        (bool success, ) = claim.requester.call{value: claim.amount}("");
        require(success, "Transfer gagal");

        emit ClaimPaid(_claimId, claim.requester, claim.amount);
    }

    // View saldo pool
    function getPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // View info bulan ini per user
    function getMonthlyInfo(address _user) external view returns (
        uint256 deposited,
        uint256 spent,
        uint256 remaining
    ) {
        deposited = depositedPerMonth[_user][currentMonth];
        spent = spentPerMonth[_user][currentMonth];
        remaining = remainingQuota(_user);
    }
}