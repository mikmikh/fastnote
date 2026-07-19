import { ACTION_TYPES, selectors } from "../store.js";
import * as jobslite from "../libs/obslite/index.js";
import { JElementBuilder } from "./jelementBuilder.js";
import { JCanvas, loadImagePromise } from "./jcanvas.js";
import { JDraw } from "./jdraw.js";

export class JSpriteEditor {
  constructor(rootEl, store, spriteSize = [32, 32]) {
    this.rootEl = rootEl;
    this.store = store;
    this.spriteSize = spriteSize;
    this.jdraw = null;

    this.sprites$ = this.store
      .select(selectors.selectSprites)
      .pipe(jobslite.operators.jdistinct());
    this.spriteIdx$ = this.store
      .select(selectors.selectSpriteIdx)
      .pipe(jobslite.operators.jdistinct());
    this.sprite$ = jobslite.operators
      .jcombineLatest(this.sprites$, this.spriteIdx$)
      .pipe(
        jobslite.operators.jmap(([sprites, spriteIdx]) => {
          return sprites[spriteIdx];
        }),
      );

    this._init();

    this.sprite$.subscribe({
      next: (sprite) => {
        sprite && this.setSprite(sprite);
      },
    });
  }

  _init() {
    this.jdraw = new JDraw(this.rootEl, this.spriteSize);

    this.rootEl.appendChild(
      JElementBuilder.addButton("save", () => this.saveSprite()),
    );
    this.rootEl.appendChild(
      JElementBuilder.addButton("remove", () => this.removeSprite()),
    );
  }
  saveSprite() {
    const { sprites, spriteIdx } = this.store.state;
    const sprite = sprites[spriteIdx];
    if (!sprite) {
      return;
    }
    const url = this.jdraw.jcanvas.toDataUrl();
    sprite.img.src = url;
    const newSprite = { ...sprite, url };
    this.store.dispatch({
      type: ACTION_TYPES.SPRITES_UPDATE,
      payload: sprites.map((s, i) => (i === spriteIdx ? newSprite : s)),
    });
  }
   removeSprite() {
    const { sprites, spriteIdx } = this.store.state;
    const sprite = sprites[spriteIdx];
    if (!sprite) {
      return;
    }
    const conf = confirm('Remove sprite?');
    if (!conf) {
      return;
    }
    this.store.dispatch({
      type: ACTION_TYPES.SPRITE_SELECT,
      payload: null,
    });
    this.store.dispatch({
      type: ACTION_TYPES.SPRITES_UPDATE,
      payload: sprites.filter(s => s !== sprite),
    });
  }
  setSprite(sprite) {
    this.jdraw.jcanvas.drawImageFromUrl(sprite.url, this.spriteSize);
  }
}
