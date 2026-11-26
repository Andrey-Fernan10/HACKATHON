const formLogin = document.getElementById('form-login');

function redirectByRole(role) {
    if (role === 'Teacher') {
        window.location.href = 'teacher.html';
    } else {
        window.location.href = 'student.html';
    }
}

formLogin.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            alert('Email ou senha inválidos.');
            return;
        }

        const user = await response.json(); 
        localStorage.setItem('loggedUser', JSON.stringify(user));
        redirectByRole(user.role);
    } catch (error) {
        alert('Não foi possível conectar ao servidor. Tente novamente quando o back-end estiver disponível.');
    }
});