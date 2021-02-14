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

  galleryClose.addEventListener('click', function () {
    closeLarge();
  });

  document.body.appendChild(gallery);

  document.addEventListener('click', function (event) {
    var el = /** @type {HTMLElement} */ (event.target);

    if (el === gallery) {
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

  /** @param {HTMLAnchorElement} el */
  function showLarge(el) {
    closeLarge();

    gallery.classList.remove('viewmax');

    showing = el;

    var galleryImg = /** @type {HTMLImageElement} */ (el.querySelector('img').cloneNode());
    galleryImg.sizes = '';

    var galleryLink = document.createElement('a');
    galleryLink.className = 'original-link'
    galleryLink.href = el.href;
    galleryLink.textContent = 'View original'

    gallery.appendChild(galleryImg);
    gallery.appendChild(galleryLink);
    gallery.style.display = null;
    gallery.scrollTop = 0;

    bodyInner.style.height = '100vh';
    bodyInner.style.overflow = 'hidden';
  }

  function closeLarge() {
    if (showing) {
      gallery.style.display = 'none';
      gallery.querySelectorAll('*').forEach(function (child) {
        if (child != galleryClose) {
          gallery.removeChild(child);
        }
      });
      bodyInner.style.height = null;
      bodyInner.style.overflow = null;
      // TODO: keep shown list so it's quicker to open.
      showing = null;
    }
  }

  /** @param {Number} n */
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
}());
