// js/auth-check.js - Verificación de autenticación (se ejecuta primero)

(function() {
    // Obtener datos del usuario desde localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    
    // Obtener la ruta actual para saber dónde estamos
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('/admin/');
    
    // Caso 1: No hay usuario logueado
    if (!userData) {
        // Redirigir al login
        window.location.replace('../login_new.html');
        return;
    }
    
    // Caso 2: Es admin pero está en página de cliente
    if (userData.role === 'admin' && !isAdminPage) {
        // Redirigir al dashboard de admin
        window.location.replace('../admin/admin_dashboard.html');
        return;
    }
    
    // Caso 3: Es cliente pero está en página de admin
    if (userData.role === 'cliente' && isAdminPage) {
        // Redirigir al dashboard de cliente
        window.location.replace('inicio.html');
        return;
    }
    
    // Si pasa todas las verificaciones, guardar timestamp de la última verificación
    sessionStorage.setItem('lastAuthCheck', Date.now());
})();