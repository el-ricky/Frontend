document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('seleccionar_sala');
    const form = document.getElementById('formEditarSala');
    const alertContainer = document.getElementById('alert-container');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnEstado = document.getElementById('btnEliminar'); 

    const API_URL = 'https://backend-salones.vercel.app/api/salones/';
    const UPLOAD_URL = 'https://backend-salones.vercel.app/api/upload/';
    let salaEstaActiva = true;

    async function cargarSalas() {
        try {
            const res = await fetch(`${API_URL}all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const salas = await res.json();
            
            selector.innerHTML = '<option value="">-- Seleccione una sala --</option>';
            salas.forEach(sala => {
                const option = document.createElement('option');
                option.value = sala.id;
                option.textContent = `${sala.nombre} (Capacidad: ${sala.capacidad})`;
                selector.appendChild(option);
            });
        } catch (error) {
            showAlert('Error al cargar la lista de salas', 'danger');
        }
    }

    selector.addEventListener('change', async (e) => {
        const id = e.target.value;
        if (!id) {
            form.style.display = 'none';
            return;
        }

        try {
            const res = await fetch(`${API_URL}${id}`,{
                credentials: 'include'
            });
            const sala = await res.json();

            document.getElementById('id_sala').value = sala.id;
            document.getElementById('nombre').value = sala.nombre;
            document.getElementById('capacidad').value = sala.capacidad;
            document.getElementById('precio').value = sala.precio;
            document.getElementById('descripcion').value = sala.descripcion;
            document.getElementById('current_imagenUrl').value = sala.imagen;
            document.getElementById('img-actual').src = sala.imagen;
            salaEstaActiva = sala.activo; 
            
            if (salaEstaActiva) {
                btnEstado.textContent = 'Desactivar Sala';
                btnEstado.className = 'btn btn-warning'; // Color naranja para advertir
            } else {
                btnEstado.textContent = 'Activar Sala';
                btnEstado.className = 'btn btn-success'; // Color verde para activar
            }

            form.style.display = 'block';
        } catch (error) {
            showAlert('Error al obtener detalles de la sala', 'danger');
        }
    });

    btnEstado.addEventListener('click', async () => {
        const id = document.getElementById('id_sala').value;
        if (!id) return;

        const accion = salaEstaActiva ? 'desactivar' : 'activar';
        const urlFinal = `${API_URL}${id}/${accion}`;

        if (!confirm(`¿Estás seguro de que deseas ${accion} esta sala?`)) return;

        try {
            btnEstado.disabled = true;
            const response = await fetch(urlFinal, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: id }), 
                credentials: 'include' 
            });

            if (response.ok) {
                showAlert(`Sala ${accion}da con éxito`, 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al cambiar el estado');
            }
        } catch (error) {
            showAlert('Error: ' + error.message, 'danger');
            btnEstado.disabled = false;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Actualizando...';

        const id = document.getElementById('id_sala').value;
        const fileInput = document.getElementById('imagen');
        let finalImageUrl = document.getElementById('current_imagenUrl').value;

        try {
            // A. ¿Se seleccionó una nueva imagen?
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);

                const uploadRes = await fetch(UPLOAD_URL, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include' // Asegura que se envíen cookies para autenticación
                });
                const imageData = await uploadRes.json();
                finalImageUrl = imageData.url;
            }

            // B. Enviar datos actualizados vía PUT
            const updateData = {
                nombre: document.getElementById('nombre').value,
                capacidad: parseInt(document.getElementById('capacidad').value),
                precio: parseFloat(document.getElementById('precio').value),
                descripcion: document.getElementById('descripcion').value,
                imagenUrl: finalImageUrl
            };

            const response = await fetch(`${API_URL}${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
                credentials: 'include' // Asegura que se envíen cookies para autenticación
            });

            if (response.ok) {
                showAlert('Sala actualizada correctamente', 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                throw new Error('Error en la respuesta del servidor');
            }

        } catch (error) {
            showAlert('Error al editar: ' + error.message, 'danger');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Cambios';
        }
    });
    
    function showAlert(msg, type) {
        alertContainer.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    }

    cargarSalas();
});