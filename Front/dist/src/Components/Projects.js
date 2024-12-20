import { createProject, editProject, deleteProject } from "../Controllers/ProjectsController.js";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("No estás autenticado. Redirigiendo al login...");
        window.location.href = "index.html";
        return;
    }

    const projectsContainer = document.getElementById("projectsContainer");
    const createProjectForm = document.getElementById("createProjectForm");
    const projectForm = document.getElementById("projectForm");
    const cancelButton = document.getElementById("cancelButton");
    const createProjectButton = document.getElementById("createProjectButton");

    // Mostrar el formulario de creación de proyecto
    createProjectButton.addEventListener("click", () => {
        createProjectForm.style.display = "block";
    });

    // Ocultar el formulario de creación de proyecto
    cancelButton.addEventListener("click", () => {
        createProjectForm.style.display = "none";
    });

    const fetchProjects = async () => {
        try {
            const response = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        query {
                            projects {
                                _id
                                title
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();

            if (result.errors) {
                console.error("Error al obtener los proyectos:", result.errors);
                return [];
            }

            return result.data.projects;
        } catch (error) {
            console.error("Error al obtener los proyectos:", error);
            return [];
        }
    };

    const renderProjects = (projects) => {
        projectsContainer.innerHTML = "";

        if (projects.length === 0) {
            projectsContainer.innerHTML = "<p>No tienes proyectos disponibles.</p>";
            return;
        }

        const list = document.createElement("ul");
        list.classList.add("list-group");
        projectsContainer.appendChild(list);

        projects.forEach((project) => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");

            listItem.innerHTML = `
                <div class="d-flex align-items-center" style="background: #ffffff;">
                    <button class="btn btn-sm btn-outline-primary dashboard-btn me-3" data-id="${project._id}">
                        <i id="dashboardIcon" class="bi bi-box-arrow-in-right"></i>
                    </button>
                    <span style="background: #ffffff;">${project.title}</span>
                </div>
                <div class="d-flex align-items-center" style="background: #ffffff;">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${project._id}">
                        <i id="editIcon" class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${project._id}">
                        <i id="deleteIcon" class="bi bi-trash"></i>
                    </button>
                </div>
            `;

            list.appendChild(listItem);

            // Eventos de edición
            listItem.querySelector(".edit-btn").addEventListener("click", async () => {
                const newTitle = prompt("Introduce el nuevo título del proyecto:");
                if (newTitle && newTitle.trim() !== "") {
                    const success = await editProject(project._id, newTitle, token);
                    if (success) await loadAndRenderProjects();
                }
            });

            // Eventos de eliminación
            listItem.querySelector(".delete-btn").addEventListener("click", async () => {
                const confirmation = confirm("¿Estás seguro de que deseas eliminar este proyecto?");
                if (confirmation) {
                    const success = await deleteProject(project._id, token);
                    if (success) await loadAndRenderProjects();
                }
            });
        });

        // Mostrar los Dashboard
        document.querySelectorAll(".dashboard-btn").forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", (event) => {
                    const projectId = event.currentTarget.getAttribute("data-id");
                    const projectTitle = event.currentTarget.closest("li").querySelector("span").textContent;
                    localStorage.setItem("projectId", projectId);
                    localStorage.setItem("projectName", projectTitle);
                    window.location.href = `dashboard.html?projectId=${projectId}`;
                });
            }
        });
    };

    const loadAndRenderProjects = async () => {
        const projects = await fetchProjects();
        renderProjects(projects);
    };

    // Manejo del formulario de creación
    projectForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = document.getElementById("projectTitle").value;

        let userId;
        try {
            const decodedToken = JSON.parse(atob(token.split(".")[1]));
            userId = decodedToken.userId;
        } catch (error) {
            console.error("Error al decodificar el token:", error);
            alert("Token inválido. Por favor, inicia sesión nuevamente.");
            return;
        }

        // Convertir userId a un array
        const userIdArray = [userId];

        const newProject = await createProject(title, userIdArray, token);
        if (newProject) {
            createProjectForm.style.display = "none";
            document.getElementById("projectTitle").value = "";
            await loadAndRenderProjects();
        }
    });

    cancelButton.addEventListener("click", () => {
        createProjectForm.style.display = "none";
    });

    // Inicializar lista de proyectos
    await loadAndRenderProjects();
});
