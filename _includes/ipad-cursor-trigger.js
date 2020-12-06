(function () {
  var iPadCursorTrigger = /** @type {HTMLInputElement} */ (document.getElementById('{{include.checkbox_id}}'));
  /** @type {HTMLElement[]} */
  var iPadCursorAssets = [];

  iPadCursorTrigger.addEventListener('change', onCursorTriggerChange, false);

  var localStorage = window.localStorage || {
    getItem: function (key) { return ''; },
    setItem: function (key, val) { },
  };

  if (localStorage.getItem('hb_ipad_cursor') === '1') {
    iPadCursorTrigger.checked = true;
    if ('createEvent' in document) {
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('change', false, true);
      iPadCursorTrigger.dispatchEvent(evt);
    } else {
      // @ts-ignore
      iPadCursorTrigger.fireEvent('onchange');
    }
  }

  /** @param {Event} event */
  function onCursorTriggerChange(event) {
    if (iPadCursorTrigger.checked) {
      localStorage.setItem('hb_ipad_cursor', '1');
      tryIpadCursor();
    } else {
      localStorage.setItem('hb_ipad_cursor', '0');
      iPadCursorAssets.forEach(function (a) { a.remove(); });
      window.iPadCursorDestroy();
    }
  }

  function tryIpadCursor() {
    var script = document.createElement('script');
    script.src = '/js/ipad-cursor.js';
    script.onerror = function () {
      var msg = document.createElement('span');
      msg.innerText = 'oh no? i dont know why something went wrong, soz :(';
      msg.style.marginLeft = '0.25em';
      msg.style.verticalAlign = 'middle';
      iPadCursorTrigger.parentElement.appendChild(msg);
    };

    script.onload = function () {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/css/ipad-cursor.css';
      document.head.appendChild(link);
      iPadCursorAssets.push(link);
    };
    document.body.appendChild(script);
    iPadCursorAssets.push(script);
  }
}());
