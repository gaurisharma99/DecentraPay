const hre = require("hardhat");

async function main() {
  const DecentraPay = await hre.ethers.getContractFactory("DecentraPay");
  const contract = await DecentraPay.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("DecentraPay deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
