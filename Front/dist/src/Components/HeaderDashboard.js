class Header extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {

    // Obtener el nombre del proyecto seleccionado desde el localStorage
    const projectName = localStorage.getItem("projectName") || "Dashboard";

    this.innerHTML = `
      <style>
          .divcolaborator-section {
            width: 50vh;
          }
      </style>

        <div>
          <div class="row pt-5">
            <div class="col-lr-10">
              <div class="d-flex justify-content-center">
                <div class="btn-group dropend">
                  <div class="d-flex justify-content-between align-items-around ">
                
                    <h1>${projectName}</h1>
                    <button id="backButton" class="btn btn-outline-secondary">
                      <i id="backIcon" class="bi bi-arrow-left"></i>
                    </button>
                     <button  class="btn btn-transparent" >
                     <i id="favoriteIcon" class="bi bi-bookmark-star"></i> 
                               
                  </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-10 d-flex justify-content-end">
              <!-- <my-collaborators class="divcolaborator-section"></my-collaborators>  --> 
            </div>
          </div>
  
          <div>
            <div class="">
              <ul class="list-unstyled d-flex justify-content-end">
                <li class="py-1 ps-3">
                  <span class=" p-0 border-0">
                    <i class="bi bi-circle-fill pe-2" style="color: #4da167;"></i>
                    Testing
                  </span>
                </li>
  
                <li class="py-1 ps-3">
                  <span  class=" p-0 border-0">
                    <i class="bi bi-circle-fill pe-2" style="color: #2589bd;"></i>
                    Back
                  </span>
                </li>
  
                <li class="py-1 ps-3">
                  <span class=" p-0 border-0">
                    <i class="bi bi-circle-fill pe-2" style="color: #f5bb00;"></i>
                    Server
                  </span>
                </li>
  
                <li class="py-1 ps-3">
                  <span  class=" p-0 border-0">
                    <i class="bi bi-circle-fill pe-2" style="color: #ed98b4;"></i>
                    Front
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>`;

    const backButton = this.querySelector("#backButton");
    if (backButton) {
      backButton.addEventListener("click", () => {
        window.location.href = "projects.html"; // Redirigir a la lista de proyectos
      });
    }
  }
}

// Define custom element
customElements.define("my-header", Header);
