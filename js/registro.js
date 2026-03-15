document.getElementById('registroForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Evita que la página se recargue

    const alertContainer = document.getElementById('alertContainer');

    // 1. Limpieza y Recolección de datos
    const formData = new FormData(this);
    const data = {
        nombre: formatNameExtra(formData.get('nombre').trim()),
        aPaterno: formatNameExtra(formData.get('apellido_paterno').trim()),
        aMaterno: formatNameExtra(formData.get('apellido_materno').trim()),
        telefono: formData.get('telefono').trim(),
        email: formData.get('email').trim().toLowerCase(),
        password: document.getElementById('password').value, // No trimear pass por seguridad
        direccion: formData.get('direccion').trim() || null
    };

    try {
        const response = await fetch('https://backend-salones.vercel.app/api/cliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // 3. Éxito: Redirigir al login
            alertContainer.innerHTML = `
                <div class="alert alert-success text-center" role="alert">
                    ¡Registro exitoso! Redirigiendo...
                </div>`;
            setTimeout(() => {
                window.location.href = 'login_new.html';
            }, 2000);
        } else {
            // 4. Errores controlados (400, 500, etc.)
            alertContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show text-center" role="alert">
                    ${result.msg || result.error || 'Error al registrarse'}
                </div>`;
        }
    } catch (error) {
        // Error de conexión o red
        console.error("Error en la petición:", error);
        alertContainer.innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                No se pudo conectar con el servidor. Intente más tarde.
            </div>`;
    }
});

const formatNameExtra = (str) => {
    return str
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};