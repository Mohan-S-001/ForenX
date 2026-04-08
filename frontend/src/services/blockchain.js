import { ethers }  from "ethers";
import contractData from "../contracts/ForenXEvidence.json";

let contract = null;

const getContract = async (signerOrProvider) => {
  if (!contractData?.address) throw new Error("Contract not deployed yet. Run: npm run deploy in blockchain/");
  return new ethers.Contract(contractData.address, contractData.abi, signerOrProvider);
};

export const addEvidence = async (signer, { evidenceId, fileHash, ipfsHash, sealId, digitalSignature, caseId }) => {
  const c  = await getContract(signer);
  const tx = await c.addEvidence(evidenceId, fileHash, ipfsHash, sealId, digitalSignature || "", caseId);
  return tx.wait();
};

export const transferEvidence = async (signer, { evidenceId, newOwner, newStatus, notes }) => {
  const c  = await getContract(signer);
  const tx = await c.transferEvidence(evidenceId, newOwner, newStatus, notes);
  return tx.wait();
};

export const verifyEvidence = async (signer, { evidenceId, computedHash, reportIpfsHash, reportFileHash, tampered }) => {
  const c  = await getContract(signer);
  const tx = await c.verifyEvidence(evidenceId, computedHash, reportIpfsHash || "", reportFileHash || "", tampered);
  return tx.wait();
};

export const getEvidence = async (provider, evidenceId) => {
  const c = await getContract(provider);
  return c.getEvidence(evidenceId);
};

export const getTransferLogs = async (provider, evidenceId) => {
  const c = await getContract(provider);
  return c.getTransferLogs(evidenceId);
};

export const getLabReport = async (provider, evidenceId) => {
  const c = await getContract(provider);
  return c.getLabReport(evidenceId);
};

export const STATUS_MAP = {
  0: "COLLECTED", 1: "IN_TRANSIT", 2: "AT_LAB",
  3: "VERIFIED",  4: "TAMPERED",   5: "AT_POLICE",
  6: "JUDICIAL_REVIEW", 7: "CLOSED",
};
