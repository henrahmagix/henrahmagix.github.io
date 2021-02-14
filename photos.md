---
section: photos
class: photos
js: /js/gallery.js
photos_order:
  /images/albums/fuji-filmsim-bw/:
    - just-sky.jpg
    - ldn.jpg
    - rain-window.jpg
    - hive.jpg
    - hive-above.jpg
    - hive-below.jpg
    - tall-tower.jpg
    - three-pipes-afar.jpg
    - three-pipes.jpg
---


{% assign albums = site.static_files | where: "album_image", true | group_by_exp: "img", "img.path | remove: img.name" %}
{% for album_hash in albums %}
  {% assign album_path = album_hash.name %}
  {% assign album_image_names = album_hash.items | map: "name" %}
  {% assign photos_order_for_album = page.photos_order[album_path] | concat: album_image_names | uniq %}
  <ul class="list-reset photos-list side-by-side">
    {% for img_name in photos_order_for_album %}
      <li class="photos-list-item">
        <a class="photos-list-photo" href="{{ album_path }}{{ img_name }}" title="{{img_name}}" aria-label="View large: {{img_name}}">
          <img src="{{ album_path }}{{ img_name }}" alt=""
            srcset="{{ album_path }}/1920/{{ img_name }} 1920w,
                    {{ album_path }}/1600/{{ img_name }} 1600w,
                    {{ album_path }}/1280/{{ img_name }} 1280w,
                    {{ album_path }}/960/{{ img_name }} 960w,
                    {{ album_path }}/640/{{ img_name }} 640w,
                    {{ album_path }}/320/{{ img_name }} 320w"
            sizes="(min-width: 800px) 320px,
                   calc(100vw - 7em)" />
        </a>
      </li>
    {% endfor %}
  </ul>
{% endfor %}
