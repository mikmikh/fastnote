import * as jobslite from "./libs/obslite/index.js";
import { ACTION_TYPES, selectors, store } from "./store.js";
import { JDraw } from "./utils/jdraw.js";
import { JNoteEditor } from "./utils/jnoteEditor.js";
import { JSpriteEditor } from "./utils/jspriteEditor.js";
import { JSpriteGallery } from "./utils/jspriteGallery.js";

function main() {
  const spriteSize = [16, 16];
  const systemEffects = {
    loggerEffect: (action$, store) =>
      action$.pipe(
        jobslite.operators.jmap((action) => {
          console.log("Action:", action);
        }),
      ),
  };
  store.addEffect(...Object.values(systemEffects));
  const noteEditor = new JNoteEditor(document.querySelector(".editor"), store);
  const spriteGallery = new JSpriteGallery(
    document.querySelector(".gallery"),
    store,
    spriteSize,
  );
  const spriteEditor = new JSpriteEditor(
    document.querySelector(".sprite-editor"),
    store,
    spriteSize,
  );

  // store.dispatch({
  //   type: ACTION_TYPES.BLOCKS_UPDATE,
  //   payload: [{ type: "p", content: "test" }],
  // });
  spriteGallery.addSprites([
    { name: "grass", url: "assets/sprites/grass.png" },
    { name: "npc", url: "assets/sprites/npc.png" },
  ]);

  // const draw = new JDraw(document.querySelector('.draw'), [32,32]);

  const sprites$ = store
    .select(selectors.selectSprites)
    .pipe(jobslite.operators.jdistinct());
  const spriteIdx$ = store
    .select(selectors.selectSpriteIdx)
    .pipe(jobslite.operators.jdistinct());
  const sprite$ = jobslite.operators.jcombineLatest(sprites$, spriteIdx$).pipe(
    jobslite.operators.jmap(([sprites, spriteIdx]) => {
      return sprites[spriteIdx];
    }),
  );
  sprite$.subscribe({
    next: (sprite) => {
      const spriteEditorEL = document.querySelector(".sprite-editor");
      if (sprite) {
        spriteEditorEL.classList.remove("hide");
      } else {
        spriteEditorEL.classList.remove("hide");
        spriteEditorEL.classList.add("hide");
      }
    },
  });

  const blocks$ = store
    .select(selectors.selectBlocks)
    .pipe(jobslite.operators.jdistinct());
  const blockIdx$ = store
    .select(selectors.selectBlockIdx)
    .pipe(jobslite.operators.jdistinct());
  blockIdx$.subscribe({
    next: (blockIdx) => {
      const { blocks } = store.state;
      const hideGalley = blockIdx === null || blocks[blockIdx]?.type !== "img";
      const galleryEl = document.querySelector(".img-editor");

      galleryEl.classList.remove("hide");
      if (hideGalley) {
        galleryEl.classList.add("hide");
      }
    },
  });

  const saveState = () => {
    const state = store.state;
    const stateStr = JSON.stringify(state);
    console.log(stateStr);
    localStorage.setItem("fastnote", stateStr);
  };
  const btnSave = document.querySelector(".btn-save");
  btnSave.addEventListener("click", saveState);

  const loadState = () => {
    const stateStr = localStorage.getItem("fastnote");
    if (!stateStr) {
      alert("no prev state");
      return;
    }
    const state = JSON.parse(stateStr);
    store.dispatch({ type: ACTION_TYPES.SPRITE_SELECT, payload: null });
    store.dispatch({ type: ACTION_TYPES.BLOCKS_SELECT, payload: null });

    store.dispatch({ type: ACTION_TYPES.SPRITES_UPDATE, payload: [] });

    spriteGallery.addSprites(state.sprites);

    store.dispatch({ type: ACTION_TYPES.BLOCKS_UPDATE, payload: state.blocks });
  };

  const btnLoad = document.querySelector(".btn-load");
  btnLoad.addEventListener("click", () => {
    const conf = confirm("Changes will be lost, ok?");
    if (conf) {
      loadState();
    }
  });

  window.addEventListener("beforeunload", saveState);

  loadState();
}

main();
