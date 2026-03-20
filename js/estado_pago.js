document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('result'); // 'success', 'failure', 'pending'
    const paymentId = params.get('payment_id'); // ID de MP

    const title = document.getElementById('status-title');
    const message = document.getElementById('status-message');
    const iconContainer = document.getElementById('status-icon');
    const card = document.getElementById('status-card');

    if (result === 'success') {
        iconContainer.innerHTML = '<i data-feather="check-circle" style="width: 80px; height: 80px; color: #28a745;"></i>';
        title.innerText = "¡Pago Exitoso!";
        message.innerText = `Tu reserva ha sido confirmada. El ID de transacción es: ${paymentId}. ¡Te esperamos!`;
        card.classList.add('border-top', 'border-success', 'border-5');
    }
    else if (result === 'pending') {
        iconContainer.innerHTML = '<i data-feather="clock" style="width: 80px; height: 80px; color: #ffc107;"></i>';
        title.innerText = "Pago Pendiente";
        message.innerText = "Tu pago está en proceso de acreditación. Te notificaremos en cuanto se confirme.";
    }
    else {
        iconContainer.innerHTML = '<i data-feather="x-circle" style="width: 80px; height: 80px; color: #dc3545;"></i>';
        title.innerText = "Pago Fallido o Cancelado";
        message.innerText = "No pudimos procesar tu pago. Por favor, intenta de nuevo desde la sección de reservas.";
        card.classList.add('border-top', 'border-danger', 'border-5');
    }

    feather.replace();
});