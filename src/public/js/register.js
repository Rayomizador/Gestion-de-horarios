document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const first_name = document.getElementById('first_name').value.trim();
            const last_name = document.getElementById('last_name').value.trim();
            const email = document.getElementById('email').value.trim();
            const age = parseInt(document.getElementById('age').value);
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submitBtn');
            const errorDiv = document.getElementById('error-message');
            
            // Validaciones del lado del cliente
            if (!first_name || !last_name || !email || !age || !password) {
                errorDiv.textContent = 'Todos los campos son obligatorios';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (password.length < 6) {
                errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
                errorDiv.classList.remove('d-none');
                return;
            }

            if (age < 18 || age > 100) {
                errorDiv.textContent = 'Debes ser mayor de 18 años';
                errorDiv.classList.remove('d-none');
                return;
            }

            // Validar formato de email básico
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                errorDiv.textContent = 'Email inválido';
                errorDiv.classList.remove('d-none');
                return;
            }
            
            // Reset estado
            errorDiv.classList.add('d-none');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Registrando...';
            
            try {
                const response = await fetch('/api/sessions/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        first_name, 
                        last_name, 
                        email, 
                        age, 
                        password 
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Redirigir al perfil tras registro exitoso
                    window.location.href = '/profile';
                } else {
                    errorDiv.textContent = data.message || 'Error al registrar usuario';
                    errorDiv.classList.remove('d-none');
                }
            } catch (error) {
                console.error('Error de fetch:', error);
                errorDiv.textContent = 'Error de conexión. Intenta nuevamente.';
                errorDiv.classList.remove('d-none');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Registrarse';
            }
        });
    }
});
