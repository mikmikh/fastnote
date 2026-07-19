export class JElementBuilder {
  static addInput(preFn, fn) {
    const input = document.createElement("input");
    preFn(input);
    input.addEventListener("change", fn);
    return input;
  }
  static addButton(text, fn) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.classList.add("button");
    button.addEventListener("click", fn);
    return button;
  }
  static addSelect(label, options, fn) {
    const selectEl = document.createElement("select");
    JElementBuilder.updateSelectOptions(selectEl, options);
    selectEl.addEventListener("change", fn);
    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.appendChild(selectEl);
    return labelEl;
  }
  static updateSelectOptions(selectEl, options) {
    selectEl.innerHTML = "";
    options.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.textContent = option;
      selectEl.appendChild(optionEl);
    });
  }
}

export function downloadObjectAsJson(exportObj, exportName) {
  const jsonString = JSON.stringify(exportObj, null, 2);

  const blob = new Blob([jsonString], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", url);
  downloadAnchorNode.setAttribute("download", `${exportName}.json`); // Set the desired file name

  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();

  document.body.removeChild(downloadAnchorNode);
  URL.revokeObjectURL(url);
}
