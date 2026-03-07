(function () {
  const API_CONTENT = '/api/content';

  function setMetaDescription(value) {
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement('meta');
      el.name = 'description';
      document.head.appendChild(el);
    }
    el.content = value || '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
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

  function sortBlocks(blocks) {
    return [...(blocks || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  function iconSvg(kind) {
    var k = String(kind || '').toLowerCase();
    if (k === 'telegram') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 15.6 9.1 20c.5 0 .8-.2 1.1-.5l2.6-2.5 5.4 4c1 .6 1.7.3 2-.9l3.6-16.7c.4-1.6-.6-2.3-1.9-1.8L1.6 9.7c-1.5.6-1.5 1.5-.3 1.9l5.7 1.8L20.1 5c.6-.4 1.1-.2.7.2L9.4 15.6z"/></svg>';
    }
    if (k === 'whatsapp') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a9.8 9.8 0 0 0-8.5 14.7L2 22l5.5-1.4A9.9 9.9 0 1 0 12 2zm0 17.9c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3.2.8.9-3.1-.2-.3A7.9 7.9 0 1 1 12 19.9zm4.6-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1-.5-1.8-1-2.6-1.8-.7-.8-1.2-1.6-1.6-2.6-.1-.2 0-.4.1-.5l.6-.7c.1-.2.2-.4.1-.6 0-.2-.6-1.5-.7-1.6-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.2 5 4.4 2.4 1 3 .8 3.5.8.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3z"/></svg>';
    }
    if (k === 'vk') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.7 16.9c-4.7 0-7.4-3.3-7.5-8.7h2.4c.1 3.9 1.8 5.6 3.1 5.9V8.2h2.3v3.4c1.3-.1 2.7-1.7 3.2-3.4h2.3c-.4 2-1.9 3.6-3 4.3 1.1.6 2.8 2 3.4 4.4h-2.5c-.5-1.6-1.7-2.9-3.4-3v3h-.3z"/></svg>';
    }
    if (k === 'dzen') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 2v9H2v2h9v9h2v-9h9v-2h-9V2h-2z"/></svg>';
    }
    if (k === 'youtube') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.75 15.02V8.98L15 12l-5.25 3.02z"/></svg>';
    }
    if (k === 'rutube') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 9.7V5c0-1.7-1.3-3-3-3H7C5.3 2 4 3.3 4 5v14c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-4.7c0-.2.2-.3.3-.3h2c.4 0 .7-.3.7-.7v-2.6c0-.4-.3-.7-.7-.7h-2c-.1 0-.3-.1-.3-.3zM10.5 15V9l5.5 3-5.5 3z"/></svg>';
    }
    if (k === 'ok') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5C8.4 1.5 5.5 4.4 5.5 8S8.4 14.5 12 14.5 18.5 11.6 18.5 8 15.6 1.5 12 1.5zm0 10c-2 0-3.5-1.5-3.5-3.5S10 4.5 12 4.5 15.5 6 15.5 8s-1.5 3.5-3.5 3.5zm3.8 4c-1.1-.4-2.3-.6-3.8-.6-1.5 0-2.7.2-3.8.6-.6.2-.9.9-.7 1.5.2.6.9.9 1.5.7.8-.3 1.8-.4 3-.4s2.2.1 3 .4c.6.2 1.3-.1 1.5-.7.2-.6-.1-1.3-.7-1.5zM6 16.5c-.7.6-1.2 1.3-1.5 2.2-.1.5.2 1.1.7 1.2.5.1 1.1-.2 1.2-.7.2-.6.5-1.1.9-1.5.4-.4 1-.5 1.4-.1.4.3.5 1 .1 1.4-.7.6-1.1 1.4-1.3 2.3-.1.5.2 1 .7 1.2h.2c.4 0 .9-.3 1-.8.2-1 .7-2 1.5-2.7.4-.4.4-1 .1-1.4-.4-.5-1-.5-1.4-.1zM18 16.5c-.4-.4-1-.3-1.4.1s-.3 1 .1 1.4c.4.4.7 1 1 1.5.2.5-.1 1.1-.6 1.2-.5.1-1.1-.2-1.2-.7-.2-.9-.7-1.7-1.3-2.3-.4-.4-1-.3-1.4.1-.4.4-.3 1.1.1 1.4.8.7 1.4 1.7 1.5 2.7.1.6.6.9 1.1.8.5-.1.9-.6 1-1.2.3-.9.7-1.6 1.5-2.2.5-.4.5-1 .1-1.4z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';
  }

  var logoIconSvg = '<span class="header__logo-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></span>';

  var featureIcons = {
    'cap': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>',
    'scales': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 11V8c0-1.1.9-2 2-2h-3V4h2V2h-6v2h2v2H8c-1.1 0-2 .9-2 2v3H2v2h4v7H4v2h16v-2h-2v-7h4v-2h-4zm-8 7v-5h4v5H6zm12 0h-4v-5h4v5z"/></svg>',
    'shield': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>'
  };

  function getFeatureIcon(index) {
    var keys = ['cap', 'scales', 'shield'];
    var key = keys[index % keys.length];
    return featureIcons[key] || featureIcons['cap'];
  }

  function highlightKeywords(text, keywords) {
    var result = escapeHtml(text);
    keywords.forEach(function (kw) {
      var escaped = escapeHtml(kw);
      var regex = new RegExp('(' + escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      result = result.replace(regex, '<strong>$1</strong>');
    });
    return result;
  }

  function renderHeader(block) {
    const logoText = escapeHtml(block.logoText || 'Логотип');
    const logoTagline = escapeHtml(block.logoTagline || '');
    const logoContent = '<img src="/public/logo.png" alt="' + escapeAttr(logoText) + '" class="header__logo-img">';
    const phone = escapeHtml(block.phone || '');
    const schedule = escapeHtml(block.schedule || '');
    const ctaText = escapeHtml(block.ctaText || '');
    const ctaLink = escapeAttr(block.ctaLink || '#contact');
    const showRating = block.showRating !== false;
    const socials = Array.isArray(block.socials) ? block.socials : [];
    const navItems = Array.isArray(block.navItems) ? block.navItems : [];
    const navHtml = navItems.filter(function (item) { return item && typeof item === 'object'; }).map(function (item, index) {
      const label = escapeHtml(item.label || '');
      const href = escapeAttr(item.href || '#');
      const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
      const isLast = index === navItems.length - 1 && !hasSubItems;
      const arrowDown = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
      const arrowRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
      const arrowIcon = isLast ? arrowRight : arrowDown;
      if (hasSubItems) {
        const subHtml = item.subItems.map(function (sub) {
          return '<a class="nav__sublink" href="' + escapeAttr(sub.href || '#') + '">' + escapeHtml(sub.label || '') + '</a>';
        }).join('');
        return '<div class="nav__accordion-item">' +
          '<a href="' + href + '" class="nav__accordion-trigger">' + label + '<span class="nav__link-arrow nav__link-arrow--down">' + arrowDown + '</span></a>' +
          '<div class="nav__accordion-panel">' + subHtml + '</div></div>';
      }
      return '<a class="nav__link" href="' + href + '">' + label + '<span class="nav__link-arrow">' + arrowIcon + '</span></a>';
    }).join('');

    const socialsHtml = socials.filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
      const url = escapeAttr(s.url || '#');
      const label = escapeAttr(s.label || 'social');
      return '<a class="header__social" href="' + url + '" target="_blank" rel="noopener" aria-label="' + label + '">' + iconSvg(s.kind) + '</a>';
    }).join('');

    let mobileAddress = '';
    if (block && block._allBlocks) {
      const fb = block._allBlocks.find(b => b.type === 'footer');
      if (fb && fb.address) {
        mobileAddress = escapeHtml(fb.address);
      }
    }

    const ratingText = escapeHtml(block.ratingText || '');
    return (
      '<header class="site-header" role="banner">' +
      '<div class="header-top">' +
      '<div class="container header-top__inner">' +
      '<a href="/" class="header__logo">' + logoContent + (logoTagline ? '<span class="header__logo-tagline">' + logoTagline + '</span>' : '') + '</a>' +
      (showRating ? '<div class="header__rating"><span class="header__stars" aria-hidden="true">★★★★★</span>' + (ratingText ? '<span class="header__rating-text">' + ratingText + '</span>' : '') + '</div>' : '') +
      '<div class="header__socials" aria-label="Мессенджеры">' + socialsHtml + '</div>' +
      '<a href="tel:' + escapeAttr((phone || '').replace(/\s/g, '')) + '" class="header__phone">' + phone + '</a>' +
      '<span class="header__schedule">' + schedule + '</span>' +
      '<a href="' + ctaLink + '" class="btn btn_red header__cta">' + ctaText + '</a>' +
      '</div>' +
      '</div>' +
      '<nav class="header-nav" aria-label="Основное меню">' +
      '<div class="container nav__container">' +

      '<a href="/" class="mobile-bar-logo" aria-label="На главную">' + logoContent + '</a>' +
      '<div class="nav__wrap">' +
      navHtml +
      '<div class="mobile-nav-header">' +
      '<a href="/" class="mobile-nav-logo">' + logoContent + '</a>' +
      '<a href="tel:' + escapeAttr((phone || '').replace(/\s/g, '')) + '" class="mobile-nav-btn-phone" aria-label="Позвонить"><svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></a>' +
      '<button type="button" class="mobile-nav-close" aria-label="Закрыть меню"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' +
      '</div>' +
      '<div class="mobile-nav-cta-wrap">' +
      '<a href="' + ctaLink + '" class="mobile-nav-cta">' + ctaText + '</a>' +
      '</div>' +
      '<div class="mobile-nav-links">' + navHtml + '</div>' +
      '<div class="mobile-nav-socials">' + socialsHtml + '</div>' +
      '<div class="mobile-nav-info">' +
      '<div class="mobile-nav-info-inner">' +
      '<p class="mobile-nav-schedule">' + schedule + '</p>' +
      '<a href="tel:' + escapeAttr((phone || '').replace(/\s/g, '')) + '" class="mobile-nav-phone-line"><svg viewBox="0 0 24 24" style="width:16px;height:16px;flex-shrink:0;"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' + phone + '</a>' +
      (mobileAddress ? '<p class="mobile-nav-address">' + mobileAddress + '</p>' : '') +
      '</div>' +
      '</div>' +

      '</div>' +
      '<a href="tel:' + escapeAttr((phone || '').replace(/\s/g, '')) + '" class="mobile-header-phone" aria-label="Позвонить"><svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></a>' +
      '<button type="button" class="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '</div>' +
      '</nav>' +
      '</header>'
    );
  }

  function renderHero(block) {
    const titleLine1 = escapeHtml(block.titleLine1 || block.title || 'Миграционные услуги');
    const titleLine2 = escapeHtml(block.titleLine2 || (typeof block.title === 'string' ? block.title.split('\n')[1] : '') || 'в Москве и Московской области');
    const btnText = escapeHtml(block.buttonText || '');
    const btnLink = escapeAttr(block.buttonLink || '#contact');
    const imgSrc = normalizeImageUrl(block.image);
    const imgSmallSrc = normalizeImageUrl(block.imageSmall);
    const imgAlt = escapeAttr(titleLine1 + ' ' + titleLine2);
    const infoCard = block.infoCard && typeof block.infoCard === 'object' ? block.infoCard : null;

    var infoTitleHtml = '';
    var infoSubHtml = '';
    if (infoCard) {
      infoTitleHtml = highlightKeywords(
        infoCard.title || '',
        ['иностранным гражданам']
      );
      infoSubHtml = highlightKeywords(
        infoCard.subtitle || '',
        ['организациям', 'иностранных сотрудников']
      );
    }

    const bullets = infoCard && Array.isArray(infoCard.bullets) ? infoCard.bullets : [];
    const bulletsHtml = bullets.slice(0, 6).map(function (b) {
      return '<li>' + escapeHtml(String(b || '')) + '</li>';
    }).join('');

    return (
      '<section class="block block_hero" id="hero">' +
      '<div class="container">' +
      '<div class="hero__frame-wrap">' +
      '<picture>' +
      '<source media="(max-width: 900px)" srcset="/public/bg-mobile.png">' +
      '<img class="hero__bg" src="/public/bg.png" alt="' + imgAlt + '">' +
      '</picture>' +

      '<div class="hero__overlay hero__overlay--title">' +
      '<h1 class="hero__title"><span class="hero__title-line1">' + titleLine1 + '</span><br><span class="hero__title-line2">' + titleLine2 + '</span></h1>' +
      '</div>' +

      (btnText ?
        '<div class="hero__overlay hero__overlay--btn">' +
        '<a href="' + btnLink + '" class="btn btn_red hero__btn">' + btnText + '</a>' +
        '</div>' : ''
      ) +

      (infoCard ? (
        '<div class="hero__overlay hero__overlay--info">' +
        '<p class="hero__info-title">' + infoTitleHtml + '</p>' +
        (infoSubHtml ? '<p class="hero__info-sub">' + infoSubHtml + '</p>' : '') +
        (bulletsHtml ? '<ul class="hero__bullets">' + bulletsHtml + '</ul>' : '') +
        '</div>'
      ) : '') +

      '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function renderFeatures(block) {
    const items = Array.isArray(block.items) ? block.items : [];
    const itemsHtml = items.filter(function (item) { return item && typeof item === 'object'; }).map(function (item, index) {
      return (
        '<div class="feature-item">' +
        '<div class="feature-item__icon">' + getFeatureIcon(index) + '</div>' +
        '<h3 class="feature-item__title">' + escapeHtml(item.title || '') + '</h3>' +
        '</div>'
      );
    }).join('');
    return (
      '<section class="block block_features" id="features">' +
      '<div class="container">' +
      '<div class="features__grid">' + itemsHtml + '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function renderServiceCards(block) {
    const cards = Array.isArray(block.cards) ? block.cards : [];
    const cardsHtml = cards.map(function (card) {
      if (!card || typeof card !== 'object') return '';
      const title = escapeHtml(card.title || '');
      const desc = escapeHtml(card.description || '');
      const btnText = escapeHtml(card.buttonText || 'Узнать подробнее');
      const btnLink = escapeAttr(card.buttonLink || '#');
      return (
        '<div class="service-card">' +
        '<h3 class="service-card__title">' + title + '</h3>' +
        '<p class="service-card__text">' + desc + '</p>' +
        '<a href="' + btnLink + '" class="btn btn_primary service-card__btn">' + btnText + '</a>' +
        '</div>'
      );
    }).join('');
    return (
      '<section class="block block_service_cards" id="services">' +
      '<div class="container">' +
      '<div class="service-cards__grid">' + cardsHtml + '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function renderOnlineServices(block) {
    const title = escapeHtml(block.title || 'ГОСУДАРСТВЕННЫЕ ОНЛАЙН СЕРВИСЫ');
    const titleLine2 = escapeHtml(block.titleLine2 || 'ДЛЯ ИНОСТРАННЫХ ГРАЖДАН');
    const subtitle = escapeHtml(block.subtitle || '');
    const services = Array.isArray(block.services) ? block.services : [];
    const itemsHtml = services.map(function (s) {
      if (!s || typeof s !== 'object') return '';
      const t = escapeHtml(s.title || '');
      const url = escapeAttr(s.url || '#');
      return (
        '<a href="' + url + '" class="online-service-item" target="_blank" rel="noopener">' +
        '<span class="online-service-item__text">' + t + '</span>' +
        '<span class="online-service-item__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg></span>' +
        '</a>'
      );
    }).join('');
    return (
      '<section class="block block_online_services" id="online-services">' +
      '<div class="container">' +
      '<h2 class="online-services__title">' + title + '<br><span class="online-services__title-line2">' + titleLine2 + '</span></h2>' +
      (subtitle ? '<p class="online-services__subtitle">' + subtitle + '</p>' : '') +
      '<div class="online-services__grid">' + itemsHtml + '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function renderFooter(block) {
    const logoText = escapeHtml(block.logoText || 'Логотип');
    const logoContent = '<img src="/public/logo.png" alt="' + escapeAttr(logoText) + '" class="footer__logo-img">';

    const footerNav = Array.isArray(block.footerNav) ? block.footerNav : [];
    const columns = (Array.isArray(block.columns) ? block.columns : []).filter(function (c) { return c && typeof c === 'object'; });
    const address = escapeHtml(block.address || '');
    const phone = escapeHtml(block.phone || '');
    const schedule = escapeHtml(block.schedule || '');

    const contactSocials = Array.isArray(block.contactSocials) ? block.contactSocials : [];
    const socials = Array.isArray(block.socials) ? block.socials : [];
    const govLogos = Array.isArray(block.govLogos) ? block.govLogos : [];

    const footerCtaText = escapeHtml(block.footerCtaText || 'Помощь специалиста');
    const footerCtaLink = escapeAttr(block.footerCtaLink || '#contact');
    const legal = escapeHtml(block.legalText || '');
    const seoTextBottom = escapeHtml(block.seoTextBottom || '');

    const navHtml = footerNav.map(function (item) {
      if (!item || !item.text) return '';
      return '<a href="' + escapeAttr(item.url || '#') + '" class="footer__nav-link">' + escapeHtml(item.text) + '</a>';
    }).join('');

    const colsHtml = columns.map(function (col) {
      const colTitle = escapeHtml(col.title || '');
      const links = (Array.isArray(col.links) ? col.links : []).filter(function (l) { return l && typeof l === 'object'; });
      const linksHtml = links.map(function (link) {
        return '<a href="' + escapeAttr(link.url || '#') + '" class="footer__col-link">' + escapeHtml(link.text || '') + '</a>';
      }).join('');
      return '<div class="footer__col"><h4 class="footer__col-title">' + colTitle + '</h4><div class="footer__links">' + linksHtml + '</div></div>';
    }).join('');

    const renderSocials = function (list) {
      return list.filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
        const url = escapeAttr(s.url || '#');
        const label = escapeAttr(s.label || 'social');
        return '<a class="footer__social footer__social--' + escapeAttr(s.kind) + '" href="' + url + '" target="_blank" rel="noopener" aria-label="' + label + '">' + iconSvg(s.kind) + '</a>';
      }).join('');
    };

    const govHtml = govLogos.filter(function (g) { return g && typeof g === 'object'; }).map(function (g, i) {
      return '<a class="footer__gov" href="' + escapeAttr(g.url || '#') + '" target="_blank" rel="noopener"><img src="/r-logo.svg" alt="" style="width: 16px; height:16px; margin-right:4px;">' + escapeHtml(g.label || '') + '</a>';
    }).join('');

    return (
      '<footer class="block block_footer site-footer">' +
      '<div class="container">' +
      '<div class="footer__section footer__section--logo">' +
      '<a href="/" class="footer__logo">' + logoContent + '</a>' +
      '</div>' +
      '<hr class="footer__divider">' +

      '<div class="footer__section footer__section--nav">' +
      navHtml +
      '</div>' +

      '<div class="footer__section footer__section--grid">' +
      colsHtml +
      '</div>' +
      '<hr class="footer__divider">' +

      '<div class="footer__section footer__section--info">' +
      '<div class="footer__info-left">' +
      (address ? '<p>' + address + '</p>' : '') +
      (schedule ? '<p>' + schedule + '</p>' : '') +
      '<div class="footer__phone-wrap">' +
      (phone ? '<a href="tel:' + escapeAttr((phone || '').replace(/\s/g, '')) + '" class="footer__phone-link">' + phone + '</a>' : '') +
      '<div class="footer__contact-socials">' + renderSocials(contactSocials) + '</div>' +
      '</div>' +
      '</div>' +

      '<div class="footer__info-center">' +
      '<span class="footer__socials-label">Мы в соц.сетях:</span>' +
      '<div class="footer__socials">' + renderSocials(socials) + '</div>' +
      '</div>' +

      '<div class="footer__info-right">' +
      '<button href="' + footerCtaLink + '" class="btn btn_red footer__cta" style="color: white;">' + footerCtaText + '</a>' +
      '</div>' +
      '</div>' +

      '<div class="footer__section footer__section--bottom">' +
      '<div class="footer__legal">' + legal + '</div>' +
      (govHtml ? '<div class="footer__gov-logos" aria-label="Гос. сервисы">' + govHtml + '</div>' : '') +
      '</div>' +

      '<hr class="footer__divider">' +

      '<div class="footer__section footer__section--seo">' +
      '<p class="footer__seo-text">' + seoTextBottom + '</p>' +
      '</div>' +
      '</div>' +
      '</footer>'
    );
  }

  var renderers = {
    header: renderHeader,
    hero: renderHero,
    features: renderFeatures,
    service_cards: renderServiceCards,
    online_services: renderOnlineServices,
    footer: renderFooter
  };

  function renderBlock(block) {
    var fn = renderers[block.type];
    if (!fn) return '';
    return fn(block);
  }

  function loadContent() {
    var container = document.getElementById('blocks');
    if (!container) return;

    fetch(API_CONTENT + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Content load failed');
        return res.json();
      })
      .then(function (data) {
        if (data.seo && data.seo.description !== undefined) {
          setMetaDescription(data.seo.description);
        }
        var blocks = sortBlocks(data.blocks || []).filter(function (b) { return b.visible !== false; });
        container.innerHTML = blocks.map(function (b) {
          b._allBlocks = blocks;
          return renderBlock(b);
        }).join('');
        container.setAttribute('aria-busy', 'false');
        initBurger();
        initMobileNavAccordion();
      })
      .catch(function () {
        container.setAttribute('aria-busy', 'false');
        container.innerHTML = '<p class="load-error">Не удалось загрузить контент. Запустите сервер (node server.js) и обновите страницу.</p>';
      });
  }

  function initBurger() {
    var burger = document.querySelector('.burger');
    var navWrap = document.querySelector('.nav__wrap');
    var closeBtn = document.querySelector('.mobile-nav-close');

    if (burger && navWrap) {
      burger.addEventListener('click', function () {
        var open = navWrap.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open);
      });
    }
    if (closeBtn && navWrap && burger) {
      closeBtn.addEventListener('click', function () {
        navWrap.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    }
  }

  function initMobileNavAccordion() {
    var wrap = document.querySelector('.nav__wrap');
    if (!wrap) return;
    var triggers = wrap.querySelectorAll('.nav__accordion-trigger');
    triggers.forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (window.innerWidth > 768) return;
        var item = tr.closest('.nav__accordion-item');
        if (!item) return;
        e.preventDefault();
        var wasOpen = item.classList.contains('is-open');
        wrap.querySelectorAll('.nav__accordion-item.is-open').forEach(function (i) { i.classList.remove('is-open'); });
        if (!wasOpen) item.classList.add('is-open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
  } else {
    loadContent();
  }
})();
