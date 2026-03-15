const API_URL = "https://backend-salones.vercel.app/api";

// Utilidades 

// El login guarda el usuario en localStorage como "user", NO hay JWT token.
// La autenticación viaja en una cookie httpOnly que el navegador envía automáticamente.
function getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

function mostrarMensaje(tipo, texto) {
    const mensaje = document.getElementById("mensaje");
    mensaje.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show text-center" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}

// Cargar datos del cliente al entrar a la página 

async function cargarPerfil() {
    const user = getUser();

    // Protección de sesión
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cliente/info`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"  // envía la cookie de sesión automáticamente
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("No se pudieron cargar los datos del perfil.");
        }

        const cliente = await response.json();
        console.log("Datos del cliente:", cliente);

        // Compatibilidad snake_case / camelCase
        const aPaterno = cliente.aPaterno || cliente.apellido_paterno || "";
        const aMaterno = cliente.aMaterno || cliente.apellido_materno || "";

        document.getElementById("nombre").value    = cliente.nombre    || "";
        document.getElementById("aPaterno").value  = aPaterno;
        document.getElementById("aMaterno").value  = aMaterno;
        document.getElementById("telefono").value  = cliente.telefono  || "";
        document.getElementById("email").value     = cliente.email     || "";
        document.getElementById("direccion").value = cliente.direccion || "";

        document.getElementById("nombreCompleto").textContent =
            `${cliente.nombre || ""} ${aPaterno}`.trim() || "Usuario";

        feather.replace();

    } catch (error) {
        mostrarMensaje("danger", `Error al cargar el perfil: ${error.message}`);
    }
}

//  Guardar cambios del perfil 

async function guardarCambios(e) {
    e.preventDefault();

    if (!getUser()) {
        window.location.href = "login.html";
        return;
    }

    const nombre    = document.getElementById("nombre").value.trim();
    const aPaterno  = document.getElementById("aPaterno").value.trim();
    const aMaterno  = document.getElementById("aMaterno").value.trim();
    const telefono  = document.getElementById("telefono").value.trim();
    const email     = document.getElementById("email").value.trim();
    const direccion = document.getElementById("direccion").value.trim();

    const body = { nombre, aPaterno, aMaterno, telefono, email, password: "placeholder_no_cambia", direccion };

    try {
        const response = await fetch(`${API_URL}/cliente/edit`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || data.error || "Error al actualizar los datos.");
        }

        localStorage.setItem("mensajePerfil", "¡Perfil actualizado correctamente!");
        window.location.href = "perfil.html";
        document.getElementById("nombreCompleto").textContent = `${nombre} ${aPaterno}`.trim();

    } catch (error) {
        mostrarMensaje("danger", `<strong>Error:</strong> ${error.message}`);
    }
}

// Init 

    document.addEventListener("DOMContentLoaded", () => {
        cargarPerfil();
        document.getElementById("formCambios").addEventListener("submit", guardarCambios);
    });
    window.addEventListener('pageshow', function() {
        const user = localStorage.getItem('user');
        if (!user) {
            window.location.href = 'index.html';
        }
    });
