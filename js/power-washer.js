(function(){

/** @type {function[]} */
var removerFunctions = [];

var cursorWrapper = document.createElement('div');
cursorWrapper.id = 'power-washer-wrapper'
var cursor = document.createElement('div');
cursorWrapper.appendChild(cursor);
cursor.id = 'power-washer';
cursor.textContent = '🚿';

document.body.appendChild(cursorWrapper);
removerFunctions.push(function () {
  document.body.removeChild(cursorWrapper);
});

var isTouching = false;
addEventListener(cursor, 'pointerdown', () => isTouching = true);
addEventListener(cursor, 'touchstart', () => isTouching = true);
addEventListener(document, 'pointerup', () => isTouching = false);
addEventListener(document, 'touchend', () => isTouching = false);

addEventListener(document, 'pointermove', function (event) {
  if (isTouching) positionCursorForPointerEvent(event);
});

window.powerWasherDestroy = function () {
  removerFunctions.forEach(function (fn) { fn(); });
};

/** @type {Map<HTMLElement,HTMLCanvasElement>} */
if (!window.canvases) window.canvases = new Map();

var BUFFER_SCALE = 4; // lowres drawing buffer

start();

function start() {
  requestAnimationFrame(() => {
    var pos = getCoords(powerWasherTrigger);
    positionCursorForPointerEvent({x: pos.left + 40, y: pos.top});
  });
  document.querySelectorAll('.power-wash-this').forEach(function (el) {
    var canvas;
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
      canvas.style.pointerEvents = 'none';
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

    addEventListener(cursorWrapper, 'mouseover',  runAndCancelEvent(canvas, pointerover));
    addEventListener(cursorWrapper, 'touchstart', runAndCancelEvent(canvas, pointerover));
    addEventListener(cursorWrapper, 'mousemove',  runAndCancelEvent(canvas, pointermove));
    addEventListener(cursorWrapper, 'touchmove',  runAndCancelEvent(canvas, pointermove));
  });
}

function runAndCancelEvent(canvas, callback) {
  return function(event) {
    if (isTouching) {
      callback(canvas, event);
      event.preventDefault();
    }
  }
}

/* funcs */

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
function pointerover(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  var ctx = getCanvasContext2d(canvas.drawingCanvas);
  var pos = event;
  if (event.touches) pos = event.touches[0];
  var x = pos.clientX - rect.left;
  var y = pos.clientY - rect.top;
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
function pointermove(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  var ctx = getCanvasContext2d(canvas.drawingCanvas);
  var pos = event;
  if (event.touches) pos = event.touches[0];
  var x = pos.clientX - rect.left;
  var y = pos.clientY - rect.top;
  ctx.lineTo(x / BUFFER_SCALE, y / BUFFER_SCALE);
  ctx.stroke();

  for (let [el, drawnCanvas] of canvases) {
    if (canvas === drawnCanvas) {
      requestAnimationFrame(() => {
        canvas.drawingCanvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          el.style.maskImage = `url(${url})`;
          el.style.maskSize = '100%';
          URL.revokeObjectURL(el.blobUrl);
          el.blobUrl = url;
        });
      });
      break;
    }
  }
}

/** @param {PointerEvent|{x: number, y: number}} event */
function positionCursorForPointerEvent(event) {
  requestAnimationFrame(function () {
    cursorWrapper.style.transform = `translate3d(calc(${event.x}px - 1.5rem), calc(${event.y}px - 1.5rem), 0)`;
  });
}

}());
