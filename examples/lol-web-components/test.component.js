export class TestComponent extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });

    const componentHref = resolvePath(import.meta.url, './test.component.html');
    console.log('web component import.meta.url', import.meta.url);
    console.log('fetch html component from', componentHref);

    fetch(componentHref)
      .then(response => response.text())
      .then(html => {
        const holder = document.createElement('div');
        holder.innerHTML = html;
        const template = holder.querySelector('template');
        const style = holder.querySelector('style');
        shadowRoot.appendChild(template.content.cloneNode(true));
        shadowRoot.appendChild(style);

        const script = holder.querySelector('script');
        const newScript = document.createElement('script');
        // Clone all attributes and content.
        script.getAttributeNames().forEach(name => {
          newScript.setAttribute(name, script.getAttribute(name));
        });
        // Rewrite relative import urls from the current absolute import url,
        // because the browser won't know how to import something from within an
        // object url.
        newScript.innerHTML = script.innerHTML.replace(
          /from *['"]([^'"]+)['"]/g,
          (whole, path) => whole.replace(path, resolvePath(componentHref, path)),
        );

        const scriptBlob = new Blob([newScript.innerHTML], {
          type: 'application/javascript'
        });
        newScript.src = URL.createObjectURL(scriptBlob);
        console.log('append cloned inline module', newScript);
        shadowRoot.appendChild(newScript);


        import(newScript.src).then(module => {
          new module.View(shadowRoot);
        });
      });
  }
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
// https://gist.github.com/zmmbreeze/7747971
function resolvePath(a, b) {
  try {
    const url = new URL(a);
    // treat a like a url
    return url.origin + resolvePath(url.pathname, b);
  } catch (err) {
    // treat a like a path, carry on
  }

  if (b.charAt(0) === '/') {
    return b;
  }
  const aParts = a.split('/');
  const bParts = b.split('/');

  aParts[aParts.length - 1] = '';

  let part, i = 0;
  while (typeof (part = bParts[i]) === 'string') {
    if (part === '..') {
      aParts.pop();
      aParts.pop();
      aParts.push('');
    } else if (part !== '.') {
      aParts.pop();
      aParts.push(part);
      aParts.push('');
    }
    i++;
  }

  if (aParts[aParts.length - 1] === '') {
    aParts.pop();
  }
  return aParts.join('/');
}
