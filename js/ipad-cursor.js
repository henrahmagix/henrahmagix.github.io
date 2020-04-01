(function(){

var removerFunctions = [];

var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
var cursor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
svg.appendChild(cursor);

svg.id = 'ipad-cursor-wrapper';
cursor.id = 'ipad-cursor';

var styles = document.createElement('style');
styles.innerText = '* { cursor: none!important; }';

var boundPosition = null;

runEventOnce(document, 'mousemove', start);

function start() {
  unbindCursor();
  document.head.appendChild(styles);
  document.body.appendChild(svg);
  removerFunctions.push(function () {
    document.head.removeChild(styles);
    document.body.removeChild(svg);
  });
}

addEventListener(document, 'mousemove', function (event) {
  positionCursorForMouseEvent(event);
});

document.querySelectorAll('a, button, input').forEach(function (el) {
  addEventListener(el, 'mouseover', function () { bindCursor(el); });
  addEventListener(el, 'mouseout', unbindCursor);
});

// Run on labels too, but ignore when on a child input so that can be bound
// instead. This should maybe be made generic for all cases, i.e. if a bindable
// element is a child of another bindable element, the child should be bound to
// differentiate it from the parent.
document.querySelectorAll('label').forEach(function (el) {
  addEventListener(el, 'mouseover', function (event) {
    if (event.target instanceof HTMLInputElement) {
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
  boundPosition = el.getBoundingClientRect();
}

function unbindCursor() {
  boundPosition = null;
}

function drawRoundedRect(moveX, moveY, w, h) {
  // Move to top center of shape, draw half-width to top-right, clockwise around
  // to top-left, and z will connect back to the top center.
  cursor.setAttribute('d',
    'm'+moveX+','+(moveY-10-h/2)
    + 'h'+w/2
    + 'a10,10 0 0 1 10,10'
    + 'v'+h
    + 'a10,10 0 0 1 -10,10'
    + 'h-'+w
    + 'a10,10 0 0 1 -10,-10'
    + 'v-'+h
    + 'a10,10 0 0 1 10,-10'
    + 'z'
  );
}

function positionCursorForMouseEvent(event) {
  // Mouse position by default.
  var x = event.x;
  var y = event.y;

  if (boundPosition) {
    var bind = boundPosition;
    var midX = bind.x + (bind.width / 2) - x;
    var midY = bind.y + (bind.height / 2) - y;
    drawRoundedRect(
      midX - getElasticDistance(midX),
      midY - getElasticDistance(midY),
      bind.width,
      bind.height
    );
  } else {
    // This should produce a circle around the cursor.
    drawRoundedRect(0, 0, 0, 0);
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
