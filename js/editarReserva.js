// editarReserva.js

const API_BASE = 'https://backend-salones.vercel.app/api';
const urlParams = new URLSearchParams(window.location.search);
const reservaId = urlParams.get('id');

// Datos originales de la reserva (para comparar si la fecha cambió)
let fechaOriginal = '';
let idSalon = null;
let idServicio = null;
let hayModificacion = false;

// Inicialización 
document.addEventListener('DOMContentLoaded', async () => {
    if (!reservaId) {
        alert('No se especificó una reserva para editar.');
        window.location.href = 'misreservas.html';
        return;
    }

    // Verificar sesión
    const userId = localStorage.getItem('id');
    if (!userId) {
        window.location.href = 'login_new.html';
        return;
    }

    // Fecha mínima: hoy (no se pueden seleccionar fechas pasadas)
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.min = new Date().toISOString().split('T')[0];
    }

    try {
        await cargarDatosReserva();
    } catch (error) {
        console.error('Error en carga inicial:', error);
        mostrarMensaje('Error al cargar los datos de la reserva.', 'danger');
    } finally {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }
});

// Cargar datos de la reserva 
async function cargarDatosReserva() {
    const response = await fetch(`${API_BASE}/reservas/cliente/info/${reservaId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 401) {
        window.location.href = 'login_new.html?error=sesion_expirada';
        return;
    }
    if (response.status === 403 || response.status === 404) {
        alert('No se encontró la reserva o no tienes permiso para editarla.');
        window.location.href = 'misreservas.html';
        return;
    }
    if (!response.ok) throw new Error(`Error ${response.status}`);

    const data = await response.json();
    const reserva = Array.isArray(data) ? data[0] : data;

    if (!reserva) {
        alert('No se encontraron datos de la reserva.');
        window.location.href = 'misreservas.html';
        return;
    }

    // Guardar datos originales
    fechaOriginal = (reserva.fecha || '').split('T')[0];
    idSalon = reserva.id_salon || reserva.id_sala;
    idServicio = reserva.id_servicio || 0;


    // Rellenar campos
    document.getElementById('nombre_sala_titulo').textContent =
        `Editando reserva en ${reserva.nombre_sala || 'la sala'}`;

    setVal('nombre_sala', reserva.nombre_sala || 'Sin nombre');
    setVal('capacidad_sala', `${reserva.capacidad_sala || 'N/A'} personas`);
    setVal('hora_inicio', formatearHora(reserva.hora_inicio));
    setVal('hora_fin', formatearHora(reserva.hora_fin));
    setVal('nombre_servicio', reserva.nombre_servicio || 'Sin servicio adicional');

    const total = reserva.total_pagar ? parseFloat(reserva.total_pagar).toFixed(2) : '0.00';
    setVal('total_pagar_display', `$${total}`);

    // Setear la fecha actual en el input (formato yyyy-mm-dd)
    document.getElementById('fecha').value = fechaOriginal;

    // Escuchar cambios en la fecha
    document.getElementById('fecha').addEventListener('change', verificarDisponibilidad);
}

//  Verificar disponibilidad al cambiar fecha 
async function verificarDisponibilidad() {
    const nuevaFecha = document.getElementById('fecha').value;
    const btn = document.getElementById('btnGuardar');
    const status = document.getElementById('statusDisponibilidad');

    // Si la fecha no cambió, deshabilitar botón guardar
    if (nuevaFecha === fechaOriginal) {
        hayModificacion = false;
        btn.disabled = true;
        status.innerHTML = '<small class="text-muted">Esta es la fecha actual de tu reserva.</small>';
        return;
    }

    if (!nuevaFecha) {
        btn.disabled = true;
        status.innerHTML = '';
        return;
    }

    // Indicador de carga
    status.innerHTML = `
        <span class="spinner-border spinner-border-sm me-1"></span>
        <small class="text-muted">Verificando disponibilidad...</small>`;
    btn.disabled = true;

    try {
        const horaInicio = document.getElementById('hora_inicio').value;
        const horaFin = document.getElementById('hora_fin').value;

        const res = await fetch(`${API_BASE}/reservas/check-disponibilidad/${reservaId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_salon: parseInt(idSalon),
                fecha: nuevaFecha,
                hora_inicio: horaInicio,
                hora_fin: horaFin
            }),
            credentials: 'include'
        });

        const { ocupada } = await res.json();

        if (ocupada) {
            status.innerHTML = '<span class="badge bg-danger">Horario Ocupado — elige otra fecha</span>';
            btn.disabled = true;
            hayModificacion = false;
        } else {
            status.innerHTML = '<span class="badge bg-success">Fecha Disponible ✓</span>';
            btn.disabled = false;
            hayModificacion = true;
        }
    } catch (e) {
        console.error('Error al verificar disponibilidad:', e);
        status.innerHTML = '<small class="text-danger">Error al verificar disponibilidad. Intenta de nuevo.</small>';
        btn.disabled = true;
    }
}

//  Guardar cambios 
document.getElementById('editarReservaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevaFecha = document.getElementById('fecha').value;
    const btn = document.getElementById('btnGuardar');

    // Validar mínimo 3 días de anticipación antes de guardar
    const hoySubmit = new Date();
    hoySubmit.setHours(0, 0, 0, 0);
    const minDateSubmit = new Date(hoySubmit);
    minDateSubmit.setDate(minDateSubmit.getDate() + 3);
    const fechaElegidaSubmit = new Date(nuevaFecha + 'T00:00:00');

    if (fechaElegidaSubmit < minDateSubmit) {
        const minStr = minDateSubmit.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
        alert(`Error: Las reservas deben realizarse con al menos 3 días de anticipación.\nFecha mínima permitida: ${minStr}`);
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const response = await fetch(`${API_BASE}/reservas/${reservaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fecha: nuevaFecha,
                id_cliente: JSON.parse(localStorage.getItem('user')).id,
                id_salon: parseInt(idSalon),
                hora_inicio: document.getElementById('hora_inicio').value,
                hora_fin: document.getElementById('hora_fin').value,
                id_servicio: idServicio
            }),
            credentials: 'include'
        });

        if (response.ok) {
            mostrarMensaje('¡Reserva actualizada exitosamente!', 'success');
            hayModificacion = false;
            // Redirigir a detalles tras 1.5 segundos
            setTimeout(() => {
                window.location.href = `detallesReserva.html?id=${reservaId}`;
            }, 1500);
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.msg || 'No se pudo actualizar la reserva');
        }
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarMensaje(error.message, 'danger');
        btn.disabled = false;
        btn.textContent = 'Guardar Cambios';
    }
});

// Confirmar cancelar 
window.confirmarCancelar = function () {
    if (hayModificacion) {
        const salir = confirm(
            '¿Estás seguro de que quieres salir?\nSe descartarán todos los cambios realizados.'
        );
        if (salir) window.location.href = `detallesReserva.html?id=${reservaId}`;
    } else {
        window.location.href = `detallesReserva.html?id=${reservaId}`;
    }
};

// Logout
window.confirmarLogout = function () {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        fetch(`${API_BASE}/logout`, {
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

// Helpers 
function setVal(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor;
}

function formatearHora(horaStr) {
    if (!horaStr) return 'N/A';
    if (horaStr.includes(':')) return horaStr.split(':').slice(0, 2).join(':');
    return horaStr;
}

function mostrarMensaje(texto, tipo) {
    const el = document.getElementById('mensajeAlerta');
    if (!el) return;
    const cls = tipo === 'success' ? 'alert-success' : (tipo === 'danger' ? 'alert-danger' : 'alert-info');
    el.innerHTML = `
        <div class="alert ${cls} alert-dismissible fade show text-center" role="alert">
            ${texto}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    if (tipo !== 'danger') {
        setTimeout(() => { el.innerHTML = ''; }, 4000);
    }
}