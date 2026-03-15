document.addEventListener('DOMContentLoaded', () => {
    obtenerReservas();
});

async function obtenerReservas() {
    const tabla = document.getElementById('lista-reservas');

    try {
        const response = await fetch('https://backend-salones.vercel.app/api/reservas', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });

        if (!response.ok) throw new Error('Error al obtener datos');

        const reservas = await response.json();
        renderizarTabla(reservas);

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

function renderizarTabla(reservas) {
    const tabla = document.getElementById('lista-reservas');
    
    if (reservas.length === 0) {
        tabla.innerHTML = '<tr><td colspan="11" class="text-center">No hay reservas registradas.</td></tr>';
        return;
    }

    tabla.innerHTML = ''; // Limpiar mensaje de carga

    reservas.forEach((reserva, index) => {
        
        // Formatear fecha (DD/MM/YYYY)
        const fecha = new Date(reserva.fecha).toLocaleDateString('es-MX');

        // Determinar color del badge
        const badgeClass = reserva.estado_pago === 'Pagado' ? 'bg-success' : 
                           reserva.estado_pago === 'Pendiente' ? 'bg-warning' : 'bg-secondary';

        const fila = `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>${fecha}</td>
                <td>${reserva.nombre_sala}</td>
                <td><span class="badge ${badgeClass}">${reserva.estado_pago}</span></td>
                <td>${reserva.hora_inicio}</td>
                <td>${reserva.hora_fin}</td>
                <td>${reserva.nombreCompleto}</td>
                <td>${reserva.email_cliente}</td>
                <td>${reserva.nombre_servicio || 'No'}</td>
                <td><strong>$${parseFloat(reserva.total_pagar).toLocaleString('es-MX', {minimumFractionDigits: 2})}</strong></td>
                <td>
                    <div class="acciones-btn-group">
                        <a href="editar_reserva.html?id=${reserva.id_reserva}" class="btn btn-custom btn-sm">Editar</a>
                        <button class="btn btn-custom btn-sm" onclick="cancelarReserva(${reserva.id})">Cancelar</button>
                    </div>
                </td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });
}

async function cancelarReserva(id) {
    if (!confirm('¿Estás seguro de que deseas desactivar esta reserva?')) {
        return;
    }

    try {
        const response = await fetch(`https://backend-salones.vercel.app/api/reservas/${id}/desactivar`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json' 
            },
            credentials: 'include' // Importante para validar la sesión en el servidor
        });

        const data = await response.json();

        if (response.ok) {
            alert('Reserva desactivada correctamente');
            obtenerReservas(); 
        } else {
            alert(`Error: ${data.message || 'No se pudo desactivar la reserva'}`);
        }

    } catch (error) {
        console.error('Error al desactivar:', error);
        alert('Hubo un error de conexión con el servidor.');
    }
}