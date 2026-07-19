import { JCanvas, loadImagePromise } from "./jcanvas.js";
import { JElementBuilder } from "./jelementBuilder.js";

export class JDraw {
  constructor(rootEl, size) {
    this.rootEl = rootEl;
    this.size = size;
    this.jcanvas = null;
    this.mode = null; // draw,clear
    // this.paletteEl = null;
    this.palette = ["red", "green", "blue"];
    this.color = "black";

    this._init();
  }
  _init() {
    const canvas = document.createElement("canvas");
    canvas.classList.add("canvas");
    this.rootEl.appendChild(canvas);
    this.jcanvas = new JCanvas(canvas, this.size);
    this.jcanvas.resize(this.size);

    const _stopDraw = () => {
      this.mode = null;
    };
    const _draw = (e) => {
      e.preventDefault();
      const clientPos = e.targetTouches
        ? [e.targetTouches[0].clientX, e.targetTouches[0].clientY]
        : [e.clientX, e.clientY];
      const cpos = this._clientPos2PixelPos(clientPos);
      if (this.mode === "draw") {
        this._drawPixel(cpos, this.color);
      } else if (this.mode === "clear") {
        this._clearPixel(cpos);
      }
    };

    canvas.addEventListener("mouseup", _stopDraw);
    canvas.addEventListener("mouseleave", _stopDraw);
    canvas.addEventListener("mousedown", (e) => {
      this.mode = e.buttons === 1 ? "draw" : "clear";
      _draw(e);
    });
    canvas.addEventListener("mousemove", _draw);

    canvas.addEventListener("touchend", _stopDraw);
    canvas.addEventListener("touchcancel", _stopDraw);
    canvas.addEventListener("touchstart", (e) => {
      this.mode = "draw";
      _draw(e);
    });
    canvas.addEventListener("touchmove", _draw);

    const paletteEl = document.createElement("div");
    this.rootEl.appendChild(paletteEl);
    paletteEl.classList.add("palette");
    const _updatePalette = () => {
      paletteEl.innerHTML = "";
      [null, ...this.palette].forEach((color) => {
        const div = document.createElement("div");
        paletteEl.appendChild(div);
        div.dataset.color = color;
        div.style.backgroundColor = color;
        div.addEventListener("click", () => {
          this.color = color;
          this.rootEl.querySelector(".color").value = color;
        });
      });
    };
    _updatePalette();

    this.rootEl.appendChild(
      JElementBuilder.addInput(
        (input) => {
          input.classList.add("color");
          input.type = "color";
          input.value = this.color;
        },
        (e) => {
          this.color = e.target.value;
          this.palette.shift();
          this.palette.push(this.color);
          _updatePalette();
        },
      ),
    );

    this.rootEl.appendChild(
      JElementBuilder.addButton("clear", () => this.clear()),
    );

    this.rootEl.appendChild(
      JElementBuilder.addButton("download", () => {
        let fname = prompt("File name:", "image.png");
        if (!fname) {
          return;
        }
        fname = fname.endsWith(".png") ? fname : `${fname}.png`;
        this.jcanvas.saveImage(fname);
      }),
    );
  }
  _drawPixel(cpos, color) {
    const pos = this._cell2canvas(cpos);
    if (this.color) {
      this.jcanvas.fillRect(pos, [1, 1], color);
    } else {
      this.jcanvas.clear(pos, [1, 1]);
    }
  }
  _clearPixel(cpos) {
    const pos = this._cell2canvas(cpos);
    this.jcanvas.clear(pos, [1, 1]);
  }
  clear() {
    this.jcanvas.clear();
  }
  _cell2canvas(cpos) {
    return cpos;
  }
  _clientPos2PixelPos(clientPos) {
    const rect = this.jcanvas.getRect();
    return clientPos.map((v, i) =>
      Math.floor(((v - rect.pos[i]) / rect.size[i]) * this.size[i]),
    );
  }
}
