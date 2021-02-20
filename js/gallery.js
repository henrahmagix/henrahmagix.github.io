(function () {
  /** @type {HTMLElement} */
  var showing = null;
  var gallery = document.createElement('div');
  var bodyInner = document.body;

  gallery.className = 'photos-gallery';
  gallery.style.display = 'none';

  var galleryClose = document.createElement('button');
  galleryClose.innerHTML = '&times;'
  galleryClose.className = 'close';
  galleryClose.setAttribute('aria-label', 'Close this overlay, or hit the Escape key');
  gallery.appendChild(galleryClose);

  document.body.appendChild(gallery);

  document.addEventListener('click', function (event) {
    var el = /** @type {HTMLElement} */ (event.target);

    if (el === gallery || el === galleryClose) {
      closeLarge();
      return;
    }

    /** @type {HTMLAnchorElement} */
    var photo = el.closest('.photos-list-photo');
    if (photo) {
      showLarge(photo);
      event.preventDefault();
      return;
    }

    if (el instanceof HTMLImageElement && gallery.contains(el)) {
      gallery.classList.toggle('viewmax');

      if (el.clientWidth > el.naturalWidth) {
        el.style.width = el.clientWidth + 'px'; // lock it in place, so this should only run once
        el.sizes = el.clientWidth * devicePixelRatio + 'px';
      }
    }
  });

  document.addEventListener('keyup', function (event) {
    if (event.key === 'Escape') {
      closeLarge();
    }
  });

  document.addEventListener('keyup', function (event) {
    var cancelArrow = false;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      cancelArrow = moveLarge(-1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      cancelArrow = moveLarge(1);
    }

    if (cancelArrow) {
      event.preventDefault();
    }
  });

  document.addEventListener('swiped-left', function (event) {
    if (showingMax()) return;
    moveLarge(1);
  });

  document.addEventListener('swiped-right', function (event) {
    if (showingMax()) return;
    moveLarge(-1);
  });

  document.addEventListener('swiped-up', function (event) {
    if (showingMax()) return;
    if (gallery.scrollTop < gallery.scrollHeight - gallery.offsetHeight) return;
    closeLarge(1);
  });

  document.addEventListener('swiped-down', function (event) {
    if (showingMax()) return;
    if (gallery.scrollTop > 0) return;
    closeLarge(-1);
  });

  /** @param {HTMLAnchorElement} el */
  function showLarge(el) {
    closeLarge();

    gallery.classList.remove('viewmax', 'animate-closing-up', 'animate-closing-down');

    showing = el;

    var galleryImg = /** @type {HTMLImageElement} */ (el.querySelector('img').cloneNode());
    galleryImg.sizes = '100vw'; // not great for portrait, but at least it'll be loaded so tapping to viewmax will be instant

    var galleryLink = document.createElement('a');
    galleryLink.className = 'original-link'
    galleryLink.href = el.href;
    galleryLink.textContent = 'View original'

    gallery.appendChild(galleryImg);
    gallery.appendChild(galleryLink);
    gallery.style.display = null;
    gallery.scrollTop = 0;

    bodyInner.style.overflow = 'hidden';
  }

  /** @param {number=} animate */
  function closeLarge(animate) {
    if (!showing) return;

    if (!animate) return _close();

    if (animate > 0) {
      gallery.classList.add('animate-closing-up');
      gallery.classList.remove('animate-closing-down');
      setTimeout(_close, 300);
    } else {
      gallery.classList.add('animate-closing-down');
      gallery.classList.remove('animate-closing-up');
      setTimeout(_close, 300);
    }
  }

  function _close() {
    gallery.style.display = 'none';
    gallery.querySelectorAll('*').forEach(function (child) {
      if (child !== galleryClose) {
        gallery.removeChild(child);
      }
    });
    bodyInner.style.overflow = null;
    // TODO: keep shown list so it's quicker to open.
    showing = null;
  }

  /** @param {number} n */
  function moveLarge(n) {
    if (!showing) {
      return false;
    }

    var li = showing.closest('li');
    /** @type {HTMLElement} */
    var nextToShow = null;
    if (n > 0) {
      nextToShow = /** @type {HTMLElement} */ (li.nextElementSibling);
    } else if (n < 0) {
      nextToShow = /** @type {HTMLElement} */ (li.previousElementSibling);
    }

    if (!nextToShow) {
      return false;
    }

    // Swap instead of closing/opening for speed.
    showLarge(nextToShow.querySelector('.photos-list-photo'));
    return true
  }

  function showingMax() {
    return gallery.classList.contains('viewmax');
  }
}());
