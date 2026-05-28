const API = 'http://localhost:3000/api';
let currentUser = null;

// ── Tabs ──────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';       // fuerza ocultamiento
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const panel = document.getElementById('tab-' + tab);
  panel.classList.add('active');
  panel.style.display = 'block';    // fuerza visibilidad

  btn.classList.add('active');
  if (tab === 'resenas') cargarResenas();
  if (tab === 'guardados') cargarGuardados();
}

// ── Avatar ────────────────────────────────────────────
function previewAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const circle = document.getElementById('avatar-circle');
    circle.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover rounded-full" />`;
  };
  reader.readAsDataURL(file);
}

function renderAvatar(name) {
  const circle = document.getElementById('avatar-circle');
  const initial = (name || '').trim().charAt(0).toUpperCase() || 'U';
  circle.innerHTML = initial;
}

// ── Mensajes ──────────────────────────────────────────
function showPerfilMessage(message, isError) {
  const msg = document.getElementById('perfil-msg');
  msg.textContent = message;
  msg.className = isError
    ? 'mt-3 text-sm font-garet text-red-500'
    : 'mt-3 text-sm font-garet text-green-600';
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 3000);
}

// ── Sesión ────────────────────────────────────────────
function getStoredUser() {
  const stored = localStorage.getItem('starbite-user') || sessionStorage.getItem('starbite-user');
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

function saveStoredUser(user) {
  const payload = JSON.stringify(user);
  if (localStorage.getItem('starbite-user')) {
    localStorage.setItem('starbite-user', payload);
  } else {
    sessionStorage.setItem('starbite-user', payload);
  }
}

function clearStoredUser() {
  localStorage.removeItem('starbite-user');
  sessionStorage.removeItem('starbite-user');
}

function cerrarSesion() {
  clearStoredUser();
  window.location.href = 'log_in.html';
}

// ── Campos ────────────────────────────────────────────
function setFields(user) {
  document.getElementById('header-nombre').textContent = user.nombre || 'Usuario';
  document.getElementById('header-correo').textContent = user.correo || '';
  document.getElementById('inp-nombre').value = user.nombre || '';
  document.getElementById('inp-correo').value = user.correo || '';
  document.getElementById('inp-telefono').value = user.telefono || '';
  document.getElementById('inp-direccion').value = user.direccion || '';
  renderAvatar(user.nombre);
}

function updateStats(resenas, guardados) {
  const r = document.getElementById('stat-resenas');
  const g = document.getElementById('stat-guardados');
  if (r) r.textContent = resenas ?? '0';
  if (g) g.textContent = guardados ?? '0';
}

// ── Perfil ────────────────────────────────────────────
async function loadProfile() {
  currentUser = getStoredUser();
  if (!currentUser?.id_user) {
    window.location.href = 'log_in.html';
    return;
  }

  try {
    const res = await fetch(`${API}/usuarios/${currentUser.id_user}`);
    if (!res.ok) {
      clearStoredUser();
      window.location.href = 'log_in.html';
      return;
    }
    const user = await res.json();
    currentUser = user;
    setFields(user);
    saveStoredUser(user);

    // Forzar visibilidad inicial de tabs
    document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
    const activePanel = document.querySelector('.tab-panel.active');
    if (activePanel) activePanel.style.display = 'block';

    // Cargar stats en paralelo
    const [resRes, guardRes] = await Promise.allSettled([
      fetch(`${API}/resenas/usuario/${currentUser.id_user}`),
      fetch(`${API}/guardados/${currentUser.id_user}`)
    ]);
    const resenas = resRes.status === 'fulfilled' && resRes.value.ok
      ? (await resRes.value.json()).length : 0;
    const guardados = guardRes.status === 'fulfilled' && guardRes.value.ok
      ? (await guardRes.value.json()).length : 0;
    updateStats(resenas, guardados);

  } catch {
    clearStoredUser();
    window.location.href = 'log_in.html';
  }
}

async function guardarPerfil() {
  const body = {
    nombre: document.getElementById('inp-nombre').value.trim(),
    correo: document.getElementById('inp-correo').value.trim(),
    telefono: document.getElementById('inp-telefono').value.trim(),
    direccion: document.getElementById('inp-direccion').value.trim(),
  };
  const nuevaContrasena = document.getElementById('inp-password').value;
  if (nuevaContrasena) body.contrasena = nuevaContrasena;

  try {
    const res = await fetch(`${API}/usuarios/${currentUser.id_user}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      showPerfilMessage(data.error || 'No fue posible guardar el perfil', true);
      return;
    }
    currentUser = data.user;
    setFields(data.user);
    saveStoredUser(data.user);
    document.getElementById('inp-password').value = '';
    showPerfilMessage('✅ Cambios guardados correctamente.', false);
  } catch {
    showPerfilMessage('❌ No se pudo conectar con el servidor.', true);
  }
}

async function eliminarCuenta() {
  if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
  try {
    const res = await fetch(`${API}/usuarios/${currentUser.id_user}`, { method: 'DELETE' });
    if (!res.ok) {
      showPerfilMessage('No se pudo eliminar la cuenta', true);
      return;
    }
    clearStoredUser();
    window.location.href = 'log_in.html';
  } catch {
    showPerfilMessage('❌ Error al eliminar la cuenta.', true);
  }
}

// ── Reseñas ───────────────────────────────────────────
function estrellas(n) {
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star${i < n ? '' : ' empty'}">★</span>`
  ).join('');
}

function escapar(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

async function cargarResenas() {
  const container = document.getElementById('resenas-container');
  try {
    const res = await fetch(`${API}/resenas/usuario/${currentUser.id_user}`);
    const resenas = await res.json();

    if (!res.ok) {
      container.innerHTML = '<p class="text-grey font-garet text-sm">Error al cargar reseñas.</p>';
      return;
    }
    if (resenas.length === 0) {
      container.innerHTML = '<p class="text-grey font-garet text-sm">Aún no has hecho ninguna reseña.</p>';
      return;
    }

    updateStats(resenas.length, null);

    container.innerHTML = resenas.map(r => `
      <div class="review-card-new" id="resena-${r.id_resena}">
        <div class="flex items-start justify-between mb-2">
          <div>
            <p class="font-bold text-black text-sm font-garet">${r.nombre_rest}</p>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex gap-0.5">${estrellas(r.calificacion)}</div>
              <span class="text-xs text-grey font-garet">${new Date(r.creado).toLocaleDateString('es-CO')}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="editarResena(${r.id_resena}, '${escapar(r.descripcion)}', ${r.calificacion})"
              class="review-action-btn hover:text-orange hover:border-orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button onclick="eliminarResena(${r.id_resena})"
              class="review-action-btn hover:text-red-500 hover:border-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
        <p class="text-grey text-sm font-garet leading-relaxed">${r.descripcion || 'Sin descripción'}</p>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p class="text-grey font-garet text-sm">Error al cargar reseñas.</p>';
  }
}

async function editarResena(id, descripcionActual, calificacionActual) {
  const nuevaDesc = prompt('Edita tu reseña:', descripcionActual);
  if (nuevaDesc === null) return;
  const nuevaCal = prompt('Nueva calificación (1-5):', calificacionActual);
  if (nuevaCal === null) return;

  try {
    await fetch(`${API}/resenas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion: nuevaDesc, calificacion: parseInt(nuevaCal) })
    });
    cargarResenas();
  } catch {
    alert('Error al editar la reseña.');
  }
}

async function eliminarResena(id) {
  if (!confirm('¿Eliminar esta reseña?')) return;
  try {
    await fetch(`${API}/resenas/${id}`, { method: 'DELETE' });
    document.getElementById('resena-' + id)?.remove();
  } catch {
    alert('Error al eliminar la reseña.');
  }
}

// ── Guardados ─────────────────────────────────────────
async function cargarGuardados() {
  const container = document.getElementById('guardados-container');
  try {
    const res = await fetch(`${API}/guardados/${currentUser.id_user}`);
    const guardados = await res.json();

    if (guardados.length === 0) {
      container.innerHTML = '<p class="text-grey font-garet text-sm col-span-2">No tienes restaurantes guardados aún.</p>';
      return;
    }

    updateStats(null, guardados.length);

    container.innerHTML = guardados.map(g => `
      <div class="saved-card-new">
        <div class="flex items-start justify-between mb-2">
          <span class="saved-pill-new ${g.tipo === 'favorito' ? 'pill-fav' : 'pill-want'} font-garet">
            ${g.tipo === 'favorito' ? 'Favorito' : 'Quiero ir'}
          </span>
          <button onclick="eliminarGuardado(${g.id_favorito}, this)"
            class="review-action-btn hover:text-red-500 hover:border-red-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
        <p class="font-bold text-black text-sm font-garet mt-1">${g.nombre}</p>
        <p class="text-grey text-xs font-garet mt-0.5">${g.direccion}</p>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p class="text-grey font-garet text-sm col-span-2">Error al cargar guardados.</p>';
  }
}

async function eliminarGuardado(id, btn) {
  if (!confirm('¿Quitar este restaurante de guardados?')) return;
  try {
    await fetch(`${API}/guardados/${id}`, { method: 'DELETE' });
    btn.closest('.saved-card-new').remove();
  } catch {
    alert('Error al eliminar.');
  }
}

// ── Nav activo ────────────────────────────────────────
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const page = link.getAttribute('data-page');
  if (currentFile.includes(page)) {
    link.classList.remove('text-grey');
    link.classList.add('text-orange');
  }
});

loadProfile();