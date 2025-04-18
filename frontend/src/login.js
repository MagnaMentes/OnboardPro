// Функция для обработки входа
async function handleLogin(event) {
    if (event) {
        event.preventDefault();
    }

    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Login successful, received tokens:', data);
            localStorage.setItem('token', data.access);
            localStorage.setItem('refresh', data.refresh);
            console.log('Tokens saved to localStorage');
            window.location.href = '/';
        } else {
            const error = await response.json();
            console.error('Login failed:', error);
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Инициализация обработчиков событий
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
