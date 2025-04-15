import Image from "next/image";

/**
 * FaucetButton button which lets you grab eth.
 */
export const BaseFaucetsButton = () => {
  const openBaseFaucets = () => {
    window.open("https://docs.base.org/tools/network-faucets/?utm_source=scaffoldbase", "_blank");
  };

  return (
    <div className={"ml-1"} data-tip="Grab funds from Superchain faucet">
      <button className="btn btn-secondary btn-sm px-2 rounded-full" onClick={() => openBaseFaucets()}>
        <Image alt="Base Logo" src="/base/Base_Symbol_Blue.svg" width={20} height={20} />
        Base Faucets
      </button>
    </div>
  );
};