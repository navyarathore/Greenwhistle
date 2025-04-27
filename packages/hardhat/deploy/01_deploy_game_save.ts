import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the GameSave contract
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployGameSave: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`\n\n 📡 Deploying GameSave...`);
  console.log(`\n 👤 Deployer: ${deployer}`);

  const gameSaveDeployment = await deploy("GameSave", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log(`\n ✅ GameSave deployed at: ${gameSaveDeployment.address}`);

  // Verify the contract on block explorer if not on a local network
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    try {
      console.log(`\n 🔍 Verifying contract on block explorer...`);
      await hre.run("verify:verify", {
        address: gameSaveDeployment.address,
        constructorArguments: [],
        contract: "contracts/GameSave.sol:GameSave",
      });
      console.log(`\n ✅ Contract verified on block explorer`);
    } catch (error) {
      console.log(`\n ❌ Error verifying contract: ${error}`);
    }
  }
};

export default deployGameSave;

deployGameSave.tags = ["GameSave"];
