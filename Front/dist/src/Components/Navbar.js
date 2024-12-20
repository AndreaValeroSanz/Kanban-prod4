import { io } from "socket.io-client";

class Navbar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEventHandlers();
  }

  render() {
    const userEmail = localStorage.getItem("userEmail");
    const userAvatar = localStorage.getItem("userAvatar");

    this.innerHTML = `
      <nav class="navbar p-0 m-0">

          ${
            userEmail
              ? `<div class="d-flex align-items-center">
                  ${
                    userAvatar
                      ? `<img src="${userAvatar}" alt="Avatar" class="rounded-circle me-2" style="width: 40px; height: 40px;">`
                      : ""
                  }
                  <span class="navbar-text me-2">${userEmail}</span>
                  <input type="file" id="avatarInput" class="form-control d-none" />
                  <label for="avatarInput" class="btn btn-sm btn-outline-dark"><i class="bi bi-exposure bg-transparent"></i></label>
                  <button id="logoutButton" class="btn btn-outline-dark btn-sm" title="Logout">
                    <i class="bi bi-box-arrow-right bg-transparent"></i>
                  </button>
                </div>`
              : `<button 
                  type="button" 
                  class="btn btn-primary d-flex align-items-center" 
                  data-bs-toggle="modal" 
                  data-bs-target="#loginModal" 
                  data-bs-whatever="email">
                  Login
                </button>`
          }
        </div>
      </nav>
    `;
  }

  attachEventHandlers() {
    const loginForm = this.querySelector("#loginForm");
    if (loginForm) loginForm.addEventListener("submit", this.handleLogin.bind(this));

    const logoutButton = this.querySelector("#logoutButton");
    if (logoutButton) logoutButton.addEventListener("click", this.handleLogout.bind(this));

    const avatarInput = this.querySelector("#avatarInput");
    if (avatarInput) avatarInput.addEventListener("change", this.uploadAvatar.bind(this));
  }

  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

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
      const response = await fetch("http://localhost:3000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();

      if (result.errors) {
        alert("Error: " + result.errors[0].message);
        return;
      }

      const token = result.data.login.token;
      const user = result.data.login.user;

      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userAvatar", user.avatar || "");
      localStorage.setItem("userId", user._id);

      alert("Login correcto");

      const modal = bootstrap.Modal.getInstance(document.getElementById("loginModal"));
      modal.hide();

      this.render();
      window.location.reload();
    } catch (error) {
      console.error("Connection error:", error);
      alert("Connection or server error");
    }
  }

  handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("userId");
    window.location.reload();
  }

  async uploadAvatar(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const fileContent = reader.result.split(',')[1];
      const fileName = file.name;

      const userId = localStorage.getItem("userId");

      if (!userId) {
        alert("Usuario no autenticado");
        return;
      }

      const socket = io("http://localhost:3000");

      socket.emit("upload_avatar", { userId, fileName, fileContent }, (response) => {
        if (response.success) {
          alert("Avatar subido correctamente");
          localStorage.setItem("userAvatar", response.avatarUrl);
          this.render();
          window.location.reload();
        } else {
          alert("Error al subir el avatar: " + response.message);
        }
      });
    };

    reader.readAsDataURL(file);
  }
}

customElements.define("my-navbar", Navbar);
