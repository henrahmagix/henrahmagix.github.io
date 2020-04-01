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
    bindCursor(el);
  });

  addEventListener(el, 'mouseout', function (event) {
    if (event.target instanceof HTMLInputElement) {
      return;
    }
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

function bindCursor(el) {
  var pos = boundPosition = el.getBoundingClientRect();
  cursor.classList.add('bound');
  cursor.style.height = pos.height + 'px';
  cursor.style.width = pos.width + 'px';
}

function unbindCursor() {
  boundPosition = null;
  cursor.classList.remove('bound');
  cursor.style.height = '';
  cursor.style.width = '';
}

function positionCursorForMouseEvent(event) {
  // Mouse position by default.
  var x = event.x;
  var y = event.y;

  if (boundPosition) {
    var pos = boundPosition;
    var midX = pos.left + (pos.width / 2);
    var midY = pos.top + (pos.height / 2);
    x = pos.x + getElasticDistance(event.x - midX);
    y = pos.y + getElasticDistance(event.y - midY);
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

}());
