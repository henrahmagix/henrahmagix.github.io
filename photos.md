---
section: photos
class: photos
js: /js/gallery.js
photo_albums:
  /images/albums/fuji-filmsim-bw/:
    -
      name: just-sky.jpg
      orientation: landscape
    -
      name: ldn.jpg
      orientation: landscape
    -
      name: rain-window.jpg
      orientation: landscape
    -
      name: hive.jpg
      orientation: landscape
    -
      name: hive-above.jpg
      orientation: landscape
    -
      name: hive-below.jpg
      orientation: landscape
    -
      name: tall-tower.jpg
      orientation: portrait
    -
      name: three-pipes-afar.jpg
      orientation: portrait
    -
      name: three-pipes.jpg
      orientation: portrait
---


{% for album_hash in page.photo_albums %}
  {% assign album_path = album_hash[0] %}
  <ul class="list-reset photos-list side-by-side">
    {% for img in album_hash[1] %}
      <li class="photos-list-item">
        <a class="photos-list-photo" href="{{ album_path }}{{ img.name }}" title="{{img.name}}" aria-label="View large: {{img.name}}">
          <img src="{{ album_path }}{{ img.name }}" alt="" class="orientation-{{img.orientation}}"
            srcset="{{ album_path }}/1920/{{ img.name }} 1920w,
                    {{ album_path }}/1600/{{ img.name }} 1600w,
                    {{ album_path }}/1280/{{ img.name }} 1280w,
                    {{ album_path }}/960/{{ img.name }} 960w,
                    {{ album_path }}/640/{{ img.name }} 640w,
                    {{ album_path }}/320/{{ img.name }} 320w,
                    {{ album_path }}{{ img.name }}"
            sizes="(min-width: 800px) 320px,
                   calc(100vw - 7em)" />
        </a>
      </li>
    {% endfor %}
  </ul>
{% endfor %}
