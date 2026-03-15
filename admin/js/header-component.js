class MiHeader extends HTMLElement {
    connectedCallback() {
        const userData = JSON.parse(localStorage.getItem('user'));

        if (!userData || userData.role !== 'admin') {
            window.location.replace('../login_new.html');
            return; 
        }

        this.innerHTML = `
        <header class="header">
            <div class="logo">
                <a href="admin_dashboard.html">
                    <img src="../img/Logo.png" alt="Logo" class="namedly-icon">
                </a>
            </div>
            <nav class="nav-bar">
                <ul class="nav-menu">
                    <li><a href="admin_dashboard.html">Inicio</a></li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown">Salas</a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="crear_sala.html">Crear sala</a></li>
                            <li><a class="dropdown-item" href="editar_sala.html">Editar sala</a></li>
                        </ul>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-bs-toggle="dropdown">Reservas</a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="ver_reservas.html">Ver reservas</a></li>
                            <li><a class="dropdown-item" href="editar_reserva.html">Editar reservas</a></li>
                        </ul>
                    </li>
                    <li><a href="ver_usuarios.html">Usuarios</a></li>
                    <li><a href="ver_reportes.html">Reportes</a></li>
                </ul>
            </nav>
            <button id="btnLogout" class="btn btn-custom">Cerrar Sesión</button>
        </header>
        `;
        this.configurarLogout();
    }

    configurarLogout() {
        const btn = this.querySelector('#btnLogout');
        if (btn) {
            btn.addEventListener('click', async () => {
                const confirmacion = confirm('¿Estás seguro de que deseas cerrar sesión?');
                if (!confirmacion) return;

                try {
                    await fetch('https://backend-salones.vercel.app/api/logout', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                } finally {
                    localStorage.clear();
                    window.location.replace('../index.html');
                }
            });
        }
    }

}

customElements.define('mi-header', MiHeader);