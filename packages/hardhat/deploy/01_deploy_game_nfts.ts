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

  console.log(`\n\n 📡 Deploying GameNfts...`);
  console.log(`\n 👤 Deployer: ${deployer}`);

  const name = "Greenwhistle NFT";
  const symbol = "GWNFT";

  console.log(`\n 🖼️ NFT Name: ${name}`);
  console.log(`\n 🔤 NFT Symbol: ${symbol}`);

  // Deploy GameNfts contract with name and symbol
  const gameNftsDeployment = await deploy("GameNfts", {
    from: deployer,
    args: [name, symbol],
    log: true,
    autoMine: true,
  });

  console.log(`\n ✅ GameNfts deployed at: ${gameNftsDeployment.address}`);

  // Get the deployed contract with proper typing
  const gameNfts = await hre.ethers.getContract<GameNfts>("GameNfts", deployer);

  // Log basic information about the NFT
  console.log(`\n 📊 Contract Details:`);
  console.log(`\n   • NFT Name: ${await gameNfts.name()}`);
  console.log(`\n   • NFT Symbol: ${await gameNfts.symbol()}`);
  console.log(`\n   • Current Token ID Counter: ${await gameNfts.getTotalNFTs()}`);

  // Verify the contract on block explorer if not on a local network
  const networkName = hre.network.name;
  if (networkName !== "localhost" && networkName !== "hardhat") {
    try {
      console.log(`\n 🔍 Verifying contract on block explorer...`);
      await hre.run("verify:verify", {
        address: gameNftsDeployment.address,
        constructorArguments: [name, symbol],
        contract: "contracts/GameNfts.sol:GameNfts",
      });
      console.log(`\n ✅ Contract verified on block explorer`);
    } catch (error) {
      console.log(`\n ❌ Error verifying contract: ${error}`);
    }
  }
};

export default deployGameNfts;

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployGameNfts.tags = ["GameNfts"];
