
(function () {
  const API_CONTENT = '/api/content';
  const API_UPLOAD = '/api/upload';

  let pageData = { seo: { description: '' }, blocks: [] };

  function showStatus(message, isError) {
    const el = document.getElementById('status');
    el.textContent = message;
    el.className = 'admin__status is-visible admin__status_' + (isError ? 'error' : 'success');
    setTimeout(() => el.classList.remove('is-visible'), 4000);
  }

  function fetchContent() {
    return fetch(API_CONTENT, { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error('Failed to load');
      return r.json();
    });
  }

  function saveContent() {
    var payload = { seo: pageData.seo, blocks: pageData.blocks };
    return fetch(API_CONTENT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) {
          var msg = (data && data.hint) ? data.hint : (data && data.error) ? data.error : 'Failed to save';
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  function uploadImage(file, blockId, field) {
    const form = new FormData();
    form.append('image', file);
    return fetch(API_UPLOAD, {
      method: 'POST',
      body: form
    })
      .then((r) => {
        if (!r.ok) throw new Error('Upload failed');
        return r.json();
      })
      .then((data) => {
        const block = pageData.blocks.find((b) => b.id === blockId);
        if (block) block[field] = data.url;
        renderBlocks();
        showStatus('Изображение загружено');
      })
      .catch((err) => showStatus(err.message || 'Ошибка загрузки', true));
  }

  function moveBlock(index, direction) {
    const blocks = [...pageData.blocks];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    blocks.forEach((b, i) => (b.order = i + 1));
    pageData.blocks = blocks;
    renderBlocks();
  }

  function updateBlock(blockId, field, value) {
    const block = pageData.blocks.find((b) => b.id === blockId);
    if (block) {
      if (field.includes('.')) {
        const parts = field.split('.');
        if (!block[parts[0]]) block[parts[0]] = {};
        block[parts[0]][parts[1]] = value;
      } else {
        block[field] = value;
      }
    }
  }

  function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    var s = url.trim();
    if (s.indexOf('http://') === 0 || s.indexOf('https://') === 0 || s.indexOf('/') === 0) return s;
    return '/' + s.replace(/^\/+/, '');
  }

  function renderInput(blockId, field, label, value, type = "text") {
    return '<div><label class="admin__label">' + label + '</label><input type="' + type + '" class="admin__input" data-block="' + blockId + '" data-field="' + field + '" value="' + escapeAttr(value) + '"></div>';
  }

  function renderTextarea(blockId, field, label, value, rows = 3) {
    return '<div><label class="admin__label">' + label + '</label><textarea class="admin__textarea" data-block="' + blockId + '" data-field="' + field + '" rows="' + rows + '">' + escapeHtml(value) + '</textarea></div>';
  }

  function renderImage(blockId, field, label, value) {
    return '<div><label class="admin__label">' + label + '</label>' +
      (value ? '<img class="admin__image-preview" src="' + escapeAttr(normalizeImageUrl(value)) + '" alt="">' : '<p class="admin__image-placeholder">Нет изображения</p>') +
      '<input type="file" accept="image/*" class="admin__input" data-block="' + blockId + '" data-field="' + field + '"></div>';
  }

  function renderCheckbox(blockId, field, label, checked) {
    return '<div class="admin__checkbox-wrap"><input type="checkbox" class="admin__checkbox" data-block="' + blockId + '" data-field="' + field + '" ' + (checked ? 'checked' : '') + '><span>' + label + '</span></div>';
  }

  function renderArrayEditor(blockId, field, label, items, schema) {
    if (!Array.isArray(items)) items = [];
    let html = '<div class="admin__array-editor" data-array-block="' + blockId + '" data-array-field="' + field + '">';
    html += '<label class="admin__label">' + label + '</label>';
    html += '<div class="admin__array-items">';

    items.forEach((item, index) => {
      html += '<div class="admin__array-item">';
      html += '<div class="admin__array-item-header"><span>Элемент ' + (index + 1) + '</span><div><button type="button" class="admin__block-btn admin__block-btn_small" data-array-move-up="' + index + '">↑</button> <button type="button" class="admin__block-btn admin__block-btn_small" data-array-move-down="' + index + '">↓</button> <button type="button" class="admin__block-btn admin__block-btn_small admin__btn_red" data-array-remove="' + index + '">✖</button></div></div>';
      html += '<div class="admin__array-item-body">';

      schema.forEach(sch => {
        const val = item[sch.key] || '';
        if (sch.type === 'textarea') {
          html += renderTextarea(blockId, field + '.' + index + '.' + sch.key, sch.label, val, 2);
        } else if (sch.type === 'subArray') {
          html += renderArrayEditor(blockId, field + '.' + index + '.' + sch.key, sch.label, val, sch.schema);
        } else {
          html += renderInput(blockId, field + '.' + index + '.' + sch.key, sch.label, val);
        }
      });

      html += '</div></div>';
    });

    html += '</div>';
    html += '<button type="button" class="admin__btn admin__btn_small admin__btn_add" data-array-add="true" data-block="' + blockId + '" data-field="' + field + '">+ Добавить элемент</button>';
    html += '</div>';
    return html;
  }

  function renderBlockCard(block, index) {
    var typeLabels = {
      header: 'Шапка', hero: 'Hero', features: 'Преимущества',
      service_cards: 'Карточки услуг', online_services: 'Онлайн-сервисы',
      footer: 'Подвал', about: 'О нас', gallery: 'Галерея', cta: 'CTA'
    };
    var typeLabel = typeLabels[block.type] || block.type;
    var f = '';

    if (block.type === 'header') {
      f += renderInput(block.id, 'ratingText', 'Текст рейтинга (рядом со звёздами)', block.ratingText);
      f += renderInput(block.id, 'phone', 'Телефон', block.phone);
      f += renderInput(block.id, 'schedule', 'Режим работы', block.schedule);
      f += renderInput(block.id, 'ctaText', 'Текст кнопки (красной)', block.ctaText);
      f += renderInput(block.id, 'ctaLink', 'Ссылка кнопки', block.ctaLink);
      f += renderCheckbox(block.id, 'showRating', 'Показывать звёзды рейтинга', block.showRating !== false);

      f += renderArrayEditor(block.id, 'socials', 'Соц. и мессенджеры', block.socials, [
        { key: 'kind', label: 'Тип (telegram, whatsapp, vk, dzen, youtube, rutube, ok)', type: 'text' },
        { key: 'label', label: 'Название (для SEO)', type: 'text' },
        { key: 'url', label: 'Ссылка', type: 'text' }
      ]);

      f += renderArrayEditor(block.id, 'navItems', 'Пункты меню', block.navItems, [
        { key: 'label', label: 'Текст ссылки', type: 'text' },
        { key: 'href', label: 'URL (#id)', type: 'text' },
        {
          key: 'subItems', label: 'Выпадающее меню (если есть)', type: 'subArray', schema: [
            { key: 'label', label: 'Текст ссылки', type: 'text' },
            { key: 'href', label: 'URL (#id)', type: 'text' }
          ]
        }
      ]);

    } else if (block.type === 'hero') {
      f += renderInput(block.id, 'titleLine1', 'Заголовок строка 1 (синяя)', block.titleLine1);
      f += renderInput(block.id, 'titleLine2', 'Заголовок строка 2', block.titleLine2);
      f += renderInput(block.id, 'buttonText', 'Текст кнопки', block.buttonText);
      f += renderInput(block.id, 'buttonLink', 'Ссылка кнопки', block.buttonLink);

      let info = block.infoCard || {};
      f += '<div class="admin__array-editor"><label class="admin__label">Карточка на баннере</label><div class="admin__array-item-body">';
      f += renderTextarea(block.id, 'infoCard.title', 'Заголовок карточки', info.title, 2);
      f += renderTextarea(block.id, 'infoCard.subtitle', 'Подзаголовок карточки', info.subtitle, 2);

      if (!Array.isArray(info.bullets)) info.bullets = [];
      f += '<label class="admin__label">Список (буллиты)</label><div class="admin__array-items">';
      info.bullets.forEach((b, i) => {
        f += '<div class="admin__string-item" style="display:flex;gap:10px;margin-bottom:5px;">';
        f += '<input type="text" class="admin__input" data-block="' + block.id + '" data-field="infoCard.bullets.' + i + '" value="' + escapeAttr(b) + '">';
        f += '<button style="color:red;" class="admin__block-btn" data-string-remove="true" data-block="' + block.id + '" data-field="infoCard.bullets" data-index="' + i + '">X</button>';
        f += '</div>';
      });
      f += '</div><button type="button" class="admin__btn admin__btn_small" data-string-add="true" data-block="' + block.id + '" data-field="infoCard.bullets">+ Добавить буллит</button>';
      f += '</div></div>';

    } else if (block.type === 'features') {
      f += renderArrayEditor(block.id, 'items', 'Элементы (Преимущества)', block.items, [
        { key: 'title', label: 'Заголовок', type: 'text' }
      ]);
    } else if (block.type === 'service_cards') {
      f += renderArrayEditor(block.id, 'cards', 'Карточки услуг', block.cards, [
        { key: 'title', label: 'Заголовок', type: 'text' },
        { key: 'description', label: 'Описание', type: 'textarea' },
        { key: 'buttonText', label: 'Текст кнопки', type: 'text' },
        { key: 'buttonLink', label: 'Ссылка кнопки', type: 'text' }
      ]);
    } else if (block.type === 'online_services') {
      f += renderInput(block.id, 'title', 'Заголовок строка 1', block.title);
      f += renderInput(block.id, 'titleLine2', 'Заголовок строка 2', block.titleLine2);
      f += renderTextarea(block.id, 'subtitle', 'Подзаголовок', block.subtitle, 2);
      f += renderArrayEditor(block.id, 'services', 'Сервисы', block.services, [
        { key: 'title', label: 'Название сервиса', type: 'text' },
        { key: 'url', label: 'Ссылка (URL)', type: 'text' }
      ]);
    } else if (block.type === 'footer') {
      f += renderInput(block.id, 'logoText', 'Логотип (текст, alt)', block.logoText);
      f += renderInput(block.id, 'address', 'Адрес', block.address);
      f += renderInput(block.id, 'phone', 'Телефон', block.phone);
      f += renderInput(block.id, 'schedule', 'Режим работы', block.schedule);
      f += renderInput(block.id, 'footerCtaText', 'Текст кнопки внизу (красной)', block.footerCtaText);
      f += renderInput(block.id, 'footerCtaLink', 'Ссылка кнопки внизу', block.footerCtaLink);
      f += renderInput(block.id, 'legalText', 'Юридический текст', block.legalText);
      f += renderInput(block.id, 'seoTextBottom', 'Крайний нижний SEO текст', block.seoTextBottom);

      f += renderArrayEditor(block.id, 'footerNav', 'Верхнее меню ссылок', block.footerNav, [
        { key: 'text', label: 'Текст', type: 'text' },
        { key: 'url', label: 'Ссылка', type: 'text' }
      ]);
      f += renderArrayEditor(block.id, 'contactSocials', 'Мессенджеры слева внизу', block.contactSocials, [
        { key: 'kind', label: 'Тип (telegram, whatsapp)', type: 'text' },
        { key: 'label', label: 'Название', type: 'text' },
        { key: 'url', label: 'Ссылка', type: 'text' }
      ]);
      f += renderArrayEditor(block.id, 'socials', 'Общие соцсети по центру', block.socials, [
        { key: 'kind', label: 'Тип (vk, dzen, youtube, rutube, ok, telegram)', type: 'text' },
        { key: 'label', label: 'Название', type: 'text' },
        { key: 'url', label: 'Ссылка', type: 'text' }
      ]);
      f += renderArrayEditor(block.id, 'govLogos', 'Гос. логотипы', block.govLogos, [
        { key: 'label', label: 'Текст', type: 'text' },
        { key: 'url', label: 'Ссылка', type: 'text' }
      ]);
      f += renderArrayEditor(block.id, 'columns', 'Колонки ссылок', block.columns, [
        { key: 'title', label: 'Заголовок колонки', type: 'text' },
        {
          key: 'links', label: 'Ссылки в колонке', type: 'subArray', schema: [
            { key: 'text', label: 'Текст', type: 'text' },
            { key: 'url', label: 'Ссылка', type: 'text' }
          ]
        }
      ]);
    } else {
      f = '<div><label class="admin__label">Данные (JSON)</label><textarea class="admin__textarea" data-block="' + block.id + '" data-field="_raw" rows="4">' + escapeHtml(JSON.stringify(block, null, 2)) + '</textarea></div>';
    }

    const visibleChecked = block.visible !== false ? ' checked' : '';

    return `
      <div class="admin__block-card" data-index="${index}">
        <div class="admin__block-header">
          <span class="admin__block-type">${escapeHtml(typeLabel)}</span>
          <div class="admin__block-actions">
            <label class="admin__checkbox-wrap">
              <input type="checkbox" class="admin__checkbox" data-block="${block.id}" data-field="visible"${visibleChecked}>
              Видим
            </label>
            <button type="button" class="admin__block-btn admin__block-btn_small" data-move-up="${index}">↑</button>
            <button type="button" class="admin__block-btn admin__block-btn_small" data-move-down="${index}">↓</button>
          </div>
        </div>
        <div class="admin__block-fields">${f}</div>
      </div>
    `;
  }

  function renderBlocks() {
    const container = document.getElementById('blocks-container');
    if (!container) return;
    container.innerHTML = pageData.blocks.map(renderBlockCard).join('');
    bindBlockEvents();
  }

  function getNestedProp(obj, path) {
    return path.split('.').reduce((o, p) => (o && o[p] !== undefined) ? o[p] : undefined, obj);
  }

  function setNestedProp(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((o, p) => {
      if (!o[p]) o[p] = isNaN(Number(p)) ? {} : []; // if next prop is not a number, make {}, else []
      return o[p];
    }, obj);
    if (value === undefined) {
      if (Array.isArray(target)) {
        target.splice(last, 1);
      } else {
        delete target[last];
      }
    } else {
      target[last] = value;
    }
  }

  function bindBlockEvents() {
    document.querySelectorAll('.admin__input:not([type="file"]), .admin__textarea').forEach((el) => {
      el.addEventListener('input', function () {
        const blockId = el.dataset.block;
        const field = el.dataset.field;
        const block = pageData.blocks.find(b => b.id === blockId);
        if (block) setNestedProp(block, field, el.value);
      });
    });

    document.querySelectorAll('.admin__checkbox').forEach((el) => {
      el.addEventListener('change', function () {
        const blockId = el.dataset.block;
        const field = el.dataset.field;
        const block = pageData.blocks.find(b => b.id === blockId);
        if (block) setNestedProp(block, field, el.checked);
      });
    });

    document.querySelectorAll('input[type="file"]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const blockId = el.dataset.block;
          const field = el.dataset.field;
          uploadImage(file, blockId, field);
        }
      });
    });

    document.querySelectorAll('[data-move-up]').forEach((btn) => {
      btn.onclick = () => moveBlock(parseInt(btn.dataset.moveUp, 10), -1);
    });
    document.querySelectorAll('[data-move-down]').forEach((btn) => {
      btn.onclick = () => moveBlock(parseInt(btn.dataset.moveDown, 10), 1);
    });

    document.querySelectorAll('[data-array-add]').forEach(btn => {
      btn.onclick = () => {
        const blockId = btn.dataset.block;
        const field = btn.dataset.field;
        const block = pageData.blocks.find(b => b.id === blockId);
        if (block) {
          let arr = getNestedProp(block, field);
          if (!Array.isArray(arr)) {
            arr = [];
            setNestedProp(block, field, arr);
          }
          arr.push({});
          renderBlocks();
        }
      };
    });

    document.querySelectorAll('[data-array-remove]').forEach(btn => {
      btn.onclick = () => {
        const blockId = btn.closest('.admin__array-editor').dataset.arrayBlock;
        const field = btn.closest('.admin__array-editor').dataset.arrayField;
        const index = parseInt(btn.dataset.arrayRemove, 10);
        const block = pageData.blocks.find(b => b.id === blockId);

        if (block && confirm('Удалить элемент?')) {
          let arr = getNestedProp(block, field);
          if (Array.isArray(arr)) {
            arr.splice(index, 1);
            renderBlocks();
          }
        }
      };
    });

    document.querySelectorAll('[data-array-move-up], [data-array-move-down]').forEach(btn => {
      btn.onclick = () => {
        const blockId = btn.closest('.admin__array-editor').dataset.arrayBlock;
        const field = btn.closest('.admin__array-editor').dataset.arrayField;
        const isUp = btn.hasAttribute('data-array-move-up');
        const index = parseInt(isUp ? btn.dataset.arrayMoveUp : btn.dataset.arrayMoveDown, 10);
        const dir = isUp ? -1 : 1;

        const block = pageData.blocks.find(b => b.id === blockId);
        if (block) {
          let arr = getNestedProp(block, field);
          if (Array.isArray(arr)) {
            const newIndex = index + dir;
            if (newIndex >= 0 && newIndex < arr.length) {
              [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
              renderBlocks();
            }
          }
        }
      };
    });

    document.querySelectorAll('[data-string-add]').forEach(btn => {
      btn.onclick = () => {
        const blockId = btn.dataset.block;
        const field = btn.dataset.field;
        const block = pageData.blocks.find(b => b.id === blockId);
        if (block) {
          let arr = getNestedProp(block, field);
          if (!Array.isArray(arr)) { arr = []; setNestedProp(block, field, arr); }
          arr.push("");
          renderBlocks();
        }
      }
    });

    document.querySelectorAll('[data-string-remove]').forEach(btn => {
      btn.onclick = () => {
        const blockId = btn.dataset.block;
        const field = btn.dataset.field;
        const index = parseInt(btn.dataset.index, 10);
        const block = pageData.blocks.find(b => b.id === blockId);
        if (block) {
          let arr = getNestedProp(block, field);
          if (Array.isArray(arr)) {
            arr.splice(index, 1);
            renderBlocks();
          }
        }
      }
    });

  }

  function sortBlocksByOrder(blocks) {
    return [...(blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function ensureBlockIds(blocks) {
    return (blocks || []).map((b, i) => (b.id ? b : { ...b, id: (b.type || 'block') + '-' + i }));
  }

  function init() {
    const seoDesc = document.getElementById('seo-description');
    const saveBtn = document.getElementById('save-btn');
    if (!seoDesc || !saveBtn) return;

    seoDesc.value = pageData.seo.description || '';
    seoDesc.oninput = () => (pageData.seo.description = seoDesc.value);

    saveBtn.onclick = function () {
      saveBtn.disabled = true;
      saveContent()
        .then(function (data) {
          pageData = {
            seo: data.seo || { description: '' },
            blocks: ensureBlockIds(sortBlocksByOrder(data.blocks || []))
          };
          seoDesc.value = pageData.seo.description || '';
          renderBlocks();
          showStatus('Сохранено. Обновите страницу сайта (F5), чтобы увидеть изменения.');
        })
        .catch(function (err) {
          showStatus(err && err.message ? err.message : 'Ошибка сохранения', true);
        })
        .finally(function () { saveBtn.disabled = false; });
    };

    fetchContent()
      .then((data) => {
        pageData = {
          seo: data.seo || { description: '' },
          blocks: ensureBlockIds(sortBlocksByOrder(data.blocks))
        };
        seoDesc.value = pageData.seo.description || '';
        renderBlocks();
      })
      .catch(() => showStatus('Не удалось загрузить контент', true));

    fetch('/api/storage-status', { cache: 'no-store' })
      .then((r) => r.json())
      .then(function (info) {
        const el = document.getElementById('storage-warning');
        if (!el || !info) return;
        if (info.persistent === false) {
          el.textContent = info.message || 'Changes will not persist. Add Vercel Blob storage and redeploy.';
          el.removeAttribute('hidden');
        }
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
