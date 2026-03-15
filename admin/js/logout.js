// admin/js/logout.js
document.addEventListener('DOMContentLoaded', function() {

    const btnLogout = document.getElementById('btnLogout');

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
            window.location.replace('../index.html'); // ← con ../
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }
});