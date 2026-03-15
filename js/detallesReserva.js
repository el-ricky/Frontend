//detallesReserva.js

const API_URL = 'https://backend-salones.vercel.app/api';

const mensajeAlerta      = document.getElementById('mensajeAlerta');
const spinnerCarga       = document.getElementById('spinnerCarga');
const contenedorReserva  = document.getElementById('contenedorReserva');
const reservaNoEncontrada = document.getElementById('reservaNoEncontrada');
const tituloSala         = document.getElementById('tituloSala');

const imagenSala         = document.getElementById('imagenSala');
const nombreSalaResumen  = document.getElementById('nombreSalaResumen');
const capacidadResumen   = document.getElementById('capacidadResumen');
const fechaResumen       = document.getElementById('fechaResumen');
const horaInicioResumen  = document.getElementById('horaInicioResumen');
const horaFinResumen     = document.getElementById('horaFinResumen');
const servicioIncluido   = document.getElementById('servicioIncluido');
const precioTotal        = document.getElementById('precioTotal');
const formaPago          = document.getElementById('formaPago');
const estadoAlerta       = document.getElementById('estadoAlerta');
const estadoTexto        = document.getElementById('estadoTexto');

let reservaId = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    reservaId = urlParams.get('id');

    if (!reservaId) {
        mostrarReservaNoEncontrada('No se especificó ninguna reserva');
        return;
    }
    verificarAutenticacion();
});

async function verificarAutenticacion() {
    try {
        const response = await fetch(`${API_URL}/verify`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 401) {
            window.location.href = 'login_new.html?error=sesion_expirada';
            return;
        }
        if (!response.ok) throw new Error(`Error ${response.status}`);

        const data = await response.json();
        if (data && data.user) localStorage.setItem('user', JSON.stringify(data.user));

        cargarDetallesReserva();

    } catch (error) {
        console.error('Error de autenticación:', error);
        mostrarMensaje('Error al verificar autenticación. Intente nuevamente.', 'danger');
    }
}

async function cargarDetallesReserva() {
    try {
        const response = await fetch(`${API_URL}/reservas/cliente/info/${reservaId}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 401) {
            mostrarMensaje('Sesión expirada. Por favor, inicia sesión nuevamente.', 'danger');
            setTimeout(() => { window.location.href = 'login_new.html'; }, 2000);
            return;
        }
        if (response.status === 403) { mostrarReservaNoEncontrada('No tienes permiso para ver esta reserva'); return; }
        if (response.status === 404) { mostrarReservaNoEncontrada('Reserva no encontrada'); return; }
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data    = await response.json();
        const reserva = Array.isArray(data) ? data[0] : data;
        renderizarDetalles(reserva);

    } catch (error) {
        console.error('Error al cargar reserva:', error);
        mostrarReservaNoEncontrada('Error al cargar los detalles de la reserva');
    }
}

function mostrarMensaje(texto, tipo) {
    if (!mensajeAlerta) return;
    const alertaClass = tipo === 'success' ? 'alert-success' : (tipo === 'danger' ? 'alert-danger' : 'alert-info');
    mensajeAlerta.innerHTML = `
        <div class="alert ${alertaClass} alert-dismissible fade show text-center" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    setTimeout(() => { if (mensajeAlerta) mensajeAlerta.innerHTML = ''; }, 5000);
}

function mostrarReservaNoEncontrada(mensaje = 'Reserva no encontrada') {
    if (spinnerCarga)       spinnerCarga.classList.add('d-none');
    if (contenedorReserva)  contenedorReserva.classList.add('d-none');
    if (reservaNoEncontrada) {
        reservaNoEncontrada.classList.remove('d-none');
        const el = reservaNoEncontrada.querySelector('p');
        if (el) el.textContent = mensaje;
    }
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha no disponible';
    try {
        const soloFecha = fechaStr.split('T')[0];
        const [año, mes, dia] = soloFecha.split('-');
        return `${dia}/${mes}/${año}`;
    } catch (e) { return fechaStr; }
}

function formatearHora(horaStr) {
    if (!horaStr) return 'Hora no disponible';
    if (horaStr.includes(':')) {
        const partes = horaStr.split(':');
        return `${partes[0]}:${partes[1]}`;
    }
    return horaStr;
}

function renderizarDetalles(reserva) {
    if (!reserva) { mostrarReservaNoEncontrada('No se encontraron datos de la reserva'); return; }

    if (spinnerCarga)       spinnerCarga.classList.add('d-none');
    if (contenedorReserva)  contenedorReserva.classList.remove('d-none');
    if (reservaNoEncontrada) reservaNoEncontrada.classList.add('d-none');

    if (tituloSala) tituloSala.textContent = `Detalles de tu reserva en ${reserva.nombre_sala || 'la sala'}`;

    if (nombreSalaResumen) nombreSalaResumen.value = reserva.nombre_sala || 'Sala sin nombre';
    if (capacidadResumen)  capacidadResumen.value  = `${reserva.capacidad_sala || 'N/A'} personas`;
    if (fechaResumen)      fechaResumen.value       = formatearFecha(reserva.fecha);
    if (horaInicioResumen) horaInicioResumen.value  = formatearHora(reserva.hora_inicio);
    if (horaFinResumen)    horaFinResumen.value     = formatearHora(reserva.hora_fin);
    if (servicioIncluido)  servicioIncluido.value   = reserva.nombre_servicio ? `Sí (${reserva.nombre_servicio})` : 'No';
    if (precioTotal) {
        const total = reserva.total_pagar ? parseFloat(reserva.total_pagar).toFixed(2) : '0.00';
        precioTotal.value = `$${total}`;
    }
    if (formaPago) formaPago.textContent = 'PayPal';

    // Determinar estado 
    const estado      = String(reserva.estado_pago || 'pendiente').toLowerCase();
    const esCancelada = ['cancelada', 'cancelado', '3'].includes(estado) || reserva.id_estado_pago === 3;
    const esPagada    = ['pagado', 'confirmada', '1'].includes(estado)   || reserva.id_estado_pago === 1;
    const esPendiente = !esCancelada && !esPagada;

    //  Badge de estado 
    if (estadoAlerta && estadoTexto) {
        estadoAlerta.className = 'alert text-center';
        if (esPagada) {
            estadoAlerta.classList.add('alert-success');
            estadoTexto.textContent = 'Confirmada / Pagada';
        } else if (esCancelada) {
            estadoAlerta.classList.add('alert-danger');
            estadoTexto.textContent = 'Cancelada';
        } else {
            estadoAlerta.classList.add('alert-warning');
            estadoTexto.textContent = 'Pendiente';
        }
    }

    const divBotones = document.getElementById('divBotones');
    if (divBotones) {
        if (esCancelada) {
            // Solo el botón Regresar
            divBotones.innerHTML = `
                <a href="misreservas.html" class="btn btn-custom w-100">
                    <i data-feather="arrow-left"></i> Regresar
                </a>`;
        } else if (esPagada) {
            divBotones.innerHTML = `
                <button class="btn btn-custom w-100" disabled>Confirmar Reserva</button>
                <button class="btn btn-custom w-100" onclick="cancelarReserva()">Cancelar</button>
                <a href="editarReserva.html?id=${reservaId}" class="btn btn-custom w-100">Editar</a>`;
        } else {
            // Pendiente
            divBotones.innerHTML = `
                <a href="confirmarPago.html?id=${reservaId}" class="btn btn-custom w-100">Confirmar Reserva</a>
                <button class="btn btn-custom w-100" onclick="cancelarReserva()">Cancelar</button>
                <a href="editarReserva.html?id=${reservaId}" class="btn btn-custom w-100">Editar</a>`;
        }
        // Re-inicializar feather icons después de inyectar HTML
        if (typeof feather !== 'undefined') feather.replace();
    }

    if (imagenSala) {
        imagenSala.src = 'img/sala-default.jpg';
        imagenSala.alt = `Imagen de ${reserva.nombre_sala || 'la sala'}`;
    }
}

// Cancelar 
window.cancelarReserva = async function () {
    if (!reservaId) { mostrarMensaje('ID de reserva no válido', 'danger'); return; }
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return;

    const boton = document.querySelector('#divBotones button:nth-child(2)');
    if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Cancelando...';
    }

    try {
        const response = await fetch(`${API_URL}/reservas/${reservaId}/desactivar`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            window.location.href = 'misreservas.html?cancelada=true';
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.msg || 'Error al cancelar la reserva');
        }
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        mostrarMensaje(error.message, 'danger');
        if (boton) { boton.disabled = false; boton.innerHTML = 'Cancelar'; }
    }
};

// Logout 
window.confirmarLogout = function () {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(() => {
            localStorage.removeItem('user');
            localStorage.removeItem('id');
            window.location.href = 'login_new.html';
        })
        .catch(() => {
            localStorage.clear();
            window.location.href = 'login_new.html';
        });
    }
};