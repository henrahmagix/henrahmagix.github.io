(function () {
  /** @type {HTMLElement} */
  var showing = null;
  var gallery = document.createElement('div');
  var bodyInner = document.getElementById('body-inner');

  gallery.className = 'photos-gallery';
  gallery.style.display = 'none';

  var galleryClose = document.createElement('button');
  galleryClose.innerHTML = '&times;'
  galleryClose.className = 'close';
  galleryClose.setAttribute('aria-label', 'Close this overlay, or hit the Escape key');
  gallery.appendChild(galleryClose);

  var galleryImg = document.createElement('img');
  gallery.appendChild(galleryImg);

  var galleryLink = document.createElement('a');
  galleryLink.className = 'original-link'
  galleryLink.textContent = 'View original'
  gallery.appendChild(galleryLink);

  document.body.insertBefore(gallery, document.body.children[0]);

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

  document.addEventListener('keydown', function (event) {
    var cancelArrow = false;
    if (event.key === 'ArrowLeft' && showing && gallery.scrollLeft <= 0) {
      cancelArrow = moveLarge(-1);
    } else if (event.key === 'ArrowUp' && showing && gallery.scrollTop <= 0) {
      cancelArrow = moveLarge(-1);
    } else if (event.key === 'ArrowRight' && showing && gallery.scrollLeft + gallery.offsetWidth >= gallery.scrollWidth) {
      cancelArrow = moveLarge(1);
    } else if (event.key === 'ArrowDown' && showing && gallery.scrollTop + gallery.offsetHeight >= gallery.scrollHeight) {
      cancelArrow = moveLarge(1);
    }

    if (cancelArrow) {
      event.preventDefault();
    }
  });

  function swipeAllowed() {
    return showing && !showingMax();
  }

  document.addEventListener('swiped-left', function (event) {
    if (!swipeAllowed()) return;
    moveLarge(1);
  });

  document.addEventListener('swiped-right', function (event) {
    if (!swipeAllowed()) return;
    moveLarge(-1);
  });

  document.addEventListener('swiped-up', function (event) {
    if (!swipeAllowed()) return;
    if (gallery.scrollTop < gallery.scrollHeight - gallery.offsetHeight) return;
    closeLarge(1);
  });

  document.addEventListener('swiped-down', function (event) {
    if (!swipeAllowed()) return;
    if (gallery.scrollTop > 0) return;
    closeLarge(-1);
  });

  document.addEventListener('focus', function (event) {
    if (showing && !gallery.contains(/** @type {Node} */(event.target))) {
      event.stopPropagation();
      gallery.focus();
    }
  }, true);

  /** @param {HTMLAnchorElement} el */
  function showLarge(el) {
    gallery.classList.remove('viewmax', 'animate-closing-up', 'animate-closing-down');

    showing = el;

    var newGalleryImg = /** @type {HTMLImageElement} */ (el.querySelector('img').cloneNode());
    gallery.insertBefore(newGalleryImg, galleryImg);
    gallery.removeChild(galleryImg);
    galleryImg = newGalleryImg;
    galleryImg.sizes = '100vw'; // not great for portrait, but at least it'll be loaded so tapping to viewmax should be instant

    galleryLink.href = el.href;

    gallery.style.display = null;
    gallery.scrollTop = 0;

    gallery.setAttribute('tabindex', '0');
    gallery.focus();
    document.body.style.overflow = 'hidden';
    bodyInner.setAttribute('aria-hidden', 'true');
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
    document.body.style.overflow = null;
    bodyInner.removeAttribute('aria-hidden');
    showing.focus();
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

    showLarge(nextToShow.querySelector('.photos-list-photo'));
    return true
  }

  function showingMax() {
    return gallery.classList.contains('viewmax');
  }
}());
