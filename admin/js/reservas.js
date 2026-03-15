let paginaActual = 1;
const limitePorPagina = 10;

document.addEventListener('DOMContentLoaded', () => {
    obtenerReservas();
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

        const reservas = await response.json();
        renderizarTabla(reservas);
        document.getElementById('prev-page').disabled = (paginaActual === 1);
        document.getElementById('next-page').disabled = (reservas.length < limitePorPagina);

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

    reservas.forEach((reserva, index) => {
        const numeroReserva = ((paginaActual - 1) * limitePorPagina) + (index + 1);
        
        const fechaFormateada = new Date(reserva.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' });

        const badgeClass = reserva.estado_pago === 'Pagado' ? 'bg-success' : 
                           reserva.estado_pago === 'Pendiente' ? 'bg-warning text-dark' : 'bg-secondary';

        const fila = `
            <tr>
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
                        <a href="editar_reserva.html?id=${reserva.id}" class="btn btn-custom btn-sm">Editar</a>
                        <button class="btn btn-custom btn-sm" onclick="cancelarReserva(${reserva.id})">Cancelar</button>
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

        if (response.ok) {
            alert('Reserva desactivada correctamente');
            obtenerReservas(); 
        } else {
            const data = await response.json();
            alert(`Error: ${data.message || 'No se pudo desactivar'}`);
        }
    } catch (error) {
        alert('Error de conexión.');
    }
}