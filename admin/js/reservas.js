let paginaActual = 1;
const limitePorPagina = 10;

document.addEventListener('DOMContentLoaded', () => {
    obtenerReservas();
    cargarSalonesFiltro();
    document.getElementById('prev-page').addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            obtenerReservas();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        paginaActual++;
        obtenerReservas();
    });
});

async function obtenerReservas() {
    const tabla = document.getElementById('lista-reservas');
    const email = document.getElementById('filter-email').value;
    const salon = document.getElementById('filter-salon').value;
    const fecha = document.getElementById('filter-fecha').value;
    const orden = document.getElementById('filter-orden').value;

    document.getElementById('current-page').innerText = `Página ${paginaActual}`;

    const params = new URLSearchParams({
        page: paginaActual,
        limit: limitePorPagina,
        email: email,
        id_sala: salon,
        fecha: fecha,
        sort: orden
    });

    try {
        tabla.innerHTML = '<tr><td colspan="11" class="text-center">Cargando reservas...</td></tr>';

        const response = await fetch(`https://backend-salones.vercel.app/api/reservas?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });

        if (!response.ok) throw new Error('Error al obtener datos');

        const data = await response.json();
        renderizarTabla(data.reservas);
        document.getElementById('next-page').disabled = (paginaActual >= data.totalPages);
        document.getElementById('current-page').innerText = `Página ${paginaActual} de ${data.totalPages}`;

    } catch (error) {
        console.error('Error:', error);
        tabla.innerHTML = `
            <tr>
                <td colspan="11" class="text-center py-4">
                    <div class="alert alert-danger">Error al conectar con el servidor.</div>
                </td>
            </tr>`;
    }
}

function aplicarFiltros() {
    paginaActual = 1;
    obtenerReservas();
}

function renderizarTabla(reservas) {
    const tabla = document.getElementById('lista-reservas');
    
    if (!reservas || reservas.length === 0) {
        tabla.innerHTML = '<tr><td colspan="11" class="text-center">No se encontraron reservas con esos filtros.</td></tr>';
        return;
    }

    tabla.innerHTML = '';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    reservas.forEach((reserva, index) => {
        const numeroReserva = ((paginaActual - 1) * limitePorPagina) + (index + 1);
        
        const fechaReserva = new Date(reserva.fecha);
        const fechaFormateada = fechaReserva.toLocaleDateString('es-MX', { timeZone: 'UTC' });

        const fechaComparacion = new Date(reserva.fecha);
        fechaComparacion.setHours(0, 0, 0, 0);

        const esPasada = fechaComparacion < hoy;
        const estadoLwr = (reserva.estado_pago || '').toLowerCase();
        const esCancelada = ['cancelada', 'cancelado', '3'].includes(estadoLwr);

        const badgeClass = estadoLwr === 'pagado' ? 'bg-success' : 
                           estadoLwr === 'pendiente' ? 'bg-warning text-dark' : 
                           esCancelada ? 'bg-danger' : 'bg-secondary';

        const botonesDeshabilitados = esPasada || esCancelada;

        const fila = `
            <tr style="${esPasada ? 'opacity: 0.8; background-color: #f9f9f9;' : ''}">
                <td><strong>#${numeroReserva}</strong></td>
                <td>${fechaFormateada}</td>
                <td>${reserva.nombre_sala}</td>
                <td><span class="badge ${badgeClass}">${reserva.estado_pago}</span></td>
                <td>${reserva.hora_inicio}</td>
                <td>${reserva.hora_fin}</td>
                <td>${reserva.nombre_completo}</td>
                <td>${reserva.email_cliente}</td>
                <td>${reserva.nombre_servicio || 'Ninguno'}</td>
                <td><strong>$${parseFloat(reserva.total_pagar).toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong></td>
                <td>
                    <div class="acciones-btn-group">
                        <a href="editar_reserva.html?id=${reserva.id}" 
                           class="btn btn-custom" ${botonesDeshabilitados ? 'disabled' : ''}
                           ${botonesDeshabilitados ? 'aria-disabled="true"' : ''}>
                           Editar
                        </a>
                        <button class="btn btn-custom" 
                                onclick="cancelarReserva(${reserva.id})" 
                                ${botonesDeshabilitados ? 'disabled' : ''}
                                title="${esPasada ? 'No se puede cancelar una reserva pasada' : esCancelada ? 'Ya está cancelada' : ''}">
                            ${esCancelada ? 'Cancelada' : 'Cancelar'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });
}

async function cancelarReserva(id) {
    if (!confirm('¿Estás seguro de que deseas desactivar esta reserva?')) return;
    try {
        const response = await fetch(`https://backend-salones.vercel.app/api/reservas/${id}/desactivar`, {
            method: 'PATCH',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            const msgReembolso = data.reembolsoAplicado ? ` (Reembolso: ${data.reembolsoAplicado})` : "";
            alert(`Reserva desactivada correctamente${msgReembolso}`);
            obtenerReservas(); 
        } else {
            alert(`Error: ${data.error || data.msg || 'No se pudo desactivar'}`);
        }
    } catch (error) {
        alert('Error de conexión con el servidor.');
    }
}

async function cargarSalonesFiltro() {
    const select = document.getElementById('filter-salon');
    try {
        const res = await fetch('https://backend-salones.vercel.app/api/salones');
        const salones = await res.json();
        
        salones.forEach(salon => {
            const option = document.createElement('option');
            option.value = salon.id;
            option.textContent = salon.nombre;
            select.appendChild(option);
        });
    } catch (err) {
        console.error("No se pudieron cargar los salones para el filtro");
    }
}

