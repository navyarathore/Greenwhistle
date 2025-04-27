import { expect } from "chai";
import { ethers } from "hardhat";
import { GameSave } from "../typechain-types";

describe("GameSave", function () {
  // We define a fixture to reuse the same setup in every test.

  let gameSave: GameSave;
  before(async () => {
    const gameSaveFactory = await ethers.getContractFactory("GameSave");
    gameSave = (await gameSaveFactory.deploy()) as GameSave;
    await gameSave.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Shouldn't have any data", async function () {
      expect(await gameSave.hasSaveData()).to.equal(false);
    });

    it("Should save data", async function () {
      await gameSave.saveGame(
        1,
        1000,
        {
          positionX: 12,
          positionY: 12,
          health: 5,
          selectedHotbarSlot: 2,
        },
        [],
        [],
        [],
      );

      expect(await gameSave.hasSaveData()).to.equal(true);
    });
  });

  it("Should have test data", async function () {
    expect(await gameSave.hasSaveData()).to.equal(true);
  });

  it("Should get the saved data", async function () {
    const saveData = await gameSave.loadGame();
    expect(saveData).to.deep.equal([
      1,
      1000,
      {
        positionX: 12,
        positionY: 12,
        health: 5,
        selectedHotbarSlot: 2,
      },
      [],
      [],
      [],
    ]);
  });
});
