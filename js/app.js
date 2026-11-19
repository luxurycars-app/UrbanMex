/**
 * App - Lógica de la Vista del Cliente (Catálogo URBAN MEX)
 * Sincronización inmediata con el Panel Admin y soporte fluido en iOS/iPhone.
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    currentCategory: 'brand',
    selectedBrand: 'all',
    searchQuery: '',
    products: [],
    brands: [],
    settings: {}
  };

  const productsGrid = document.getElementById('productsGrid');
  const brandFiltersWrapper = document.getElementById('brandFiltersWrapper');
  const customBanner = document.getElementById('customBanner');
  const catalogCountEl = document.getElementById('catalogCount');
  const segmentBtns = document.querySelectorAll('.segment-btn');
  const searchInput = document.getElementById('searchInput');

  const productModal = document.getElementById('productModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImgWrap = document.getElementById('modalImgWrap');
  const modalImg = document.getElementById('modalImg');
  const modalBrandBadge = document.getElementById('modalBrandBadge');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalPrice = document.getElementById('modalPrice');
  const modalWaBtn = document.getElementById('modalWaBtn');

  function init() {
    loadData();
    renderBrandsFilter();
    renderProducts();
    bindEvents();
  }

  function loadData() {
    state.settings = Store.getSettings();
    state.brands = Store.getBrands();
    state.products = Store.getProducts();

    document.title = `${state.settings.storeName || 'URBAN MEX'} | ${state.settings.tagline || 'Te Lo Hacen Realidad'}`;
    document.querySelectorAll('.dynamic-store-name').forEach(el => {
      el.textContent = state.settings.storeName || 'URBAN MEX';
    });
    const taglineEl = document.getElementById('dynamicTagline');
    if (taglineEl && state.settings.tagline) {
      taglineEl.textContent = `✦ ${state.settings.tagline}`;
    }
  }

  function renderBrandsFilter() {
    if (!brandFiltersWrapper) return;

    if (state.currentCategory === 'custom') {
      brandFiltersWrapper.style.display = 'none';
      if (customBanner) customBanner.style.display = 'block';
      return;
    }

    brandFiltersWrapper.style.display = 'flex';
    if (customBanner) customBanner.style.display = 'none';

    const allBrandsProducts = state.products.filter(p => p.category === 'brand' || !p.category);
    const totalBrandProducts = allBrandsProducts.length;

    // Verificar si la marca seleccionada sigue existiendo
    if (state.selectedBrand !== 'all') {
      const brandStillExists = state.brands.some(b => b.toLowerCase() === state.selectedBrand.toLowerCase());
      if (!brandStillExists) state.selectedBrand = 'all';
    }

    let html = `
      <button type="button" class="brand-chip ${state.selectedBrand === 'all' ? 'active' : ''}" data-brand="all">
        <span>Todas</span>
        <span class="chip-count">${totalBrandProducts}</span>
      </button>
    `;

    state.brands.forEach(brand => {
      const count = allBrandsProducts.filter(p => (p.brand || '').toLowerCase() === brand.toLowerCase()).length;
      const isActive = state.selectedBrand.toLowerCase() === brand.toLowerCase();
      html += `
        <button type="button" class="brand-chip ${isActive ? 'active' : ''}" data-brand="${escapeHtml(brand)}">
          <span>${escapeHtml(brand)}</span>
          <span class="chip-count">${count}</span>
        </button>
      `;
    });

    brandFiltersWrapper.innerHTML = html;

    brandFiltersWrapper.querySelectorAll('.brand-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.selectedBrand = chip.getAttribute('data-brand');
        renderBrandsFilter();
        renderProducts();
      });
    });
  }

  function renderProducts() {
    if (!productsGrid) return;

    let filtered = state.products.filter(p => {
      if (state.currentCategory === 'custom') {
        return p.category === 'custom';
      }
      return p.category === 'brand' || !p.category;
    });

    if (state.currentCategory === 'brand' && state.selectedBrand !== 'all') {
      filtered = filtered.filter(p => (p.brand || '').toLowerCase() === state.selectedBrand.toLowerCase());
    }

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (catalogCountEl) {
      catalogCountEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'modelo' : 'modelos'}`;
    }

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-catalog" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h3>No se encontraron camisas</h3>
          <p>No hay modelos disponibles en esta categoría o con el filtro seleccionado.</p>
          ${state.selectedBrand !== 'all' ? `
            <button type="button" class="btn btn-secondary btn-sm" id="btnResetBrandFilter">
              Ver todas las marcas
            </button>
          ` : ''}
        </div>
      `;

      const resetBtn = document.getElementById('btnResetBrandFilter');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.selectedBrand = 'all';
          renderBrandsFilter();
          renderProducts();
        });
      }
      return;
    }

    productsGrid.innerHTML = filtered.map((product, index) => {
      const isCustom = product.category === 'custom';
      const badgeText = isCustom ? 'Personalizada' : (product.brand || 'Original');
      const badgeClass = isCustom ? 'badge-brand badge-custom' : 'badge-brand';
      const displayTitle = (product.name || `Camisa ${index + 1}`).trim();
      const waLink = Store.getWhatsAppLink(product);
      const formattedPrice = Store.formatPrice(product.price);
      const animDelay = Math.min(index * 40, 400);

      const hasRealImage = product.image && product.image.trim() !== '' && !product.image.startsWith('data:image/svg+xml');

      const imageContent = hasRealImage
        ? `<img 
            class="product-image" 
            src="${escapeHtml(product.image)}" 
            alt="${escapeHtml(displayTitle)}"
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="no-image-minimal" style="display:none;"><span>Sin imagen</span></div>`
        : `<div class="no-image-minimal"><span>Sin imagen</span></div>`;

      return `
        <article class="product-card" data-id="${escapeHtml(product.id)}" style="animation-delay: ${animDelay}ms;">
          <div class="product-image-box js-open-modal" data-id="${escapeHtml(product.id)}">
            ${imageContent}
            <span class="${badgeClass}">${escapeHtml(badgeText)}</span>
          </div>

          <div class="product-info">
            <h3 class="product-title js-open-modal" data-id="${escapeHtml(product.id)}" style="cursor: pointer;">
              ${escapeHtml(displayTitle)}
            </h3>
            
            <p class="product-desc" title="${escapeHtml(product.description || '')}">
              ${escapeHtml(product.description || 'Consulta tallas y colores')}
            </p>

            <div class="product-footer">
              <div class="price-container">
                <span class="product-price">${escapeHtml(formattedPrice)}</span>
              </div>

              <a 
                href="${waLink}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="btn-whatsapp"
                title="Pedir ${escapeHtml(displayTitle)} por WhatsApp"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.076-2.125-.515-1.503-.62-2.457-2.148-2.532-2.247-.074-.1-1.07-1.423-1.07-2.715 0-1.291.678-1.928.92-2.189.243-.261.53-.326.708-.326.178 0 .356.002.51.01.164.008.384-.062.6.457.222.533.757 1.848.824 1.983.067.135.111.293.023.47-.089.178-.133.289-.264.444-.131.155-.276.347-.394.466-.131.132-.268.276-.115.539.153.262.68 1.119 1.46 1.814 1.002.893 1.847 1.17 2.108 1.301.261.13.414.11.567-.066.153-.177.653-.761.826-1.023.173-.262.348-.218.587-.13.239.088 1.517.716 1.777.846.26.13.434.195.499.304.065.109.065.632-.079 1.037z"/>
                </svg>
                <span>Pedir por WhatsApp</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function bindEvents() {
    // Delegación segura para abrir el modal al tocar imagen o título
    if (productsGrid) {
      productsGrid.addEventListener('click', (e) => {
        const trigger = e.target.closest('.js-open-modal');
        if (trigger) {
          const prodId = trigger.getAttribute('data-id');
          openProductDetail(prodId);
        }
      });
    }

    segmentBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        segmentBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        state.currentCategory = btn.getAttribute('data-category');
        state.selectedBrand = 'all';
        renderBrandsFilter();
        renderProducts();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderProducts();
      });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeProductModal);
    }

    if (productModal) {
      productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
          closeProductModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && productModal && productModal.classList.contains('active')) {
        closeProductModal();
      }
    });

    // Sincronización automática cuando editas en otra pestaña o regresas desde Admin en iPhone
    window.addEventListener('storage', () => {
      loadData();
      renderBrandsFilter();
      renderProducts();
    });

    window.addEventListener('pageshow', () => {
      loadData();
      renderBrandsFilter();
      renderProducts();
    });
  }

  function openProductDetail(productId) {
    const product = Store.getProductById(productId);
    if (!product || !productModal) return;

    const hasRealImage = product.image && product.image.trim() !== '' && !product.image.startsWith('data:image/svg+xml');
    const wrap = modalImgWrap || modalImg.parentElement;

    const oldPlaceholder = wrap.querySelector('.no-image-minimal');
    if (oldPlaceholder) oldPlaceholder.remove();

    if (hasRealImage) {
      modalImg.style.display = 'block';
      modalImg.src = product.image;
      modalImg.alt = product.name;
      modalImg.onerror = () => {
        modalImg.style.display = 'none';
        appendModalNoImage(wrap);
      };
    } else {
      modalImg.style.display = 'none';
      appendModalNoImage(wrap);
    }

    modalTitle.textContent = product.name;
    modalDesc.textContent = product.description || 'Sin descripción detallada disponible.';
    modalPrice.textContent = Store.formatPrice(product.price);

    const isCustom = product.category === 'custom';
    modalBrandBadge.textContent = isCustom ? 'Personalizada' : product.brand;
    modalBrandBadge.className = isCustom ? 'badge-brand badge-custom' : 'badge-brand';

    modalWaBtn.href = Store.getWhatsAppLink(product);

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function appendModalNoImage(wrap) {
    if (wrap.querySelector('.no-image-minimal')) return;
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className = 'no-image-minimal';
    placeholderDiv.innerHTML = '<span>Sin imagen</span>';
    wrap.appendChild(placeholderDiv);
  }

  function closeProductModal() {
    if (!productModal) return;
    productModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  init();
});