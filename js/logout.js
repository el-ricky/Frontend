// logout.js - Cerrar sesión y redirigir al login
document.addEventListener('DOMContentLoaded', function() {

    const btnLogout = document.getElementById('btnLogout');

    async function cerrarSesion() {
        // Confirmación antes de cerrar sesión
        const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
        if (!confirmacion) return; // Si cancela, no hace nada

        try {
            // Llamar al endpoint de logout para invalidar la cookie del servidor
            await fetch('https://backend-salones.vercel.app/api/logout', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.log('Error al llamar al endpoint de logout:', error);
        } finally {
            // Limpiar localStorage y redirigir
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }
});

async function cerrarSesion() {
    const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
    if (!confirmacion) return;

    try {
        await fetch('https://backend-salones.vercel.app/api/logout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log('Error al llamar al endpoint de logout:', error);
    } finally {
        localStorage.clear();
        // Reemplaza la página actual en el historial en vez de agregar una nueva
        // Así el botón "atrás" no puede regresar a la página protegida
        window.location.replace('index.html');
    }
}
