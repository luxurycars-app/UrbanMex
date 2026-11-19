/**
 * Admin Panel - Lógica de Control para el Dueño
 * Subir camisas, cambiar precios en Soles (S/), gestionar marcas y quitar/poner fotos sin errores.
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    products: [],
    brands: [],
    settings: {},
    currentImageBase64: '',
    editingProductId: null,
    searchFilter: '',
    typeFilter: 'all'
  };

  const loginScreen = document.getElementById('loginScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const loginPin = document.getElementById('loginPin');
  const btnLogout = document.getElementById('btnLogout');

  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  const statProductsCount = document.getElementById('statProductsCount');
  const statBrandsCount = document.getElementById('statBrandsCount');
  const dynamicStoreNames = document.querySelectorAll('.dynamic-store-name');
  const currencyLabels = document.querySelectorAll('.currency-label');

  const formCard = document.getElementById('formCard');
  const formTitle = document.getElementById('formTitle');
  const productForm = document.getElementById('productForm');
  const editProductIdInput = document.getElementById('editProductId');
  const typeBrandRadio = document.getElementById('typeBrand');
  const typeCustomRadio = document.getElementById('typeCustom');
  const brandSelectGroup = document.getElementById('brandSelectGroup');
  const productBrandSelect = document.getElementById('productBrand');
  const btnQuickAddBrand = document.getElementById('btnQuickAddBrand');
  const productNameInput = document.getElementById('productName');
  const productPriceInput = document.getElementById('productPrice');
  const productDescInput = document.getElementById('productDesc');
  const dropzoneBox = document.getElementById('dropzoneBox');
  const fileInput = document.getElementById('fileInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreviewImg = document.getElementById('imagePreviewImg');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const productImageUrlInput = document.getElementById('productImageUrl');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  const btnSubmitProduct = document.getElementById('btnSubmitProduct');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const btnResetForm = document.getElementById('btnResetForm');

  const adminProductsList = document.getElementById('adminProductsList');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminFilterType = document.getElementById('adminFilterType');

  const brandForm = document.getElementById('brandForm');
  const newBrandNameInput = document.getElementById('newBrandName');
  const adminBrandsList = document.getElementById('adminBrandsList');

  const settingsForm = document.getElementById('settingsForm');
  const settingStoreName = document.getElementById('settingStoreName');
  const settingStoreTagline = document.getElementById('settingStoreTagline');
  const settingWhatsapp = document.getElementById('settingWhatsapp');
  const settingCurrency = document.getElementById('settingCurrency');
  const settingAdminPin = document.getElementById('settingAdminPin');
  const btnResetDefaults = document.getElementById('btnResetDefaults');

  const toastContainer = document.getElementById('toastContainer');

  function init() {
    loadStoreData();
    checkAuthStatus();
    bindEvents();
  }

  function loadStoreData() {
    state.settings = Store.getSettings();
    state.brands = Store.getBrands();
    state.products = Store.getProducts();

    dynamicStoreNames.forEach(el => {
      el.textContent = state.settings.storeName || 'URBAN MEX';
    });

    currencyLabels.forEach(el => {
      el.textContent = (state.settings.currency || 'S/').trim();
    });
  }

  function checkAuthStatus() {
    if (Store.isAdminAuthenticated()) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = 'block';
    adminDashboard.style.display = 'none';
    btnLogout.style.display = 'none';
    loginPin.value = '';
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    btnLogout.style.display = 'inline-flex';

    loadStoreData();
    renderBrandsInSelect();
    renderProductsList();
    renderBrandsManager();
    populateSettingsForm();
    updateStats();
  }

  function updateStats() {
    if (statProductsCount) statProductsCount.textContent = state.products.length;
    if (statBrandsCount) statBrandsCount.textContent = state.brands.length;
  }

  function bindEvents() {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (Store.loginAdmin(loginPin.value)) {
        showToast('¡Bienvenido al Panel de Administración!', 'success');
        showDashboard();
      } else {
        showToast('PIN incorrecto. Intenta de nuevo.', 'error');
        loginPin.select();
      }
    });

    btnLogout.addEventListener('click', () => {
      Store.logoutAdmin();
      showToast('Sesión cerrada.', 'info');
      showLogin();
    });

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        tabContents.forEach(content => {
          content.style.display = content.id === targetTabId ? 'block' : 'none';
        });

        if (targetTabId === 'tabProducts') {
          renderBrandsInSelect();
          renderProductsList();
        }
        if (targetTabId === 'tabBrands') renderBrandsManager();
        if (targetTabId === 'tabSettings') populateSettingsForm();
      });
    });

    typeBrandRadio.addEventListener('change', toggleBrandGroupVisibility);
    typeCustomRadio.addEventListener('change', toggleBrandGroupVisibility);

    dropzoneBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        try {
          showToast('Optimizando foto...', 'info');
          const compressedDataUrl = await Store.compressImage(file, 900, 900, 0.82);
          setImagePreview(compressedDataUrl);
          state.currentImageBase64 = compressedDataUrl;
          productImageUrlInput.value = '';
          showToast('Foto lista.', 'success');
        } catch (err) {
          showToast('Error al procesar la imagen.', 'error');
        }
      }
    });

    productImageUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      setImagePreview(url);
      state.currentImageBase64 = url;
    });

    if (btnRemoveImage) {
      btnRemoveImage.addEventListener('click', () => {
        setImagePreview('');
        state.currentImageBase64 = '';
        fileInput.value = '';
        productImageUrlInput.value = '';
        showToast('La camisa quedará como "Sin imagen".', 'info');
      });
    }

    productForm.addEventListener('submit', handleProductSubmit);
    btnCancelEdit.addEventListener('click', resetProductForm);
    btnResetForm.addEventListener('click', resetProductForm);

    adminSearchInput.addEventListener('input', (e) => {
      state.searchFilter = e.target.value;
      renderProductsList();
    });

    adminFilterType.addEventListener('change', (e) => {
      state.typeFilter = e.target.value;
      renderProductsList();
    });

    // Delegación segura de botones Editar y Eliminar en Inventario
    adminProductsList.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.js-edit-product');
      if (editBtn) {
        startEditProduct(editBtn.getAttribute('data-id'));
        return;
      }
      const delBtn = e.target.closest('.js-delete-product');
      if (delBtn) {
        deleteProductItem(delBtn.getAttribute('data-id'));
      }
    });

    // Delegación segura para eliminar marcas
    adminBrandsList.addEventListener('click', (e) => {
      const removeBrandBtn = e.target.closest('.js-delete-brand');
      if (removeBrandBtn) {
        deleteBrandItem(removeBrandBtn.getAttribute('data-brand'));
      }
    });

    btnQuickAddBrand.addEventListener('click', () => {
      const brandTabBtn = document.querySelector('[data-tab="tabBrands"]');
      if (brandTabBtn) brandTabBtn.click();
      setTimeout(() => newBrandNameInput.focus(), 150);
    });

    brandForm.addEventListener('submit', handleBrandSubmit);
    settingsForm.addEventListener('submit', handleSettingsSubmit);
    btnResetDefaults.addEventListener('click', handleResetDefaults);
  }

  function toggleBrandGroupVisibility() {
    brandSelectGroup.style.display = typeCustomRadio.checked ? 'none' : 'block';
  }

  function setImagePreview(src) {
    const hasValidSrc = src && src.trim() !== '' && !src.startsWith('data:image/svg+xml');
    if (!hasValidSrc) {
      imagePreviewContainer.style.display = 'none';
      imagePreviewImg.src = '';
      dropzonePrompt.style.display = 'block';
      if (btnRemoveImage) btnRemoveImage.style.display = 'none';
      return;
    }
    imagePreviewImg.src = src;
    imagePreviewContainer.style.display = 'block';
    dropzonePrompt.style.display = 'none';
    if (btnRemoveImage) btnRemoveImage.style.display = 'inline-flex';
  }

  function renderBrandsInSelect() {
    if (!productBrandSelect) return;
    if (state.brands.length === 0) {
      productBrandSelect.innerHTML = `<option value="General">General</option>`;
      return;
    }
    productBrandSelect.innerHTML = state.brands.map(brand => `
      <option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>
    `).join('');
  }

  function renderBrandsManager() {
    if (!adminBrandsList) return;

    if (state.brands.length === 0) {
      adminBrandsList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No hay marcas registradas. Agrega una arriba.</p>`;
      return;
    }

    adminBrandsList.innerHTML = state.brands.map(brand => {
      const count = state.products.filter(p => p.category === 'brand' && (p.brand || '').toLowerCase() === brand.toLowerCase()).length;
      return `
        <div class="brand-admin-tag">
          <span>${escapeHtml(brand)}</span>
          <span style="font-size: 0.74rem; color: var(--text-muted);">(${count})</span>
          <button type="button" class="btn-remove-tag js-delete-brand" data-brand="${escapeHtml(brand)}" title="Eliminar ${escapeHtml(brand)}">
            &times;
          </button>
        </div>
      `;
    }).join('');
  }

  function handleBrandSubmit(e) {
    e.preventDefault();
    const name = newBrandNameInput.value.trim();
    if (!name) return;

    const result = Store.addBrand(name);
    if (!result.success) {
      showToast(result.error, 'error');
      return;
    }

    loadStoreData();
    newBrandNameInput.value = '';
    renderBrandsInSelect();
    renderBrandsManager();
    updateStats();
    showToast(`Marca "${name}" agregada.`, 'success');
  }

  function deleteBrandItem(brandName) {
    if (!brandName) return;
    const count = state.products.filter(p => p.category === 'brand' && (p.brand || '').toLowerCase() === brandName.toLowerCase()).length;
    let msg = `¿Eliminar la marca "${brandName}"?`;
    if (count > 0) msg += `\nHay ${count} camisa(s) con esta marca.`;

    if (confirm(msg)) {
      Store.deleteBrand(brandName);
      loadStoreData();
      renderBrandsInSelect();
      renderBrandsManager();
      updateStats();
      showToast(`Marca "${brandName}" eliminada.`, 'info');
    }
  }

  function handleProductSubmit(e) {
    e.preventDefault();

    const isCustom = typeCustomRadio.checked;
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const description = productDescInput.value.trim();
    const brand = isCustom ? 'Personalizada' : (productBrandSelect.value || 'General');
    const image = (state.currentImageBase64 || '').trim();

    if (!name) {
      showToast('Escribe el nombre de la camisa.', 'error');
      return;
    }

    if (isNaN(price) || price < 0) {
      showToast('Ingresa un precio válido (puede ser 0).', 'error');
      return;
    }

    if (state.editingProductId) {
      const updated = Store.updateProduct(state.editingProductId, {
        name,
        price,
        description,
        category: isCustom ? 'custom' : 'brand',
        brand,
        image
      });

      if (updated) {
        showToast(`"${name}" actualizada (${Store.formatPrice(price)}).`, 'success');
      }
    } else {
      Store.addProduct({
        name,
        price,
        description,
        category: isCustom ? 'custom' : 'brand',
        brand,
        image
      });

      showToast(`"${name}" agregada al catálogo.`, 'success');
    }

    loadStoreData();
    renderProductsList();
    renderBrandsManager();
    updateStats();
    resetProductForm();
  }

  function renderProductsList() {
    if (!adminProductsList) return;

    let filtered = [...state.products];

    if (state.typeFilter === 'brand') {
      filtered = filtered.filter(p => p.category === 'brand');
    } else if (state.typeFilter === 'custom') {
      filtered = filtered.filter(p => p.category === 'custom');
    }

    if (state.searchFilter.trim()) {
      const q = state.searchFilter.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      adminProductsList.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 0.86rem;">
          No hay camisas registradas con los filtros actuales.
        </div>
      `;
      return;
    }

    adminProductsList.innerHTML = filtered.map(p => {
      const isCustom = p.category === 'custom';
      const metaBrand = isCustom ? 'Personalizada' : p.brand;
      const formattedPrice = Store.formatPrice(p.price);
      const hasRealImage = p.image && p.image.trim() !== '' && !p.image.startsWith('data:image/svg+xml');
      const thumbSrc = hasRealImage ? p.image : Store.getDefaultImagePlaceholder();

      return `
        <div class="admin-item-row" data-id="${escapeHtml(p.id)}">
          <img 
            class="admin-item-thumb" 
            src="${escapeHtml(thumbSrc)}" 
            alt="${escapeHtml(p.name)}"
            onerror="this.onerror=null; this.src='${Store.getDefaultImagePlaceholder()}';"
          />

          <div class="admin-item-details">
            <h4 class="admin-item-title">${escapeHtml(p.name)}</h4>
            <div class="admin-item-meta">
              <span>${escapeHtml(metaBrand)}</span>
              <span>•</span>
              <span class="admin-item-price">${escapeHtml(formattedPrice)}</span>
            </div>
            <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(p.description || '')}
            </div>
          </div>

          <div class="admin-item-actions">
            <button 
              type="button" 
              class="btn btn-secondary btn-sm js-edit-product" 
              data-id="${escapeHtml(p.id)}"
              title="Editar precio, foto o nombre"
            >
              Editar
            </button>
            <button 
              type="button" 
              class="btn btn-danger btn-sm js-delete-product" 
              data-id="${escapeHtml(p.id)}"
              title="Eliminar camisa"
            >
              ✕
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function startEditProduct(productId) {
    const product = Store.getProductById(productId);
    if (!product) return;

    state.editingProductId = product.id;
    editProductIdInput.value = product.id;
    productNameInput.value = product.name;
    productPriceInput.value = product.price;
    productDescInput.value = product.description || '';

    if (product.category === 'custom') {
      typeCustomRadio.checked = true;
    } else {
      typeBrandRadio.checked = true;
      renderBrandsInSelect();
      productBrandSelect.value = product.brand;
    }
    toggleBrandGroupVisibility();

    const cleanImg = (product.image && !product.image.startsWith('data:image/svg+xml')) ? product.image : '';
    setImagePreview(cleanImg);
    state.currentImageBase64 = cleanImg;
    productImageUrlInput.value = cleanImg.startsWith('http') ? cleanImg : '';

    formTitle.textContent = `Editando: ${product.name}`;
    btnSubmitProduct.textContent = 'Guardar Cambios';
    btnCancelEdit.style.display = 'inline-flex';

    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => productPriceInput.focus(), 300);
  }

  function deleteProductItem(productId) {
    const product = Store.getProductById(productId);
    if (!product) return;

    if (confirm(`¿Eliminar "${product.name}" del catálogo?`)) {
      Store.deleteProduct(productId);
      if (state.editingProductId === productId) resetProductForm();
      loadStoreData();
      renderProductsList();
      renderBrandsManager();
      updateStats();
      showToast(`"${product.name}" eliminada.`, 'info');
    }
  }

  function resetProductForm() {
    state.editingProductId = null;
    editProductIdInput.value = '';
    productForm.reset();
    typeBrandRadio.checked = true;
    toggleBrandGroupVisibility();

    setImagePreview('');
    state.currentImageBase64 = '';
    fileInput.value = '';
    productImageUrlInput.value = '';

    formTitle.textContent = 'Subir Camisa';
    btnSubmitProduct.textContent = 'Guardar Camisa';
    btnCancelEdit.style.display = 'none';
  }

  function populateSettingsForm() {
    settingStoreName.value = state.settings.storeName || 'URBAN MEX';
    settingStoreTagline.value = state.settings.tagline || '';
    settingWhatsapp.value = state.settings.whatsapp || '51900000000';
    settingCurrency.value = state.settings.currency || 'S/ ';
    settingAdminPin.value = state.settings.adminPin || '1234';
  }

  function handleSettingsSubmit(e) {
    e.preventDefault();

    const storeName = settingStoreName.value.trim() || 'URBAN MEX';
    const tagline = settingStoreTagline.value.trim();
    const whatsapp = settingWhatsapp.value.trim();
    const rawCurrency = settingCurrency.value.trim() || 'S/';
    const currency = rawCurrency.endsWith(' ') ? rawCurrency : `${rawCurrency} `;
    const adminPin = settingAdminPin.value.trim() || '1234';

    Store.saveSettings({
      storeName,
      tagline,
      whatsapp,
      currency,
      adminPin
    });

    loadStoreData();
    renderProductsList();
    showToast('Configuración guardada correctamente.', 'success');
  }

  function handleResetDefaults() {
    if (confirm('¿Restablecer el catálogo inicial (Camisa 1 a Camisa 7 en S/ 0.00 y sin fotos)?')) {
      Store.resetToDefaults();
      loadStoreData();
      resetProductForm();
      renderBrandsInSelect();
      renderProductsList();
      renderBrandsManager();
      populateSettingsForm();
      updateStats();
      showToast('Catálogo restablecido a S/ 0.00.', 'success');
    }
  }

  function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '•';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';

    toast.innerHTML = `
      <span style="font-weight: 700;">${icon}</span>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
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