// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title ForenX Evidence Management Smart Contract
/// @notice Tamper-proof forensic evidence tracking on Ethereum
contract ForenXEvidence {

    // ─── Enums ──────────────────────────────────────────────────────────────
    enum EvidenceStatus { COLLECTED, IN_TRANSIT, AT_LAB, VERIFIED, TAMPERED, AT_POLICE, JUDICIAL_REVIEW, CLOSED }
    enum UserRole       { NONE, ADMIN, COLLECTOR, TRANSPORT, LAB, POLICE, JUDICIAL }

    // ─── Structs ─────────────────────────────────────────────────────────────
    struct Evidence {
        string  evidenceId;
        string  fileHash;       // SHA-256 of original file
        string  ipfsHash;       // IPFS CID
        string  sealId;         // Physical tamper seal ID
        string  digitalSignature;
        address owner;
        address originalCollector;
        uint256 timestamp;
        EvidenceStatus status;
        string  caseId;
        bool    exists;
    }

    struct TransferLog {
        address from;
        address to;
        uint256 timestamp;
        EvidenceStatus stage;
        string  notes;
    }

    struct LabReport {
        string  reportIpfsHash;
        string  reportFileHash;
        bool    tampered;
        address verifiedBy;
        uint256 timestamp;
    }

    // ─── State Variables ──────────────────────────────────────────────────────
    address public owner;
    mapping(string => Evidence)         private evidences;          // evidenceId => Evidence
    mapping(string => TransferLog[])    private transferLogs;       // evidenceId => logs[]
    mapping(string => LabReport)        private labReports;         // evidenceId => report
    mapping(address => UserRole)        public  userRoles;
    string[] private allEvidenceIds;

    // ─── Events ───────────────────────────────────────────────────────────────
    event EvidenceAdded(string indexed evidenceId, address indexed collector, uint256 timestamp);
    event EvidenceTransferred(string indexed evidenceId, address indexed from, address indexed to, EvidenceStatus stage);
    event EvidenceVerified(string indexed evidenceId, bool tampered, address verifiedBy);
    event RoleAssigned(address indexed user, UserRole role);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "ForenX: Not contract owner");
        _;
    }

    modifier evidenceExists(string memory _evidenceId) {
        require(evidences[_evidenceId].exists, "ForenX: Evidence not found");
        _;
    }

    modifier onlyCurrentOwner(string memory _evidenceId) {
        require(evidences[_evidenceId].owner == msg.sender, "ForenX: Not evidence owner");
        _;
    }

    modifier hasRole(UserRole _role) {
        require(userRoles[msg.sender] == _role || userRoles[msg.sender] == UserRole.ADMIN,
            "ForenX: Insufficient role");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        userRoles[msg.sender] = UserRole.ADMIN;
    }

    // ─── Role Management ──────────────────────────────────────────────────────
    function assignRole(address _user, UserRole _role) external onlyOwner {
        userRoles[_user] = _role;
        emit RoleAssigned(_user, _role);
    }

    function getRole(address _user) external view returns (UserRole) {
        return userRoles[_user];
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /// @notice Add new evidence to the blockchain
    function addEvidence(
        string memory _evidenceId,
        string memory _fileHash,
        string memory _ipfsHash,
        string memory _sealId,
        string memory _digitalSignature,
        string memory _caseId
    ) external {
        require(!evidences[_evidenceId].exists, "ForenX: Evidence ID already exists");
        require(bytes(_evidenceId).length > 0, "ForenX: Invalid evidence ID");
        require(bytes(_fileHash).length > 0, "ForenX: Invalid file hash");
        require(bytes(_ipfsHash).length > 0, "ForenX: Invalid IPFS hash");
        require(bytes(_sealId).length > 0, "ForenX: Invalid seal ID");

        evidences[_evidenceId] = Evidence({
            evidenceId:       _evidenceId,
            fileHash:         _fileHash,
            ipfsHash:         _ipfsHash,
            sealId:           _sealId,
            digitalSignature: _digitalSignature,
            owner:            msg.sender,
            originalCollector: msg.sender,
            timestamp:        block.timestamp,
            status:           EvidenceStatus.COLLECTED,
            caseId:           _caseId,
            exists:           true
        });

        allEvidenceIds.push(_evidenceId);

        // Log initial custody entry
        transferLogs[_evidenceId].push(TransferLog({
            from:      address(0),
            to:        msg.sender,
            timestamp: block.timestamp,
            stage:     EvidenceStatus.COLLECTED,
            notes:     "Evidence collected and registered"
        }));

        emit EvidenceAdded(_evidenceId, msg.sender, block.timestamp);
    }

    /// @notice Transfer evidence ownership (custody chain)
    function transferEvidence(
        string memory _evidenceId,
        address       _newOwner,
        EvidenceStatus _newStatus,
        string memory  _notes
    ) external evidenceExists(_evidenceId) onlyCurrentOwner(_evidenceId) {
        require(_newOwner != address(0), "ForenX: Invalid recipient");
        require(_newOwner != msg.sender,  "ForenX: Cannot transfer to self");

        address previousOwner = evidences[_evidenceId].owner;
        evidences[_evidenceId].owner  = _newOwner;
        evidences[_evidenceId].status = _newStatus;

        transferLogs[_evidenceId].push(TransferLog({
            from:      previousOwner,
            to:        _newOwner,
            timestamp: block.timestamp,
            stage:     _newStatus,
            notes:     _notes
        }));

        emit EvidenceTransferred(_evidenceId, previousOwner, _newOwner, _newStatus);
    }

    /// @notice Verify evidence integrity (called by Lab)
    function verifyEvidence(
        string memory _evidenceId,
        string memory _computedHash,
        string memory _reportIpfsHash,
        string memory _reportFileHash,
        bool          _tampered
    ) external evidenceExists(_evidenceId) {
        Evidence storage ev = evidences[_evidenceId];

        // Compare hashes
        bool hashMatch = keccak256(bytes(ev.fileHash)) == keccak256(bytes(_computedHash));
        bool actualTampered = _tampered || !hashMatch;

        ev.status = actualTampered ? EvidenceStatus.TAMPERED : EvidenceStatus.VERIFIED;

        labReports[_evidenceId] = LabReport({
            reportIpfsHash: _reportIpfsHash,
            reportFileHash: _reportFileHash,
            tampered:       actualTampered,
            verifiedBy:     msg.sender,
            timestamp:      block.timestamp
        });

        transferLogs[_evidenceId].push(TransferLog({
            from:      msg.sender,
            to:        msg.sender,
            timestamp: block.timestamp,
            stage:     ev.status,
            notes:     actualTampered ? "TAMPER DETECTED: Hash mismatch" : "Evidence verified - hash matches"
        }));

        emit EvidenceVerified(_evidenceId, actualTampered, msg.sender);
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getEvidence(string memory _evidenceId)
        external view evidenceExists(_evidenceId)
        returns (Evidence memory)
    {
        return evidences[_evidenceId];
    }

    function getTransferLogs(string memory _evidenceId)
        external view evidenceExists(_evidenceId)
        returns (TransferLog[] memory)
    {
        return transferLogs[_evidenceId];
    }

    function getLabReport(string memory _evidenceId)
        external view evidenceExists(_evidenceId)
        returns (LabReport memory)
    {
        return labReports[_evidenceId];
    }

    function getAllEvidenceIds() external view returns (string[] memory) {
        return allEvidenceIds;
    }

    function evidenceExistsCheck(string memory _evidenceId) external view returns (bool) {
        return evidences[_evidenceId].exists;
    }
}
