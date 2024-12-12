class TaskStickerController extends HTMLElement {
    constructor() {
      super();
      this.expanded = false;
      this.isToggling = false;
      this.observer = new MutationObserver(() => {
        if (this.expanded) {
          this.render();
        }
      });
    }
  
    connectedCallback() {
      this.render();
      this.addEventListeners();
    }
  
    render() {
      this.observer.disconnect();
      this.innerHTML = '';
  
      const dataKey = this.getAttribute('data-key');
      const savedData = localStorage.getItem(dataKey) || '';
      const [title, description, dueDate, workarea] = savedData.split(';');
  
      const elementHTML = `
        <task-sticker data-key="${dataKey}" 
          title="${title || this.getAttribute('title')}" 
          description="${description || this.getAttribute('description')}" 
          color="${this.getAttribute('color')}" 
          dueDate="${dueDate || this.getAttribute('dueDate')}"
          workarea="${this.expanded ? (workarea || 'Front,Back,Server,Testing') : ''}">
        </task-sticker>
      `;
  
      this.insertAdjacentHTML('beforeend', elementHTML);
  
      this.observer.observe(this, { childList: true, subtree: true });
    }
  
    addEventListeners() {
      this.addEventListener('click', () => {
        if (!this.isToggling) {
          this.isToggling = true;
          this.expanded = !this.expanded;
          this.render();
          
          setTimeout(() => {
            this.isToggling = false;
          }, 300);
        }
      });
    }
    
  }
  
  customElements.define('task-sticker-controller', TaskStickerController);
  