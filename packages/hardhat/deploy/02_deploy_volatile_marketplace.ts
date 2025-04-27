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
  const gameSave = await hre.ethers.getContract("GameSave", deployer);

  console.log(`\n 💾 Using GameSave at ${gameSave.target}`);

  // Deploy the VolatileMarketplace contract
  const volatileMarketplace = await deploy("VolatileMarketplace", {
    from: deployer,
    args: [gameSave.target],
    log: true,
    autoMine: true,
  });

  console.log(`\n ✅ VolatileMarketplace deployed at ${volatileMarketplace.address}`);

  // Approve the marketplace to update user inventories in GameSave
  try {
    console.log(`\n 🔐 Setting marketplace approval in GameSave contract...`);
    const gameSaveContract = await hre.ethers.getContractAt("GameSave", gameSave.target);
    const tx = await gameSaveContract.setMarketplaceApproval(volatileMarketplace.address, true);
    await tx.wait();
    console.log(`\n ✅ VolatileMarketplace approved to manage inventories`);
  } catch (error) {
    console.log(`\n ❌ Error setting marketplace approval: ${error}`);
  }

  // Verify the contract on block explorer if not on a local network
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    try {
      console.log(`\n 🔍 Verifying contract on block explorer...`);
      await hre.run("verify:verify", {
        address: volatileMarketplace.address,
        constructorArguments: [gameSave.target],
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
deployVolatileMarketplace.dependencies = ["GameSave"];
