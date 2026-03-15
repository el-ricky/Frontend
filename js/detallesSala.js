const API_URL = "https://backend-salones.vercel.app/api/salones/";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener el ID de la URL (?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const salaId = urlParams.get('id');

    if (!salaId) {
        window.location.href = 'SalasDisponibles.html';
        return;
    }

    cargarDetalleSala(salaId);
});

async function cargarDetalleSala(id) {
    try {
        const response = await fetch(`${API_URL}${id}`);
        
        if (!response.ok) throw new Error('Sala no encontrada');
        
        const sala = await response.json();

        // 2. Llenar los campos del HTML
        document.getElementById('titulo-pagina').innerText = "Detalles de la Sala";
        document.getElementById('subtitulo-nombre').innerText = sala.nombre;
        document.getElementById('sala-img').src = sala.imagen || 'https://via.placeholder.com/400x200?text=Sin+Imagen';
        document.getElementById('sala-img').alt = `Imagen de ${sala.nombre}`;
        
        document.getElementById('sala-nombre').value = sala.nombre;
        document.getElementById('sala-capacidad').value = `${sala.capacidad} personas`;
        document.getElementById('sala-precio').value = `$${parseFloat(sala.precio).toFixed(2)}`;
        document.getElementById('sala-descripcion').value = sala.descripcion || "Sin descripción disponible.";

        // 3. Configurar el botón de reserva
        document.getElementById('btn-reservar').href = `reserva.html?id=${sala.id || id}`;

        // 4. Mostrar contenido y ocultar spinner
        document.getElementById('loading-view').classList.add('d-none');
        document.getElementById('detalle-content').classList.remove('d-none');

        if (window.feather) feather.replace();

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo cargar la información de la sala.");
        window.location.href = 'SalasDisponibles.html';
    }
}

function confirmarLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        window.location.href = 'logout.html'; 
    }
}