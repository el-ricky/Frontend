const API_URL = "https://backend-salones.vercel.app/api";

// ─── Seguridad: solo admins ───────────────────────────────────────────────────
const userData = JSON.parse(localStorage.getItem('user'));
if (!userData || userData.role !== 'admin') {
    alert('Acceso denegado. Por favor, inicie sesión como administrador.');
    window.location.href = '../login_new.html';
}

// ─── Variables globales ───────────────────────────────────────────────────────
let todosLosUsuarios = []; // Guardamos todos para filtrar sin llamar a la API de nuevo

// ─── Cargar usuarios desde la API ─────────────────────────────────────────────
async function cargarUsuarios() {
    const tbody = document.getElementById('listaUsuarios');
    if (!tbody) return;

    try {
        const response = await fetch(`${API_URL}/cliente`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '../login_new.html';
            return;
        }

        if (!response.ok) throw new Error('Error al obtener usuarios');

        const usuarios = await response.json();

        if (!Array.isArray(usuarios)) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error en el formato de datos</td></tr>';
            return;
        }

        todosLosUsuarios = usuarios; // Guardar para filtros
        renderizarUsuarios(usuarios);

    } catch (error) {
        console.error('Error:', error);
        const tbody = document.getElementById('listaUsuarios');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al conectar con el servidor</td></tr>';
    }
}

// ─── Renderizar tabla ─────────────────────────────────────────────────────────
function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById('listaUsuarios');
    const contador = document.getElementById('contadorResultados');

    contador.textContent = `Mostrando ${usuarios.length} usuario(s)`;

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No se encontraron usuarios con esos criterios</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    usuarios.forEach((u, index) => {
        // activo puede venir como 1/0 o true/false según la BD
        const activo = u.activo === 1 || u.activo === true;
        const badgeClass = activo ? 'bg-success' : 'bg-secondary';
        const estadoTexto = activo ? 'Activo' : 'Inactivo';

        const fila = `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>${u.nombre || '-'}</td>
                <td>${u.aPaterno || '-'}</td>
                <td>${u.aMaterno || '-'}</td>
                <td>${u.telefono || '-'}</td>
                <td>${u.email || '-'}</td>
                <td><span class="badge ${badgeClass}">${estadoTexto}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="desactivarUsuario(${u.id})" 
                        title="Desactivar" ${!activo ? 'disabled' : ''}>
                        Desactivar
                    </button>
                    <button class="btn btn-sm btn-success" onclick="activarUsuario(${u.id})"
                        title="Activar" ${activo ? 'disabled' : ''}>
                        Activar
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
function aplicarFiltros() {
    const nombre  = document.getElementById('filtrNombre').value.trim().toLowerCase();
    const estado  = document.getElementById('filtrEstado').value;

    let filtrados = todosLosUsuarios;

    // Filtro por nombre (busca en nombre, aPaterno o aMaterno)
    if (nombre) {
        filtrados = filtrados.filter(u =>
            (u.nombre   || '').toLowerCase().includes(nombre) ||
            (u.aPaterno || '').toLowerCase().includes(nombre) ||
            (u.aMaterno || '').toLowerCase().includes(nombre)
        );
    }

    // Filtro por estado
    if (estado === 'activo') {
        filtrados = filtrados.filter(u => u.activo === 1 || u.activo === true);
    } else if (estado === 'inactivo') {
        filtrados = filtrados.filter(u => u.activo === 0 || u.activo === false);
    }

    renderizarUsuarios(filtrados);
}

function limpiarFiltros() {
    document.getElementById('filtrNombre').value = '';
    document.getElementById('filtrEstado').value = '';
    renderizarUsuarios(todosLosUsuarios);
}

// ─── Acciones: activar / desactivar ──────────────────────────────────────────
async function desactivarUsuario(id) {
    if (!confirm('¿Estás seguro de que deseas desactivar este usuario?')) return;

    try {
        const response = await fetch(`${API_URL}/cliente/${id}/desactivar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || data.error);

        alert('Usuario desactivado correctamente');
        cargarUsuarios(); // Recargar tabla

    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function activarUsuario(id) {
    if (!confirm('¿Estás seguro de que deseas activar este usuario?')) return;

    try {
        const response = await fetch(`${API_URL}/cliente/${id}/activar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || data.error);

        alert('Usuario activado correctamente');
        cargarUsuarios(); // Recargar tabla

    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();
    document.getElementById('btnFiltrar').addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarFiltros);

    // Filtrar también al presionar Enter en el campo de nombre
    document.getElementById('filtrNombre').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') aplicarFiltros();
    });
});

// Protección contra botón atrás
window.addEventListener('pageshow', function(e) {
    const user = localStorage.getItem('user');
    if (!user) {
        if (e.persisted) window.location.reload();
        else window.location.replace('../index.html');
    }
});
