import { io } from "socket.io-client";
const socket = io("http://localhost:3000");
socket.on("connect", () => {
  console.log("Conectado al servidor de Socket.IO con ID:", socket.id);
});
socket.on("connect_error", (error) => {
  console.error("Error al conectar con Socket.IO:", error);
});
class TaskSticker extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const attributes = this.getAttributes();
    this.setUniqueIdentifiers(attributes);
    this.render(attributes);
    this.addEventListeners(attributes.modalId, attributes.dataKey);
  }

  getAttributes() {
    return {
      title: this.getAttribute("title") || "Untitled Task",
      description:
        this.getAttribute("description") ||
        "Please, remember to write a task description.",
      color: this.getAttribute("color"),
      dueDate: this.getAttribute("dueDate") || "No date assigned.",
      workarea: this.getAttribute("workarea") || "",
      dataKey:
        this.getAttribute("data-key") ||
        `task-${Math.floor(Math.random() * 10000)}`,
      modalId: `taskModal-${Math.floor(Math.random() * 10000)}`,
      cardId: this.getAttribute("card-id"), // Asegúrate de obtener correctamente el atributo 'card-id'
    };
  }

  setUniqueIdentifiers(attributes) {
    this.setAttribute("data-key", attributes.dataKey);
    this.setAttribute("data-modal-id", attributes.modalId);
    this.setAttribute("card-id", attributes.cardId);
    console.log("Initializing TaskSticker with dataKey:", attributes.dataKey);
    console.log("Card ID:", attributes.cardId); // Verifica que el Card ID sea válido
  }

  render(attributes) {
    const selectedWorkareas = attributes.workarea.split(",");
    this.innerHTML = `
      <style>${this.getStyles()}</style>
      ${this.getCardHTML(attributes)}
      ${this.getModalHTML(attributes, selectedWorkareas)}
    `;
  }

  getStyles() {
    return `
      .background-yellow { background-color: #fadd80; }
      .background-blue { background-color: #92c4de; }
      .background-pink { background-color: #ed98b4; }
      .background-green { background-color: #a6d0b3; }
      .background-grey { background-color: #7c8491; }
    `;
  }

  // Aquí se crea el HTML de la tarjeta
  getCardHTML({ title, dueDate, color, modalId }) {
    return `
    <style>
        .card-margin {
            margin-bottom: 1.875rem;
        }
    
        .card {
            border: 0;
            box-shadow: 0px 0px 10px 0px rgba(82, 63, 105, 0.1);
            -webkit-box-shadow: 0px 0px 10px 0px rgba(82, 63, 105, 0.1);
            -moz-box-shadow: 0px 0px 10px 0px rgba(82, 63, 105, 0.1);
            -ms-box-shadow: 0px 0px 10px 0px rgba(82, 63, 105, 0.1);
        }
    
        .card {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            word-wrap: break-word;
            background-clip: border-box;
            border: 1px solid #e6e4e9;
            border-radius: 8px;
            width: 24vh;
            height: 24vh;
        }
    
        .card .card-header.no-border {
            border: 0;
        }
    
        .card .card-header {
            background-color: transparent;
            padding: 0 0.9375rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            min-height: 50px;
        }
    
        .card-header:first-child {
            border-radius: calc(8px - 1px) calc(8px - 1px) 0 0;
        }
          
        .background-yellow {
          background-color: #fadd80;
        }
    
        .background-blue {
          background-color: #92c4de;
        }
    
        .background-pink {
          background-color: #ed98b4;
        }
    
        .background-green {
          background-color: #a6d0b3;
        }
    
        .background-grey {
          background-color: #7c8491;
        }
          
           .btn-task btn{
                border-radius: 50%;
                border: 2px solid #fafafa;
               
                background-color: transparent;
              }
    
        .btn-task .btn img {
                border-radius: 50%;
                border: 2px solid #fafafa;
            
                background-color: transparent;
              }
      h5{
      font-weight: 600;
      }          
    
    </style>
    
    <div class="container ">
        <div class="row  ">
            <div class="g-0 ">
                <div class="card card-margin  background-${color}">
                    <div class="card-header no-border d-flex justify-content-end mt-2   ">
                     
                    </div>
                    <div class="card-body d-flex pt-0 g-0 p-0 mx-2 row background-${color}">
                      <h5 class="card-title background-${color} text-center" id="card-title">${title}</h5>
                                   
                                <div class="background-${color} d-flex  align-self-center ">
                                    <span class=" d-flex align-self-end background-${color}">${dueDate}</span>               
                        </div>
                             
                </div>
            </div>
        </div>
    </div>
    
        `;
  }

  getModalHTML(
    { title, description, dueDate, modalId, color },
    selectedWorkareas
  ) {
    return `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content background-${color}">
            <div class="modal-header">
              <input type="text" class="form-control" id="editTitle-${modalId}" placeholder="Task Title" value="${title}">
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <input type="date" class="form-control" id="editDueDate-${modalId}" placeholder="Due Date" value="${dueDate}">
              </div>
              <div class="mb-3">
                <textarea class="form-control" id="editDescription-${modalId}" rows="3" placeholder="Task Description">${description}</textarea>
              </div>
              <div>
                  ${this.getWorkareaOptions(selectedWorkareas)}
                </div>
              <div class="mb-3 pt-2">
                <label for="fileUpload-${modalId}">Subir Archivo</label>
                <input type="file" class="form-control" id="fileUpload-${modalId}">
                <button type="button" class="btn btn-primary mt-2" id="uploadFile-${modalId}">Subir Archivo</button>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger delete-task">Delete</button>
              <button type="button" class="btn btn-primary save-task">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getWorkareaOptions(selectedWorkareas) {
    const workareas = ["Front", "Back", "Server", "Testing"];
    return workareas
      .map(
        (area) => `
      <label>
        <input type="checkbox" name="workarea" class="workarea-option" value="${area}" ${
          selectedWorkareas.includes(area) ? "checked" : ""
        }>
        ${area}
      </label><br>
    `
      )
      .join("");
  }

  addEventListeners(modalId, dataKey) {
    const card = this.querySelector(".card");
    const modal = this.querySelector(`#${modalId}`);
    const uploadButton = modal.querySelector(`#uploadFile-${modalId}`);
    const fileInput = modal.querySelector(`#fileUpload-${modalId}`);
    const cardId = this.getAttribute("card-id");

    console.log("Modal:", modal);
    console.log("Upload Button:", uploadButton);
    console.log("File Input:", fileInput);

    if (uploadButton && fileInput) {
      uploadButton.addEventListener("click", () => {
        console.log("Upload button clicked");
        const file = fileInput.files[0];
        if (!file) {
          alert("Por favor selecciona un archivo.");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64Content = reader.result.split(",")[1];
          console.log(
            "Base64 Content (primeros 100 caracteres):",
            base64Content.slice(0, 100)
          );
          console.log("Tamaño Base64:", base64Content.length);

          socket.emit(
            "upload_task_file",
            {
              cardId,
              fileName: file.name,
              fileContent: base64Content,
            },
            (response) => {
              console.log("Socket.IO response:", response);
              if (response.success) {
                alert("Archivo subido exitosamente.");
              } else {
                alert(`Error al subir archivo: ${response.message}`);
              }
            }
          );
        };
        reader.readAsDataURL(file);
      });
    } else {
      console.error("Upload button or file input not found.");
    }

    if (card && modal) {
      // Usa `bind(this)` para asegurarte de que `this` se refiera a la instancia de `TaskSticker`
      card.addEventListener("click", this.showModal.bind(this, modal));
      modal.querySelector(".delete-task").addEventListener("click", () => {
        const cardId = this.getAttribute("card-id"); // Obtener 'card-id' directamente aquí
        if (!cardId || cardId === "null" || cardId === "undefined") {
          console.error("Invalid cardId:", cardId);
          alert("No se puede eliminar la tarea: ID de la tarjeta no válido.");
          return;
        }
        this.deleteTask(dataKey, cardId);
      });

      // aquí mira tú yo que sé, buena suerte.
      const saveButton = modal.querySelector(".save-task");
      if (saveButton) {
        saveButton.addEventListener("click", () => {
          const cardId = this.getAttribute("card-id");
          if (!cardId || cardId === "null" || cardId === "undefined") {
            console.error("Invalid cardId:", cardId);
            alert("Cannot save the task: invalid card ID.");
            return;
          }
          this.saveTask(cardId, modal);
        });
      } else {
        console.error("Save button not found in the modal.");
      }

      // fin del buena suerte.
    } else {
      console.error(`Modal or card element not found. Modal ID: ${modalId}`);
    }
  }

  showModal(modal) {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modal, {
      backdrop: "static",
      keyboard: false,
    });
    modalInstance.show();
  }

  async deleteTask(dataKey, cardId) {
    const token = localStorage.getItem("token");

    // Confirmar antes de eliminar
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      // Realizar la solicitud para eliminar la tarea de la base de datos
      const query = `
        mutation {
          deleteCard(id: "${cardId}") {
            _id
            title
          }
        }
      `;

      const response = await fetch("http://localhost:3000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Eliminar la tarjeta del DOM y del localStorage
      localStorage.removeItem(dataKey);
      this.remove();
      alert("Task deleted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(`Error: ${error.message}`);
    }
  }

  async saveTask(cardId, modal) {
    const token = localStorage.getItem("token");
    const titleInput = modal.querySelector(`#editTitle-${modal.id}`);
    const descriptionInput = modal.querySelector(
      `#editDescription-${modal.id}`
    );
    const dueDateInput = modal.querySelector(`#editDueDate-${modal.id}`);

    // Verifica si los inputs existen antes de obtener sus valores
    const title = titleInput ? titleInput.value : null;
    const description = descriptionInput ? descriptionInput.value : null;
    const dueDateEdit = dueDateInput ? dueDateInput.value : null;

    const selectedWorkareas = Array.from(
      modal.querySelectorAll('input[type="checkbox"]:checked')
    );
    const workareaCount = selectedWorkareas.length;

    // Si hay más de un área de trabajo seleccionada, muestra una alerta y termina
    if (workareaCount > 1) {
      alert("Solo se puede seleccionar un área de trabajo.");
      return;
    }

    // Obtén el valor del área de trabajo si hay una seleccionada
    const workarea = workareaCount === 1 ? selectedWorkareas[0].value : null;

    console.log(title, description, dueDateEdit, workarea);

    let color;
    switch (workarea) {
      case "Front":
        color = "pink";
        break;
      case "Back":
        color = "blue";
        break;
      case "Server":
        color = "yellow";
        break;
      case "Testing":
        color = "green";
        break;
      default:
        color = "grey"; // Color por defecto si `workarea` no coincide con ningún caso
    }

    if (!title || !description) {
      alert("El título y la descripción son obligatorios");
      return;
    }

    try {
      const query = `
        mutation {
          editCard(id: "${cardId}", title: "${title}", description: "${description}", duedate: "${dueDateEdit}", color: "${color}") {
            _id
            title
            description
            duedate
            color
          }
        }
      `;
      const response = await fetch("http://localhost:3000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);

      alert("¡Tarea guardada exitosamente!");

      // Aquí actualizamos la card en el DOM
      const cardTitle = this.querySelector(".card-title");
      const cardDueDate = this.querySelector(".card-body span");

      // Asegúrate de que los elementos existen antes de intentar actualizarlos
      if (cardTitle) cardTitle.textContent = title;
      if (cardDueDate)
        cardDueDate.textContent = dueDateEdit
          ? new Date(dueDateEdit).toISOString().split("T")[0]
          : "Sin fecha asignada";

      // Cambia el color de la card si fue modificado
      const cardElement = this.querySelector(".card");
      if (cardElement) {
        cardElement.className = `card card-margin background-${color}`;
      }
      location.reload();

      return result.data.editCard;
    } catch (error) {
      console.error("Error al guardar la tarea:", error.message);
      alert(`Error: ${error.message}`);
    }
  }
}

customElements.define("task-sticker", TaskSticker);
