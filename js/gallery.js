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
    /** @type {HTMLAnchorElement} */
    var photo = /** @type {HTMLElement} */ (event.target).closest('.photos-list-photo');
    if (photo) {
      showLarge(photo);
      event.preventDefault();
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

    showing = el;

    // var galleryImg = /** @type {HTMLImageElement} */ (el.querySelector('img').cloneNode());
    var showingImg = el.querySelector('img');
    var galleryImg = document.createElement('img');
    galleryImg.src = showingImg.src;
    galleryImg.alt = showingImg.alt;
    // galleryImg.srcset = null;
    // galleryImg.sizes = null;

    var galleryLink = document.createElement('a');
    galleryLink.href = el.href;
    galleryLink.textContent = 'View original'

    galleryImg.addEventListener('click', function () {
      galleryImg.classList.toggle('viewmax');
    });

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
