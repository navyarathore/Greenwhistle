import * as Phaser from "phaser";

export class InputComponent {
  readonly cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  readonly inventoryKey: Phaser.Input.Keyboard.Key;
  readonly actionKey: Phaser.Input.Keyboard.Key;
  readonly enterKey: Phaser.Input.Keyboard.Key;
  // WASD keys
  readonly wKey: Phaser.Input.Keyboard.Key;
  readonly aKey: Phaser.Input.Keyboard.Key;
  readonly sKey: Phaser.Input.Keyboard.Key;
  readonly dKey: Phaser.Input.Keyboard.Key;
  // Hotbar keys (1-5)
  readonly hotbarKeys: Phaser.Input.Keyboard.Key[];
  // Item use key
  readonly itemUseKey: Phaser.Input.Keyboard.Key;

  constructor(keyboardPlugin: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.cursorKeys = keyboardPlugin.createCursorKeys();
    this.inventoryKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.actionKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.enterKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    // Add WASD keys
    this.wKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Add hotbar keys (1-5)
    this.hotbarKeys = [];
    for (let i = 0; i < 5; i++) {
      this.hotbarKeys.push(keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + i));
    }

    // Add item use key (Q)
    this.itemUseKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // E = B, Inventory
    // F = A, Talk, Run, Lift, Push/Pull
    // 1-5 = Hotbar selection
    // Q = Item use
  }

  get isUpDown(): boolean {
    return this.cursorKeys.up.isDown || this.wKey.isDown;
  }

  get isUpJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursorKeys.up) || Phaser.Input.Keyboard.JustDown(this.wKey);
  }

  get isDownDown(): boolean {
    return this.cursorKeys.down.isDown || this.sKey.isDown;
  }

  get isDownJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursorKeys.down) || Phaser.Input.Keyboard.JustDown(this.sKey);
  }

  get isLeftDown(): boolean {
    return this.cursorKeys.left.isDown || this.aKey.isDown;
  }

  get isRightDown(): boolean {
    return this.cursorKeys.right.isDown || this.dKey.isDown;
  }

  get isActionKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.actionKey);
  }

  get isInventoryKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.inventoryKey);
  }

  get isSelectKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursorKeys.shift);
  }

  get isEnterKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.enterKey);
  }

  /**
   * Checks if a specific hotbar key was just pressed
   * @param index Index of the hotbar key (0-4)
   * @returns Whether the key was just pressed
   */
  isHotbarKeyJustDown(index: number): boolean {
    if (index >= 0 && index < this.hotbarKeys.length) {
      return Phaser.Input.Keyboard.JustDown(this.hotbarKeys[index]);
    }
    return false;
  }

  /**
   * Checks if the item use key was just pressed
   * @returns Whether the key was just pressed
   */
  get isItemUseKeyJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.itemUseKey);
  }
}
