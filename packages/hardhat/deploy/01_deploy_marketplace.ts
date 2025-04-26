import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { MarketplaceV2 } from "../typechain-types";

/**
 * Deploys the MarketplaceV2 contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // First, make sure the GameToken is deployed
  const gameTokenDeployment = await hre.deployments.get("GameToken");
  console.log(`Using GameToken at: ${gameTokenDeployment.address}`);

  // Set treasury address - using deployer address for now, can be changed later
  const treasuryAddress = deployer;
  console.log(`Using treasury address: ${treasuryAddress}`);

  // Deploy MarketplaceV2 contract
  const marketplaceDeployment = await deploy("MarketplaceV2", {
    from: deployer,
    args: [gameTokenDeployment.address, treasuryAddress],
    log: true,
    autoMine: true,
  });

  console.log(`MarketplaceV2 deployed at: ${marketplaceDeployment.address}`);

  // Get the deployed marketplace contract with proper typing
  const marketplace = await hre.ethers.getContract<MarketplaceV2>("MarketplaceV2", deployer);

  console.log(`Verifying MarketplaceV2 configuration...`);
  console.log(`Game token address in marketplace: ${await marketplace.gameToken()}`);
  console.log(`Treasury address in marketplace: ${await marketplace.treasury()}`);
};

export default deployMarketplace;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployMarketplace.tags = ["MarketplaceV2"];
// This indicates that GameToken must be deployed before this contract
deployMarketplace.dependencies = ["GameToken"];
