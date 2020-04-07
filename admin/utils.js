export function createHTML(s) {
  const holder = document.createElement('div');
  holder.innerHTML = s;
  return holder.children.item(0);
}

// https://stackoverflow.com/a/30106551/3150057
export const base64 = {
  encode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
  },
  decode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  },
};

export function show(el, visible) {
  if (visible == null) {
    visible = true;
  }
  return el.hidden = !visible;
}
export function showing(el) {
  return !el.hidden;
}
