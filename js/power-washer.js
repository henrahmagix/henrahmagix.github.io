(function(){

/** @type {function[]} */
var removerFunctions = [];

var cursorWrapper = document.createElement('div');
cursorWrapper.id = 'power-washer-wrapper'
var cursor = document.createElement('div');
cursorWrapper.appendChild(cursor);
cursor.id = 'power-washer';
cursor.textContent = '🚿';

runEventOnce(document, 'mousemove', start);

/** @type {Map<HTMLElement,HTMLCanvasElement>} */
if (!window.canvases) window.canvases = new Map();

var BUFFER_SCALE = 4; // lowres drawing buffer

function start() {
  document.body.appendChild(cursorWrapper);
  removerFunctions.push(function () {
    document.body.removeChild(cursorWrapper);
  });

  document.querySelectorAll('.power-wash-this').forEach(function (el) {
    var canvas;
    console.log('canvases has el?', window.canvases, el, window.canvases.has(el));
    if (window.canvases.has(el)) {
      canvas = window.canvases.get(el);
    } else {
      canvas = document.createElement('canvas');
      canvas.drawingCanvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      window.canvases.set(el, canvas);

      var rect = getCoords(el);
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.drawingCanvas.width = canvas.width / BUFFER_SCALE;
      canvas.drawingCanvas.height = canvas.height / BUFFER_SCALE;
      // canvas.style.pointerEvents = 'none';
      canvas.style.position = 'absolute';
      canvas.style.top = rect.top + 'px';
      canvas.style.left = rect.left + 'px';
      canvas.style.zIndex = '8';
      canvas.style.opacity = '0';

      var ctx = getCanvasContext2d(canvas.drawingCanvas);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.drawingCanvas.width, canvas.drawingCanvas.height);
      ctx.globalCompositeOperation = 'destination-out'; // erase to transparent
    }

    addEventListener(canvas, 'mouseover', function(event) { mouseover(this, event); });
    addEventListener(canvas, 'mousemove', function(event) { mousemove(this, event); });
  });
}

addEventListener(document, 'mousemove', function (event) {
  positionCursorForMouseEvent(event);
});

window.powerWasherDestroy = function () {
  removerFunctions.forEach(function (fn) { fn(); });
};

/* funcs */

/**
 * @param {EventTarget} target
 * @param {string} name
 * @param {EventListener} fn
 */
function runEventOnce(target, name, fn) {
  /** @type {EventListener} */
  var wrapped = function (event) {
    fn(event);
    target.removeEventListener(name, wrapped);
  }
  addEventListener(target, name, wrapped);
}

/**
 * @param {EventTarget} target
 * @param {string} name
 * @param {EventListener} fn
 */
function addEventListener(target, name, fn) {
  target.addEventListener(name, fn);
  removerFunctions.push(function () {
    target.removeEventListener(name, fn);
  });
}

/** @param {HTMLElement} el */
function getCoords(el) {
  var rect = el.getBoundingClientRect();

  var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;

  var clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
  var clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;

  var top  = rect.top +  scrollTop - clientTop;
  var left = rect.left + scrollLeft - clientLeft;

  return { top, left, width: rect.width, height: rect.height };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {CanvasRenderingContext2D}
 */
function getCanvasContext2d(canvas) {
  var ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  return ctx;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MouseEvent} event
*/
function mouseover(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  var ctx = getCanvasContext2d(canvas.drawingCanvas);
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  ctx.moveTo(x / BUFFER_SCALE, y / BUFFER_SCALE);
  ctx.beginPath();
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'white';
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MouseEvent} event
*/
function mousemove(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  var ctx = getCanvasContext2d(canvas.drawingCanvas);
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  ctx.lineTo(x / BUFFER_SCALE, y / BUFFER_SCALE);
  ctx.stroke();

  requestAnimationFrame(() => {
    for (let [el, drawnCanvas] of canvases) {
      if (canvas === drawnCanvas) {
        canvas.drawingCanvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          el.style.maskImage = `url(${url})`;
          el.style.maskSize = '100%';
          URL.revokeObjectURL(el.blobUrl);
          el.blobUrl = url;
        });
        break;
      }
    }
  });
}

/** @param {MouseEvent} event */
function positionCursorForMouseEvent(event) {
  requestAnimationFrame(function () {
    cursorWrapper.style.transform = 'translate3d(' + event.x + 'px, ' + event.y + 'px, 0)';
  });
}

}());
