var cursor = document.createElement('div');
cursor.id = 'ipad-cursor'
cursor.style.top = cursor.style.left = 0;

var DISTANCE = 0;

if (document.readyState !== 'loading') {
  ready();
} else {
  window.addEventListener('DOMContentLoaded', ready);
}

var boundToClickable = false;

function ready() {
  DISTANCE = Math.max(document.body.clientHeight);

  unbindCursor();
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', function (event) {
    if (!boundToClickable) {
      adjustCursorForMouseEvent({x: 0, y: 0, width: 0, height: 0}, event);
    }
  });

  document.querySelectorAll('a, button').forEach(function (el) {
    var pos;

    el.addEventListener('mouseover', function (event) {
      boundToClickable = true;
      pos = getAbsolutePosition(el);

      setCursorColourFromElement(el);
      bindCursor();

      positionCursorOntoElement(pos);
      adjustCursorForMouseEvent(pos, event);
    });

    el.addEventListener('mousemove', function (event) {
      if (boundToClickable) {
        adjustCursorForMouseEvent(pos, event);
      }
    });

    el.addEventListener('mouseout', function () {
      boundToClickable = false;
      unbindCursor();
    });
  });
}

function bindCursor() {
  cursor.classList.add('bound');
}

function unbindCursor() {
  cursor.classList.remove('bound');

  cursor.style.top = '';
  cursor.style.left = '';
  cursor.style.height = '';
  cursor.style.width = '';
  cursor.style.backgroundColor = '';
}

function positionCursorOntoElement(pos) {
  cursor.style.top = pos.y + 'px';
  cursor.style.left = pos.x + 'px';
  cursor.style.height = pos.height + 'px';
  cursor.style.width = pos.width + 'px';
}

function adjustCursorForMouseEvent(pos, event) {
  var mouse = normaliseToScroll(event.x, event.y);
  var x = mouse.x - pos.x - (pos.width / 2);
  var y = mouse.y - pos.y - (pos.height / 2);
  if (boundToClickable) {
    x = getElasticDistance(x);
    y = getElasticDistance(y);
  }
  cursor.style.transform = 'translate3d('+x+'px, '+y+'px, 0)';
}

function setCursorColourFromElement(el) {
  var c = getComputedStyle(el).color;
  cursor.style.backgroundColor = c;
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
