//misreservas.js

const API_URL = 'https://backend-salones.vercel.app/api';

const mensajeAlerta   = document.getElementById('mensajeAlerta');
const tablaBody       = document.getElementById('tabla-reservas-body');
const sinReservasDiv  = document.getElementById('sinReservas');
const tablaReservas   = document.getElementById('tablaReservas');

let contadorReservas    = 1;
let todasLasReservas    = [];
let mostrandoCanceladas = false;

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    verificarMensajesURL();
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

        await cargarReservas();

    } catch (error) {
        console.error('Error de autenticación:', error);
        mostrarMensaje('Error al verificar autenticación. Intente nuevamente.', 'danger');
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
    const alertaClass = tipo === 'success' ? 'alert-success' : (tipo === 'danger' ? 'alert-danger' : 'alert-info');
    mensajeAlerta.innerHTML = `
        <div class="alert ${alertaClass} alert-dismissible fade show text-center" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    setTimeout(() => { if (mensajeAlerta) mensajeAlerta.innerHTML = ''; }, 5000);
}

async function cargarReservas() {
    try {
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status"></div>
                        <p class="mt-2">Cargando tus reservas...</p>
                    </td>
                </tr>`;
        }

        const response = await fetch(`${API_URL}/reservas/cliente`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 401) {
            mostrarMensaje('Sesión expirada. Por favor, inicia sesión nuevamente.', 'danger');
            setTimeout(() => { window.location.href = 'login_new.html'; }, 2000);
            return;
        }
        if (response.status === 404) { mostrarSinReservas(); return; }
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const reservas     = await response.json();
        const reservasArray = Array.isArray(reservas) ? reservas : (reservas ? [reservas] : []);

        if (reservasArray.length === 0) {
            mostrarSinReservas();
        } else {
            reservasArray.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            todasLasReservas = reservasArray;
            filtrarYRenderizar();
        }

    } catch (error) {
        console.error('Error al cargar reservas:', error);
        if (tablaBody) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-5">
                        <div class="alert alert-danger">
                            Error al cargar tus reservas. Intente más tarde.<br>
                            <small class="text-muted">${error.message}</small><br>
                            <button class="btn btn-outline-danger mt-2" onclick="location.reload()">Reintentar</button>
                        </div>
                    </td>
                </tr>`;
        }
    }
}

window.toggleCanceladas = function () {
    mostrandoCanceladas = !mostrandoCanceladas;
    const btn = document.getElementById('btnVerCanceladas');
    if (btn) btn.textContent = mostrandoCanceladas ? 'Ocultar canceladas' : 'Ver canceladas';
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
    if (tablaBody)      tablaBody.innerHTML = '';
}

function getBadgeClass(estado) {
    const e = String(estado || '').toLowerCase();
    if (['pagado', 'confirmada', '1'].includes(e))    return 'bg-success';
    if (['cancelada', 'cancelado', '3'].includes(e))  return 'bg-danger';
    return 'bg-warning';
}

function generarBotones(reserva) {
    const estado = String(reserva.estado_pago || 'pendiente').toLowerCase();
    const id     = reserva.id;

    const esCancelada = ['cancelada', 'cancelado', '3'].includes(estado);
    const esPagada    = ['pagado', 'confirmada', '1'].includes(estado);

    const btnDetalles = `<a href="detallesReserva.html?id=${id}" class="btn btn-custom">Detalles</a>`;

    const btnConfirmar = (!esCancelada && !esPagada)
        ? `<button class="btn btn-custom" onclick="pagarReserva(${id})">Confirmar</button>`
        : `<button class="btn btn-custom" disabled>Confirmar</button>`;

    const btnCancelar = esCancelada
        ? `<button class="btn btn-custom" disabled>Cancelado</button>`
        : `<button class="btn btn-custom" onclick="cancelarReserva(${id}, this)">Cancelar</button>`;

    return `${btnDetalles} ${btnConfirmar} ${btnCancelar}`;
}

async function pagarReserva(id) {
    const res = await fetch(`${API_URL}/pagos/crear-preferencia`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_reserva: id , origin_url: window.location.origin})
    });
    const data = await res.json();
    window.location.href = data.init_point;
}

function renderizarReservas(reservas) {
    if (!tablaBody) return;

    if (tablaReservas) tablaReservas.classList.remove('d-none');
    if (sinReservasDiv) sinReservasDiv.classList.add('d-none');

    if (reservas.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    No hay reservas activas para mostrar.
                </td>
            </tr>`;
        return;
    }

    contadorReservas = 1;
    let html = '';

    reservas.forEach((reserva) => {
        const soloFecha  = (reserva.fecha || '').split('T')[0];
        const [año, mes, dia] = soloFecha.split('-');
        const fecha      = (dia && mes && año) ? `${dia}/${mes}/${año}` : 'Fecha no disponible';
        const estado     = reserva.estado_pago || 'pendiente';
        const badgeClass = getBadgeClass(estado);
        const nombreSala = reserva.nombre_salon || reserva.nombre_sala || 'Sala sin nombre';

        html += `
            <tr id="fila-reserva-${reserva.id}">
                <td><strong>${contadorReservas}</strong></td>
                <td>${fecha}</td>
                <td>${nombreSala}</td>
                <td><span class="badge ${badgeClass}">${estado}</span></td>
                <td>
                    <div class="acciones-reserva">
                        ${generarBotones(reserva)}
                    </div>
                </td>
            </tr>`;

        contadorReservas++;
    });

    tablaBody.innerHTML = html;
}

// Cancelar 
window.cancelarReserva = async function (reservaId, btnOrigen) {
    if (!reservaId) { mostrarMensaje('ID de reserva no válido', 'danger'); return; }
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return;

    if (btnOrigen) {
        btnOrigen.disabled = true;
        btnOrigen.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Cancelando...`;
    }

    try {
        const response = await fetch(`${API_URL}/reservas/${reservaId}/desactivar`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.msg || 'Error al cancelar la reserva');
        }
        const fila = document.getElementById(`fila-reserva-${reservaId}`);
        if (fila) {
            const badge = fila.querySelector('.badge');
            if (badge) { 
                badge.className = 'badge bg-danger'; 
                badge.textContent = 'cancelado'; 
            }

            const divAcciones = fila.querySelector('.acciones-reserva');
            if (divAcciones) {
                divAcciones.innerHTML = `
                    <a href="detallesReserva.html?id=${reservaId}" class="btn btn-custom">Detalles</a>
                    <button class="btn btn-custom" disabled>Confirmar</button>
                    <button class="btn btn-custom" disabled>Cancelado</button>`;
            }
        }
        let mensajeFinal = `Reserva cancelada exitosamente.`;
        if (result.reembolsoAplicado) {
            mensajeFinal += ` Reembolso procesado: ${result.reembolsoAplicado}.`;
        }
        mostrarMensaje(mensajeFinal, 'success');

    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        mostrarMensaje('Error al cancelar la reserva. Intente nuevamente.', 'danger');
        if (btnOrigen) { btnOrigen.disabled = false; btnOrigen.innerHTML = 'Cancelar'; }
    }
};