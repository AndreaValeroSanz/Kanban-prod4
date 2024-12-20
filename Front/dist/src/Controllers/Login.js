document.addEventListener("DOMContentLoaded", () => {
    const signinButton = document.getElementById("signinButton");
    const loginForm = document.getElementById("loginForm");

    signinButton.addEventListener("click", async (event) => {
        event.preventDefault(); // Prevenir el comportamiento por defecto del formulario

        // Obtener los valores de los campos
        const email = loginForm.querySelector("#email").value.trim();
        const password = loginForm.querySelector("#password").value.trim();

        // Validar campos vacíos
        if (!email || !password) {
            alert("Por favor, ingresa tu correo y contraseña.");
            return;
        }

        const query = `
        mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                token
                user {
                    _id
                    email
                    avatar
                }
            }
        }
        `;
        const variables = { email, password };

        try {
            // Realizar la solicitud
            const response = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ query, variables }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Manejo de errores del servidor GraphQL
            if (result.errors) {
                alert("Error: " + result.errors[0].message);
                return;
            }

            // Extraer el token y guardar en localStorage
            const token = result.data.login.token;
            const user = result.data.login.user;

            localStorage.setItem("token", token);
            localStorage.setItem("userEmail", user.email);
            localStorage.setItem("userAvatar", user.avatar || "");
            localStorage.setItem("userId", user._id);
            alert("Login correcto");

            // Redirigir después del login exitoso
            window.location.href = "projects.html";

        } catch (error) {
            console.error("Connection error:", error);
            alert("Connection or server error.");
        }
    });
});
