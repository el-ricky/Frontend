//detallesReserva.js
// Configuración de la API
const API_URL = 'https://backend-salones.vercel.app/api';

// Elementos del DOM
const mensajeAlerta = document.getElementById('mensajeAlerta');
const spinnerCarga = document.getElementById('spinnerCarga');
const contenedorReserva = document.getElementById('contenedorReserva');
const reservaNoEncontrada = document.getElementById('reservaNoEncontrada');
const tituloSala = document.getElementById('tituloSala');

// Elementos del formulario
const imagenSala = document.getElementById('imagenSala');
const nombreSalaResumen = document.getElementById('nombreSalaResumen');
const capacidadResumen = document.getElementById('capacidadResumen');
const fechaResumen = document.getElementById('fechaResumen');
const horaInicioResumen = document.getElementById('horaInicioResumen');
const horaFinResumen = document.getElementById('horaFinResumen');
const servicioIncluido = document.getElementById('servicioIncluido');
const precioTotal = document.getElementById('precioTotal');
const formaPago = document.getElementById('formaPago');
const estadoAlerta = document.getElementById('estadoAlerta');
const estadoTexto = document.getElementById('estadoTexto');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCancelar = document.getElementById('btnCancelar');

// Variable para almacenar el ID de la reserva
let reservaId = null;

// Verificar autenticación y cargar detalles al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Cargando detalles de reserva...');
    
    const urlParams = new URLSearchParams(window.location.search);
    reservaId = urlParams.get('id');
    
    console.log('ID de reserva:', reservaId);
    
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
        console.log('Autenticación exitosa:', data);
        
        if (data && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        cargarDetallesReserva();

    } catch (error) {
        console.error('Error de autenticación:', error);
        mostrarMensaje('Error al verificar autenticación. Intente nuevamente.', 'danger');
    }
}

async function cargarDetallesReserva() {
    try {
        console.log('Cargando reserva ID:', reservaId);
        
        const response = await fetch(`${API_URL}/reservas/cliente/info/${reservaId}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Respuesta - Status:', response.status);

        if (response.status === 401) {
            mostrarMensaje('Sesión expirada. Por favor, inicia sesión nuevamente.', 'danger');
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            return;
        }

        if (response.status === 403) {
            mostrarReservaNoEncontrada('No tienes permiso para ver esta reserva');
            return;
        }

        if (response.status === 404) {
            mostrarReservaNoEncontrada('Reserva no encontrada');
            return;
        }

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        console.log('Reserva cargada:', data);
        
        const reserva = Array.isArray(data) ? data[0] : data;
        console.log('Reserva procesada:', reserva);
        
        renderizarDetalles(reserva);

    } catch (error) {
        console.error('Error al cargar reserva:', error);
        mostrarReservaNoEncontrada('Error al cargar los detalles de la reserva');
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

function mostrarReservaNoEncontrada(mensaje = 'Reserva no encontrada') {
    if (spinnerCarga) spinnerCarga.classList.add('d-none');
    if (contenedorReserva) contenedorReserva.classList.add('d-none');
    if (reservaNoEncontrada) {
        reservaNoEncontrada.classList.remove('d-none');
        const mensajeElement = reservaNoEncontrada.querySelector('p');
        if (mensajeElement) mensajeElement.textContent = mensaje;
    }
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return 'Fecha no disponible';
    try {
        const fecha = new Date(fechaStr);
        const dia  = String(fecha.getDate()).padStart(2, '0');
        const mes  = String(fecha.getMonth() + 1).padStart(2, '0');
        const año  = fecha.getFullYear();
        return `${dia}/${mes}/${año}`;
    } catch (e) {
        return fechaStr;
    }
}

function formatearHora(horaStr) {
    if (!horaStr) return 'Hora no disponible';
    if (horaStr.includes(':')) {
        const partes = horaStr.split(':');
        return `${partes[0]}:${partes[1]}`;
    }
    return horaStr;
}

// ── Determina si la reserva se puede cancelar ─────────────────────────────────
function puedeCancelar(reserva) {
    if (!reserva) return false;
    
    if (reserva.id_estado_pago !== undefined) {
        // 1 = pagado/confirmada  |  3 = cancelada
        if (reserva.id_estado_pago === 3 || reserva.id_estado_pago === 1) return false;
    } else if (reserva.estado_pago) {
        const estado = String(reserva.estado_pago).toLowerCase();
        // ← Se agregan "cancelado" y "cancelada" para cubrir ambas formas
        if (['cancelada', 'cancelado', 'pagado', 'confirmada'].includes(estado)) return false;
    }
    
    // No permitir cancelar reservas con fecha pasada
    if (reserva.fecha) {
        try {
            const fechaReserva = new Date(reserva.fecha);
            const hoy = new Date();
            fechaReserva.setHours(0, 0, 0, 0);
            hoy.setHours(0, 0, 0, 0);
            if (fechaReserva < hoy) return false;
        } catch (e) {
            console.error('Error al comparar fechas:', e);
        }
    }
    
    return true;
}

function renderizarDetalles(reserva) {
    console.log('Renderizando reserva:', reserva);
    
    if (!reserva) {
        mostrarReservaNoEncontrada('No se encontraron datos de la reserva');
        return;
    }
    
    if (spinnerCarga) spinnerCarga.classList.add('d-none');
    if (contenedorReserva) contenedorReserva.classList.remove('d-none');
    if (reservaNoEncontrada) reservaNoEncontrada.classList.add('d-none');
    
    if (tituloSala) {
        tituloSala.textContent = `Detalles de tu reserva en ${reserva.nombre_sala || 'la sala'}`;
    }
    
    if (nombreSalaResumen) nombreSalaResumen.value = reserva.nombre_sala || 'Sala sin nombre';
    if (capacidadResumen)  capacidadResumen.value  = `${reserva.capacidad_sala || 'N/A'} personas`;
    if (fechaResumen)      fechaResumen.value       = formatearFecha(reserva.fecha);
    if (horaInicioResumen) horaInicioResumen.value  = formatearHora(reserva.hora_inicio);
    if (horaFinResumen)    horaFinResumen.value     = formatearHora(reserva.hora_fin);
    
    if (servicioIncluido) {
        servicioIncluido.value = reserva.nombre_servicio
            ? `Sí (${reserva.nombre_servicio})`
            : 'No';
    }
    
    if (precioTotal) {
        const total = reserva.total_pagar ? parseFloat(reserva.total_pagar).toFixed(2) : '0.00';
        precioTotal.value = `$${total}`;
    }
    
    if (formaPago) formaPago.textContent = 'PayPal';
    
    // ── Estado ────────────────────────────────────────────────────────────────
    const estado     = reserva.estado_pago || 'pendiente';
    const estadoLower = String(estado).toLowerCase();
    const esCancelada = ['cancelada', 'cancelado', '3'].includes(estadoLower) || reserva.id_estado_pago === 3;
    const esConfirmada = ['pagado', 'confirmada', '1'].includes(estadoLower) || reserva.id_estado_pago === 1;
    const puedeCancel = puedeCancelar(reserva);
    
    if (estadoAlerta && estadoTexto) {
        estadoAlerta.className = 'alert text-center';
        
        if (esConfirmada) {
            estadoAlerta.classList.add('alert-success');
            estadoTexto.textContent = 'Confirmada';
        } else if (esCancelada) {
            // ← Cambio: usa alert-danger (rojo) en vez de alert-secondary
            estadoAlerta.classList.add('alert-danger');
            estadoTexto.textContent = 'Cancelada';
        } else {
            estadoAlerta.classList.add('alert-warning');
            estadoTexto.textContent = 'Pendiente';
        }
    }
    
    // ── Botón Confirmar: solo visible si está pendiente y no está cancelada ───
    if (btnConfirmar) {
        const puedeConfirmar = !esCancelada && !esConfirmada && puedeCancel;
        btnConfirmar.classList.toggle('d-none', !puedeConfirmar);
    }
    
    // ── Botón Cancelar: deshabilitado si ya está cancelada o no se puede ──────
    if (btnCancelar) {
        if (!puedeCancel) {
            btnCancelar.disabled = true;
            btnCancelar.classList.add('opacity-50');
            btnCancelar.title = esCancelada
                ? 'Esta reserva ya está cancelada'
                : esConfirmada
                    ? 'No se puede cancelar una reserva confirmada'
                    : 'No se puede cancelar una reserva pasada';
        } else {
            btnCancelar.disabled = false;
            btnCancelar.classList.remove('opacity-50');
            btnCancelar.title = 'Cancelar reserva';
        }
    }
    
    if (imagenSala) {
        imagenSala.src = 'img/sala-default.jpg';
        imagenSala.alt = `Imagen de ${reserva.nombre_sala || 'la sala'}`;
    }
}

// ── Confirmar reserva ─────────────────────────────────────────────────────────
// FIX: Se obtiene el botón directamente por ID en lugar de depender de event.target
window.confirmarReserva = async function() {
    if (!reservaId) {
        mostrarMensaje('ID de reserva no válido', 'danger');
        return;
    }
    
    if (!confirm('¿Confirmar esta reserva?')) return;
    
    const boton = document.getElementById('btnConfirmar');
    const textoOriginal = boton ? boton.innerHTML : '';
    
    if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Confirmando...';
    }
    
    try {
        const response = await fetch(`${API_URL}/reservas/${reservaId}/activar`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            mostrarMensaje('Reserva confirmada exitosamente', 'success');
            setTimeout(() => { cargarDetallesReserva(); }, 1500);
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.msg || 'Error al confirmar la reserva');
        }
    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        mostrarMensaje(error.message, 'danger');
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    }
};

// ── Cancelar reserva ──────────────────────────────────────────────────────────
// FIX: Se obtiene el botón directamente por ID en lugar de depender de event.target
window.cancelarReserva = async function() {
    if (!reservaId) {
        mostrarMensaje('ID de reserva no válido', 'danger');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return;
    
    const boton = document.getElementById('btnCancelar');
    const textoOriginal = boton ? boton.innerHTML : '';
    
    if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Cancelando...';
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
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    }
};

// ── Logout ────────────────────────────────────────────────────────────────────
window.confirmarLogout = function() {
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
        .catch(error => {
            console.error('Error al cerrar sesión:', error);
            localStorage.clear();
            window.location.href = 'login_new.html';
        });
    }
};