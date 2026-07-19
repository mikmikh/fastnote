import * as obslite from "./libs/obslite/index.js";

const initState = {
  // {type, content}
  blocks: [],
  blockIdx: null,
  sprites: [],
  spriteIdx: null,
};

const idFn = (x) => x;

export const selectors = {
  selectBlocks: obslite.store.jcreateSelectorMemo(
    (state) => state.blocks,
    idFn,
  ),
  selectBlockIdx: obslite.store.jcreateSelectorMemo(
    (state) => state.blockIdx,
    idFn,
  ),
  selectSprites: obslite.store.jcreateSelectorMemo(
    (state) => state.sprites,
    idFn,
  ),
  selectSpriteIdx: obslite.store.jcreateSelectorMemo(
    (state) => state.spriteIdx,
    idFn,
  ),
};

export const ACTION_TYPES = {
  BLOCKS_UPDATE: "BLOCKS_UPDATE",
  BLOCKS_SELECT: "BLOCKS_SELECT",
  SPRITES_UPDATE: "SPRITES_UPDATE",
  SPRITE_SELECT: "SPRITE_SELECT",
};

const handlers = {
  [ACTION_TYPES.BLOCKS_UPDATE]: (state, { payload }) =>
    obslite.utils.jupdateState(state, { blocks: payload }),
  [ACTION_TYPES.BLOCKS_SELECT]: (state, { payload }) =>
    obslite.utils.jupdateState(state, {
      blockIdx: payload,
    }),
    [ACTION_TYPES.SPRITES_UPDATE]: (state, { payload }) =>
    obslite.utils.jupdateState(state, { sprites: payload }),
  [ACTION_TYPES.SPRITE_SELECT]: (state, { payload }) =>
    obslite.utils.jupdateState(state, {
      spriteIdx: payload,
    }),
};

const reducer = obslite.store.jcreateReducer(initState, handlers);

export const store = new obslite.store.JStore(reducer);
