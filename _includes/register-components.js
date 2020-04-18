import('/admin/component.js').then(component => {
  /** @type {string[]} */
  const componentFilepaths = JSON.parse(`{{site.static_files | where_exp: "file","file.extname == '.html'" | where_exp: "file","file.name contains '.component.html'" | map: "path" | jsonify}}`);
  componentFilepaths.forEach(path => {
    const name = path.replace(/^\//, '').replace(/.component.html$/, '').split('/').join('-');
    customElements.define(name, component.HTMLComponentForHref(path));
  });
});
