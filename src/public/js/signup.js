function togglePassword() {
  const input = document.getElementById('signup-password');
  const icon = document.getElementById('eyeIcon');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  icon.style.opacity = isHidden ? '0.6' : '1';
}

function showMessage(message, isError) {
  const msg = document.getElementById('signup-msg');
  msg.textContent = message;
  msg.className = isError
    ? 'mb-3 text-sm font-garet text-red-500'
    : 'mb-3 text-sm font-garet text-green-600';
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3500);
}

function getStoredUser() {
  const stored = localStorage.getItem('starbite-user') || sessionStorage.getItem('starbite-user');
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

function saveSession(user, remember) {
  const payload = JSON.stringify(user);
  if (remember) {
    localStorage.setItem('starbite-user', payload);
    sessionStorage.removeItem('starbite-user');
  } else {
    sessionStorage.setItem('starbite-user', payload);
    localStorage.removeItem('starbite-user');
  }
}

function redirectIfSignedIn() {
  const currentUser = getStoredUser();
  if (currentUser?.id_user) {
    window.location.href = 'account.html';
  }
}

async function register() {
  const nombre = document.getElementById('signup-name').value.trim();
  const correo = document.getElementById('signup-email').value.trim();
  const contrasena = document.getElementById('signup-password').value;
  const remember = document.getElementById('signup-remember').checked;

  if (!nombre || !correo || !contrasena) {
    showMessage('Nombre, correo y contraseña son requeridos', true);
    return;
  }

  if (contrasena.length < 5) {
    showMessage('La contraseña debe tener al menos 5 caracteres', true);
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, contrasena })
    });

    const data = await res.json();
    if (!res.ok) {
      showMessage(data.error || 'No fue posible crear la cuenta', true);
      return;
    }

    saveSession(data.user, remember);
    window.location.href = 'account.html';
  } catch {
    showMessage('No se pudo conectar con el servidor', true);
  }
}

redirectIfSignedIn();

const currentFile = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const page = link.getAttribute('data-page');
  if (currentFile.includes(page)) {
    link.classList.remove('text-grey');
    link.classList.add('text-orange');
  }
});