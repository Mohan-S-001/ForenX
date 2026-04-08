import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying ForenXEvidence contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📋 Deployer address: ${deployer.address}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);

  const ForenXEvidence = await hre.ethers.getContractFactory("ForenXEvidence");
  const contract = await ForenXEvidence.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ ForenXEvidence deployed to: ${contractAddress}`);

  // Export ABI + address for frontend and backend
  const artifact = await hre.artifacts.readArtifact("ForenXEvidence");

  const exportData = {
    address: contractAddress,
    abi: artifact.abi,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
  };

  // Save to frontend
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
  fs.writeFileSync(
    path.join(frontendDir, "ForenXEvidence.json"),
    JSON.stringify(exportData, null, 2)
  );

  // Save to backend
  const backendDir = path.join(__dirname, "../../backend/src/contracts");
  if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendDir, "ForenXEvidence.json"),
    JSON.stringify(exportData, null, 2)
  );

  console.log("📁 ABI + address exported to frontend/src/contracts/ and backend/src/contracts/");
  console.log("\n🎉 Deployment complete!");
  console.log(`\nAdd this to your .env files:\nCONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
