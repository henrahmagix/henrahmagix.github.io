export class TestComponent extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });

    fetch('test.component.html')
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
        newScript.innerHTML = script.innerHTML;

        const scriptBlob = new Blob([newScript.innerHTML], {
          type: 'application/javascript'
        });
        newScript.src = URL.createObjectURL(scriptBlob);
        shadowRoot.appendChild(newScript);


        import(newScript.src).then(module => {
          new module.View(shadowRoot);
        });
      });
  }
}
