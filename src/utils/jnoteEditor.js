import * as obslite from "../libs/obslite/index.js";
import { ACTION_TYPES, selectors } from "../store.js";

export class JNoteEditor {
  constructor(rootEl, store) {
    this.rootEl = rootEl;
    this.store = store;

    // obslite.operators.jmerge(
    //     this.store.select(selectors.selectBlocks).pipe(obslite.operators.jdistinct()),
    //     this.store.select(selectors.selectBlockIdx).pipe(obslite.operators.jdistinct()),
    // ).pipe(
    //     obslite.operators.jtap(() => {
    //         const {blocks, blockIdx} = this.store.state;
    //     }),
    //   )
    //   .subscribe();
    this.store
      .select(selectors.selectBlocks)
      .pipe(
        obslite.operators.jdistinct(),
        obslite.operators.jtap(() => {
          // render blocks
          this.render();
        }),
      )
      .subscribe();

    this.store
      .select(selectors.selectBlockIdx)
      .pipe(
        obslite.operators.jdistinct(),
        obslite.operators.jtap(() => {
          const { blocks, blockIdx } = this.store.state;
          // replace block with textarea
          this.edit();
        }),
      )
      .subscribe();
  }

  edit() {
    const { blocks, blockIdx } = this.store.state;
    console.log("blockIdx", blockIdx);
    if (blockIdx === null) {
      this._handleRemoveEditor();
      return;
    }
    const block = blocks[blockIdx];
    if (!block) {
      return;
    }
    const blockEls = Array.from(this.rootEl.querySelectorAll(".block"));
    const blockEl = blockEls[blockIdx];
    blockEl.classList.remove("selected");
    blockEl.classList.add("selected");

    const contentEl = blockEl.querySelector(".block__content");

    const editorContainer = document.createElement("div");
    blockEl.appendChild(editorContainer);
    editorContainer.classList.add("block__editor");
    if (block.type === "img") {
      editorContainer.textContent = "select sprite from gallery";
      const imageEditor = document.querySelector('.img-editor');
      editorContainer.appendChild(imageEditor);
    } else {
      const textareaEl = document.createElement("textarea");
      editorContainer.appendChild(textareaEl);
      textareaEl.classList.add("block__editor");
      textareaEl.value = contentEl.innerHTML
        .replaceAll(/<br\s?\/?>/gi, "\n")
        .replaceAll(/&nbsp;/gi, " ");
    }

    // blockEl.classList.remove('editing');
    // blockEl.classList.add('editing');

    const saveBtn = this.__createBlockBtn("save block", () =>
      this._handleSaveBlock(),
    );
    editorContainer.appendChild(saveBtn);

    const cancelBtn = this.__createBlockBtn("cancel", () =>
      this._handleSelectBlock(null),
    );
    editorContainer.appendChild(cancelBtn);
  }
  render() {
    this.rootEl.innerHTML = "";

    const { blocks, blockIdx } = this.store.state;
    // this._createBlock({ type: "empty" }, -1);
    if (!blocks.length) {
      this.rootEl.appendChild(this.__createBlockBtn('add block', () => this._handleAddBlock(-1)));
    }

    blocks.forEach((block, bi) => {
      this._createBlock(block, bi);
    });
  }
  _createBlock(block, bi) {
    const { type, content } = block;

    const { blockEl, el, btns_right, btns_bottom, btns_top } =
      this.__createBlockBase(block, bi);
    this.rootEl.appendChild(blockEl);

    btns_right.appendChild(
      this.__createBlockBtn("edit", () => this._handleSelectBlock(bi)),
    );

    btns_right.appendChild(
      this.__createBlockBtn("x", () => this._handleDeleteBlock(bi)),
    );

    btns_bottom.appendChild(
      this.__createBlockBtn("add", () => this._handleAddBlock(bi)),
    );

    btns_top.appendChild(
      this.__createBlockBtn("up", () => this._handleMoveBlock(block, -1)),
    );
    btns_top.appendChild(
      this.__createBlockBtn("down", () => this._handleMoveBlock(block, 1)),
    );
  }
  // block helpers
  __createBlockBase(block, bi) {
    const { type, content } = block;
    const blockEl = document.createElement("section");
    blockEl.classList.add("block");
    blockEl.dataset.type = type;
    blockEl.dataset.idx = bi;

    // let el = null;
    // if (type !== "empty") {
    const el = document.createElement(type);
    el.classList.add("block__content");
    if (type === "img") {
      el.src = content;
    } else {
      el.innerHTML = content;
    }
    blockEl.appendChild(el);
    // }

    const btns_right = document.createElement("div");
    blockEl.appendChild(btns_right);
    btns_right.classList.add("block__btns", "btns_right");

    const btns_bottom = document.createElement("div");
    blockEl.appendChild(btns_bottom);
    btns_bottom.classList.add("block__btns", "btns_bottom");

    const btns_top = document.createElement("div");
    blockEl.appendChild(btns_top);
    btns_top.classList.add("block__btns", "btns_top");

    return { blockEl, el, btns_right, btns_bottom, btns_top };
  }
  __createBlockBtn(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    return btn;
  }
  // btn handlers
  _handleSelectBlock(bi) {
    const { blockIdx } = this.store.state;
    console.log("_handleSelectBlock", bi, blockIdx);
    if (bi === blockIdx) {
      return;
    }
    if (blockIdx !== null) {
      this._handleSaveBlock();
    } else {
      this._handleRemoveEditor();
    }
    this.store.dispatch({
      type: ACTION_TYPES.BLOCKS_SELECT,
      payload: bi,
    });
  }
  _handleDeleteBlock(bi) {
    const { blocks, blockIdx } = this.store.state;
    if (bi === blockIdx) {
      this.store.dispatch({
        type: ACTION_TYPES.BLOCKS_SELECT,
        payload: null,
      });
    }
    this.store.dispatch({
      type: ACTION_TYPES.BLOCKS_UPDATE,
      payload: [...blocks.slice(0, bi), ...blocks.slice(bi + 1)],
    });
  }
  _handleAddBlock(bi) {
    const { blocks } = this.store.state;
    const type = prompt("Enter type (h1-h6,p,img)", "p");
    if (!["h1", "h2", "h3", "h4", "h5", "h6", "p", "img"].includes(type)) {
      alert(`Type "${type}" not found`);
      return;
    }
    const newBlock = { type, content: type !== "img" ? "Enter text" : null };
    const newBlocks = [
      ...blocks.slice(0, bi + 1),
      newBlock,
      ...blocks.slice(bi + 1),
    ];
    this.store.dispatch({
      type: ACTION_TYPES.BLOCKS_UPDATE,
      payload: newBlocks,
    });
    this.store.dispatch({
      type: ACTION_TYPES.BLOCKS_SELECT,
      payload: bi + 1,
    });
  }
  _handleMoveBlock(block, offset) {
    const { blocks } = this.store.state;
    const bi = blocks.indexOf(block);
    const nbi = bi + offset;
    if (nbi < 0 || nbi >= blocks.length) {
      return;
    }
    const newBlocks = [...blocks];
    newBlocks[nbi] = blocks[bi];
    newBlocks[bi] = blocks[nbi];
    this.store.dispatch({
      type: ACTION_TYPES.BLOCKS_UPDATE,
      payload: newBlocks,
    });
  }
  _handleSaveBlock() {
    const { blocks, blockIdx } = this.store.state;
    const block = blocks[blockIdx];

    this._ensureImageEditor();

    const blockEls = Array.from(this.rootEl.querySelectorAll(".block"));
    const blockEl = blockEls[blockIdx];

    let content = block.content;
    if (block.type === "img") {
      const { sprites, spriteIdx } = this.store.state;
      const sprite = sprites[spriteIdx];
      content = sprite?.url;
    } else {
      const textareaEl = blockEl.querySelector(".block__editor textarea");
      content = textareaEl.value
        .replaceAll(" ", "&nbsp;")
        .replaceAll("\n", "<br />");
      content = content ? content : "&nbsp;";
    }

    const newBlock = {
      ...block,
      content,
    };
    this.store.dispatch({
      type: ACTION_TYPES.BLOCKS_UPDATE,
      payload: blocks.map((b, bi) => (bi === blockIdx ? newBlock : b)),
    });
    this.store.dispatch({
      type: ACTION_TYPES.BLOCKS_SELECT,
      payload: null,
    });
  }
  _handleRemoveEditor() {
    this._ensureImageEditor();
    const blockEls = Array.from(
      this.rootEl.querySelectorAll(".block"),
    );
    blockEls.forEach((blockEl)=> {
      blockEl.classList.remove('editing');
    })
    const editorEls = Array.from(
      this.rootEl.querySelectorAll(".block__editor"),
    );
    editorEls.forEach((editorEl) => {
      editorEls.remove();
    });
  }

  _ensureImageEditor() {
    const host= document.querySelector('.img-editor-host');
    if (!host.querySelector('.img-editor')) {
      const imageEditor = document.querySelector('.img-editor');
      if (!imageEditor) {
        return;
      }
      host.appendChild(imageEditor);
    }
  }
}
