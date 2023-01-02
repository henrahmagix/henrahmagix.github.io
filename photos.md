---
section: Photos
class: photos
description: Gallery of the few photos I think look "Professional"
related_posts_category: Photography
# js:
#   - /js/gallery.js
#   - /js/swiped-events.js
# photo_albums:
#   /images/albums/my-album/:
#     -
#       name: photo.jpg
#       orientation: landscape|portrait
---

<center><big>🚧 under construction 🚧</big></center>

<!--
Tap to view an individual image, then tap again to view full resolution. Swipe left/right or use arrow keys to navigate between images, and swipe up/down or use Escape key to close the view.

Using swipe gestures will only animate movement if you haven't set a **prefers-reduced-motion setting**. For more info on vestibular motion disorders, please read <https://css-tricks.com/introduction-reduced-motion-media-query>.

<a rel="license" style="display:inline-block;" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0;display:block;" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />These works are licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.

{% for album_hash in page.photo_albums %}
  {% assign album_path = album_hash[0] %}
  <ul class="list-reset photos-list side-by-side">
    {% for img in album_hash[1] %}
      <li class="photos-list-item">
        <a id="photo-{{ album_path|replace:'/','-' }}{{ img.name|remove:'.jpg' }}" class="photos-list-photo outline-big" href="{{ album_path }}{{ img.name }}" title="{{img.name}}">
          <span class="action-text sr-when-off">View large</span><span class="sr-only">: {{img.name}}</span>
          <img src="{{ album_path }}{{ img.name }}" alt="" class="orientation-{{img.orientation}}"
            srcset="{{ album_path }}{{ img.name }},
                    {{ album_path }}/3200/{{ img.name }} 3200w,
                    {{ album_path }}/2880/{{ img.name }} 2880w,
                    {{ album_path }}/2560/{{ img.name }} 2560w,
                    {{ album_path }}/2240/{{ img.name }} 2240w,
                    {{ album_path }}/1920/{{ img.name }} 1920w,
                    {{ album_path }}/1600/{{ img.name }} 1600w,
                    {{ album_path }}/1280/{{ img.name }} 1280w,
                    {{ album_path }}/960/{{ img.name }} 960w,
                    {{ album_path }}/640/{{ img.name }} 640w,
                    {{ album_path }}/320/{{ img.name }} 320w"
            sizes="(min-width: 1124px) 320px,
                   calc(100vw - 7em)" />
        </a>
      </li>
    {% endfor %}
  </ul>
{% endfor %}
 -->
