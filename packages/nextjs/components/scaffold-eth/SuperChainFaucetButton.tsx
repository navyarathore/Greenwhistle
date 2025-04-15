import Image from "next/image";

/**
 * FaucetButton button which lets you grab eth.
 */
export const SuperchainFaucetButton = () => {
  const openSuperchainFaucet = () => {
    window.open("https://app.optimism.io/faucet?utm_source=scaffoldbase", "_blank");
  };

  return (
    <div className={"ml-1"} data-tip="Grab funds from Superchain faucet">
      <button className="btn btn-secondary btn-sm px-2 rounded-full" onClick={() => openSuperchainFaucet()}>
        <Image alt="Optimism Logo" src="/optimism_logo.png" width={20} height={20} />
        Superchain Faucet
      </button>
    </div>
  );
};