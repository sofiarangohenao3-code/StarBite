const API = 'http://localhost:3000/api';
const fallbackImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80';
const grid = document.getElementById('restaurants-grid');
const filtersContainer = document.getElementById('filters-container');

let allRestaurants = [];
let activeFilter = null;

function renderStars(rating = 0) {
  const n = Math.round(Math.max(0, Math.min(5, Number(rating) || 0)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function makeCard(restaurant) {
  return `
    <a href="rest.html?id=${restaurant.id_rest}" class="bg-white rounded-[2rem] shadow-lg hover:scale-[1.01] transition-transform block no-underline">
      <div class="h-40 overflow-hidden bg-white-grey" style="border-radius: 2rem 2rem 0 0;">
        <img src="${restaurant.logo || fallbackImage}" alt="${restaurant.nombre}" class="w-full h-full object-cover">
      </div>
      <div class="px-6 py-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-bold text-black text-lg">${restaurant.nombre}</h3>
            <p class="text-xs text-grey mt-1">${restaurant.direccion || 'Dirección no disponible'}</p>
          </div>
          <span class="text-orange text-sm">${renderStars(restaurant.rating)}</span>
        </div>
        ${restaurant.cuisine ? `
        <div class="flex flex-wrap gap-1 mt-2">
          ${restaurant.cuisine.map(c => `<span class="text-[10px] bg-orange/10 text-orange px-2 py-0.5 rounded-full">${c}</span>`).join('')}
        </div>` : ''}
        <p class="text-sm text-grey mt-3 leading-relaxed">${restaurant.descripcion || 'Información no disponible'}</p>
        <div class="mt-4 flex items-center justify-between text-[11px] text-grey font-bold">
          <span>${restaurant.horario || 'Horario no disponible'}</span>
          <span>Ver detalle →</span>
        </div>
      </div>
    </a>`;
}

function buildFilters(restaurants) {
  // Recoger todas las categorías únicas del JSON extra
  const categories = [...new Set(restaurants.flatMap(r => r.cuisine || []))].sort();

  filtersContainer.innerHTML = `
    <button
      class="filter-btn bg-orange text-white px-4 py-2 rounded-full shadow-sm text-xs uppercase tracking-wide font-bold transition-all"
      data-filter="null"
      onclick="applyFilter(null)"
    >Todos</button>
    ${categories.map(cat => `
      <button
        class="filter-btn bg-white text-grey hover:bg-orange hover:text-white px-4 py-2 rounded-full shadow-sm text-xs uppercase tracking-wide font-bold transition-all"
        data-filter="${cat}"
        onclick="applyFilter('${cat}')"
      >${cat}</button>
    `).join('')}
  `;
}

window.applyFilter = function(category) {
  activeFilter = category;

  // Actualizar estilos de botones
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-filter') === String(category);
    btn.classList.toggle('bg-orange', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('bg-white', !isActive);
    btn.classList.toggle('text-grey', !isActive);
  });

  const filtered = category
    ? allRestaurants.filter(r => r.cuisine?.includes(category))
    : allRestaurants;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="col-span-full bg-white rounded-[2rem] p-6 text-grey shadow-sm text-center">No hay restaurantes en esta categoría.</div>';
  } else {
    grid.innerHTML = filtered.map(makeCard).join('');
  }
};

async function loadRestaurants() {
  try {
    const [restaurants, extra] = await Promise.all([
      fetch(`${API}/restaurantes`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('/assets/data/restaurants-extra.json').then(r => r.json()).catch(() => [])
    ]);

    // Merge: los datos de DB tienen prioridad, pero conservamos el logo extra si el logo de DB está vacío
    const extraMap = Object.fromEntries(extra.map(e => [e.id_rest, e]));
    allRestaurants = restaurants.map(r => {
      const extraData = extraMap[r.id_rest] ?? {};
      const merged = {
        ...extraData,
        ...r,
      };
      if (!merged.logo && extraData.logo) {
        merged.logo = extraData.logo;
      }
      return merged;
    });

    buildFilters(allRestaurants);
    grid.innerHTML = allRestaurants.map(makeCard).join('');
  } catch {
    grid.innerHTML = '<div class="col-span-full bg-white rounded-[2rem] p-6 text-grey shadow-sm">No pudimos cargar los restaurantes. Revisa la conexión.</div>';
  }
}

// Nav activo
const currentFile = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(link => {
  const page = link.getAttribute('data-page');
  if (currentFile.includes(page)) {
    link.classList.remove('text-grey');
    link.classList.add('text-orange');
  }
});

loadRestaurants();