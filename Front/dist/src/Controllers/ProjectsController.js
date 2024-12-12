// Crear un nuevo proyecto
const createProject = async (title, userId, token) => {
    try {
        const response = await fetch("http://localhost:3000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: `
                    mutation CreateProject($title: String!, $userId: String!) {
                        createProject(title: $title, userId: $userId) {
                            _id
                            title
                            user_id
                        }
                    }
                `,
                variables: { title, userId },
            }),
        });

        const result = await response.json();

        if (result.errors) {
            console.error("Error al crear el proyecto:", result.errors[0].message);
            alert("Error al crear el proyecto.");
            return null;
        }

        alert("Proyecto creado con éxito.");
        return result.data.createProject;
    } catch (error) {
        console.error("Error al crear el proyecto:", error);
        alert("Hubo un error al crear el proyecto. Intenta nuevamente.");
        return null;
    }
};

// Editar un proyecto
const editProject = async (projectId, newTitle, token) => {
    try {
        const response = await fetch("http://localhost:3000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: `
                    mutation EditProject($id: ID!, $title: String!) {
                        editProject(id: $id, title: $title) {
                            _id
                            title
                        }
                    }
                `,
                variables: { id: projectId, title: newTitle },
            }),
        });

        const result = await response.json();

        if (result.errors) {
            alert("Error al editar el proyecto: " + result.errors[0].message);
            return false;
        }

        alert("Proyecto editado con éxito.");
        return true;
    } catch (error) {
        console.error("Error al editar el proyecto:", error);
        alert("Hubo un error al editar el proyecto.");
        return false;
    }
};

// Eliminar un proyecto
const deleteProject = async (projectId, token) => {
     try {
         const response = await fetch("http://localhost:3000/graphql", {
             method: "POST",
             headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${token}`,
             },
             body: JSON.stringify({
                 query: `
                     mutation DeleteProject($id: ID!) {
                         deleteProject(id: $id) {
                             _id
                             title
                         }
                     }
                 `,
                 variables: { id: projectId },
             }),
         });

         const result = await response.json();

         // Verifica la respuesta del servidor
         console.log('Response from server:', result);

         if (result.errors) {
             alert("Error al eliminar el proyecto: " + result.errors[0].message);
             return false;
         }

         // Verifica que el proyecto se ha eliminado
         if (result.data.deleteProject) {
             alert("Proyecto eliminado con éxito.");
             return true;
         } else {
             alert("No se pudo eliminar el proyecto.");
             return false;
         }
     } catch (error) {
         console.error("Error al eliminar el proyecto:", error);
         alert("Hubo un error al eliminar el proyecto.");
         return false;
     }
 };

// Exportar las funciones
export { createProject, editProject, deleteProject };