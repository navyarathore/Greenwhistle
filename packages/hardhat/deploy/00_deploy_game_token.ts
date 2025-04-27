import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GameToken } from "../typechain-types";

/**
 * Deploys the GameToken contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployGameToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log(`\n\n 📡 Deploying GameToken...`);
  console.log(`\n 👤 Deployer: ${deployer}`);

  // Set initial values for the GameToken contract
  const initialSupply = hre.ethers.parseEther("1000000"); // 1 million tokens with 18 decimals
  const name = "Green Whistle Token";
  const symbol = "GWT";
  const decimals = 18; // Standard ERC20 decimals

  console.log(`\n 💰 Initial Supply: ${hre.ethers.formatEther(initialSupply)} tokens`);
  console.log(`\n 🏷️ Token Name: ${name}`);
  console.log(`\n 🔤 Token Symbol: ${symbol}`);
  console.log(`\n 🔢 Decimals: ${decimals}`);

  // Deploy GameToken contract with constructor arguments
  const gameTokenDeployment = await deploy("GameToken", {
    from: deployer,
    args: [initialSupply, name, symbol, decimals],
    log: true,
    autoMine: true,
  });

  console.log(`\n ✅ GameToken deployed at: ${gameTokenDeployment.address}`);

  // Get the deployed contract with proper typing
  const gameToken = await hre.ethers.getContract<GameToken>("GameToken", deployer);

  // Now we can access the contract functions correctly
  console.log(`\n 📊 Contract Details:`);
  console.log(`\n   • Token Name: ${await gameToken.name()}`);
  console.log(`\n   • Token Symbol: ${await gameToken.symbol()}`);
  console.log(`\n   • Decimals: ${await gameToken.decimals()}`);
  console.log(`\n   • Total Supply: ${hre.ethers.formatEther(await gameToken.totalSupply())}`);

  // Verify the contract on block explorer if not on a local network
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    try {
      console.log(`\n 🔍 Verifying contract on block explorer...`);
      await hre.run("verify:verify", {
        address: gameTokenDeployment.address,
        constructorArguments: [initialSupply, name, symbol, decimals],
        contract: "contracts/GameToken.sol:GameToken",
      });
      console.log(`\n ✅ Contract verified on block explorer`);
    } catch (error) {
      console.log(`\n ❌ Error verifying contract: ${error}`);
    }
  }
};

export default deployGameToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployGameToken.tags = ["GameToken"];
