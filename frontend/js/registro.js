const formRegistro = document.getElementById('form-registro');

formRegistro.addEventListener('submit', async (event) => {
    event.preventDefault();

    const userData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        role: document.querySelector('input[name="role"]:checked').value
    };

    try {
        const response = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            alert(response.status === 409
                ? 'Já existe uma conta com este email.'
                : 'Não foi possível cadastrar. Verifique os dados e tente novamente.');
            return;
        }

        alert('Cadastro realizado com sucesso!');
        window.location.href = 'login.html';
    } catch (error) {
        alert('Não foi possível conectar ao servidor. O cadastro não foi salvo.');
    }
});