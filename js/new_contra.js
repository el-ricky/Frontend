const form = document.getElementById("formPassword");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pass = document.getElementById("password_actual").value;
    const new_pass = document.getElementById("password_nueva").value;
    const confirm = document.getElementById("password_confirmar").value;
    mensaje.innerHTML = "";

    if (new_pass !== confirm) {
        mensaje.innerHTML = `
            <div class="alert alert-danger text-center">
                Error: Las contraseñas no coinciden
            </div>`;
        return;
    }

    try {
        const response = await fetch(
            "https://backend-salones.vercel.app/api/cliente/changePassword",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ pass, new_pass })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || data.error || "Error desconocido");
        }

        mensaje.innerHTML = `
            <div class="alert alert-success text-center">
                ¡Contraseña cambiada correctamente!
            </div>`;
        form.reset();
    } catch (error) {
        mensaje.innerHTML = `
            <div class="alert alert-danger text-center">
                ${error.message}
            </div>`;
    }
});