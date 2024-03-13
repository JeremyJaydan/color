
class ColorManager extends HTMLElement {
  
  constructor(){
    super();
    this.attachShadow({ mode: 'open' });
    this.#render();
    this.#renderColors(this.#getAllColorsFromURL());
    const colorInput = this.shadowRoot.querySelector('#color-input');
    colorInput.addEventListener('keydown', this.#onColorInputKeydown.bind(this));
    const colorContainer = this.shadowRoot.querySelector('.color-container');
    colorContainer.addEventListener('click', this.#onColorContainerClick.bind(this));
    colorContainer.addEventListener('keydown', this.#onColorContainerKeyup.bind(this));
    window.addEventListener('load', () => colorInput.focus());
    window.addEventListener('hashchange', this.#onWindowHashChange.bind(this));
    window.addEventListener('keydown', this.#onWindowKeydown.bind(this));
  }
  
  #onWindowKeydown(event){
    if(event.key === 'Escape'){
      const colorInput = this.shadowRoot.querySelector('#color-input');
      if(this.shadowRoot.activeElement === colorInput){
        colorInput.blur();
      }else{
        colorInput.focus();
      }
    }
  }
  
  #onWindowHashChange(){
    const colors = this.#getAllColorsFromURL();
    this.#renderColors(colors);
  }
  
  #updateTabTitle(){
    const numColors = this.#getAllColorsFromURL().length;
    document.title = `Color Manager (${numColors} colors)`;
  }
  
  #onColorContainerKeyup(event){
    if(event.target.closest('.color')){
      if(event.key === 'ArrowRight') this.#moveColorElementRight(event.target);
      if(event.key === 'ArrowLeft') this.#moveColorElementLeft(event.target);
      if(event.key === 'Enter') this.#selectColorElement(event.target);
      if(event.key === 'Backspace'){
        const prevElement = event.target.previousElementSibling;
        event.target.remove();
        if(prevElement){
          prevElement.focus();
        }else{
          this.shadowRoot.querySelector('#color-input').focus();
        }
        this.#saveColorsToURL(this.#getAllColorFromElements());
      }
    }
  }
  
  #moveColorElementRight(element){
    if(element.nextElementSibling === null) return;
    const colorHex = element.dataset.backgroundColor;
    const colors = this.#getAllColorsFromURL();
    const newColors = colors.filter(c => c !== colorHex);
    const index = colors.indexOf(colorHex);
    newColors.splice(index + 1, 0, colorHex);
    this.#saveColorsToURL(newColors);
    this.#renderColors(newColors);
  }
  
  #moveColorElementLeft(element){
    if(element.previousElementSibling === null) return;
    const colorHex = element.dataset.backgroundColor;
    const colors = this.#getAllColorsFromURL();
    const newColors = colors.filter(c => c !== colorHex);
    const index = colors.indexOf(colorHex);
    newColors.splice(index - 1, 0, colorHex);
    this.#saveColorsToURL(newColors);
    this.#renderColors(newColors);
  }
  
  #getAllColorFromElements(){
    const colorElements = this.shadowRoot.querySelectorAll('.color');
    return Array.from(colorElements).map(e => e.dataset.backgroundColor);
  }
  
  #onColorContainerClick(event){
    if(event.target.closest('.color')){
      this.#selectColorElement(event.target);
    }
  }
  
  #selectColorElement(element){
    const color = element.dataset.backgroundColor;
    const colorValue = window.prompt('Copy to clipboard: Ctrl+C, Enter', color.startsWith('#') ? color : '#' + color);
    if(colorValue){
      navigator.clipboard.writeText(colorValue);
    }
    console.log([colorValue, color])
    if(colorValue && colorValue.replaceAll('#', '') !== color.replaceAll('#', '')){
      element.dataset.backgroundColor = colorValue;
      element.style.backgroundColor = colorValue;
      this.#saveColorsToURL(this.#getAllColorFromElements());
    }
  }
  
  #colorAlreadyExists(color){
    color = color.toUpperCase();
    const colors = this.#getAllColorsFromURL().map(c => c.toUpperCase());
    const includesColor = colors.includes(color) || colors.includes('#' + color) || colors.includes(color.slice(1));
    return includesColor;
  }
  
  #onColorInputKeydown(event){
    if(event.key == 'Enter'){
      const success = this.#addColor(event.target.value);
      if(success){
        event.target.placeholder = event.target.value;
        event.target.value = '';
      }
    }
  }
  
  #addColor(hexCode){
    const validHexCode = /^(?:#)?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexCode);
    if(!validHexCode){
      this.#showUserError('Received invalid hex code.');
      return;
    }
    if(!hexCode.startsWith('#')) hexCode = '#' + hexCode;
    if(hexCode.length == 4) hexCode = '#' + hexCode[1] + hexCode[1] + hexCode[2] + hexCode[2] + hexCode[3] + hexCode[3];
    if(this.#colorAlreadyExists(hexCode)){
      this.#showUserError('Color already exists.');
      return;
    }
    const colors = this.#getAllColorsFromURL();
    colors.unshift(hexCode);
    this.#saveColorsToURL(colors);
    return true;
  }
  
  #saveColorsToURL(colors){
    const colorsString = colors.join('-').replace(/#/g, '');
    window.location.hash = colorsString;
  }
  
  #getAllColorsFromURL(){
    const colorsString = window.location.hash.slice(1);
    if(!colorsString) return [];
    return colorsString.split('-').map((e,i) => i == 0 ? `#${e}` : e);
  }
  
  #showUserError(message){
    console.error(message);
    alert(message);
  }
  
  #renderColors(colors){
    const currentFocus = this.shadowRoot.activeElement;
    let focusedColor = null;
    if(currentFocus && currentFocus.classList.contains('color')){
      focusedColor = currentFocus.dataset.backgroundColor;
    }
    const colorContainer = this.shadowRoot.querySelector('.color-container');
    colorContainer.innerHTML = '';
    for(let color of colors){
      const colorDiv = document.createElement('div');
      colorDiv.classList.add('color');
      colorDiv.style.backgroundColor = color;
      colorDiv.dataset.backgroundColor = color;
      colorDiv.tabIndex = 0;
      colorContainer.appendChild(colorDiv);
      if(focusedColor == color || '#' + focusedColor === color || focusedColor === '#' + color){
        colorDiv.focus();
      }
    }
    this.#updateTabTitle();
  }
  
  #render(){
    this.shadowRoot.innerHTML = /*html*/ `
    
      <style>
        :host{
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 154px;
          box-sizing: border-box;
          overflow: auto;
          background: #333;
        }
        .container{
          display: flex;
          position: relative;
          flex-direction: column;
          height: 100%;
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }
        .color-container{
          display: flex;
          flex-wrap: wrap;
          margin-top: 150px;
        }
        .color{
          display: block;
          height: 100px;
          width: 100px;
          transition: ease 150ms;
        }
        .color:hover, .color:focus{
          z-index: 10;
        }
        .color-controls{
          display: flex;
          position: fixed;
          width: 100%;
          top: 0;
          box-sizing: border-box;
          z-index: 100;
          background: inherit;
          padding-top: 250px;
          max-width: 1000px;
          left: 0;
          right: 0;
          margin: 0 auto;
        }
        #color-input{
          padding: 8px;
          font-size: 24px;
          border: none;
          background: transparent;
          width: 100%;
          border-bottom: 2px solid #444;
          color: #fff;
        }
      </style>
    
      <div class="container">
        <div class="color-controls">
          <input id="color-input" placeholder="#" maxlength="7" />
        </div>
        
        <div class="color-container"></div>
      </div>
    
    `;
  }
  
}

customElements.define('color-manager', ColorManager);
