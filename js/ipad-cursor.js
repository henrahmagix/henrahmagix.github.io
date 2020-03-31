var cursor = document.createElement('div');
cursor.id = 'ipad-cursor'
cursor.style.top = cursor.style.left = 0;

var boundPosition = null;

unbindCursor();
document.body.appendChild(cursor);

var DISTANCE = Math.max(document.body.clientHeight);

positionCursorForMouseEvent(window.startingCursorPosition || {x: 0, y: 0});

document.addEventListener('mousemove', function (event) {
  positionCursorForMouseEvent(event);
});

document.querySelectorAll('a, button').forEach(function (el) {
  el.addEventListener('mouseover', function (event) {
    boundPosition = getAbsolutePosition(el);

    bindCursor();
    positionCursorForMouseEvent(event);
  });

  el.addEventListener('mouseout', function () {
    boundPosition = null;
    unbindCursor();
  });
});

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
  var mouseAbs = normaliseToScroll(event.x, event.y);
  var x, y;

  if (boundPosition) {
    var pos = boundPosition;
    x = pos.x;
    y = pos.y;
    x += getElasticDistance(mouseAbs.x - (x + (pos.width / 2)));
    y += getElasticDistance(mouseAbs.y - (y + (pos.height / 2)));
  } else {
    x = mouseAbs.x;
    y = mouseAbs.y;
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
  var d = DISTANCE;
  var c = 0.3;
  return (1.0 - (1.0 / ((x * c / d) + 1.0))) * d;
}

function getAbsolutePosition(el) {
  var r = cursor.getBoundingClientRect();
  var rect = el.getBoundingClientRect();
  var normalised = normaliseToScroll(rect.left, rect.top);
  return {
    x: normalised.x,
    y: normalised.y,
    width: rect.width,
    height: rect.height
  };
}

function normaliseToScroll(x, y) {
  return {
    x: x + (window.pageXOffset || document.documentElement.scrollLeft || 0),
    y: y + (window.pageYOffset || document.documentElement.scrollTop || 0)
  };
}
