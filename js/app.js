    const SUPABASE_URL = 'https://xhhcclmwdxkkrrbqlkze.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaGNjbG13ZHhra3JyYnFsa3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzE1MjgsImV4cCI6MjA5MDA0NzUyOH0.7Eyt-poMCD40psl96EPZ6U1Vo1i_JPv7pg1L5muvWcw';
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const MOBILE_LIMIT = 30;

    const el = {
      desktopNewBtn: document.getElementById('desktopNewBtn'),
      desktopExportBtn: document.getElementById('desktopExportBtn'),
      desktopImportBtn: document.getElementById('desktopImportBtn'),
      desktopSearchInput: document.getElementById('desktopSearchInput'),
      desktopCategoryFilter: document.getElementById('desktopCategoryFilter'),
      desktopTagFilter: document.getElementById('desktopTagFilter'),
      desktopSortFilter: document.getElementById('desktopSortFilter'),
      desktopFavoriteFilterBtn: document.getElementById('desktopFavoriteFilterBtn'),
      desktopPromptCount: document.getElementById('desktopPromptCount'),
      desktopRecentBtn: document.getElementById('desktopRecentBtn'),
      desktopPromptList: document.getElementById('desktopPromptList'),
      desktopDetailsContainer: document.getElementById('desktopDetailsContainer'),
      statusHint: document.getElementById('statusHint'),

      mobileListScreen: document.getElementById('mobileListScreen'),
      mobileDetailsScreen: document.getElementById('mobileDetailsScreen'),
      mobileSearchInput: document.getElementById('mobileSearchInput'),
      mobileCategoryFilter: document.getElementById('mobileCategoryFilter'),
      mobileSortFilter: document.getElementById('mobileSortFilter'),
      mobileQuickTabs: document.getElementById('mobileQuickTabs'),
      mobilePromptCount: document.getElementById('mobilePromptCount'),
      mobilePromptList: document.getElementById('mobilePromptList'),
      mobileDetailsContainer: document.getElementById('mobileDetailsContainer'),
      mobileBackBtn: document.getElementById('mobileBackBtn'),
      mobileFabBtn: document.getElementById('mobileFabBtn'),
      mobileFilterToggleBtn: document.getElementById('mobileFilterToggleBtn'),
      mobileFilterBox: document.getElementById('mobileFilterBox'),
      bottomNavBtns: Array.from(document.querySelectorAll('[data-nav]')),

      actionSheetBackdrop: document.getElementById('actionSheetBackdrop'),
      sheetCopyBtn: document.getElementById('sheetCopyBtn'),
      sheetEditBtn: document.getElementById('sheetEditBtn'),
      sheetFavoriteBtn: document.getElementById('sheetFavoriteBtn'),
      sheetDuplicateBtn: document.getElementById('sheetDuplicateBtn'),
      sheetDeleteBtn: document.getElementById('sheetDeleteBtn'),
      sheetCancelBtn: document.getElementById('sheetCancelBtn'),

      importFileInput: document.getElementById('importFileInput'),
      modalBackdrop: document.getElementById('modalBackdrop'),
      modalWrap: document.getElementById('modalWrap'),
      modalTitle: document.getElementById('modalTitle'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      cancelModalBtn: document.getElementById('cancelModalBtn'),
      modalDuplicateBtn: document.getElementById('modalDuplicateBtn'),
      modalDeleteBtn: document.getElementById('modalDeleteBtn'),
      promptForm: document.getElementById('promptForm'),
      promptId: document.getElementById('promptId'),
      titleInput: document.getElementById('titleInput'),
      categoryInput: document.getElementById('categoryInput'),
      languageInput: document.getElementById('languageInput'),
      tagsInput: document.getElementById('tagsInput'),
      notesInput: document.getElementById('notesInput'),
      promptInput: document.getElementById('promptInput'),
      saveBtn: document.getElementById('saveBtn'),
      toast: document.getElementById('toast')
    };

    const state = {
      items: [],
      selectedId: null,
      search: '',
      category: 'all',
      tag: 'all',
      sort: 'updated_desc',
      mode: 'all',
      mobileScreen: 'list',
      editingId: null,
      actionSheetId: null,
      mobileFiltersOpen: false,
      isLoading: false,
      isSaving: false
    };

    function uid() {
      return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function formatDate(value) {
      if (!value) return '-';
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date(value)).replace(',', '');
    }

    function escapeHtml(str = '') {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function normalizeCsv(value) {
      return value.split(',').map(v => v.trim()).filter(Boolean);
    }

    function showToast(message) {
      el.toast.textContent = message;
      el.toast.classList.add('show');
      clearTimeout(showToast.timer);
      showToast.timer = setTimeout(() => el.toast.classList.remove('show'), 2200);
    }

    function setStatus(text) {
      el.statusHint.textContent = text;
    }

    function rowToItem(row) {
      return {
        id: row.id,
        title: row.title || '',
        category: row.category || 'Other',
        language: row.language || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        notes: row.notes || '',
        prompt: row.prompt || '',
        favorite: !!row.favorite,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        _pending: false
      };
    }

    function itemToInsertPayload(item) {
      return {
        title: item.title,
        category: item.category || 'Other',
        language: item.language || '',
        tags: item.tags || [],
        notes: item.notes || '',
        prompt: item.prompt,
        favorite: !!item.favorite
      };
    }

    function selectedItem() {
      return state.items.find(item => item.id === state.selectedId) || null;
    }

    function daysAgo(iso) {
      const diff = Date.now() - new Date(iso).getTime();
      return diff / (1000 * 60 * 60 * 24);
    }

    function sortItems(items, sort) {
      const copy = [...items];
      switch (sort) {
        case 'created_desc':
          return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        case 'title_asc':
          return copy.sort((a, b) => a.title.localeCompare(b.title));
        case 'favorites_first':
          return copy.sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt) - new Date(a.updatedAt));
        case 'updated_desc':
        default:
          return copy.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }
    }

    function filteredItems() {
      const q = state.search.trim().toLowerCase();
      let items = state.items.filter(item => {
        const matchesSearch = !q || [item.title, item.notes, item.prompt, item.category, item.language, ...(item.tags || [])].join(' ').toLowerCase().includes(q);
        const matchesCategory = state.category === 'all' || item.category === state.category;
        const matchesTag = state.tag === 'all' || (item.tags || []).includes(state.tag);
        const matchesMode = state.mode === 'all' ? true : state.mode === 'favorites' ? item.favorite : state.mode === 'recent' ? daysAgo(item.updatedAt) <= 7 : true;
        return matchesSearch && matchesCategory && matchesTag && matchesMode;
      });
      return sortItems(items, state.sort);
    }

    function getCategories() {
      return ['all', ...new Set(state.items.map(i => i.category).filter(Boolean))].sort((a, b) => a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b));
    }

    function getTags() {
      return ['all', ...new Set(state.items.flatMap(i => i.tags || []).filter(Boolean))].sort((a, b) => a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b));
    }

    function renderSelectOptions(selectEl, options, currentValue, fallbackLabel) {
      selectEl.innerHTML = options.map(value => {
        const label = value === 'all' ? fallbackLabel : value;
        return `<option value="${escapeHtml(value)}" ${value === currentValue ? 'selected' : ''}>${escapeHtml(label)}</option>`;
      }).join('');
    }

    function renderSortOptions(selectEl) {
      const options = [
        { value: 'updated_desc', label: 'Updated' },
        { value: 'created_desc', label: 'Newest' },
        { value: 'title_asc', label: 'A-Z' },
        { value: 'favorites_first', label: 'Favorites first' }
      ];
      selectEl.innerHTML = options.map(opt => `<option value="${opt.value}" ${opt.value === state.sort ? 'selected' : ''}>${opt.label}</option>`).join('');
    }

    function renderDesktopFilters() {
      renderSelectOptions(el.desktopCategoryFilter, getCategories(), state.category, 'All categories');
      renderSelectOptions(el.desktopTagFilter, getTags(), state.tag, 'All tags');
      renderSortOptions(el.desktopSortFilter);
      el.desktopFavoriteFilterBtn.textContent = state.mode === 'favorites' ? 'Favorites: ON' : 'Favorites';
      el.desktopFavoriteFilterBtn.style.background = state.mode === 'favorites' ? '#eef3ff' : '#f6f8fb';
      el.desktopFavoriteFilterBtn.style.borderColor = state.mode === 'favorites' ? '#bfd0ff' : '#d9e1eb';
    }

    function renderDesktopList() {
      const items = filteredItems();
      el.desktopPromptCount.textContent = `${items.length} ${items.length === 1 ? 'prompt' : 'prompts'}`;
      if (!items.length) {
        el.desktopPromptList.innerHTML = `<div class="empty">Nothing found. Adjust filters or add a new prompt.</div>`;
        return;
      }
      el.desktopPromptList.innerHTML = items.map(item => `
        <article class="prompt-item ${item.id === state.selectedId ? 'active' : ''} ${item._pending ? 'pending' : ''}" data-id="${item.id}">
          <div class="prompt-head">
            <div><h3 class="prompt-title">${escapeHtml(item.title)}</h3></div>
            <button class="star-btn" data-favorite-id="${item.id}">${item.favorite ? '★' : '☆'}</button>
          </div>
          <div class="meta-row">
            <span>◫ ${escapeHtml(item.category || 'Other')}</span>
            <span>⌂ ${escapeHtml((item.tags || []).slice(0, 3).join(', ') || 'no tags')}</span>
          </div>
          <p class="prompt-desc">${escapeHtml(item.prompt)}</p>
        </article>
      `).join('');

      el.desktopPromptList.querySelectorAll('.prompt-item').forEach(node => {
        node.addEventListener('click', event => {
          if (event.target.closest('.star-btn')) return;
          state.selectedId = node.dataset.id;
          renderDesktopList();
          renderDesktopDetails();
        });
      });

      el.desktopPromptList.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          toggleFavorite(btn.dataset.favoriteId);
        });
      });
    }

    function renderDesktopDetails() {
      const item = selectedItem();
      if (!item) {
        el.desktopDetailsContainer.innerHTML = `<div class="empty">Select a prompt to see details.</div>`;
        return;
      }

      el.desktopDetailsContainer.innerHTML = `
        <div class="desktop-details-top">
          <div>
            <div class="details-title-line">
              <h2 class="details-title">${escapeHtml(item.title)}</h2>
              ${item.favorite ? '<span class="badge">Favorite</span>' : ''}
              ${item._pending ? '<span class="badge"><span class="loading-dot"></span>Syncing</span>' : ''}
            </div>
            <div class="tag-row">
              <span class="badge">${escapeHtml(item.category || 'Other')}</span>
              ${(item.tags || []).map(tag => `<span class="badge">#${escapeHtml(tag)}</span>`).join('')}
              ${item.language ? `<span class="badge">${escapeHtml(item.language)}</span>` : ''}
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-sm" id="desktopCopyBtn">Copy</button>
            <button class="btn btn-sm" id="desktopEditBtn">Edit</button>
            <button class="btn btn-sm" id="desktopDuplicateBtn">Duplicate</button>
            <button class="btn btn-sm" id="desktopFavBtn">${item.favorite ? 'Unfavorite' : 'Favorite'}</button>
            <button class="btn btn-sm btn-danger" id="desktopDeleteBtn">Delete</button>
          </div>
        </div>
        <div class="content-box">
          <h3 class="content-label">Notes</h3>
          <p class="content-text">${escapeHtml(item.notes || '-')}</p>
        </div>
        <div class="content-box">
          <h3 class="content-label">Prompt</h3>
          <p class="content-text">${escapeHtml(item.prompt)}</p>
        </div>
        <div class="dates">
          <div>Created: ${escapeHtml(formatDate(item.createdAt))}</div>
          <div>Updated: ${escapeHtml(formatDate(item.updatedAt))}</div>
        </div>
      `;

      document.getElementById('desktopCopyBtn').addEventListener('click', () => copyPrompt(item.id));
      document.getElementById('desktopEditBtn').addEventListener('click', () => openModal(item.id));
      document.getElementById('desktopDuplicateBtn').addEventListener('click', () => duplicatePrompt(item.id));
      document.getElementById('desktopFavBtn').addEventListener('click', () => toggleFavorite(item.id));
      document.getElementById('desktopDeleteBtn').addEventListener('click', () => deletePrompt(item.id));
    }

    function renderMobileFilters() {
      renderSelectOptions(el.mobileCategoryFilter, getCategories(), state.category, 'Categories');
      renderSortOptions(el.mobileSortFilter);
      const tabs = [
        { value: 'all', label: 'All' },
        { value: 'favorites', label: 'Favorites' },
        { value: 'recent', label: 'Recent' },
        { value: 'clearTag', label: state.tag === 'all' ? 'All tags' : `#${state.tag}` }
      ];
      el.mobileQuickTabs.innerHTML = tabs.map(tab => {
        const active = tab.value === 'clearTag' ? state.tag !== 'all' : state.mode === tab.value;
        return `<button class="chip-btn ${active ? 'active' : ''}" data-chip="${tab.value}">${escapeHtml(tab.label)}</button>`;
      }).join('');
      el.mobilePromptCount.textContent = `${filteredItems().length} prompts`;
      el.bottomNavBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.nav === state.mode));
      el.mobileFilterBox.classList.toggle('open', state.mobileFiltersOpen);
      el.mobileFilterToggleBtn.textContent = state.mobileFiltersOpen ? 'Hide' : 'Filters';
    }

    function renderMobileList() {
      const items = filteredItems().slice(0, MOBILE_LIMIT);
      if (!items.length) {
        el.mobilePromptList.innerHTML = `<div class="empty">Nothing found. Try another search or create a new prompt.</div>`;
      } else {
        el.mobilePromptList.innerHTML = items.map(item => `
          <article class="mobile-item ${item.id === state.selectedId ? 'active' : ''} ${item._pending ? 'pending' : ''}" data-mobile-id="${item.id}">
            <div class="mobile-item-top">
              <h3 class="mobile-item-title">${escapeHtml(item.title)}</h3>
              <button class="star-btn" data-mobile-favorite-id="${item.id}">${item.favorite ? '★' : '☆'}</button>
            </div>
            <div class="mobile-meta">
              <span>◫ ${escapeHtml(item.category || 'Other')}</span>
              <span>⌂ ${escapeHtml((item.tags || []).slice(0, 2).join(', ') || 'no tags')}</span>
            </div>
            <p class="mobile-preview">${escapeHtml(item.prompt)}</p>
          </article>
        `).join('');

        if (filteredItems().length > MOBILE_LIMIT) {
          el.mobilePromptList.insertAdjacentHTML('beforeend', `<div class="empty">Showing first ${MOBILE_LIMIT} prompts. Use search, favorites, recent, or sorting to narrow the list.</div>`);
        }
      }

      el.mobilePromptList.querySelectorAll('[data-mobile-id]').forEach(node => {
        node.addEventListener('click', event => {
          if (event.target.closest('.star-btn')) return;
          openMobileDetails(node.dataset.mobileId);
        });
      });

      el.mobilePromptList.querySelectorAll('[data-mobile-favorite-id]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          toggleFavorite(btn.dataset.mobileFavoriteId);
        });
      });

      el.mobileQuickTabs.querySelectorAll('[data-chip]').forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.chip;
          if (value === 'clearTag') state.tag = 'all'; else state.mode = value;
          renderMobile();
        });
      });
    }

    function renderMobileDetails() {
      const item = selectedItem();
      if (!item) {
        el.mobileDetailsContainer.innerHTML = `<div class="empty">Select a prompt from the list.</div>`;
        return;
      }
      el.mobileDetailsContainer.innerHTML = `
        <div class="card mobile-details-card">
          <h2 class="mobile-details-title">${escapeHtml(item.title)}</h2>
          <div class="tag-row">
            <span class="badge">${escapeHtml(item.category || 'Other')}</span>
            ${(item.tags || []).map(tag => `<span class="badge">#${escapeHtml(tag)}</span>`).join('')}
            ${item.language ? `<span class="badge">${escapeHtml(item.language)}</span>` : ''}
            ${item.favorite ? `<span class="badge">Favorite</span>` : ''}
            ${item._pending ? `<span class="badge"><span class="loading-dot"></span>Syncing</span>` : ''}
          </div>
          <div class="mobile-actions-row">
            <button class="btn" id="mobileCopyBtn">Copy</button>
            <button class="btn btn-primary" id="mobileActionsBtn">Actions</button>
          </div>
          <div class="content-box">
            <h3 class="content-label">Notes</h3>
            <p class="content-text">${escapeHtml(item.notes || '-')}</p>
          </div>
          <div class="content-box">
            <h3 class="content-label">Prompt</h3>
            <p class="content-text">${escapeHtml(item.prompt)}</p>
          </div>
          <div class="dates" style="grid-template-columns:1fr; gap:10px; font-size:15px;">
            <div>Created: ${escapeHtml(formatDate(item.createdAt))}</div>
            <div>Updated: ${escapeHtml(formatDate(item.updatedAt))}</div>
          </div>
        </div>
      `;
      document.getElementById('mobileCopyBtn').addEventListener('click', () => copyPrompt(item.id));
      document.getElementById('mobileActionsBtn').addEventListener('click', () => openActionSheet(item.id));
    }

    function renderMobileScreens() {
      el.mobileListScreen.classList.toggle('active', state.mobileScreen === 'list');
      el.mobileDetailsScreen.classList.toggle('active', state.mobileScreen === 'details');
    }

    function renderDesktop() {
      renderDesktopFilters();
      renderDesktopList();
      renderDesktopDetails();
      el.desktopSearchInput.value = state.search;
    }

    function renderMobile() {
      renderMobileFilters();
      renderMobileList();
      renderMobileDetails();
      renderMobileScreens();
      el.mobileSearchInput.value = state.search;
    }

    function renderAll() {
      renderDesktop();
      renderMobile();
    }

    function openMobileDetails(id) {
      state.selectedId = id;
      state.mobileScreen = 'details';
      renderMobile();
    }

    function closeMobileDetails() {
      state.mobileScreen = 'list';
      renderMobileScreens();
    }

    function openActionSheet(id) {
      state.actionSheetId = id;
      const item = state.items.find(x => x.id === id);
      el.sheetFavoriteBtn.textContent = item?.favorite ? 'Unfavorite' : 'Favorite';
      el.actionSheetBackdrop.classList.add('show');
    }

    function closeActionSheet() {
      el.actionSheetBackdrop.classList.remove('show');
      state.actionSheetId = null;
    }

    function openModal(id = null) {
      state.editingId = id;
      const item = state.items.find(x => x.id === id);
      el.modalTitle.textContent = item ? 'Edit prompt' : 'New prompt';
      el.promptId.value = item?.id || '';
      el.titleInput.value = item?.title || '';
      el.categoryInput.value = item?.category || '';
      el.languageInput.value = item?.language || '';
      el.tagsInput.value = (item?.tags || []).join(', ');
      el.notesInput.value = item?.notes || '';
      el.promptInput.value = item?.prompt || '';
      el.modalDeleteBtn.style.display = item ? 'inline-flex' : 'none';
      el.modalDuplicateBtn.style.display = item ? 'inline-flex' : 'none';
      el.modalBackdrop.classList.add('show');
      el.modalWrap.classList.add('show');
      setTimeout(() => el.titleInput.focus(), 40);
    }

    function closeModal() {
      el.modalBackdrop.classList.remove('show');
      el.modalWrap.classList.remove('show');
      state.editingId = null;
      el.promptForm.reset();
      el.promptId.value = '';
      el.saveBtn.disabled = false;
      el.saveBtn.textContent = 'Save prompt';
    }

    async function loadStateFromDb() {
      state.isLoading = true;
      setStatus('Loading...');
      const { data, error } = await buildSelectQuery();
      state.isLoading = false;
      if (error) {
        console.error('Load error:', error);
        setStatus('Load failed');
        showToast('Failed to load prompts.');
        return;
      }
      state.items = (data || []).map(rowToItem);
      if (!state.items.some(x => x.id === state.selectedId)) state.selectedId = state.items[0]?.id || null;
      setStatus('Connected');
    }

    function buildSelectQuery() {
      let query = supabaseClient.from('prompts').select('*');

      const sortMap = {
        updated_desc: { column: 'updated_at', ascending: false },
        created_desc: { column: 'created_at', ascending: false },
        title_asc: { column: 'title', ascending: true },
        favorites_first: { column: 'favorite', ascending: false, second: { column: 'updated_at', ascending: false } }
      };

      const selectedSort = sortMap[state.sort] || sortMap.updated_desc;
      query = query.order(selectedSort.column, { ascending: selectedSort.ascending, nullsFirst: false });
      if (selectedSort.second) query = query.order(selectedSort.second.column, { ascending: selectedSort.second.ascending, nullsFirst: false });

      return query;
    }

    async function refreshFromDb() {
      await loadStateFromDb();
      renderAll();
    }

    async function savePrompt(event) {
      event.preventDefault();

      const title = el.titleInput.value.trim();
      const prompt = el.promptInput.value.trim();
      if (!title) return showToast('Title is required.');
      if (!prompt) return showToast('Prompt text is required.');

      el.saveBtn.disabled = true;
      el.saveBtn.textContent = 'Saving...';

      const existing = state.items.find(item => item.id === el.promptId.value);
      const optimisticItem = {
        id: existing?.id || `tmp-${uid()}`,
        title,
        category: el.categoryInput.value.trim() || 'Other',
        language: el.languageInput.value.trim(),
        tags: normalizeCsv(el.tagsInput.value),
        notes: el.notesInput.value.trim(),
        prompt,
        favorite: existing?.favorite || false,
        createdAt: existing?.createdAt || nowIso(),
        updatedAt: nowIso(),
        _pending: true
      };

      if (existing) {
        state.items = state.items.map(item => item.id === existing.id ? optimisticItem : item);
      } else {
        state.items.unshift(optimisticItem);
      }

      state.selectedId = optimisticItem.id;
      state.mobileScreen = 'details';
      closeModal();
      renderAll();

      let result;
      if (existing) {
        result = await supabaseClient
          .from('prompts')
          .update(itemToInsertPayload(optimisticItem))
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await supabaseClient
          .from('prompts')
          .insert(itemToInsertPayload(optimisticItem))
          .select()
          .single();
      }

      if (result.error) {
        console.error('Save error:', result.error);
        showToast('Failed to save prompt.');
        await refreshFromDb();
        return;
      }

      const savedItem = rowToItem(result.data);
      if (existing) {
        state.items = state.items.map(item => item.id === existing.id ? savedItem : item);
      } else {
        state.items = state.items.map(item => item.id === optimisticItem.id ? savedItem : item);
      }
      state.selectedId = savedItem.id;
      renderAll();
      showToast(existing ? 'Prompt updated.' : 'Prompt created.');
    }

    async function deletePrompt(id) {
      const existingItems = [...state.items];
      const existingSelectedId = state.selectedId;
      const item = state.items.find(x => x.id === id);
      if (!item) return;
      if (!confirm(`Delete prompt "${item.title}"?`)) return;

      state.items = state.items.filter(x => x.id !== id);
      if (state.selectedId === id) state.selectedId = state.items[0]?.id || null;
      if (!state.selectedId) state.mobileScreen = 'list';
      closeModal();
      closeActionSheet();
      renderAll();

      const { error } = await supabaseClient.from('prompts').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        state.items = existingItems;
        state.selectedId = existingSelectedId;
        renderAll();
        showToast('Failed to delete prompt.');
        return;
      }

      showToast('Prompt deleted.');
    }

    async function duplicatePrompt(id) {
      const item = state.items.find(x => x.id === id);
      if (!item) return;

      const optimisticCopy = {
        ...item,
        id: `tmp-${uid()}`,
        title: `${item.title} copy`,
        favorite: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        _pending: true
      };

      state.items.unshift(optimisticCopy);
      state.selectedId = optimisticCopy.id;
      state.mobileScreen = 'details';
      closeModal();
      closeActionSheet();
      renderAll();

      const { data, error } = await supabaseClient
        .from('prompts')
        .insert(itemToInsertPayload(optimisticCopy))
        .select()
        .single();

      if (error) {
        console.error('Duplicate error:', error);
        state.items = state.items.filter(x => x.id !== optimisticCopy.id);
        renderAll();
        showToast('Failed to duplicate prompt.');
        return;
      }

      const savedCopy = rowToItem(data);
      state.items = state.items.map(x => x.id === optimisticCopy.id ? savedCopy : x);
      state.selectedId = savedCopy.id;
      renderAll();
      showToast('Prompt duplicated.');
    }

    async function toggleFavorite(id) {
      const item = state.items.find(x => x.id === id);
      if (!item) return;

      const previousFavorite = item.favorite;
      state.items = state.items.map(x => x.id === id ? { ...x, favorite: !x.favorite, _pending: true, updatedAt: nowIso() } : x);
      renderAll();

      const { data, error } = await supabaseClient
        .from('prompts')
        .update({ favorite: !previousFavorite })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Favorite error:', error);
        state.items = state.items.map(x => x.id === id ? { ...x, favorite: previousFavorite, _pending: false } : x);
        renderAll();
        showToast('Failed to update favorite.');
        return;
      }

      state.items = state.items.map(x => x.id === id ? rowToItem(data) : x);
      closeActionSheet();
      renderAll();
    }

    async function copyPrompt(id) {
      const item = state.items.find(x => x.id === id);
      if (!item) return;
      try {
        await navigator.clipboard.writeText(item.prompt);
        showToast('Prompt copied.');
      } catch {
        showToast('Could not copy prompt.');
      }
    }

    function exportPrompts() {
      const cleanItems = state.items.map(({ _pending, ...rest }) => rest);
      const blob = new Blob([JSON.stringify(cleanItems, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prompt-vault-export.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('JSON exported.');
    }

    async function importPrompts(file) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (!Array.isArray(parsed)) throw new Error('Invalid JSON');

          const rows = parsed.map(item => ({
            title: item.title || 'Untitled',
            category: item.category || 'Other',
            language: item.language || '',
            tags: Array.isArray(item.tags) ? item.tags : [],
            notes: item.notes || '',
            prompt: item.prompt || '',
            favorite: !!item.favorite
          }));

          const { error } = await supabaseClient.from('prompts').insert(rows);
          if (error) throw error;

          await refreshFromDb();
          showToast('Prompts imported.');
        } catch (error) {
          console.error('Import error:', error);
          showToast('Import failed. Invalid JSON format.');
        }
      };
      reader.readAsText(file);
    }

    function resetFilters() {
      state.search = '';
      state.category = 'all';
      state.tag = 'all';
      state.sort = 'updated_desc';
      state.mode = 'all';
      state.mobileFiltersOpen = false;
      el.desktopSearchInput.value = '';
      el.mobileSearchInput.value = '';
      refreshFromDb();
    }

    function openRecentMode() {
      state.mode = 'recent';
      state.sort = 'updated_desc';
      refreshFromDb();
    }

    function debounce(fn, wait = 180) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
      };
    }

    function bindEvents() {
      el.desktopNewBtn.addEventListener('click', () => openModal());
      el.desktopExportBtn.addEventListener('click', exportPrompts);
      el.desktopImportBtn.addEventListener('click', () => el.importFileInput.click());
      el.desktopRecentBtn.addEventListener('click', openRecentMode);
      el.desktopFavoriteFilterBtn.addEventListener('click', () => {
        state.mode = state.mode === 'favorites' ? 'all' : 'favorites';
        renderAll();
      });

      const debouncedSearch = debounce(value => {
        state.search = value;
        renderAll();
      });

      el.desktopSearchInput.addEventListener('input', e => debouncedSearch(e.target.value));
      el.mobileSearchInput.addEventListener('input', e => debouncedSearch(e.target.value));

      el.desktopCategoryFilter.addEventListener('change', e => { state.category = e.target.value; renderAll(); });
      el.desktopTagFilter.addEventListener('change', e => { state.tag = e.target.value; renderAll(); });
      el.mobileCategoryFilter.addEventListener('change', e => { state.category = e.target.value; renderAll(); });

      const handleSortChange = async value => {
        state.sort = value;
        await refreshFromDb();
      };

      el.desktopSortFilter.addEventListener('change', e => handleSortChange(e.target.value));
      el.mobileSortFilter.addEventListener('change', e => handleSortChange(e.target.value));

      el.mobileFabBtn.addEventListener('click', () => openModal());
      el.mobileBackBtn.addEventListener('click', closeMobileDetails);
      el.mobileFilterToggleBtn.addEventListener('click', () => {
        state.mobileFiltersOpen = !state.mobileFiltersOpen;
        renderMobileFilters();
      });

      el.bottomNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const nav = btn.dataset.nav;
          if (nav === 'new') { openModal(); return; }
          state.mode = nav;
          state.mobileScreen = 'list';
          renderMobile();
        });
      });

      el.sheetCopyBtn.addEventListener('click', () => copyPrompt(state.actionSheetId));
      el.sheetEditBtn.addEventListener('click', () => {
        const id = state.actionSheetId;
        closeActionSheet();
        openModal(id);
      });
      el.sheetFavoriteBtn.addEventListener('click', () => toggleFavorite(state.actionSheetId));
      el.sheetDuplicateBtn.addEventListener('click', () => duplicatePrompt(state.actionSheetId));
      el.sheetDeleteBtn.addEventListener('click', () => deletePrompt(state.actionSheetId));
      el.sheetCancelBtn.addEventListener('click', closeActionSheet);
      el.actionSheetBackdrop.addEventListener('click', e => {
        if (e.target === el.actionSheetBackdrop) closeActionSheet();
      });

      el.importFileInput.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (file) importPrompts(file);
        e.target.value = '';
      });

      el.closeModalBtn.addEventListener('click', closeModal);
      el.cancelModalBtn.addEventListener('click', closeModal);
      el.modalBackdrop.addEventListener('click', closeModal);
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          closeModal();
          closeActionSheet();
        }
      });
      el.promptForm.addEventListener('submit', savePrompt);
      el.modalDeleteBtn.addEventListener('click', () => { if (state.editingId) deletePrompt(state.editingId); });
      el.modalDuplicateBtn.addEventListener('click', () => { if (state.editingId) duplicatePrompt(state.editingId); });
    }

    async function init() {
      bindEvents();
      await refreshFromDb();
    }

    init();