document.addEventListener("DOMContentLoaded", function () {
  getAllTasks();
});
function convertToISODate(dateString) {
  const parts = dateString.split("/"); // Suponemos que el formato es "DD/MM/YYYY"
  if (parts.length === 3) {
    // Convertir de "DD/MM/YYYY" a "YYYY-MM-DD"
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString; // Si el formato no es válido, devolvemos null
}
async function getAllTasks() {
  const token = localStorage.getItem("token"); // Get the token from localStorage

  // Define the columns with the correct IDs
  const columns = {
    "on-hold": document.getElementById("on-hold"),
    "not-started": document.getElementById("not-started"),
    "in-progress": document.getElementById("in-progress"),
    "review-ready": document.getElementById("review-ready"),
    done: document.getElementById("done"),
  };

  // Check if all the columns are available
  if (
    !columns["on-hold"] ||
    !columns["not-started"] ||
    !columns["in-progress"] ||
    !columns["review-ready"] ||
    !columns["done"]
  ) {
    console.error("One or more task columns are not available.");
    return;
  }
  const projects_id = new URLSearchParams(window.location.search).get(
    "projectId"
  );
  console.log("Project ID:", projects_id);

  const query = `
  query GetAllCards($projectId: ID) {
    getAllCards(projectId: $projectId) {
      _id
      title
      description
      duedate
      type
      color
      user_id
      projects_id
    }
  }
`;

  try {
    const response = await fetch("http://localhost:3000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        variables: { projectId: projects_id }, // Pasar el projectId como variable
      }),
    });

    if (!response.ok) {
      throw new Error(`Server response error: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const cards = result.data.getAllCards;

    if (!cards || cards.length === 0) {
      console.log("No cards found.");
      return;
    }

    // Iterate over each card and create an element in the DOM
    cards.forEach((card) => {
      const { _id, title, description, duedate, type, color } = card;

      if (!_id) {
        console.error("Card ID is null or undefined:", card);
        return;
      }

      const postItColour = color;
      // console.log(`Card ID: ${_id}, Title: ${title}, Description: ${description}, Due Date: ${duedate}, Type: ${type}`);
      console.log(new Date(duedate));

      let dueDateString = "Sin fecha"; // Valor por defecto

      // Si duedate es un número (milisegundos)
      if (typeof duedate === "number") {
        const dueDateValue = new Date(duedate); // Convertir milisegundos a fecha
        dueDateString = dueDateValue.toISOString().split("T")[0]; // Obtener solo la parte de la fecha
      }
      // Si duedate es una cadena (esperamos que sea "DD/MM/YYYY")
      else if (typeof duedate === "string") {
        const formattedDate = convertToISODate(duedate); // Convertir "DD/MM/YYYY" a "YYYY-MM-DD"
        if (formattedDate) {
          const dueDateValue = new Date(formattedDate); // Crear un objeto Date con la fecha reformateada
          if (!isNaN(dueDateValue.getTime())) {
            dueDateString = dueDateValue.toISOString().split("T")[0]; // Obtener solo la parte de la fecha
          }
        }
      }

      // Create a draggable div
      const dragDiv = document.createElement("div");
      dragDiv.classList.add("drag");
      dragDiv.setAttribute("draggable", "true"); // Set draggable to true

      const taskSticker = document.createElement("task-sticker");
      taskSticker.setAttribute("title", title);
      taskSticker.setAttribute("description", description);
      taskSticker.setAttribute("color", postItColour);
      taskSticker.setAttribute("dueDate", dueDateString);
      taskSticker.setAttribute("card-id", _id); // Assign the 'card-id' correctly

      dragDiv.appendChild(taskSticker);

      // Use the type directly to match the column keys
      const normalizedType = type.toLowerCase();
      const targetColumn = columns[normalizedType] || columns["done"]; // Default to "done" if type is unrecognized

      if (targetColumn) {
        const contentSlot = targetColumn.querySelector('[slot="content"]');
        if (contentSlot) {
          contentSlot.appendChild(dragDiv);
        } else {
          console.error(
            `Content slot not found for column with type: ${normalizedType}`
          );
        }
      } else {
        console.error(
          `No target column found for card type: ${normalizedType}`
        );
      }
    });

    dragInit(); // Initialize the drag-and-drop functionality
  } catch (error) {
    console.error("Error fetching cards:", error);
  }
}
