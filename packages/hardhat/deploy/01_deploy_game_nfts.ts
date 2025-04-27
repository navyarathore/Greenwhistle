import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { GameNfts } from "../typechain-types";

/**
 * Deploys the GameNfts contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployGameNfts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy GameNfts contract with name and symbol
  const gameNftsDeployment = await deploy("GameNfts", {
    from: deployer,
    args: ["Greenwhistle NFT", "GWNFT"],
    log: true,
    autoMine: true,
  });

  console.log(`GameNfts deployed at: ${gameNftsDeployment.address}`);

  // Get the deployed contract with proper typing
  const gameNfts = await hre.ethers.getContract<GameNfts>("GameNfts", deployer);

  // Log basic information about the NFT
  console.log(`Game NFT name: ${await gameNfts.name()}`);
  console.log(`Game NFT symbol: ${await gameNfts.symbol()}`);
  console.log(`Current token ID counter: ${await gameNfts.getTotalNFTs()}`);
};

export default deployGameNfts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployGameNfts.tags = ["GameNfts"];
