// logout.js - Cerrar sesión y redirigir al login

document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar si hay sesión activa (opcional)
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // Elemento del botón de cerrar sesión
    const btnLogout = document.getElementById('btnLogout');
    
    // Función para cerrar sesión (equivalente al logout.php)
    async function cerrarSesion() {
        try {
            // 1. Limpiar localStorage (equivalente a $_SESSION = array())
            localStorage.clear(); // Elimina TODOS los datos del localStorage
            
            // 2. Eliminar cookies de sesión (equivalente a la parte de cookies en PHP)
            eliminarCookie('PHPSESSID'); // Nombre típico de cookie de sesión PHP
            eliminarCookie('sessionid'); // Otro nombre común
            eliminarCookie('connect.sid'); // Para Express.js
            
            // 3. Llamar al endpoint de logout si existe (opcional)
            try {
                await fetch('https://backend-salones.vercel.app/api/logout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.log('Error al llamar al endpoint de logout:', error);
                // Continuamos aunque falle la llamada API
            }
            
        } catch (error) {
            console.error('Error durante el logout:', error);
        } finally {
            // 4. Redirigir al index.html (equivalente a header("Location: index.html"))
            window.location.href = '../index.html';
        }
    }
    
    // Función auxiliar para eliminar cookies
    function eliminarCookie(nombre) {
        document.cookie = nombre + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = nombre + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
        document.cookie = nombre + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname.split('.').slice(-2).join('.');
    }
    
    // Event listener para el botón de cerrar sesión
    if (btnLogout) {
        btnLogout.addEventListener('click', cerrarSesion);
    }
});