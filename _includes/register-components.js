import('/admin/component.js').then(({
  HTMLComponentForHref,
}) => {
  /** @type {string[]} */
  const componentFilepaths = JSON.parse(`{{site.static_files | where_exp: "file","file.extname == '.html'" | where_exp: "file","file.name contains '.component.html'" | map: "path" | jsonify}}`);
  componentFilepaths.forEach(path => {
    const name = path.replace(/^\//, '').replace(/.component.html$/, '').split('/').join('-');
    customElements.define(name, HTMLComponentForHref(path));
  });
});
