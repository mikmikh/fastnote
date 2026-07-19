import { ACTION_TYPES, selectors } from "../store.js";
import * as jobslite from "../libs/obslite/index.js";
import { JElementBuilder } from "./jelementBuilder.js";
import { JCanvas, loadImagePromise } from "./jcanvas.js";

export class JSpriteGallery {
  constructor(rootEl, store, spriteSize=[32,32]) {
    this.rootEl = rootEl;
    this.store = store;
    this.spriteSize=spriteSize;
    this._listEl = null;
    this._canvas = null;
    this._jcanvas = null;

    this.sprites$ = this.store
      .select(selectors.selectSprites)
      .pipe(jobslite.operators.jdistinct());
    this.spritesIdx$ = this.store
      .select(selectors.selectSpriteIdx)
      .pipe(jobslite.operators.jdistinct());

    this._init();

    jobslite.operators
      .jmerge(this.sprites$, this.spritesIdx$)
      .pipe(
        jobslite.operators.jtap(() => {
          const { sprites, spriteIdx } = this.store.state;
          if (!sprites) {
            return;
          }
          this._renderSprites(sprites);
          this._selectSprite(sprites, spriteIdx);
        }),
      )
      .subscribe();
  }

  /**
   *
   * @param {{name,url}[]} spriteInfos
   */
  async addSprites(spriteInfos) {
    const dataUrls = await Promise.all(
      spriteInfos.map(({ url }) => this._url2dataUrl(url)),
    );
    spriteInfos.forEach((info, si) => {
      info.url = dataUrls[si];
    });
    const imgs = await Promise.all(
      spriteInfos.map(({ name, url }) => {
        const img = loadImagePromise(url);
        return img;
      }),
    );
    const newSprites = imgs.map((img, ii) => {
      const name = spriteInfos[ii].name;
      const url = img.src;
      return { name, url, img };
    });
    const { sprites } = this.store.state;
    this.store.dispatch({
      type: ACTION_TYPES.SPRITES_UPDATE,
      payload: [...sprites, ...newSprites],
    });
  }
  async addEmpty() {
    const name = prompt("Sprite name:", "new_sprite");
    if (!name) {
      return;
    }
    this._jcanvas.clear();
    const url = this._jcanvas.toDataUrl();
    const img = await loadImagePromise(url);
    const newSprite = { name, img, url };

    const { sprites } = this.store.state;
    this.store.dispatch({
      type: ACTION_TYPES.SPRITES_UPDATE,
      payload: [...sprites, newSprite],
    });
  }
  async _url2dataUrl(url) {
    if (url.startsWith("data:")) {
      return url;
    }
    await this._jcanvas.drawImageFromUrl(url, this.spriteSize);
    return this._jcanvas.toDataUrl();
  }

  _init() {
    const canvas = document.createElement("canvas");
    canvas.classList.add("hide");
    const jcanvas = new JCanvas(canvas, this.spriteSize);
    this._canvas = canvas;
    this._jcanvas = jcanvas;

    const listEl = document.createElement("div");
    this.rootEl.appendChild(listEl);
    this._listEl = listEl;
    listEl.addEventListener("click", (e) => {
      const el = e.target;
      if (!el.matches("img")) {
        this.store.dispatch({
          type: ACTION_TYPES.SPRITE_SELECT,
          payload: null,
        });
        return;
      }
      const imgs = Array.from(listEl.querySelectorAll("img"));
      const idx = imgs.indexOf(el);

      this.store.dispatch({
        type: ACTION_TYPES.SPRITE_SELECT,
        payload: idx,
      });
    });

    this.rootEl.appendChild(
      JElementBuilder.addInput(
        (input) => {
          input.type = "file";
          input.multiple = true;
          input.accept = "image/*";
        },
        async (e) => {
          const files = Array.from(e.target.files);
          if (!files.length) {
            return;
          }
          // Todo promise
          const spriteInfos = files.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file),
          }));

          await this.addSprites(spriteInfos);
        },
      ),
    );

    this.rootEl.appendChild(
      JElementBuilder.addButton("new", () => this.addEmpty()),
    );
  }
  _renderSprites(sprites) {
    this._listEl.innerHTML = "";
    sprites.forEach((sprite) => {
      sprite.img.title = sprite.name;
      this._listEl.appendChild(sprite.img);
    });
  }
  _selectSprite(sprites, spriteIdx) {
    sprites.forEach((s) => s.img.classList.remove("active"));
    sprites[spriteIdx]?.img.classList.add("active");
  }
}
