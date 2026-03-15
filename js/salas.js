// Configuración de la API
const API_URL = "https://backend-salones.vercel.app/api/salones/";

document.addEventListener('DOMContentLoaded', () => {
    cargarSalas();
});

async function cargarSalas() {
    const container = document.getElementById('salas-container');
    const spinner = document.getElementById('cargando-spinner');
    const mensajeAlerta = document.getElementById('mensajeAlerta');

    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        const salas = await response.json();

        // Limpiar el contenedor (quitar el spinner)
        container.innerHTML = '';

        if (salas.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info text-center">No hay salas de reunión disponibles en este momento.</div>
                </div>`;
            return;
        }

        // Iterar y crear las tarjetas (Cards)
        salas.forEach(sala => {
            // Verificación rápida: si 'sala.imagen' llega nulo o indefinido
            const imagenUrl = (sala.imagen && sala.imagen.trim() !== "") 
                            ? sala.imagen 
                            : 'https://via.placeholder.com/400x200?text=Sin+Imagen';

            const salaCard = document.createElement('div');
            salaCard.className = 'col-lg-4 col-md-6';
            
            salaCard.innerHTML = `
                <div class="service-card h-100 d-flex flex-column sala-card">
                    <div class="sala-imagen mb-3">
                        <img src="${imagenUrl}" 
                            alt="Imagen de la sala ${sala.nombre}" 
                            class="img-fluid rounded" 
                            style="width: 100%; height: 200px; object-fit: cover;">
                    </div>
                    <div class="sala-info flex-grow-1">
                        <h3 class="sala-nombre h4" style="color: #5d4037;">${sala.nombre}</h3>
                        <p class="mb-2"><strong>Capacidad:</strong> ${sala.capacidad} personas</p>
                        <p class="mb-3"><strong>Precio:</strong> 
                            <span style="color: #8a5c39; font-weight: bold;">$${parseFloat(sala.precio).toFixed(2)}</span> por hora
                        </p>
                    </div>
                    <div class="sala-actions mt-auto">
                        <a href="DetallesSala.html?id=${sala.id}" class="btn btn-custom w-100">Ver Detalles</a>
                    </div>
                </div>
            `;
            container.appendChild(salaCard);
        });

    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = '';
        mensajeAlerta.innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                Error al cargar las salas. Intente más tarde.
            </div>`;
    }
}

// Función auxiliar para el logout que mencionas en tu HTML
function confirmarLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Aquí rediriges a tu lógica de cierre de sesión
        window.location.href = 'logout.html'; 
    }
}