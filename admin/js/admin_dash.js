// 1. SEGURIDAD: Verificar si el usuario es administrador antes de cargar nada

const userData = JSON.parse(localStorage.getItem('user'));



if (!userData || userData.role !== 'admin') {

    alert('Acceso denegado. Por favor, inicie sesión como administrador.');

    window.location.href = '../login_new.html';

}



// 2. FUNCIÓN PARA CARGAR RESERVAS

async function cargarReservas() {
    const tbody = document.getElementById('listaReservas');
    if (!tbody) return;

    try {
        const response = await fetch('https://backend-salones.vercel.app/api/reservas', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' 
        });

        const data = await response.json();
        const reservas = data.reservas;

        // 1. VALIDACIÓN CRUCIAL: Verificar si es un array antes del forEach
        if (!Array.isArray(reservas)) {
            console.error('La respuesta no es un arreglo:', reservas);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error en el formato de datos del servidor</td></tr>';
            return;
        }


        if (reservas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay reservas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        reservas.forEach((res, index) => {
            // Formatear fecha
            const fechaFormateada = new Date(res.fecha).toLocaleDateString('es-MX');

            // 2. AJUSTE DE ESTADOS: Tu DB devuelve "Pagado"
            // Usamos toLowerCase() para evitar problemas de mayúsculas
            const estado = res.estado_pago ? res.estado_pago.toLowerCase() : '';
            
            const badgeClass = estado === 'pagado' || estado === 'confirmada' ? 'bg-success' :
                               (estado === 'pendiente' ? 'bg-warning' : 'bg-secondary');

            const fila = `
                <tr>
                    <td><strong>#${index + 1}</strong></td>
                    <td>${fechaFormateada}</td>
                    <td>${res.nombre_sala || 'N/A'}</td>
                    <td>
                        <span class="badge ${badgeClass}">${res.estado_pago}</span>
                    </td>
                    <td>${res.hora_inicio}</td>
                    <td>${res.hora_fin}</td>
                    <td>${res.nombre_completo}</td>
                    <td>$${res.total_pagar}</td>
                </tr>
            `;
            tbody.innerHTML += fila;
        });

    } catch (error) {
        console.error('Error al obtener reservas:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al conectar con el servidor</td></tr>';
    }
}



// 3. CERRAR SESIÓN

document.getElementById('btnLogout').addEventListener('click', () => {

    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {

        localStorage.removeItem('user');

        // Aquí podrías llamar también a una ruta de backend para limpiar la cookie

        window.location.href = 'login.html';

    }

});



// Ejecutar carga al abrir la página

cargarReservas();