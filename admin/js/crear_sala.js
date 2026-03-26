document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCrearSala');
    const alertContainer = document.getElementById('alert-container');
    const btnGuardar = document.getElementById('btnGuardar');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Bloquear botón para evitar múltiples clics
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Procesando...';

        const fileInput = document.getElementById('imagen');
        const formData = new FormData();
        
        // 1. Preparar archivo para Cloudinary
        if (fileInput.files.length === 0) {
            showAlert('Por favor, selecciona una imagen', 'danger');
            btnGuardar.disabled = false;
            return;
        }
        
        formData.append('image', fileInput.files[0]);

        try {
            // --- PASO 1: Subir imagen a Cloudinary ---
            const uploadRes = await fetch('https://backend-salones.vercel.app/api/upload/', {
                method: 'POST',
                body: formData,
                credentials: 'include' // Asegura que se envíen cookies para autenticación
            });

            if (!uploadRes.ok) throw new Error('Error al subir la imagen');
            const imageData = await uploadRes.json();
            const imageUrl = imageData.url; // URL devuelta por Cloudinary

            // --- PASO 2: Crear la sala con la URL de la imagen ---
            const salaData = {
                nombre: document.getElementById('nombre').value,
                capacidad: parseInt(document.getElementById('capacidad').value),
                precio: parseFloat(document.getElementById('precio').value),
                descripcion: document.getElementById('descripcion').value,
                imagenUrl: imageUrl // Aquí enviamos la URL recibida
            };

            const createRes = await fetch('https://backend-salones.vercel.app/api/salones/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(salaData),
                credentials: 'include' // Asegura que se envíen cookies para autenticación
            });

            if (createRes.status === 201) {
                showAlert('¡Sala creada exitosamente!', 'success');
                form.reset();
                setTimeout(() => {
                    window.location.href = "admin_dashboard.php";
                }, 2000);
            } else {
                throw new Error('No se pudo crear la sala en la base de datos');
            }

        } catch (error) {
            console.error(error);
            showAlert('Error: ' + error.message, 'danger');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Sala';
        }
    });

    function showAlert(message, type) {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }
});