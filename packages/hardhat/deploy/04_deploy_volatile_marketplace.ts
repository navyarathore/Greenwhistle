import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the VolatileMarketplace contract
 * @param hre HardhatRuntimeEnvironment object
 */
const deployVolatileMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // Get the necessary values from the HRE
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`\n\n 📡 Deploying VolatileMarketplace...`);
  console.log(`\n\n 👤 Deployer: ${deployer}`);

  // Get the deployed token contracts that VolatileMarketplace depends on
  const gameToken = await hre.ethers.getContract("GameToken", deployer);
  const gameNfts = await hre.ethers.getContract("GameNfts", deployer);
  const gameSave = await hre.ethers.getContract("GameSave", deployer);

  console.log(`\n 📦 Using GameToken at ${gameToken.target}`);
  console.log(`\n 🖼️ Using GameNfts at ${gameNfts.target}`);
  console.log(`\n 💾 Using GameSave at ${gameSave.target}`);

  // Deploy the VolatileMarketplace contract
  const volatileMarketplace = await deploy("VolatileMarketplace", {
    from: deployer,
    args: [gameToken.target, gameNfts.target, gameSave.target],
    log: true,
    autoMine: true,
  });

  console.log(`\n ✅ VolatileMarketplace deployed at ${volatileMarketplace.address}`);

  // Verify the contract on block explorer if not on a local network
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    try {
      console.log(`\n 🔍 Verifying contract on block explorer...`);
      await hre.run("verify:verify", {
        address: volatileMarketplace.address,
        constructorArguments: [gameToken.target, gameNfts.target, gameSave.target],
        contract: "contracts/VolatileMarketplace.sol:VolatileMarketplace",
      });
      console.log(`\n ✅ Contract verified on block explorer`);
    } catch (error) {
      console.log(`\n ❌ Error verifying contract: ${error}`);
    }
  }
};

export default deployVolatileMarketplace;

// Tags help when executing specific deploy scripts
deployVolatileMarketplace.tags = ["VolatileMarketplace"];
// Dependencies ensure these contracts are deployed first
deployVolatileMarketplace.dependencies = ["GameToken", "GameNfts", "GameSave"];
