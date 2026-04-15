// js/footer-component.js

class MiFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer>
            <div class="container">
                <div class="footer-content">
                    <div class="footer-column">
                        <h3>Tenex Reservas</h3>
                        <p>Salas de reunión excepcionales para tus proyectos y eventos. Inspiramos creatividad y productividad en cada espacio.</p>
                    </div>
                    <div class="footer-column">
                        <h3>Enlaces Rápidos</h3>
                        <ul class="footer-links">
                            <li><a href="inicio.html">Inicio</a></li>
                            <li><a href="SalasDisponibles.html">Reservar</a></li>
                            <li><a href="inicio.html#nosotros">Nosotros</a></li>
                            <li><a href="inicio.html#servicios">Servicios</a></li>
                            <li><a href="inicio.html#contacto">Contacto</a></li>
                        </ul>
                    </div>
                    <div class="footer-column">
                        <h3>Políticas</h3>
                        <ul class="footer-links">
                            <li><a href="politicas.html#Terminos">Términos y Condiciones</a></li>
                            <li><a href="politicas.html#politicas-privacidad">Política de Privacidad</a></li>
                            <li><a href="politicas.html#politicas-cancelacion">Política de Cancelación</a></li>
                            <li><a href="politicas.html#politicas-cookies">Política de Cookies</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2025 Tenex Reservas. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
        `;
    }
}

// Registrar el componente
customElements.define('mi-footer', MiFooter);