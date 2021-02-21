(function () {
  /** @type {HTMLElement} */
  var showing = null;
  var gallery = document.createElement('div');
  var bodyInner = document.getElementById('body-inner');

  gallery.className = 'photos-gallery';
  gallery.style.display = 'none';

  var galleryControls = document.createElement('div');
  galleryControls.className = 'controls';
  gallery.appendChild(galleryControls);

  var galleryExpand = document.createElement('button');
  galleryExpand.className = 'expand fas fa-expand';
  galleryExpand.setAttribute('aria-label', 'Expand this image');
  galleryControls.appendChild(galleryExpand);

  var galleryClose = document.createElement('button');
  galleryClose.className = 'close fas fa-times';
  galleryClose.setAttribute('aria-label', 'Close this overlay, or hit the Escape key');
  galleryControls.appendChild(galleryClose);

  var galleryImg = document.createElement('img');
  gallery.appendChild(galleryImg);

  var galleryLink = document.createElement('a');
  galleryLink.className = 'original-link'
  galleryLink.textContent = 'View original'
  gallery.appendChild(galleryLink);

  document.body.insertBefore(gallery, document.body.children[0]);

  var showControlsSetup = false;
  document.addEventListener('click', function (event) {
    if (!showControlsSetup) {
      showControlsSetup = true;
      setupMouseShowControls();
    }

    var el = /** @type {HTMLElement} */ (event.target);

    if (el === gallery || el === galleryClose) {
      closeLarge();
      return;
    }

    if (el === galleryExpand || el instanceof HTMLImageElement && gallery.contains(el)) {
      expand();
      return;
    }

    /** @type {HTMLAnchorElement} */
    var photo = el.closest('.photos-list-photo');
    if (photo) {
      showLarge(photo);
      event.preventDefault();
      return;
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

  var hasTouch = false;
  document.addEventListener('touchstart', function detectTouch() {
    hasTouch = true;
    document.removeEventListener('touchstart', detectTouch);
  });

  function setupMouseShowControls() {
    if (hasTouch) return;
    gallery.addEventListener('mouseenter', function () {
      gallery.classList.add('show-controls');
    });
    gallery.addEventListener('mouseleave', function () {
      gallery.classList.remove('show-controls');
    });
  }

  function swipeAllowed() {
    return showing && !showingMax();
  }

  document.addEventListener('swiped-left', function () {
    if (!swipeAllowed()) return;
    moveLarge(1);
  });

  document.addEventListener('swiped-right', function () {
    if (!swipeAllowed()) return;
    moveLarge(-1);
  });

  document.addEventListener('swiped-up', function () {
    if (!swipeAllowed()) return;
    if (gallery.scrollTop < gallery.scrollHeight - gallery.offsetHeight) return;
    closeLarge(1);
  });

  document.addEventListener('swiped-down', function () {
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

  function expand() {
    gallery.classList.toggle('viewmax');
    galleryExpand.classList.toggle('fa-expand');
    galleryExpand.classList.toggle('fa-compress');

    if (galleryImg.clientWidth > galleryImg.naturalWidth) {
      galleryImg.style.width = galleryImg.clientWidth + 'px'; // lock it in place, so this should only run once
      galleryImg.sizes = galleryImg.clientWidth * devicePixelRatio + 'px';
    }
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
