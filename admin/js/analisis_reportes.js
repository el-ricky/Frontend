let chartInstance = null;
API_BASE_URL = 'https://backend-salones.vercel.app/api';

async function cargarReportes(anioInicio, anioFin) {
    const tbody = document.getElementById('tbodyTemporadas');
    const tbodyProy = document.getElementById('tbodyProyecciones');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border text-primary" role="status"></div> Cargando...</td></tr>';
    tbodyProy.innerHTML = '<tr><td colspan="2" class="text-center">Cargando...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/analytics/temporadas?anio_inicio=${anioInicio}&anio_fin=${anioFin}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        actualizarUI(data);
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" class="text-danger">❌ Error al cargar datos: ${error.message}. Verifique que esté autenticado como administrador.</td></tr>`;
        tbodyProy.innerHTML = '<tr><td colspan="2" class="text-danger">No se pudieron obtener proyecciones</td></tr>';
        // Limpiar KPIs
        document.getElementById('kValue').innerText = 'Error';
        document.getElementById('aValue').innerText = '--';
        document.getElementById('r2Value').innerText = '--';
        document.getElementById('proxMes').innerText = '--';
        document.getElementById('tendencia').innerText = 'Error';
    }
}

function actualizarUI(data) {
    // KPIs
    document.getElementById('kValue').innerText = data.tasa_crecimiento_k?.toFixed(5) || '0';
    document.getElementById('aValue').innerText = data.coeficiente_a?.toFixed(2) || '0';
    document.getElementById('r2Value').innerText = data.r2?.toFixed(4) || '0';
    const prox = data.proyecciones?.[0]?.cantidad_estimada ?? '--';
    document.getElementById('proxMes').innerText = prox;
    const tendenciaTexto = data.interpretacion || (data.tasa_crecimiento_k > 0 ? 'Crecimiento' : 'Decrecimiento');
    document.getElementById('tendencia').innerText = tendenciaTexto;
    document.getElementById('kInterpretacion').innerText = data.tasa_crecimiento_k > 0 ? 'Positivo' : (data.tasa_crecimiento_k < 0 ? '📉 Negativo' : '⚖️ Neutro');

    // Tabla de temporadas
    const tbody = document.getElementById('tbodyTemporadas');
    tbody.innerHTML = '';
    if (data.temporadas && data.temporadas.length) {
        data.temporadas.forEach(item => {
            const row = tbody.insertRow();
            row.className = `temp-${item.tipo}`;
            row.insertCell(0).innerText = item.mes;
            row.insertCell(1).innerText = item.cantidad_reservas;
            row.insertCell(2).innerText = `$${item.total_ingresos?.toFixed(2) || 0}`;
            const badge = document.createElement('span');
            badge.className = `badge-temp badge bg-${item.tipo === 'alta' ? 'warning' : (item.tipo === 'baja' ? 'secondary' : 'info')} text-dark`;
            badge.innerText = item.tipo.toUpperCase();
            row.insertCell(3).appendChild(badge);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4">No hay datos para el periodo seleccionado</td></tr>';
    }

    // Proyecciones
    const tbodyProy = document.getElementById('tbodyProyecciones');
    tbodyProy.innerHTML = '';
    if (data.proyecciones && data.proyecciones.length) {
        data.proyecciones.forEach(proy => {
            const row = tbodyProy.insertRow();
            row.insertCell(0).innerText = `+${proy.mes_offset} mes(es)`;
            row.insertCell(1).innerText = proy.cantidad_estimada;
        });
    } else {
        tbodyProy.innerHTML = '<tr><td colspan="2">Sin proyecciones disponibles</td></tr>';
    }

    // Gráfica
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('reservasChart').getContext('2d');
    const meses = data.temporadas.map(t => t.mes);
    const reservasReales = data.temporadas.map(t => t.cantidad_reservas);
    // Proyecciones: añadimos puntos futuros al final
    const mesesFuturos = [...meses];
    const valoresFuturos = [...reservasReales];
    if (data.proyecciones && data.proyecciones.length) {
        for (let i = 0; i < data.proyecciones.length; i++) {
            mesesFuturos.push(`+${i + 1}m`);
            valoresFuturos.push(data.proyecciones[i].cantidad_estimada);
        }
    }
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mesesFuturos,
            datasets: [
                {
                    label: 'Reservas reales',
                    data: [...reservasReales, ...Array(data.proyecciones?.length || 0).fill(null)],
                    borderColor: '#8a5c39',
                    backgroundColor: 'transparent',
                    tension: 0.2,
                    pointBackgroundColor: '#8a5c39',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Proyección exponencial',
                    data: [...Array(reservasReales.length).fill(null), ...(data.proyecciones?.map(p => p.cantidad_estimada) || [])],
                    borderColor: '#e68a2e',
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                    pointBackgroundColor: '#e68a2e',
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                legend: { position: 'top' },
                title: { display: true, text: 'Evolución de reservas y proyección exponencial' }
            },
            scales: {
                y: { title: { display: true, text: 'Número de reservas' }, beginAtZero: true }
            }
        }
    });
}

// Eventos y carga inicial
document.getElementById('btnRefrescar').addEventListener('click', () => {
    const anioInicio = document.getElementById('anioInicio').value;
    const anioFin = document.getElementById('anioFin').value;
    if (parseInt(anioInicio) > parseInt(anioFin)) {
        alert('El año de inicio no puede ser mayor al año de fin');
        return;
    }
    cargarReportes(anioInicio, anioFin);
});

// Carga inicial (por defecto 2023-2024)
cargarReportes('2023', '2024');