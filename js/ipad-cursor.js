(function(){

/** @type {function[]} */
var removerFunctions = [];

var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
var cursor = document.createElementNS('http://www.w3.org/2000/svg', 'path');
svg.appendChild(cursor);

svg.id = 'ipad-cursor-wrapper';
cursor.id = 'ipad-cursor';

var styles = document.createElement('style');
styles.innerText = '* { cursor: none!important; }';

/** @type {DOMRect} */
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

/** @type {number} */
var fadeTimeout;
addEventListener(document, 'mousemove', function (event) {
  cursor.setAttribute('hidden', 'false');
  window.clearTimeout(fadeTimeout);

  positionCursorForMouseEvent(event);

  fadeTimeout = window.setTimeout(function () {
    cursor.setAttribute('hidden', 'true');
  }, 3000);
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
  removerFunctions.forEach(function (fn) { fn(); });
};

var PAD = 10;

var duration = 70;
/** @type {number} */
var lastTransition;

/* funcs */

/**
 * @param {EventTarget} target
 * @param {string} name
 * @param {(event: MouseEvent) => void} fn
 */
function runEventOnce(target, name, fn) {
  /** @type {(event: MouseEvent) => void} */
  var wrapped = function (event) {
    fn(event);
    target.removeEventListener(name, wrapped);
  }
  addEventListener(target, name, wrapped);
}

/**
 * @param {EventTarget} target
 * @param {string} name
 * @param {(event: MouseEvent) => void} fn
 */
function addEventListener(target, name, fn) {
  target.addEventListener(name, fn);
  removerFunctions.push(function () {
    target.removeEventListener(name, fn);
  });
}

/** @param {Element} el */
function bindCursor(el) {
  boundPosition = el.getBoundingClientRect();
  lastTransition = Date.now();
}

function unbindCursor() {
  boundPosition = null;
  lastTransition = Date.now();
}

var ARC_START = 'a'+PAD+','+PAD+' 0 0 1';
var ARC_TOP_RIGHT =    ARC_START+' '+PAD+ ','+PAD;
var ARC_BOTTOM_RIGHT = ARC_START+' -'+PAD+','+PAD;
var ARC_BOTTOM_LEFT =  ARC_START+' -'+PAD+',-'+PAD;
var ARC_TOP_LEFT =     ARC_START+' '+PAD+ ',-'+PAD;

/**
 * @param {number} moveX
 * @param {number} moveY
 * @param {number} w
 * @param {number} h
 */
function drawRoundedRect(moveX, moveY, w, h) {
  // Move to top center of shape, draw half-width to top-right, clockwise around
  // to top-left, and z will connect back to the top center.
  cursor.setAttribute('d',
    'm'+moveX+','+(moveY-PAD-h/2)
    + 'h'+w/2
    + ARC_TOP_RIGHT
    + 'v'+h
    + ARC_BOTTOM_RIGHT
    + 'h-'+w
    + ARC_BOTTOM_LEFT
    + 'v-'+h
    + ARC_TOP_LEFT
    + 'z'
  );
}

/** @type {number} */
var animating = null;
/**
 * @param {'in'|'out'} easeInOrOut
 * @param {number[]} a
 * @param {number[]} b
 * @param {(...args: number[]) => void} fn
 */
function animate(easeInOrOut, a, b, fn) {
  var easeFn = easeInOut;
  if (easeInOrOut === 'in') {
    easeFn = easeIn;
  } else if (easeInOrOut === 'out') {
    easeFn = easeOut;
  }

  if (animating) {
    cancelAnimationFrame(animating);
  }

  var anim = function () {
    if (!lastTransition) {
      animating = null;
      fn.apply(null, b);
      return;
    }

    var time = Date.now() - lastTransition;
    if (time >= duration) {
      lastTransition = null;
      animating = null;
      fn.apply(null, b);
      return;
    }

    var args = a.map(function (aa, i) {
      return animateBetween(aa, b[i], time, duration, easeFn);
    });
    fn.apply(null, args);

    animating = requestAnimationFrame(anim);
  };
  animating = requestAnimationFrame(anim);
}

/** @type {{[key: string]: number}} */
var animateBetweenCache = {};
/**
 * @param {number} a
 * @param {number} b
 * @param {number} timePosition
 * @param {number} timeTotal
 * @param {*} easeFn
 * @returns
 */
function animateBetween(a, b, timePosition, timeTotal, easeFn) {
  var key = Array.prototype.join.call(arguments, '');
  if (animateBetweenCache.hasOwnProperty(key)) {
    return animateBetweenCache[key];
  }
  var n = easeFn(timePosition / timeTotal);
  return animateBetweenCache[key] = a + (n * (b - a));
}

// https://gist.github.com/gre/1650294
/** @param {number} n */
function easeIn(n) {
  return n*n*n; // cubic
}
/** @param {number} n */
function easeOut(n) {
  return (--n)*n*n+1; // cubic
}
/** @param {number} n */
function easeInOut(n) {
  return n<.5 ? 4*n*n*n : (n-1)*(2*n-2)*(2*n-2)+1; // cubic
}

/** @type {number[]} */
var lastAnim = null;
/** @param {MouseEvent} event */
function positionCursorForMouseEvent(event) {
  // Mouse position by default.
  var x = event.x;
  var y = event.y;

  if (boundPosition) {
    var bind = boundPosition;
    var midX = bind.x + (bind.width / 2) - x;
    var midY = bind.y + (bind.height / 2) - y;
    var start = [0, 0, 0, 0];
    var end = [
      // Adjust distance from mid to cursor by a range of 0 to PAD. Change the
      // pad multiplier and elastic constant to tune the "stickiness".
      midX - getElasticDistance(PAD*2 * midX / (bind.width / 2), bind.width),
      midY - getElasticDistance(PAD*2 * midY / (bind.height / 2), bind.height),
      bind.width,
      bind.height
    ];

    animate('in', start, end, function(x, y, w, h) {
      lastAnim = [x, y, w, h];
      drawRoundedRect(x, y, w, h);
    });
  } else if (lastTransition) {
    // This should produce a circle around the cursor.
    animate('out', lastAnim || [0, 0, 0, 0], [0, 0, 0, 0], function(x, y, w, h) {
      drawRoundedRect(x, y, w, h);
    });
  }

  requestAnimationFrame(function () {
    cursor.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  });
}

/**
 * @param {number} x
 * @param {number} d
 * @returns {number}
 */
function getElasticDistance(x, d) {
  // Use Apple's formula for rubber band scrolling:
  // b = (1.0 – (1.0 / ((x * c / d) + 1.0))) * d
  // where x is the distance from the edge, c is a constant (Apple
  // uses 0.55), and d is a dimension of the rubber banding item.
  // Here, the dimension is the window width or height, depending on
  // the angle of the slider (see setElasticatedDimension). A constant C
  // of 1 allows full movement, whereas 0 stops all movement.
  // See http://squareb.wordpress.com/2013/01/06/31/
  var c = 0.2;
  return (1.0 - (1.0 / ((x * c / d) + 1.0))) * d;
}

}());
