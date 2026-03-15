const loginForm = document.getElementById('loginForm');
const alertContainer = document.getElementById('alertContainer');
const btnIngresar = document.getElementById('btnIngresar');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');

function showAlert(message, type = 'danger') {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Limpiar alertas previas
    alertContainer.innerHTML = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        return showAlert('Por favor, completa todos los campos.');
    }

    btnIngresar.disabled = true;
    btnText.textContent = 'Cargando...';
    btnLoader.classList.remove('d-none');

    try {
        const response = await fetch('https://backend-salones.vercel.app/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('id', JSON.stringify(data.id));

            showAlert('Bienvenido Redirigiendo...', 'success');

            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = './admin/admin_dashboard.html';
                } else {
                    window.location.href = 'inicio.html';
                }
            }, 1500);

        } else {
            showAlert(data.message || 'Credenciales incorrectas. Intenta de nuevo.');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error de conexi��n con el servidor. Revisa tu internet.');
    } finally {
        btnIngresar.disabled = false;
        btnText.textContent = 'Ingresar';
        btnLoader.classList.add('d-none');
    }
});