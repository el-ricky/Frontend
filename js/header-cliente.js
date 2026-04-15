// js/header-cliente.js

class MiHeaderCliente extends HTMLElement {
    connectedCallback() {
        // Verificar autenticación y rol de cliente
        const userData = JSON.parse(localStorage.getItem('user'));

        // Si no hay usuario, redirigir al login
        if (!userData) {
            window.location.replace('../login_new.html');
            return;
        }

        // Si es admin, redirigir al dashboard de admin
        if (userData.role === 'admin') {
            window.location.replace('../admin/admin_dashboard.html');
            return;
        }

        // Renderizar el header para cliente (igual que el tuyo original)
        this.innerHTML = `
        <header class="header">
            <div class="logo">
                <a href="inicio.html">
                    <img src="img/Logo.png" alt="Logo" class="namedly-icon">
                </a>
            </div>
            <nav class="nav-bar">
                <ul class="nav-menu">
                    <li><a href="inicio.html">Inicio</a></li>
                    <li><a href="SalasDisponibles.html">Reservar</a></li>
                    <li><a href="inicio.html#nosotros">Nosotros</a></li>
                    <li><a href="inicio.html#servicios">Servicios</a></li>
                    <li><a href="inicio.html#contacto">Contacto</a></li>
                </ul>
            </nav>
            <button id="btnLogout" class="btn btn-custom">Cerrar Sesión</button>
        </header>
        `;

        // Configurar el botón de logout (con tu misma lógica, pero mejorada)
        this.configurarLogout();
    }

    configurarLogout() {
        const btn = this.querySelector('#btnLogout');
        if (btn) {
            btn.addEventListener('click', async () => {
                // Confirmación (igual que tu logout.js)
                const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
                if (!confirmacion) return;

                try {
                    // Llamar al endpoint de logout (igual que tu logout.js)
                    await fetch('https://backend-salones.vercel.app/api/logout', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                } finally {
                    // Limpiar localStorage (MEJORADO: clear en lugar de removeItem)
                    localStorage.clear();
                    // Redirigir con replace() para mejor seguridad
                    window.location.replace('../index.html');
                }
            });
        }
    }
}

// Registrar el componente
customElements.define('mi-header-cliente', MiHeaderCliente);