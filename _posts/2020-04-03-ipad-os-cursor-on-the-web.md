---
layout: post
class: post
title: iPadOS cursor on the web
subtitle: just because it's fun!
# image: /images/ipad-cursor-preview-minimal.png
image: /images/ipad-cursor-preview.jpg
# syndications:
#     -
#         title: Reply on Twitter
#         icon: fab fa-twitter
#         url: https://twitter.com/henrahmagix/status/1043831106284539904
---

Are Apple good at designing UIs (User Interfaces)? Should a touch device _only_ be a touch device? Or is it time for more precision and control that doesn't cost over £100 and isn't a pencil?

There's a lot that can be said about UI (User Interface) in touch devices, design and innovation, and how Apple fits into all of that. Their new cursor is an interesting example: new, different, interesting... useful?

The [iPadOS Cursor (video)](https://www.youtube.com/watch?v=9iO52-MIBP0 "Video on YouTube: 'Introducing the new iPad Pro Cursor &vert; Craig Federighi'") was released recently in iPadOS 13.4, allowing mouse and trackpad support for iPads. It hovers above everything, snaps to certain UI elements, and fades away when not in use.

From <https://support.apple.com/en-us/HT211008>:

>When the cursor hovers over various parts of iPadOS, they also change appearance and use subtle animation to help you navigate. For example, toolbar buttons in apps change color, and app icons on the Home screen get bigger...
>
>The cursor disappears after a few seconds of inactivity. To make it appear again, just move the mouse or touch the trackpad.*

I think it looks kinda cool! Honestly though, I have no idea if it will be useful 💁‍♂️

I'd rather not try to answer such lofty questions as were posed above 😅 So, let's *have some useless fun* by trying to emulate the iPadOS Cursor in the browser! You can turn it on at the top of the page** and at the bottom of this post is an example gif recorded on the [iPadOS cursor testbed page]({{site.data.urls.ipad_cursor}}).

Please do have a read of the code if it interests you – I certainly haven't taken care to make it _nice_... yet! Let's keep the refactoring for a later post 🙃

[JavaScript](https://github.com/henrahmagix/henrahmagix.github.io/blob/56459f653125138296ecff257c73e9de927d0d45/js/ipad-cursor.js "iPadOS cursor JavaScript source code")
|
[Styles](https://github.com/henrahmagix/henrahmagix.github.io/blob/56459f653125138296ecff257c73e9de927d0d45/css/ipad-cursor.css "iPadOS cursor CSS source code")

<small>* I've guessed my own fade-away timeout, I don't care about matching Apple, because we're all about being useless here, right??</small>
<small>** the on/off value persists in localStorage, named `hb_ipad_cursor`</small>

![iPadOS cursor example](/images/ipad-os-cursor-demo-minimal.gif)

---

**P.S.** it would be cool to support the I-beam cursor over text too! That would mean detecting when the cursor is over a text node... maybe there's a DOM method for this? I found `document.elementFromPoint(point)` [(docs)](https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/elementFromPoint "Documentation for document.elementFromPoint") but I haven't tested if that will return a TextNode 🤔

From the same Apple information page as above:
>As it moves across different elements on the screen, the cursor changes shape. For example, it turns into an I-beam over text, indicating that you can insert the cursor into a text document or highlight and copy words from a webpage

<style>
  #content img {
    border: 2px solid #23242C;
  }
</style>
