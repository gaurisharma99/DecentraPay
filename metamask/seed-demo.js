// Seeds a few clearly-labelled demo payments on a LOCAL Hardhat node so the
// "Transaction History" section has real on-chain entries to show.
//
// Usage (hardhat node running + contract deployed):
//   npx hardhat run scripts/seed-demo.js --network localhost
// Optional: CONTRACT_ADDRESS=0x... to override the default first-deploy address.
//
// Safe by design: refuses to run on any network other than chain 31337.
const hre = require("hardhat");

const DEFAULT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const DEMO_PAYMENTS = [
  // [sender index, receiver index, amount (ETH), message]
  [1, 0, "0.25", "Demo: Welcome to DecentraPay"],
  [2, 0, "1.5", "Demo: Invoice #1042 - design work"],
  [0, 3, "0.05", "Demo: Thanks for lunch"],
];

async function main() {
  const { chainId } = await hre.ethers.provider.getNetwork();
  if (chainId !== 31337n) {
    throw new Error(`Refusing to seed demo data on chain ${chainId}; local Hardhat (31337) only.`);
  }

  const address = process.env.CONTRACT_ADDRESS || DEFAULT_ADDRESS;
  const code = await hre.ethers.provider.getCode(address);
  if (code === "0x") {
    throw new Error(`No contract at ${address}. Run scripts/deploy.js first (same node).`);
  }

  const signers = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt("DecentraPay", address);

  for (const [from, to, eth, message] of DEMO_PAYMENTS) {
    const tx = await contract
      .connect(signers[from])
      .sendPayment(signers[to].address, message, { value: hre.ethers.parseEther(eth) });
    await tx.wait();
    console.log(`#${from} -> #${to}  ${eth} ETH  "${message}"`);
  }
  console.log("Total payments on-chain:", (await contract.totalPayments()).toString());
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
