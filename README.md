# 🔐 Forensic Evidence Management System using Blockchain

A secure and tamper-proof system to manage forensic evidence using Blockchain, IPFS, and QR-based verification.  
This project ensures integrity, transparency, and traceability of evidence from collection to court.



## 📌 Overview

Traditional forensic systems are prone to:
- Evidence tampering
- Lack of transparency
- Poor chain-of-custody tracking

This system solves these issues using modern technologies like blockchain, cryptography, and decentralized storage.



## 🎯 Objective

- Ensure **tamper-proof evidence handling**
- Maintain **secure chain of custody**
- Provide **traceability and transparency**
- Prevent unauthorized access using KYC



## 🚀 Tech Stack

### Frontend
- React.js

### Backend
- Node.js
- Express.js

### Blockchain
- Ethereum (Solidity Smart Contracts)
- Ethers.js / Web3.js

### Storage
- IPFS (for evidence files)
- MongoDB (for user & case data)

### Authentication
- MetaMask Wallet (for signing & identity)

### Security
- SHA-256 Hashing
- Digital Signatures

### Utilities
- QR Code Generator & Scanner



## 🏗️ System Architecture

The system consists of 3 layers:

### 1. Blockchain Layer
- Stores evidence metadata
- Maintains chain of custody
- Immutable records

### 2. Storage Layer
- IPFS → Evidence files
- MongoDB → User & KYC data

### 3. Application Layer
- React frontend (portals)
- Node.js backend APIs



## 👥 User Roles / Portals

### 🔐 Admin
- KYC verification
- Role assignment
- System monitoring

### 🧍 Evidence Collector
- Upload evidence
- Generate hash
- Upload to IPFS
- Generate QR codes
- Seal evidence

### 🚚 Transport Officer
- Scan QR
- Verify seal
- Transfer custody

### 🧪 Forensic Lab
- Verify evidence
- Recompute hash
- Detect tampering
- Upload report

### 👮 Police
- View evidence
- Track chain of custody
- Use reports for investigation

### ⚖️ Judicial
- View audit trail
- Verify integrity
- Generate final report



## 🔄 Workflow

KYC → Evidence Collection → QR Generation → Sealing  
→ Transport → Lab Verification → Police → Judicial  



## 🔍 Verification Logic

File Hash == QR Hash == Blockchain Hash  

- ✅ Match → Valid Evidence  
- ❌ Mismatch → Tampered Evidence  



## 📦 Data Storage

| Data Type        | Storage Location |
|-----------------|----------------|
| Evidence Files   | IPFS           |
| File Hash        | Blockchain     |
| Metadata         | Blockchain     |
| User/KYC Data    | MongoDB        |
| QR Data          | Encoded JSON   |



## 🔐 Security Features

- SHA-256 Hashing (Integrity Check)  
- Blockchain Immutability  
- Dual QR Verification  
- Tamper-Proof Packaging  
- Digital Signatures  
- KYC Authentication  


## ⚙️ Smart Contract Structure


struct Evidence {
    string evidenceId;
    string fileHash;
    string ipfsHash;
    string sealId;
    address currentOwner;
    string status;
    uint256 timestamp;
}
