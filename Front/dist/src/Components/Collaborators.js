
class Collaborators extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
  
    connectedCallback() {
      this.shadowRoot.innerHTML = `
        <style>
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');
          .row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
          }
          .btn-group {
            display: flex;
          }
          .collaborator-section {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .btn-group .btn {
            margin-left: -10px; 
            border-radius: 50%; /* Hacer que los botones se vean redondos */
            padding: 5px;
            width: 40px;
            height: 40px;
            display: inline-flex;
            justify-content: center;
            align-items: center;
          }
          .btn-group .btn img {
            border-radius: 50%;
            border: 2px solid #fafafa;
          }
          h1 {
            margin: 0;
          }
          .invite-text {
            margin-bottom: 5px;
            font-size: 14px;
          }
          .collaborators{
            display: flex;
            justify-content: flex-end;
          }
          .spacer{
            padding-inline-start: 2rem;
          }
        </style>
  
        <div class="collaborators">
          <div class="row pt-5">
            <button type="button" class="btn">
              <i class="bi bi-plus-square"></i>
            </button>
          </div>

          <div class="row pt-5 spacer">
            <div class="col-lg-10 d-flex justify-content-end align-items-center collaborator-section">
           
              <div class="btn-group" role="group" aria-label="Collaborators icons">
                <button type="button" class="btn btn-outline-primary">
                  <img src="https://placehold.co/40x40"></img>
                </button>
                <button type="button" class="btn btn-outline-primary">
                   <img src="https://placehold.co/40x40"></img>
                </button>
                <button type="button" class="btn btn-outline-primary">
                   <img src="https://placehold.co/40x40"></img>
                </button>
                <button type="button" class="btn btn-outline-primary">
                   <img src="https://placehold.co/40x40"></img>
                </button>
                <button type="button" class="btn btn-outline-primary">
                   <img src="https://placehold.co/40x40"></img>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
  }

  // Define custom element
  customElements.define("my-collaborators", Collaborators);
  