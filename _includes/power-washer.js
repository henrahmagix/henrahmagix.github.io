(function () {
  window.powerWasherTrigger = /** @type {HTMLInputElement} */ (document.getElementById('{{include.checkbox_id}}'));
  /** @type {HTMLElement[]} */
  var powerWasherAssets = [];

  powerWasherTrigger.addEventListener('change', onCursorTriggerChange, false);

  var localStorage = window.localStorage || {
    getItem: function (key) { return ''; },
    setItem: function (key, val) { },
  };

  if (localStorage.getItem('hb_power_washer') === '1') {
    powerWasherTrigger.checked = true;
    if ('createEvent' in document) {
      var evt = document.createEvent('HTMLEvents');
      evt.initEvent('change', false, true);
      powerWasherTrigger.dispatchEvent(evt);
    } else {
      /* @ts-ignore */
      powerWasherTrigger.fireEvent('onchange');
    }
  }

  /** @param {Event} event */
  function onCursorTriggerChange(event) {
    if (powerWasherTrigger.checked) {
      localStorage.setItem('hb_power_washer', '1');
      tryPowerWasher();
    } else {
      localStorage.setItem('hb_power_washer', '0');
      powerWasherAssets.forEach(function (a) { a.remove(); });
      window.powerWasherDestroy();
    }
  }

  function tryPowerWasher() {
    var script = document.createElement('script');
    script.src = '/js/power-washer.js';
    script.onerror = function () {
      var msg = document.createElement('span');
      msg.innerText = 'oh no? i dont know why something went wrong, soz :(';
      msg.style.marginLeft = '0.25em';
      msg.style.verticalAlign = 'middle';
      powerWasherTrigger.parentElement.appendChild(msg);
    };

    script.onload = function () {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = '/css/power-washer.css';
      document.head.appendChild(link);
      powerWasherAssets.push(link);
    };
    document.body.appendChild(script);
    powerWasherAssets.push(script);
  }
}());
