import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GameNfts, GameSave, GameToken, VolatileMarketplace } from "../typechain-types";

/**
 * Deploys the VolatileMarketplace contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployVolatileMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get deployed contract instances that are dependencies
  const gameToken = await hre.ethers.getContract<GameToken>("GameToken", deployer);
  const gameNfts = await hre.ethers.getContract<GameNfts>("GameNfts", deployer);
  const gameSave = await hre.ethers.getContract<GameSave>("GameSave", deployer);

  console.log(`Using GameToken at: ${gameToken.target}`);
  console.log(`Using GameNfts at: ${gameNfts.target}`);
  console.log(`Using GameSave at: ${gameSave.target}`);

  // Set treasury address (using deployer address for testing purposes)
  const treasuryAddress = deployer;

  // Deploy VolatileMarketplace contract
  const volatileMarketplaceDeployment = await deploy("VolatileMarketplace", {
    from: deployer,
    args: [gameToken.target, gameNfts.target, gameSave.target, treasuryAddress],
    log: true,
    autoMine: true,
  });

  console.log(`VolatileMarketplace deployed at: ${volatileMarketplaceDeployment.address}`);

  // Get the deployed contract with proper typing
  const volatileMarketplace = await hre.ethers.getContract<VolatileMarketplace>("VolatileMarketplace", deployer);

  // Initialize marketplace with default settings
  const volatilityEnabled = true;
  await volatileMarketplace.setVolatilityEnabled(volatilityEnabled);
  console.log(`Set volatility enabled: ${volatilityEnabled}`);

  const updateInterval = 24 * 60 * 60; // 24 hours in seconds
  await volatileMarketplace.setPriceUpdateInterval(updateInterval);
  console.log(`Set price update interval: ${updateInterval} seconds`);

  // Log treasury address
  console.log(`Treasury address set to: ${treasuryAddress}`);

  console.log(`VolatileMarketplace setup complete!`);
};

export default deployVolatileMarketplace;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployVolatileMarketplace.tags = ["VolatileMarketplace"];

// Make sure VolatileMarketplace is deployed after its dependencies
deployVolatileMarketplace.dependencies = ["GameToken", "GameNfts", "GameSave"];
