// Admin Login Handler
(function() {
    'use strict';

    function showAlert(message, type = 'danger') {
        const alertContainer = document.getElementById('alertContainer');
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas ${icon} me-2"></i>${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        if (type === 'success') {
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, 2000);
        }
    }

    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showAlert('Please enter both email and password');
            return;
        }

        const originalBtnText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing In...';
        loginBtn.disabled = true;

        try {
            const response = await fetch('/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showAlert('Login successful! Redirecting...', 'success');
                
                // Store user data
                if (result.data && result.data.user) {
                    localStorage.setItem('currentUser', JSON.stringify(result.data.user));
                }
                
                // Redirect immediately
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 500);
            } else {
                // Handle error
                const errorMsg = result.message || 'Login failed. Please try again.';
                showAlert(errorMsg);
                loginBtn.innerHTML = originalBtnText;
                loginBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Connection error. Please try again.');
            loginBtn.innerHTML = originalBtnText;
            loginBtn.disabled = false;
        }
    });

    // Auto-focus email field
    emailInput.focus();
})();
