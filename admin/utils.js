export function createHTML(s) {
  const holder = document.createElement('div');
  holder.innerHTML = s;
  return holder.children.item(0);
}
