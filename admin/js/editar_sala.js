document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('seleccionar_sala');
    const form = document.getElementById('formEditarSala');
    const alertContainer = document.getElementById('alert-container');
    const btnGuardar = document.getElementById('btnGuardar');

    const API_URL = 'https://backend-salones.vercel.app/api/salones/';
    const UPLOAD_URL = 'https://backend-salones.vercel.app/api/upload/';

    // 1. Cargar todas las salas al iniciar
    async function cargarSalas() {
        try {
            const res = await fetch(API_URL);
            const salas = await res.json();
            
            selector.innerHTML = '<option value="">-- Seleccione una sala --</option>';
            salas.forEach(sala => {
                const option = document.createElement('option');
                option.value = sala.id; // Ajusta si el campo es id_sala
                option.textContent = `${sala.nombre} (Capacidad: ${sala.capacidad})`;
                selector.appendChild(option);
            });
        } catch (error) {
            showAlert('Error al cargar la lista de salas', 'danger');
        }
    }

    // 2. Detectar cambio en el selector para cargar datos de la sala
    selector.addEventListener('change', async (e) => {
        const id = e.target.value;
        if (!id) {
            form.style.display = 'none';
            return;
        }

        try {
            const res = await fetch(`${API_URL}${id}`);
            const sala = await res.json();

            // Rellenar formulario
            document.getElementById('id_sala').value = sala.id;
            document.getElementById('nombre').value = sala.nombre;
            document.getElementById('capacidad').value = sala.capacidad;
            document.getElementById('precio').value = sala.precio;
            document.getElementById('descripcion').value = sala.descripcion;
            document.getElementById('current_imagenUrl').value = sala.imagen;
            document.getElementById('img-actual').src = sala.imagen;

            form.style.display = 'block';
        } catch (error) {
            showAlert('Error al obtener detalles de la sala', 'danger');
        }
    });

    // 3. Procesar la edición
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