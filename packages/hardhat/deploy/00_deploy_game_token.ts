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

  // Deploy GameToken contract
  const gameTokenDeployment = await deploy("GameToken", {
    from: deployer,
    args: [], // GameToken constructor doesn't require any arguments
    log: true,
    autoMine: true,
  });

  console.log(`GameToken deployed at: ${gameTokenDeployment.address}`);

  // Get the deployed contract with proper typing
  const gameToken = await hre.ethers.getContract<GameToken>("GameToken", deployer);

  // Now we can access the contract functions correctly
  console.log(`GameToken name: ${await gameToken.name()}`);
  console.log(`GameToken symbol: ${await gameToken.symbol()}`);
  console.log(`GameToken totalSupply: ${await gameToken.totalSupply()}`);
};

export default deployGameToken;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployGameToken.tags = ["GameToken"];
