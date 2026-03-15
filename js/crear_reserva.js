const API_BASE = 'https://backend-salones.vercel.app/api';
const urlParams = new URLSearchParams(window.location.search);
const idSalaSeleccionada = urlParams.get('id');

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión (Si guardaste el id como 'userId' o 'id', asegúrate que coincida)
    const userId = localStorage.getItem('id');
    if (!userId) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Configurar fecha mínima (hoy) para evitar reservas en el pasado
    const fechaInput = document.getElementById('fecha');
    if(fechaInput) {
        fechaInput.min = new Date().toISOString().split('T')[0];
    }

    try {
        // Ejecutar cargas iniciales
        await Promise.all([cargarSalones(), cargarServicios()]);
    } catch (error) {
        console.error("Fallo en la carga inicial:", error);
    } finally {
        // Quitar loader siempre
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }
});

async function cargarSalones() {
    if (!idSalaSeleccionada) return;

    try {
        const res = await fetch(`${API_BASE}/salones/${idSalaSeleccionada}`);
        const salon = await res.json();
        
        // REVISIÓN: Tu API de salones devuelve 'id_sala' según tus modelos previos
        const idReal = salon.id_sala || salon.id;
        
        if (salon && idReal) {
            const select = document.getElementById('id_salon');
            select.innerHTML = '';
            const option = new Option(salon.nombre, idReal);
            option.selected = true;
            select.add(option);

            // Actualizar interfaz
            document.getElementById('nombre_sala_titulo').textContent = salon.nombre;
            const img = document.getElementById('imagen_sala');
            if (img) img.src = `../img/${salon.imagen || 'placeholder.jpg'}`;
        }
    } catch (e) { 
        console.error("Error cargando el salón", e); 
        document.getElementById('nombre_sala_titulo').textContent = "Error al cargar datos de la sala";
    }
}

async function cargarServicios() {
    try {
        const res = await fetch(`${API_BASE}/servicios`);
        const servicios = await res.json();
        const select = document.getElementById('id_servicio');
        select.innerHTML = `
            <option value="0">Sin servicio adicional ($0.00)</option>
        `;

        servicios.forEach(s => {
            // Usamos s.id_servicio o s.id dependiendo de tu tabla servicios
            const idServ = s.id_servicio || s.id;
            select.innerHTML += `<option value="${idServ}">${s.nombre} (+$${s.costo})</option>`;
        });
    } catch (e) { 
        console.error("Error cargando servicios", e); 
    }
}

// Lógica de Validación y Cálculo en tiempo real
async function procesarCambios() {
    const sala = idSalaSeleccionada;
    const serv = document.getElementById('id_servicio').value;
    const fecha = document.getElementById('fecha').value;
    const hI = document.getElementById('hora_inicio').value;
    const hF = document.getElementById('hora_fin').value;
    const btn = document.getElementById('btnConfirmar');
    const status = document.getElementById('statusDisponibilidad');
    const displayPrecio = document.getElementById('total_pagar_display');

    // 1. Calcular Presupuesto
    if (sala && serv) {
        try {
            const res = await fetch(`${API_BASE}/reservas/calcular-presupuesto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_sala: parseInt(sala), id_servicio: parseInt(serv) }),
                credentials: 'include'
            });
            const data = await res.json();
            if (displayPrecio) displayPrecio.textContent = `$${data.total_calculado}`;
        } catch (e) { console.error("Error al calcular presupuesto", e); }
    }

    // 2. Verificar Disponibilidad
    if (sala && fecha && hI && hF) {
        if (hI >= hF) {
            status.innerHTML = '<small class="text-danger">La hora de fin debe ser posterior a la de inicio.</small>';
            btn.disabled = true;
            return;
        }

        try {
            // El ID '0' en la URL indica que es una reserva nueva (para el validador SQL)
            const res = await fetch(`${API_BASE}/reservas/check-disponibilidad/0`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id_salon: parseInt(sala), 
                    fecha, 
                    hora_inicio: hI, 
                    hora_fin: hF 
                }),
                credentials: 'include'
            });
            const { ocupada } = await res.json();

            if (ocupada) {
                status.innerHTML = '<span class="badge bg-danger">Horario Ocupado</span>';
                btn.disabled = true;
            } else {
                status.innerHTML = '<span class="badge bg-success">Horario Disponible</span>';
                btn.disabled = false;
            }
        } catch (e) { console.error("Error al verificar disponibilidad", e); }
    }
}

// Envío del Formulario
document.getElementById('reservaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Bloquear botón para evitar doble click
    const btn = document.getElementById('btnConfirmar');
    btn.disabled = true;
    btn.textContent = "Procesando...";

    const payload = {
        id_cliente: parseInt(localStorage.getItem('id')),
        id_salon: parseInt(idSalaSeleccionada),
        fecha: document.getElementById('fecha').value,
        hora_inicio: document.getElementById('hora_inicio').value,
        hora_fin: document.getElementById('hora_fin').value,
        id_servicio: parseInt(document.getElementById('id_servicio').value)
    };

    try {
        const response = await fetch(`${API_BASE}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const resultado = await response.json();

        if (response.ok) {
            alert("¡Reserva creada con éxito! Puedes verla en tu perfil.");
            window.location.href = 'misreservas.html';
        } else {
            alert("Error: " + (resultado.error || resultado.msg || "No se pudo crear la reserva"));
            btn.disabled = false;
            btn.textContent = "Confirmar Reserva";
        }
    } catch (e) { 
        alert("Error de conexión con el servidor"); 
        btn.disabled = false;
        btn.textContent = "Confirmar Reserva";
    }
});

// Eventos
document.getElementById('id_servicio').addEventListener('change', procesarCambios);
['fecha', 'hora_inicio', 'hora_fin'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', procesarCambios);
});

if(document.getElementById('btnLogout')) {
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}