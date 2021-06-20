(function () {
  var widthInput        = /** @type {HTMLInputElement}  */ (document.getElementById('option-width'));
  var heightInput       = /** @type {HTMLInputElement}  */ (document.getElementById('option-height'));
  var greyscaleCheckbox = /** @type {HTMLInputElement}  */ (document.getElementById('option-greyscale'));
  var form              = /** @type {HTMLFormElement}   */ (document.getElementById('generate-form'));
  var saveButton        = /** @type {HTMLButtonElement} */ (document.getElementById('save'));
  var keepControls      = /** @type {HTMLElement}       */ (document.querySelector('.keep-controls'));
  var keepImageA        = /** @type {HTMLInputElement}  */ (document.getElementById('option-keep-a'));
  var keepImageB        = /** @type {HTMLInputElement}  */ (document.getElementById('option-keep-b'));
  var readyMessage      = document.getElementById('ready');
  var loadingMessage    = document.getElementById('loading');
  var images            = document.getElementById('generated-images');

  function showLoading() {
    readyMessage.style.display = 'none';
    loadingMessage.style.display = '';
  }
  function hideLoading() {
    readyMessage.style.display = '';
    loadingMessage.style.display = 'none';
  }
  hideLoading();

  function beforeGenerate() {
    showLoading();
    /* Keep the height of the images container until regenerated. */
    images.style.height = images.clientHeight + 'px';
  }
  function afterGenerate() {
    hideLoading();
    images.style.height = '';
    updateSaveUrl();
  }

  /**
   * @param {HTMLImageElement} img
   * @returns {number}
   */
  function getAverageBrightness(img) {
    var colorSum = 0;
    var width = img.width;
    var height = img.height;
    var context = document.createElement('canvas').getContext('2d');
    context.drawImage(img, 0, 0);
    var data = context.getImageData(0, 0, width, height).data;

    for (var x = 0, len = data.length; x < len; x+=4) {
      var r = data[x];
      var g = data[x+1];
      var b = data[x+2];

      var avg = Math.floor((r + g + b) / 3);
      colorSum += avg;
    }

    var brightness = Math.floor(colorSum / (width * height));
    return brightness;
  }

  /**
   * @param {HTMLImageElement} firstImg
   * @param {HTMLImageElement} secondImg
   * @param {number} brightnessDiff
   */
  function makeDoubleExposure(firstImg, secondImg, brightnessDiff) {
    /* Clone the first image for use with Caman, so both images can be seen */
    /* separately to the combined double-exposure. */
    var camanCanvas = document.createElement('canvas');
    camanCanvas.className = "generated-canvas";
    camanCanvas.height = parseInt(firstImg.getAttribute('height'), 10);
    camanCanvas.width = parseInt(firstImg.getAttribute('width'), 10);
    camanCanvas.getContext('2d').drawImage(firstImg, 0, 0);
    firstImg.parentElement.appendChild(camanCanvas);
    // @ts-ignore
    Caman(camanCanvas, function () {
      if (brightnessDiff < 10) {
        this.brightness(-10);
      }
      this.newLayer(function () {
        this.setBlendingMode('screen');
        this.context.drawImage(secondImg, 0, 0);
        this.c.reloadCanvasData.call(this);
        if (brightnessDiff < 10) {
          this.filter.brightness(10);
        }
      });
      this.render(function () {
        var width = parseInt(widthInput.value, 10) / 2 + 'px';
        firstImg.style.maxWidth = width;
        secondImg.style.maxWidth = width;
        afterGenerate();
      });
    });
  }

  /**
   * @param {HTMLImageElement} aImage
   * @param {HTMLImageElement} bImage
   */
  function onAllImagesLoad(aImage, bImage) {
    var aBrightness = getAverageBrightness(aImage);
    var bBrightness = getAverageBrightness(bImage);
    var difference = Math.abs(aBrightness - bBrightness);
    if (aBrightness < bBrightness) {
      makeDoubleExposure(aImage, bImage, difference);
    } else {
      makeDoubleExposure(bImage, aImage, difference);
    }
  }

  /**
   * @param {HTMLImageElement} img
   * @param {HTMLInputElement} keepImageCheckbox
   */
  function startImageLoad(img, keepImageCheckbox) {
    var width = parseInt(widthInput.value, 10);
    var height = parseInt(heightInput.value, 10);
    img.width = width;
    img.height = height;
    /* Without crossOrigin set to anonymous, a security error will be thrown */
    /* when calling getImageData() on a canvas context. picsum.photos kindly */
    /* supplies the correct Access-Control-Allow-Origin header. */
    img.crossOrigin = 'anonymous';
    /* Append a random number so a new image is requested and the cache isn't used. */
    var widthParam = width + '/';
    var heightParam = height + '/';
    var randomParam = '?' + Math.random();
    var greyscaleParam = greyscaleCheckbox.checked ? '&grayscale' : '';
    var idParam = keepImageCheckbox.checked ? 'id/' + keepImageCheckbox.dataset.picsum_id + '/' : '';

    var url = 'https://picsum.photos/' + idParam + widthParam + heightParam + randomParam + greyscaleParam;


    ajax('GET', url, 'blob', function (xhr) {
      img.dataset.picsum_id = xhr.getResponseHeader('Picsum-ID');
      img.src = window.URL.createObjectURL(xhr.response);
    });
  }

  function generate() {
    beforeGenerate();
    /* Store keep data before deletion. */
    var currentImages = /** @type {NodeListOf<HTMLImageElement>} */ (images.querySelectorAll('.source-image'));
    if (currentImages.length > 0) {
      keepImageA.dataset.picsum_id = currentImages[0].dataset.picsum_id;
      keepImageB.dataset.picsum_id = currentImages[1].dataset.picsum_id;
    }
    /* Remove all images. */
    var numImages = images.children.length;
    for (var i = 0; i < numImages; i++) {
      images.removeChild(images.children[0]);
    }
    /* Make new images. */
    var aImage = new Image();
    var bImage = new Image();
    aImage.className = 'source-image';
    bImage.className = 'source-image';
    images.appendChild(aImage);
    images.appendChild(bImage);
    var aLoaded = false;
    var bLoaded = false;
    aImage.addEventListener('load', function () {
      aLoaded = true;
      if (bLoaded) {
        onAllImagesLoad(aImage, bImage);
      }
    });
    bImage.addEventListener('load', function () {
      bLoaded = true;
      if (aLoaded) {
        onAllImagesLoad(aImage, bImage);
      }
    });
    startImageLoad(aImage, keepImageA);
    startImageLoad(bImage, keepImageB);
  }

  function updateSaveUrl() {
    var imgs = images.querySelectorAll('img');
    var canvas = images.querySelector('canvas');
    var saveCanvas = document.createElement('canvas');
    var imgHeight = Math.max.apply(null, [].map.call(imgs, function (/** @type {HTMLImageElement} */ img) {
      return img.naturalHeight / 2;
    }));
    var imgWidth = Math.max.apply(null, [].map.call(imgs, function (/** @type {HTMLImageElement} */ img) {
      return img.naturalWidth / 2;
    }));
    saveCanvas.height = imgHeight * 3;
    saveCanvas.width = imgWidth * 2;

    var context = saveCanvas.getContext('2d');
    var x1 = 0, x2 = imgWidth;
    var y1 = 0, y2 = imgHeight;
    context.drawImage(imgs[0], x1, y1, imgWidth, imgHeight);
    context.drawImage(imgs[1], x2, y1, imgWidth, imgHeight);
    context.drawImage(canvas, x1, y2, imgWidth * 2, imgHeight * 2);
    var url = saveCanvas.toDataURL('image/jpg');
    saveButton.setAttribute('href', url);
    saveButton.style.display = '';
    keepControls.style.display = '';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    generate();
  });

  /**
   * @param {string} method
   * @param {string} url
   * @param {null|'text'|'json'|'blob'|'document'|'arraybuffer'} responseType
   * @param {(arg0: XMLHttpRequest) => void} done
   */
  function ajax(method, url, responseType, done) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        done(xhr);
      }
    };
    xhr.responseType = responseType;
    xhr.open(method, url);
    xhr.send();
  }
}());
