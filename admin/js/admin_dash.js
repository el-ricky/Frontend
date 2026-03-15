let paginaActual = 1;
const limitePorPagina = 10;

document.addEventListener('DOMContentLoaded', () => {
    cargarReservas(paginaActual);

    document.getElementById('prev-page').addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            cargarReservas(paginaActual);
        }
    });
    document.getElementById('next-page').addEventListener('click', () => {
        paginaActual++;
        cargarReservas(paginaActual);
    });
});

async function cargarReservas(page = 1) {
    const tbody = document.getElementById('listaReservas');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Cargando...</td></tr>';
        const hoy = new Date().toISOString().split('T')[0];
        const response = await fetch(`https://backend-salones.vercel.app/api/reservas?page=${page}&limit=${limitePorPagina}&sort=DESC&fecha=${hoy}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });
        const data = await response.json();
        if (!data.reservas || data.reservas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay reservas para hoy o fechas futuras.</td></tr>';
            actualizarControlesPaginacion(0);
            return;
        }
        renderizarTabla(data.reservas);
        actualizarControlesPaginacion(data.totalPages);
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar datos</td></tr>';
    }
}

function renderizarTabla(reservas) {
    const tbody = document.getElementById('listaReservas');
    tbody.innerHTML = '';
    reservas.forEach((res, index) => {
        const numero = ((paginaActual - 1) * limitePorPagina) + (index + 1);
        const fechaFormateada = new Date(res.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' });
        
        const estado = res.estado_pago ? res.estado_pago.toLowerCase() : '';
        const badgeClass = estado === 'pagado' ? 'bg-success' : (estado === 'pendiente' ? 'bg-warning text-dark' : 'bg-secondary');

        tbody.innerHTML += `
            <tr>
                <td><strong>#${numero}</strong></td>
                <td>${fechaFormateada}</td>
                <td>${res.nombre_sala}</td>
                <td><span class="badge ${badgeClass}">${res.estado_pago}</span></td>
                <td>${res.hora_inicio}</td>
                <td>${res.hora_fin}</td>
                <td>${res.nombre_completo}</td>
                <td>$${parseFloat(res.total_pagar).toFixed(2)}</td>
            </tr>
        `;
    });
}

function actualizarControlesPaginacion(totalPages) {
    const btnPrev = document.getElementById('prev-page');
    const btnNext = document.getElementById('next-page');
    const labelPage = document.getElementById('current-page');
    labelPage.innerText = `Página ${paginaActual} de ${totalPages || 1}`;
    btnPrev.disabled = (paginaActual <= 1);
    btnNext.disabled = (paginaActual >= totalPages || totalPages === 0);
}