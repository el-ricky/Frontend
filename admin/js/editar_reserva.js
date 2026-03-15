document.addEventListener('DOMContentLoaded', async () => {
    await cargarListaReservas();
    const urlParams = new URLSearchParams(window.location.search);
    const idReserva = urlParams.get('id');
    if (idReserva) {
        document.getElementById('seleccionar_reserva').value = idReserva;
        await cargarDatosReserva(idReserva);
    }

    document.getElementById('seleccionar_reserva').addEventListener('change', (e) => {
        if (e.target.value) cargarDatosReserva(e.target.value);
    });
    document.getElementById('formReserva').addEventListener('submit', guardarCambios);
});

async function cargarListaReservas() {
    try {
        const res = await fetch('https://backend-salones.vercel.app/api/reservas', { credentials: 'include' });
        const reservas = await res.json();
        const select = document.getElementById('seleccionar_reserva');
        
        reservas.forEach(r => {
            const option = document.createElement('option');
            option.value = r.id_reserva;
            option.textContent = `Reserva #${r.id_reserva} - ${r.nombre_sala} (${r.fecha})`;
            select.appendChild(option);
        });
    } catch (err) { console.error("Error al cargar lista", err); }
}

async function cargarDatosReserva(id) {
    try {
        const res = await fetch(`https://backend-salones.vercel.app/api/reservas/${id}`, { 
            method: 'GET',
            credentials: 'include' 
        });
        const data = await res.json();

        if (data) {
            document.getElementById('formReserva').style.display = 'block';
            document.getElementById('id_reserva').value = data.id;
            document.getElementById('id_sala').value = data.id_sala;
            document.getElementById('id_usuario').value = data.id_cliente;
            document.getElementById('nombre_sala').value = data.nombre_sala;
            document.getElementById('fecha').value = data.fecha;
            document.getElementById('hora_inicio').value = data.hora_inicio;
            document.getElementById('hora_fin').value = data.hora_fin;
            document.getElementById('precio_sala').value = `$${data.precio_sala}`;
            document.getElementById('estado').value = data.estado_pago;
        }
    } catch (err) { alert("Error al obtener la reserva"); }
}

async function guardarCambios(e) {
    e.preventDefault();
    const id = document.getElementById('id_reserva').value;

    const paquete = {
        id_sala: parseInt(document.getElementById('id_sala').value),
        id_cliente: parseInt(document.getElementById('id_usuario').value),
        fecha: document.getElementById('fecha').value,
        hora_inicio: document.getElementById('hora_inicio').value,
        hora_fin: document.getElementById('hora_fin').value,
        id: parseInt(id)
    };

    try {
        const response = await fetch(`https://backend-salones.vercel.app/api/reservas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paquete),
            credentials: 'include'
        });

        if (response.ok) {
            alert("¡Reserva actualizada con éxito!");
            window.location.href = 'ver_reservas.html';
        } else {
            const errData = await response.json();
            alert("Error: " + (errData.message || "No se pudo actualizar"));
        }
    } catch (err) {
        alert("Error de conexión");
    }
}