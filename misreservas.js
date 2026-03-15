//misreservas.js

// Configuración de la API
const API_URL = 'https://backend-salones.vercel.app/api';

// Elementos del DOM
const mensajeAlerta = document.getElementById('mensajeAlerta');
const tablaBody = document.getElementById('tabla-reservas-body');
const sinReservasDiv = document.getElementById('sinReservas');
const tablaReservas = document.getElementById('tablaReservas');

// Contador para numerar las reservas
let contadorReservas = 1;

// Almacén de todas las reservas y estado del filtro
let todasLasReservas = [];
let mostrandoCanceladas = false;

// Verificar autenticación y cargar reservas al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cargando mis reservas...');
    verificarAutenticacion();
    verificarMensajesURL();
});

async function verificarAutenticacion() {
    try {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            window.location.href = 'login.html?error=sesion_expirada';
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        console.log('Autenticación exitosa:', data);
        
        if (data && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        await cargarReservas();

    } catch (error) {
        console.error('Error de autenticación:', error);
        mostrarMensaje('Error al verificar autenticación. Intente nuevamente.', 'danger');
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="alert alert-danger">
                            Error al verificar autenticación. Intente más tarde.
                            <br>
                            <button class="btn btn-outline-danger mt-2" onclick="location.reload()">
                                Reintentar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function verificarMensajesURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('cancelada') === 'true') {
        mostrarMensaje('Reserva cancelada exitosamente', 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (urlParams.get('error') === 'cancelacion') {
        mostrarMensaje('Error al cancelar la reserva. Intente nuevamente.', 'danger');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function mostrarMensaje(texto, tipo) {
    if (!mensajeAlerta) return;
    
    const alertaClass = tipo === 'success' ? 'alert-success' : 
                       (tipo === 'danger' ? 'alert-danger' : 'alert-info');
    
    mensajeAlerta.innerHTML = `
        <div class="alert ${alertaClass} alert-dismissible fade show text-center" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    setTimeout(() => {
        if (mensajeAlerta) mensajeAlerta.innerHTML = '';
    }, 5000);
}

async function cargarReservas() {
    try {
        console.log('Cargando reservas...');
        
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando reservas...</span>
                        </div>
                        <p class="mt-2">Cargando tus reservas...</p>
                    </td>
                </tr>
            `;
        }
        
        const response = await fetch(`${API_URL}/reservas/cliente`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Respuesta de reservas - Status:', response.status);

        if (response.status === 401) {
            mostrarMensaje('Sesión expirada. Por favor, inicia sesión nuevamente.', 'danger');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        if (response.status === 404) {
            mostrarSinReservas();
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const reservas = await response.json();
        console.log('Reservas cargadas:', reservas);
        
        const reservasArray = Array.isArray(reservas) ? reservas : (reservas ? [reservas] : []);
        
        if (reservasArray.length === 0) {
            mostrarSinReservas();
        } else {
            // Ordenar de más reciente a más antiguo
            reservasArray.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            todasLasReservas = reservasArray;
            filtrarYRenderizar();
        }

    } catch (error) {
        console.error('Error al cargar reservas:', error);
        
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="alert alert-danger">
                            Error al cargar tus reservas. Intente más tarde.
                            <br>
                            <small class="text-muted">${error.message}</small>
                            <br>
                            <button class="btn btn-outline-danger mt-2" onclick="location.reload()">
                                Reintentar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// ── Toggle mostrar/ocultar canceladas ─────────────────────────────────────────
window.toggleCanceladas = function() {
    mostrandoCanceladas = !mostrandoCanceladas;
    const btn = document.getElementById('btnVerCanceladas');
    if (btn) {
        btn.textContent = mostrandoCanceladas ? 'Ocultar canceladas' : 'Ver canceladas';
    }
    filtrarYRenderizar();
};

function filtrarYRenderizar() {
    if (mostrandoCanceladas) {
        renderizarReservas(todasLasReservas);
    } else {
        const activas = todasLasReservas.filter(r => {
            const estado = String(r.estado_pago || '').toLowerCase();
            return !['cancelada', 'cancelado', '3'].includes(estado);
        });
        renderizarReservas(activas);
    }
}

function mostrarSinReservas() {
    if (tablaReservas) tablaReservas.classList.add('d-none');
    if (sinReservasDiv) sinReservasDiv.classList.remove('d-none');
    if (tablaBody) tablaBody.innerHTML = '';
}

// ── Colores por estado ────────────────────────────────────────────────────────
function getBadgeClass(estado) {
    if (!estado) return 'bg-warning';
    
    const estadoLower = String(estado).toLowerCase();
    
    switch(estadoLower) {
        case 'pagado':
        case 'confirmada':
        case '1':
            return 'bg-success';
        case 'cancelada':
        case 'cancelado':
        case '3':
            return 'bg-danger';
        case 'pendiente':
        case '2':
        default:
            return 'bg-warning';
    }
}

function renderizarReservas(reservas) {
    if (!tablaBody) return;
    
    if (tablaReservas) tablaReservas.classList.remove('d-none');
    if (sinReservasDiv) sinReservasDiv.classList.add('d-none');
    
    if (reservas.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    No hay reservas activas para mostrar.
                </td>
            </tr>
        `;
        return;
    }
    
    contadorReservas = 1;
    let html = '';
    
    reservas.forEach((reserva) => {
        const soloFecha = (reserva.fecha || '').split('T')[0];
        const [año, mes, dia] = soloFecha.split('-');
        const fecha = (dia && mes && año) ? `${dia}/${mes}/${año}` : 'Fecha no disponible';

        const estado      = reserva.estado_pago || 'pendiente';
        const badgeClass  = getBadgeClass(estado);
        const nombreSala  = reserva.nombre_salon || reserva.nombre_sala || 'Sala sin nombre';
        const estadoLower = String(estado).toLowerCase();

        // Si está cancelada, ambos botones se deshabilitan
        const estaCancelada = ['cancelada', 'cancelado', '3'].includes(estadoLower);

        const btnCancelar = estaCancelada
            ? `<button class="btn btn-custom" disabled>Cancelado</button>`
            : `<button class="btn btn-custom"
                       onclick="cancelarReserva(${reserva.id}, this)">
                   Cancelar
               </button>`;

        const btnConfirmar = estaCancelada
            ? `<button class="btn btn-custom" disabled>Confirmar</button>`
            : `<button class="btn btn-custom" disabled>Confirmar</button>`;
        
        html += `
            <tr id="fila-reserva-${reserva.id}">
                <td><strong>${contadorReservas}</strong></td>
                <td>${fecha}</td>
                <td>${nombreSala}</td>
                <td>
                    <span class="badge ${badgeClass}">
                        ${estado}
                    </span>
                </td>
                <td>
                    <div class="acciones-reserva">
                        <a href="detallesReserva.html?id=${reserva.id}" 
                           class="btn btn-custom">Detalles</a>
                        ${btnConfirmar}
                        ${btnCancelar}
                    </div>
                </td>
            </tr>
        `;
        
        contadorReservas++;
    });
    
    tablaBody.innerHTML = html;
}

// Cancelar: cambia el badge a rojo sin eliminar la fila 
window.cancelarReserva = async function(reservaId, btnOrigen) {
    if (!reservaId) {
        mostrarMensaje('ID de reserva no válido', 'danger');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return;

    if (btnOrigen) {
        btnOrigen.disabled = true;
        btnOrigen.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Cancelando...`;
    }
    
    try {
        const response = await fetch(`${API_URL}/reservas/${reservaId}/desactivar`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.msg || 'Error al cancelar la reserva');
        }

        // Actualizar el badge a rojo
        const fila = document.getElementById(`fila-reserva-${reservaId}`);
        if (fila) {
            const badge = fila.querySelector('.badge');
            if (badge) {
                badge.className = 'badge bg-danger';
                badge.textContent = 'cancelado';
            }
            // Deshabilitar ambos botones
            if (btnOrigen) {
                btnOrigen.disabled = true;
                btnOrigen.innerHTML = 'Cancelado';
            }
            // Deshabilitar también el botón Confirmar de esa fila
            const btns = fila.querySelectorAll('button');
            btns.forEach(btn => { btn.disabled = true; });
        }

        mostrarMensaje('Reserva cancelada exitosamente.', 'success');

    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        mostrarMensaje('Error al cancelar la reserva. Intente nuevamente.', 'danger');

        if (btnOrigen) {
            btnOrigen.disabled = false;
            btnOrigen.innerHTML = 'Cancelar';
        }
    }
};

// ── Logout ────────────────────────────────────────────────────────────────────
window.confirmarLogout = function() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        console.log('Cerrando sesión...');
        
        fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(() => {
            localStorage.removeItem('user');
            localStorage.removeItem('id');
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error('Error al cerrar sesión:', error);
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
};