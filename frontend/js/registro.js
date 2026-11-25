const formRegistro = document.getElementById('form-registro');

formRegistro.addEventListener('submit', async (event) => {
    event.preventDefault();

    const userData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        role: document.querySelector('input[name="role"]:checked').value
    };

    localStorage.setItem('registeredRole_' + userData.email, userData.role);

    try {
        const response = await fetch('http://localhost:8080/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            alert('Erro ao cadastrar usuário.');
            return;
        }

        alert('Cadastro realizado com sucesso!');
        window.location.href = 'login.html';
    } catch (error) {

        alert('Back-end indisponível no momento; indo para o login para teste local.');
        window.location.href = 'login.html';
    }
});