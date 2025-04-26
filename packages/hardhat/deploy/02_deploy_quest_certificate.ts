import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { QuestCertificateNFT } from "../typechain-types";

/**
 * Deploys the QuestCertificateNFT contract using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployQuestCertificate: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy QuestCertificateNFT contract
  const questCertificateDeployment = await deploy("QuestCertificateNFT", {
    from: deployer,
    args: [], // No constructor arguments needed
    log: true,
    autoMine: true,
  });

  console.log(`QuestCertificateNFT deployed at: ${questCertificateDeployment.address}`);

  // Get the deployed contract with proper typing
  const questCertificate = await hre.ethers.getContract<QuestCertificateNFT>("QuestCertificateNFT", deployer);

  // Log basic information about the NFT
  console.log(`Certificate NFT name: ${await questCertificate.name()}`);
  console.log(`Certificate NFT symbol: ${await questCertificate.symbol()}`);
  console.log(`Current token ID counter: ${await questCertificate.getCurrentTokenId()}`);
};

export default deployQuestCertificate;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployQuestCertificate.tags = ["QuestCertificateNFT"];
