var cursor = document.createElement('div');
cursor.style.position = 'absolute';
cursor.style.zIndex = 3;
cursor.style.top = cursor.style.left = 0;
cursor.style.pointerEvents = 'none';
cursor.style.opacity = 0.2;
cursor.style.borderRadius = '0.4em';
cursor.style.padding = '0.4em';
cursor.style.marginTop = '-0.4em';
cursor.style.marginLeft = '-0.4em';
cursor.style.boxSizing = 'content-box';

var style = document.createElement('style');
style.innerText = '.hide-cursor * {cursor: none !important;}';

function ready() {
  hideCursor();
  document.head.appendChild(style);
  document.body.appendChild(cursor);

  document.querySelectorAll('a, button').forEach(function (el) {
    el.addEventListener('mouseover', function () {
      setCursorColourFromElement(el);
      positionCursorToElement(el);
      showCursor();
    });
    el.addEventListener('mouseout', function () {
      hideCursor();
    });
  });
}

function showCursor() {
  cursor.style.visibility = 'visible';
  document.body.classList.add('hide-cursor');
}
function hideCursor() {
  cursor.style.visibility = 'hidden';
  document.body.classList.remove('hide-cursor');
}

function positionCursorToElement(el) {
  var o = offset(el);
  cursor.style.top = o.top + 'px';
  cursor.style.left = o.left + 'px';
  cursor.style.height = o.height + 'px';
  cursor.style.width = o.width + 'px';
}

function setCursorColourFromElement(el) {
  var c = getComputedStyle(el).color;
  cursor.style.backgroundColor = c;
}

if (document.readyState !== 'loading') {
  ready();
} else {
  window.addEventListener('DOMContentLoaded', ready);
}

function offset(el) {
  var r = cursor.getBoundingClientRect();
  var rect = el.getBoundingClientRect();
  var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    width: rect.width,
    height: rect.height
  };
}
