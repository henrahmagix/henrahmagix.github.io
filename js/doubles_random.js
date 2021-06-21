(function () {
  var widthInput        = /** @type {HTMLInputElement}  */ (document.getElementById('option-width'));
  var heightInput       = /** @type {HTMLInputElement}  */ (document.getElementById('option-height'));
  var greyscaleCheckbox = /** @type {HTMLInputElement}  */ (document.getElementById('option-greyscale'));
  var form              = /** @type {HTMLFormElement}   */ (document.getElementById('generate-form'));
  var keepImageA        = /** @type {HTMLInputElement}  */ (document.getElementById('option-keep-a'));
  var keepImageB        = /** @type {HTMLInputElement}  */ (document.getElementById('option-keep-b'));
  var loadingMessage    = document.getElementById('loading');
  var images            = document.getElementById('generated-images');

  /** @return {NodeListOf<HTMLImageElement>} */
  function currentImages() {
    return images.querySelectorAll('.source-image');
  }

  var saveLink = document.createElement('a');
  saveLink.download = 'double-exposure.jpg';
  saveLink.textContent = 'Save result';

  var loadingHelpTimeout = /** @type {NodeJS.Timeout} */ (null);

  function showLoading() {
    loadingMessage.textContent = 'Processing…';
    loadingHelpTimeout = setTimeout(function () {
      loadingMessage.textContent += ' (this might take a while for picsum.photos to respond)'
    }, 3000);
  }
  function finishLoading() {
    clearTimeout(loadingHelpTimeout);
    loadingMessage.textContent = 'Done! ';
    loadingMessage.appendChild(saveLink);
    var curr = currentImages();
    createPicsumSourceInfoElements('First image', curr[0]).forEach(function (el) {
      loadingMessage.appendChild(el);
    });
    createPicsumSourceInfoElements('Second image', curr[1]).forEach(function (el) {
      loadingMessage.appendChild(el);
    });
  }

  /**
   * @param {string} name
   * @param {HTMLImageElement} img
   * @return {(HTMLElement|Text)[]}
   */
  function createPicsumSourceInfoElements(name, img) {
    var picsumLink = document.createElement('a');
    picsumLink.href = img.dataset.picsum_source_url;
    picsumLink.textContent = img.dataset.picsum_author;
    picsumLink.target = '_blank';

    return [
      document.createElement('br'),
      document.createTextNode(name + ' by '),
      picsumLink
    ]
  }

  function beforeGenerate() {
    showLoading();
    /* Keep the height of the images container until regenerated. */
    images.style.height = images.clientHeight + 'px';
  }
  function afterGenerate() {
    finishLoading();
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
    camanCanvas.height = parseInt(heightInput.value, 10);
    camanCanvas.width = parseInt(widthInput.value, 10);
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
      this.render(afterGenerate);
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
    img.width = width / 2;
    img.height = height / 2;
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
      var picsum_id = xhr.getResponseHeader('Picsum-ID');
      img.dataset.picsum_id = picsum_id;
      keepImageCheckbox.dataset.picsum_id = picsum_id;

      var imageSource = window.URL.createObjectURL(xhr.response);

      img.dataset.picsum_info_url = 'https://picsum.photos/id/' + img.dataset.picsum_id + '/info';
      ajax('GET', img.dataset.picsum_info_url, 'json', function (xhr) {
        img.dataset.picsum_author = xhr.response.author;
        img.dataset.picsum_source_url = xhr.response.url;

        // This will trigger onload, so do this after setting dataset so info
        // links can be built from this element in afterGenerate.
        img.src = imageSource;
      });
    });
  }

  function generate() {
    beforeGenerate();
    /* Remove all images. */
    images.textContent = '';
    images.appendChild(loadingMessage);
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
    saveLink.setAttribute('href', url);
    keepImageA.disabled = false;
    keepImageB.disabled = false;
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
