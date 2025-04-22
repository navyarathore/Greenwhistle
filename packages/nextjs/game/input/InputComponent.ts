import * as Phaser from "phaser";

export class InputComponent {
  readonly cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
  readonly inventoryKey: Phaser.Input.Keyboard.Key;
  readonly actionKey: Phaser.Input.Keyboard.Key;
  readonly enterKey: Phaser.Input.Keyboard.Key;

  constructor(keyboardPlugin: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.cursorKeys = keyboardPlugin.createCursorKeys();
    this.inventoryKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.actionKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.enterKey = keyboardPlugin.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // F = B, Inventory
    // E = A, Talk, Run, Lift, Push/Pull
    // shift = Select, Open Save Menu
    // return/enter = Start, Open Inventory
  }

  get isUpDown(): boolean {
    return this.cursorKeys.up.isDown;
  }

  get isUpJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursorKeys.up);
  }

  get isDownDown(): boolean {
    return this.cursorKeys.down.isDown;
  }

  get isDownJustDown(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursorKeys.down);
  }

  get isLeftDown(): boolean {
    return this.cursorKeys.left.isDown;
  }

  get isRightDown(): boolean {
    return this.cursorKeys.right.isDown;
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
}
