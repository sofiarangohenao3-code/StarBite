/* ═══════════════════════════════════════════════════════
   rest.js  –  StarBite · Vista detalle de restaurante
   ═══════════════════════════════════════════════════════ */

const API     = 'http://localhost:3000/api';
const params  = new URLSearchParams(location.search);
const restId  = params.get('id');

const user = (() => {
  try {
    return JSON.parse(
      localStorage.getItem('starbite-user') ||
      sessionStorage.getItem('starbite-user')
    );
  } catch { return null; }
})();

let restaurant    = null;
let savedRecord   = null;
let editingId     = null;
let selectedStars = 0;

/* ─── Helpers ─────────────────────────────────────────── */

function starsStr(n) {
  const s = Math.round(Math.max(0, Math.min(5, Number(n) || 0)));
  return '★'.repeat(s) + '☆'.repeat(5 - s);
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

function el(id) { return document.getElementById(id); }

function setTagList(containerId, items, cls) {
  const c = el(containerId);
  if (!c) return;
  if (!items || !items.length) { c.innerHTML = '<span style="font-size:12px;color:#ccc">—</span>'; return; }
  c.innerHTML = items.map(t => `<span class="tag ${cls}">${t}</span>`).join('');
}

/* ─── Carga de restaurante ─────────────────────────────── */

async function loadRestaurant() {
  if (!restId) {
    el('rest-nombre').textContent = 'Restaurante no encontrado';
    return;
  }

  try {
    const [dbRestaurant, extraData] = await Promise.all([
      fetch(`${API}/restaurantes/${restId}`).then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch('/assets/data/restaurants-extra.json')
        .then(res => res.ok ? res.json() : [])
        .catch(() => [])
    ]);

    const extra = (extraData || []).find(item => String(item.id_rest) === String(restId)) || {};
    const r = {
      ...extra,
      ...dbRestaurant,
      logo: dbRestaurant.logo || extra.logo,
      coverImage: extra.coverImage || dbRestaurant.logo || extra.logo
    };

    restaurant = r;
    document.title = `StarBite – ${r.nombre}`;

    /* Portada */
    if (r.coverImage) el('cover-img').src = r.coverImage;
    if (r.logo)       el('logo-img').src  = r.logo;

    /* Header */
    el('rest-nombre').textContent        = r.nombre || '—';
    el('rest-direccion').textContent     = r.direccion || '—';
    el('rest-rating-num').textContent    = r.rating ?? '—';
    el('rest-stars').textContent         = starsStr(r.rating ?? 0);
    el('rest-reviews-count').textContent = r.reviewsCount
      ? `${r.reviewsCount.toLocaleString('es-CO')} valoraciones` : '';

    /* Info cards */
    el('info-desc').textContent          = r.descripcion || '—';
    el('info-telefono').textContent      = r.telefono    || '—';
    el('info-horario').textContent       = r.horario     || '—';
    el('info-direccion-card').textContent = r.direccion  || '—';

    if (r.website) {
      const a = el('info-website');
      a.href        = r.website;
      a.textContent = r.website.replace(/^https?:\/\//, '');
    }

    /* Redes sociales */
    if (r.social) {
      const socials = el('social-links');
      const links   = [];
      if (r.social.instagram) links.push({ url: r.social.instagram, label: 'Instagram' });
      if (r.social.facebook)  links.push({ url: r.social.facebook,  label: 'Facebook'  });
      if (r.social.twitter)   links.push({ url: r.social.twitter,   label: 'Twitter/X' });
      socials.innerHTML = links.map(l =>
        `<a class="social-btn" href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`
      ).join('');
    }

    /* Tags */
    setTagList('cuisine-tags',  r.cuisine,  'tag-cuisine');
    setTagList('dietary-tags',  r.dietary,  'tag-dietary');
    setTagList('payment-tags',  r.payment,  'tag-payment');
    setTagList('services-tags', r.services, 'tag-service');
    setTagList('pop-tags',      r.tags,     'tag-pop');

    /* Rating derecho */
    if (r.rating !== undefined && r.rating !== null) {
      el('rating-big').textContent       = r.rating;
      el('rating-stars-big').textContent = starsStr(r.rating);
    }

    /* Menú / platos */
    renderMenu(r.menu);

    /* Mapa */
    if (r.mapQuery) {
      el('map-frame').src =
        `https://www.google.com/maps?q=${encodeURIComponent(r.mapQuery + ', Medellín Colombia')}&output=embed`;
    }

  } catch (err) {
    console.error('[loadRestaurant]', err);
    el('rest-nombre').textContent = 'Error al cargar el restaurante';
  }
}

function renderMenu(menu) {
  const grid = el('menu-grid');
  if (!grid) return;
  if (!menu || !menu.length) {
    grid.innerHTML = '<p style="font-size:13px;color:#ccc;grid-column:1/-1">Sin platos destacados.</p>';
    return;
  }
  grid.innerHTML = menu.map((plato, i) => {
    const imgHtml = plato.image
      ? `<img class="menu-img" src="${plato.image}" alt="${plato.name}" loading="lazy">`
      : `<div class="menu-img-placeholder">🍽</div>`;
    return `
      <div class="menu-card">
        ${imgHtml}
        <div class="menu-info">
          <span class="menu-badge">⭐ #${i + 1}</span>
          <div class="menu-name">${plato.name || ''}</div>
          <div class="menu-desc">${plato.description || ''}</div>
          <div class="menu-price">${plato.price || ''}</div>
        </div>
      </div>`;
  }).join('');
}

/* ─── Guardados (favorito / quiero ir) ─────────────────── */

async function loadSavedStatus() {
  if (!user) return;
  try {
    const rows = await fetch(`${API}/guardados/${user.id_user}`).then(r => r.json());
    savedRecord = rows.find(g => String(g.id_rest) === String(restId)) || null;
    updateSavedUI();
  } catch (err) {
    console.warn('[loadSavedStatus]', err);
  }
}

function updateSavedUI() {
  el('btn-fav').classList.toggle('active',  savedRecord?.tipo === 'favorito');
  el('btn-want').classList.toggle('active', savedRecord?.tipo === 'quiero_ir');
}

window.toggleGuardado = async function(tipo) {
  if (!user) { toast('Inicia sesión para guardar restaurantes'); return; }

  /* Si ya está guardado con ese tipo → borrar */
  if (savedRecord && savedRecord.tipo === tipo) {
    await fetch(`${API}/guardados/${savedRecord.id_favorito}`, { method: 'DELETE' });
    savedRecord = null;
    updateSavedUI();
    toast('Eliminado de guardados');
    return;
  }

  /* Si existe con otro tipo → borrar primero */
  if (savedRecord) {
    await fetch(`${API}/guardados/${savedRecord.id_favorito}`, { method: 'DELETE' });
    savedRecord = null;
  }

  /* Crear nuevo */
  await fetch(`${API}/guardados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_user: user.id_user, id_rest: restId, tipo })
  });

  const rows = await fetch(`${API}/guardados/${user.id_user}`).then(r => r.json());
  savedRecord = rows.find(g => String(g.id_rest) === String(restId)) || null;
  updateSavedUI();
  toast(tipo === 'favorito' ? '❤ Guardado como favorito' : '📍 Añadido a quiero ir');
};

/* ─── Formulario de reseña ──────────────────────────────── */

function buildReviewForm() {
  const container = el('review-form-inner');
  if (!container) return;

  if (!user) {
    container.innerHTML = `
      <div class="login-prompt">
        Inicia sesión para dejar una reseña.
        <a href="log_in.html">Iniciar sesión →</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="star-picker" id="star-picker">
      ${[1,2,3,4,5].map(n =>
        `<span data-val="${n}" onclick="setStars(${n})">☆</span>`
      ).join('')}
    </div>
    <textarea
      id="review-text"
      class="review-textarea"
      rows="3"
      placeholder="Comparte tu experiencia..."></textarea>
    <button
      id="btn-submit-review"
      class="btn-submit"
      onclick="submitReview()">
      Publicar reseña
    </button>`;
}

window.setStars = function(n) {
  selectedStars = n;
  document.querySelectorAll('#star-picker span').forEach((span, i) => {
    span.textContent = i < n ? '★' : '☆';
    span.classList.toggle('active', i < n);
  });
};

window.submitReview = async function() {
  const textEl = el('review-text');
  const text   = textEl?.value?.trim();
  const btnEl  = el('btn-submit-review');

  if (!selectedStars)  { toast('Selecciona una calificación'); return; }
  if (!text)           { toast('Escribe tu reseña'); return; }

  btnEl.disabled = true;

  try {
    if (editingId) {
      await fetch(`${API}/resenas/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: text, calificacion: selectedStars })
      });
      editingId           = null;
      btnEl.textContent   = 'Publicar reseña';
      toast('Reseña actualizada ✓');
    } else {
      await fetch(`${API}/resenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_user: user.id_user, id_rest: restId,
          descripcion: text, calificacion: selectedStars
        })
      });
      toast('Reseña publicada ✓');
    }

    setStars(0);
    selectedStars     = 0;
    textEl.value      = '';
    await loadReviews();

  } catch (err) {
    console.error('[submitReview]', err);
    toast('Error al guardar la reseña');
  } finally {
    btnEl.disabled = false;
  }
};

window.editReview = function(id, cal, desc) {
  editingId = id;
  const textEl = el('review-text');
  if (textEl) textEl.value = desc;
  setStars(cal);
  const btnEl = el('btn-submit-review');
  if (btnEl) btnEl.textContent = 'Guardar cambios';
  const formEl = el('review-form-inner');
  if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.deleteReview = async function(id) {
  if (!confirm('¿Eliminar esta reseña?')) return;
  try {
    await fetch(`${API}/resenas/${id}`, { method: 'DELETE' });
    toast('Reseña eliminada');
    await loadReviews();
  } catch {
    toast('Error al eliminar');
  }
};

/* ─── Lista de reseñas ──────────────────────────────────── */

async function loadReviews() {
  const list = el('reviews-list');
  if (!list) return;

  try {
    const rows = await fetch(`${API}/resenas/restaurante/${restId}`).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

    if (!rows.length) {
      list.innerHTML = '<p class="empty-state">Aún no hay reseñas. ¡Sé el primero!</p>';
      return;
    }

    list.innerHTML = rows.map(rv => {
      const isOwner = user && String(user.id_user) === String(rv.id_user);
      const actions = isOwner ? `
        <div class="review-actions">
          <button class="review-action-btn edit"
            onclick="editReview(${rv.id_resena}, ${rv.calificacion}, ${JSON.stringify(rv.descripcion)})">
            Editar
          </button>
          <button class="review-action-btn del"
            onclick="deleteReview(${rv.id_resena})">
            Eliminar
          </button>
        </div>` : '';

      return `
        <div class="review-item">
          <div class="review-header">
            <span class="review-user">${rv.nombre_user || 'Usuario'}</span>
            <span class="review-stars">${starsStr(rv.calificacion)}</span>
          </div>
          <div class="review-date">${fmtDate(rv.creado)}</div>
          <div class="review-text">${rv.descripcion || ''}</div>
          ${actions}
        </div>`;
    }).join('');

  } catch (err) {
    console.error('[loadReviews]', err);
    list.innerHTML = '<p class="empty-state">No se pudieron cargar las reseñas.</p>';
  }
}

/* ─── Nav activo ─────────────────────────────────────────── */

(function markActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-page]').forEach(link => {
    const matches = page.includes(link.dataset.page);
    link.style.color = matches ? 'var(--brand)' : '';
  });
})();

/* ─── Init ───────────────────────────────────────────────── */

(async function init() {
  await loadRestaurant();
  buildReviewForm();
  await loadSavedStatus();
  await loadReviews();
})();