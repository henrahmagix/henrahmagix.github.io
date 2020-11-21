---
layout: post
class: post
categories:
  - Code
  - Accessibility
title: Pretty and random animated blog post images
subtitle: ooo pretty... what do you think?
image: /images/pretty-and-random-animated-blog-post-images.jpg
syndications:
  twitter: 'https://twitter.com/henrahmagix/status/1330283284752977923?s=20'
pre_content:
  - Skip to the bottom to see [the examples](#what-do-you-think)! But check your "Reduced Motion" system settings first!
---

I recently made a small change to [my blog list page](/blog) by showing images in the list, to provide a clearer identifier for posts you may have already read. But not every post has an image, so what could I show for a default? Ooh, how about a random gradient?

Well, I searched for ["random background gradient" on duckduckgo.com](https://duckduckgo.com/?q=random+background+gradient&t=h_&ia=web), and found someone who was [randomising 141deg linear-gradients from a combination of 4 colours](https://stackoverflow.com/questions/50878276/random-gradient-background-color). I thought "ooo, that looks nice!" so I unashamedly copied the 4 colours _and_ the `141deg` 🙈 <small>CSS is free, right??</small> I then combined them into their 12 pairings and tried them out.

Then, for dark mode, I used VS Code's excellent built-in colour picker that appears in front of every colour written in a CSS file to darken each colour. After some tweaks, I then had (what I think is) a pleasant pairing of 8 light and dark gradients to use as a default image in my blog list 😌

<small>It's worth mentioning again: [StackOverflow has problems]({% post_url 2020-04-13-lol-web-components %}#ft-stackoverflow-merits 'footnote in my other blog post "lol I made my own component framework"'). Also, I tried to find an active account of the user from whom I copied the colours so I could credit them, and all I could find was a GitHub account by the same username. If anyone knows them on something like Twitter, please let me know so I can thank them!</small>

## Can CSS be random?

Well… unfortunately not 😔 If you search for it, all you'll find are answers like "you can use JavaScript!" which, like, yeah sure, that'll work! Or "LESS or Sass can preprocess your CSS, so you can randomise when it's compiled" and, yeah that's also true!

So what's my problem then?

Well, this website is built on [GitHub Pages](https://pages.github.com/) (which is [Jekyll](https://jekyllrb.com/) with an uncustomisable set of plugins), so it's compiled when I push code changes to [my repo]({{site.github.owner_url}}). If I used a preprocessor, I would have to run it locally and commit the compiled CSS. As explained in [another post "I'm not hating on frontend frameworks"]({% post_url 2020-04-13-lol-web-components %}#im-not-hating-on-frontend-frameworks):

>I wanted to keep my website free of a frontend build step, so I could write and commit HTML, CSS, and JavaScript anywhere at any time. This is a Jekyll site, but that compilation is handled for me by GitHub Pages, **so I can commit via git or the GitHub file editor.**

I want to write anywhere at anytime on any device, and a preprocessor makes that more difficult. Also, I just like sticking to plain CSS: it forces me to think more practically when I can't put functional stuff like loops or maps into it 😇

<small>To be honest, I still haven't used CSS Custom Properties (or variables)!! 😱 Maybe when I make a light/dark mode toggle? 🤔</small>

So I used JavaScript, right? ❌

Why not? 🤷‍♀️

On with the code!

---

## CSS

So this isn't really random. Instead, I made 8 pairs and applied them to the blog posts by array index using modulus, so position 1, 8, 16 is the first one; 2, 9, 17 is the second; and so on.

```css
.random-gradient-0 {
  background-image: linear-gradient(141deg, #ffd0d2 50%, #fffdd0 50%);
}
.random-gradient-1 {
  background-image: linear-gradient(141deg, #ffd0d2 50%, #d0fffd 50%);
}
.random-gradient-2 {
  background-image: linear-gradient(141deg, #fffdd0 50%, #ffd0d2 50%);
}
.random-gradient-3 {
  background-image: linear-gradient(141deg, #fffdd0 50%, #d0d2ff 50%);
}
.random-gradient-4 {
  background-image: linear-gradient(141deg, #d0fffd 50%, #ffd0d2 50%);
}
.random-gradient-5 {
  background-image: linear-gradient(141deg, #d0fffd 50%, #d0d2ff 50%);
}
.random-gradient-6 {
  background-image: linear-gradient(141deg, #d0d2ff 50%, #fffdd0 50%);
}
.random-gradient-7 {
  background-image: linear-gradient(141deg, #d0d2ff 50%, #d0fffd 50%);
}

@media (prefers-color-scheme: dark) {
  .random-gradient-0 {
    background-image: linear-gradient(141deg, #962d48 50%, #e08f0b 50%);
  }
  .random-gradient-1 {
    background-image: linear-gradient(141deg, #3b9e02 50%, #0579a7 50%);
  }
  .random-gradient-2 {
    background-image: linear-gradient(141deg, #e08f0b 50%, #962d48 50%);
  }
  .random-gradient-3 {
    background-image: linear-gradient(141deg, #e08f0b 50%, #4147b4 50%);
  }
  .random-gradient-4 {
    background-image: linear-gradient(141deg, #0579a7 50%, #3b9e02 50%);
  }
  .random-gradient-5 {
    background-image: linear-gradient(141deg, #0579a7 50%, #4147b4 50%);
  }
  .random-gradient-6 {
    background-image: linear-gradient(141deg, #4147b4 50%, #e08f0b 50%);
  }
  .random-gradient-7 {
    background-image: linear-gradient(141deg, #4147b4 50%, #0579a7 50%);
  }
}
```

## HTML (Jekyll)

Looping in Jekyll is done like so:
```liquid
{% raw %}
{% for post in posts %}
{% endfor %}
{% endraw %}
```

To get the index of the loop, you can use `forloop`:
```liquid
{% raw %}
{% for post in posts %}
  <div class="random-gradient-{{forloop.index0}}"></div>
{% endfor %}
{% endraw %}
```

And now to modulus the index so it goes from 0 to 7:
```liquid
{% raw %}
{% for post in posts %}
  <div class="random-gradient-{{forloop.index0|modulo:8}}"></div>
{% endfor %}
{% endraw %}
```

Result:
```html
<div class="random-gradient-0"></div>
<div class="random-gradient-1"></div>
<div class="random-gradient-2"></div>
<div class="random-gradient-3"></div>
<div class="random-gradient-4"></div>
<div class="random-gradient-5"></div>
<div class="random-gradient-6"></div>
<div class="random-gradient-7"></div>
<div class="random-gradient-0"></div>
<div class="random-gradient-1"></div>
&hellip;
```

<small class="secret">Get it? `&hellip;`? Like &hellip; 😅 html humour y'all!</small>

## Animation

First things first: **some readers have vestibular motion disorders** that can cause problems for them when presenting with motion graphics. As web developers we must design our sites to be accessible to _all_ users.

If you weren't aware yet (we're all learning 😇), [CSS Trick's article "An Introduction to the Reduced Motion Media Query"](https://css-tricks.com/introduction-reduced-motion-media-query/) explains:

>[Vestibular disorders](http://a11yproject.com/posts/understanding-vestibular-disorders/) can cause your vestibular system to struggle to make sense of what is happening, resulting in loss of balance and vertigo, migraines, nausea, and hearing loss. Anyone who has spun around too quickly is familiar with a confused vestibular system.

Knowing that, my first animation choice was a simple fade from colour to black and white. Nice and easy. Totally fashionable in The Year Of Our Furby 2020 <picture><source srcset="/images/hides-furby-linux/SnowWhite.gif" media="(prefers-color-scheme: dark)"><img src="/images/hides-furby-linux/Black.gif" alt="Black Furby 32x32 icon by Hide Itoh, because Furbies are fashionable once again" class="image-reset" style="vertical-align: middle;"></picture>.

```css
.random-gradient {
  transition: filter 400ms ease-out;
}
.random-gradient:hover {
  filter: saturate(0);
}

/* And for the dark mode colours, adding a bit of contrast for punch */
@media (prefers-color-scheme: dark) {
  .random-gradient:hover {
    filter: saturate(0) contrast(1.3);
  }
}
```

Then, when the user has not set a preference for reduction of motion, I wanted to do a kind of "swoosh" that makes it feel the content is coming in from the right. After fiddling with `background-size` and `background-position`, I came across something that works quite well with a rectangle 160px tall and between 350px and 700px wide:
```css
@media (prefers-reduced-motion: no-preference) {
  .random-gradient {
    background-size: 100%;
    background-position-x: 50%;
    transition-property: filter, background-size, background-position;
  }
  .random-gradient:hover {
    background-size: 200%;
    background-position-x: 150%;
  }
}
```

<small>I liked this motion so much, I applied it to the actual blog images too, so they animate the same way 💞</small>

The [Mozilla Developer Network page on prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) explains how Firefox determines this setting based on your operating system. As far as I can tell, this is the same for other modern browsers. Unfortunately, support is unknown on the UC, QQ, Baidu, and KaiOS browsers (thanks to [caniuse.com's info for CSS at-rule @media prefers-reduced-motion](https://caniuse.com/mdn-css_at-rules_media_prefers-reduced-motion)): in those, the motion animations will simply not apply. I prefer to "progressively enhance" motion animations, i.e. add when allowed, rather than undo when unwanted.

Please check your system settings if you think you might have problems – there are LOTS of animations below that are trigged by hovering your cursor.

---

## What do you think?

Here is the full range of light- and dark-mode pretty random animated blog post default images that are comfortable and nice and _random_ and all here right here for you yayyyy!!! 🙌

I've also duplicated each set and removed the `linear-gradient` stops (positions) to get a smooth gradient instead of a hard angle line, and I think those look nice too! But then the motion animation, that transitions `background-position-x`, still shows a hard vertical line, so I'm not so sure about using the soft ones 🤔

What do you think? Blurred or not blurred? Let me know with the "Reply" link(s) in the footer 🤗

<ul class="list-reset side-by-side examples light">
  {% for i in (0..11) %}
    <li><div class="example-random-gradient example-random-gradient-{{forloop.index0|modulo:8}}"></div></li>
  {% endfor %}
</ul>
<ul class="list-reset side-by-side examples light soft">
  {% for i in (0..11) %}
    <li><div class="example-random-gradient example-random-gradient-{{forloop.index0|modulo:8}}"></div></li>
  {% endfor %}
</ul>

<ul class="list-reset side-by-side examples dark">
  {% for i in (0..11) %}
    <li><div class="example-random-gradient example-random-gradient-{{forloop.index0|modulo:8}}"></div></li>
  {% endfor %}
</ul>
<ul class="list-reset side-by-side examples dark soft">
  {% for i in (0..11) %}
    <li><div class="example-random-gradient example-random-gradient-{{forloop.index0|modulo:8}}"></div></li>
  {% endfor %}
</ul>

<style>
.examples {
  margin-top: 0;
  margin-bottom: 0;
}

.example-random-gradient {
  height: 160px;
  width: 100%;
  background-size: 100%;
  background-position-x: 50%;
  transition: 400ms ease-out;
  transition-property: filter;
}

.light {
  background-color: #fcfcfc;
}
.light .example-random-gradient {
  border: 2px solid #23242C;
}

.dark {
  background-color: #23242C;
}
.dark .example-random-gradient {
  border: 2px solid #DEDEDE;
}

.light .example-random-gradient:hover {
  filter: saturate(0);
}
.light .example-random-gradient-0 {
  background-image: linear-gradient(141deg, #ffd0d2 50%, #fffdd0 50%);
}
.light .example-random-gradient-1 {
  background-image: linear-gradient(141deg, #ffd0d2 50%, #d0fffd 50%);
}
.light .example-random-gradient-2 {
  background-image: linear-gradient(141deg, #fffdd0 50%, #ffd0d2 50%);
}
.light .example-random-gradient-3 {
  background-image: linear-gradient(141deg, #fffdd0 50%, #d0d2ff 50%);
}
.light .example-random-gradient-4 {
  background-image: linear-gradient(141deg, #d0fffd 50%, #ffd0d2 50%);
}
.light .example-random-gradient-5 {
  background-image: linear-gradient(141deg, #d0fffd 50%, #d0d2ff 50%);
}
.light .example-random-gradient-6 {
  background-image: linear-gradient(141deg, #d0d2ff 50%, #fffdd0 50%);
}
.light .example-random-gradient-7 {
  background-image: linear-gradient(141deg, #d0d2ff 50%, #d0fffd 50%);
}
.light.soft .example-random-gradient-0 {
  background-image: linear-gradient(141deg, #ffd0d2, #fffdd0);
}
.light.soft .example-random-gradient-1 {
  background-image: linear-gradient(141deg, #ffd0d2, #d0fffd);
}
.light.soft .example-random-gradient-2 {
  background-image: linear-gradient(141deg, #fffdd0, #ffd0d2);
}
.light.soft .example-random-gradient-3 {
  background-image: linear-gradient(141deg, #fffdd0, #d0d2ff);
}
.light.soft .example-random-gradient-4 {
  background-image: linear-gradient(141deg, #d0fffd, #ffd0d2);
}
.light.soft .example-random-gradient-5 {
  background-image: linear-gradient(141deg, #d0fffd, #d0d2ff);
}
.light.soft .example-random-gradient-6 {
  background-image: linear-gradient(141deg, #d0d2ff, #fffdd0);
}
.light.soft .example-random-gradient-7 {
  background-image: linear-gradient(141deg, #d0d2ff, #d0fffd);
}

.dark .example-random-gradient:hover {
  filter: saturate(0) brightness(1.6);
}
.dark .example-random-gradient-0 {
  background-image: linear-gradient(141deg, #962d48 50%, #e08f0b 50%);
}
.dark .example-random-gradient-1 {
  background-image: linear-gradient(141deg, #3b9e02 50%, #0579a7 50%);
}
.dark .example-random-gradient-2 {
  background-image: linear-gradient(141deg, #e08f0b 50%, #962d48 50%);
}
.dark .example-random-gradient-3 {
  background-image: linear-gradient(141deg, #e08f0b 50%, #4147b4 50%);
}
.dark .example-random-gradient-4 {
  background-image: linear-gradient(141deg, #0579a7 50%, #3b9e02 50%);
}
.dark .example-random-gradient-5 {
  background-image: linear-gradient(141deg, #0579a7 50%, #4147b4 50%);
}
.dark .example-random-gradient-6 {
  background-image: linear-gradient(141deg, #4147b4 50%, #e08f0b 50%);
}
.dark .example-random-gradient-7 {
  background-image: linear-gradient(141deg, #4147b4 50%, #0579a7 50%);
}
.dark.soft .example-random-gradient-0 {
  background-image: linear-gradient(141deg, #962d48, #e08f0b);
}
.dark.soft .example-random-gradient-1 {
  background-image: linear-gradient(141deg, #3b9e02, #0579a7);
}
.dark.soft .example-random-gradient-2 {
  background-image: linear-gradient(141deg, #e08f0b, #962d48);
}
.dark.soft .example-random-gradient-3 {
  background-image: linear-gradient(141deg, #e08f0b, #4147b4);
}
.dark.soft .example-random-gradient-4 {
  background-image: linear-gradient(141deg, #0579a7, #3b9e02);
}
.dark.soft .example-random-gradient-5 {
  background-image: linear-gradient(141deg, #0579a7, #4147b4);
}
.dark.soft .example-random-gradient-6 {
  background-image: linear-gradient(141deg, #4147b4, #e08f0b);
}
.dark.soft .example-random-gradient-7 {
  background-image: linear-gradient(141deg, #4147b4, #0579a7);
}

@media (prefers-reduced-motion: no-preference) {
  .example-random-gradient {
    transition-property: filter, background-size, background-position;
  }
  .example-random-gradient:hover {
    background-size: 200%;
    background-position-x: 150%;
  }
}
</style>
