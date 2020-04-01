(function(){

var removerFunctions = [];

var cursor = document.createElement('div');
cursor.id = 'ipad-cursor'
cursor.style.top = cursor.style.left = 0;

var styles = document.createElement('style');
styles.innerText = '* { cursor: none!important; }';

var boundPosition = null;

runEventOnce(document, 'mousemove', start);

function start() {
  unbindCursor();
  document.head.appendChild(styles);
  document.body.appendChild(cursor);
  removerFunctions.push(function () {
    document.head.removeChild(styles);
    document.body.removeChild(cursor);
  });
}

addEventListener(document, 'mousemove', function (event) {
  positionCursorForMouseEvent(event);
});

document.querySelectorAll('a, button, label, input').forEach(function (el) {
  var isLabel = el instanceof HTMLLabelElement;
  addEventListener(el, 'mouseover', function (event) {
    if (isLabel && event.target instanceof HTMLInputElement) {
      return;
    }

    boundPosition = getAbsolutePosition(el);
    bindCursor();
    positionCursorForMouseEvent(event);
  });

  addEventListener(el, 'mouseout', function () {
    if (isLabel && event.target instanceof HTMLInputElement) {
      return;
    }

    boundPosition = null;
    unbindCursor();
  });
});

window.iPadCursorDestroy = function () {
  removerFunctions.forEach(function (fn) { fn(); })
};

/* funcs */

function runEventOnce(target, name, fn) {
  var wrapped = function (event) {
    fn(event);
    target.removeEventListener(name, wrapped);
  }
  addEventListener(target, name, wrapped);
}

function addEventListener(target, name, fn) {
  target.addEventListener(name, fn);
  removerFunctions.push(function () {
    target.removeEventListener(name, fn);
  });
}

function bindCursor() {
  var pos = boundPosition;
  cursor.classList.add('bound');
  cursor.style.height = pos.height + 'px';
  cursor.style.width = pos.width + 'px';
}

function unbindCursor() {
  cursor.classList.remove('bound');
  cursor.style.height = '';
  cursor.style.width = '';
}

function positionCursorForMouseEvent(event) {
  var mouse = normaliseToScroll(event);
  // Mouse position by default.
  var x = mouse.x;
  var y = mouse.y;

  if (boundPosition) {
    var pos = boundPosition;
    var midX = pos.x + (pos.width / 2);
    var midY = pos.y + (pos.height / 2);
    x = pos.x + getElasticDistance(mouse.x - midX);
    y = pos.y + getElasticDistance(mouse.y - midY);
  }

  cursor.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
}

function getElasticDistance(x) {
  // Use Apple's formula for rubber band scrolling:
  // b = (1.0 – (1.0 / ((x * c / d) + 1.0))) * d
  // where x is the distance from the edge, c is a constant (Apple
  // uses 0.55), and d is a dimension of the rubber banding item.
  // Here, the dimension is the window width or height, depending on
  // the angle of the slider (see setElasticatedDimension). A constant C
  // of 1 allows full movement, whereas 0 stops all movement.
  // See http://squareb.wordpress.com/2013/01/06/31/
  var d = document.body.clientHeight;
  var c = 0.3;
  return (1.0 - (1.0 / ((x * c / d) + 1.0))) * d;
}

function getAbsolutePosition(el) {
  var r = cursor.getBoundingClientRect();
  var rect = el.getBoundingClientRect();
  var normalised = normaliseToScroll({x: rect.left, y: rect.top});
  return {
    x: normalised.x,
    y: normalised.y,
    width: rect.width,
    height: rect.height
  };
}

function normaliseToScroll(pos) {
  return {
    x: pos.x + (window.pageXOffset || document.documentElement.scrollLeft || 0),
    y: pos.y + (window.pageYOffset || document.documentElement.scrollTop || 0)
  };
}

}());
