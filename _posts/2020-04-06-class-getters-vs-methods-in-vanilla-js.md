---
layout: post
class: post
categories: Code
title: Class getters vs methods in vanilla JS
subtitle: when debugging them
image: /images/class-getter.png
syndications:
  twitter: 'https://twitter.com/henrahmagix/status/1247124024745918470'
---

Using class getters is really easy with the help of TypeScript. Kinda makes me feel like I'm writing Ruby!

This example demonstrates a Content instance that has a Title that cannot be changed:

```js
class Content {
    get title() {
        return 'cannot change';
    }
}
```
```js
const myContent = new Content();
alert(`My title = ${myContent.title}`);
```

In vanilla js, I find it much easier to debug when using class methods, because it will raise a `TypeError` if the method doesn't exist, instead of returning the `undefined` value.

```js
class Content {
    getTitle() {
        return 'cannot change';
    }
}
```
```js
const myContent = new Content();
alert(`My title = ${myContent.getTitle()}`);
```

In this small example, my point is useless. But when it comes to writing a complicated set of vanilla JS modules, without tests[*](#footnote-1), I find the raised `TypeError` to be much easier to debug: it points me directly to the code I need to fix, whereas an `undefined` value can cascade to some other point and either raise an error (good!) or just... make everything not work[**](#footnote-2).

At the moment I'm trying to build my own edit-and-commit-to-github admin for this site, and the code is a mess[***](#footnote-3), which has wasted me quite a bit of time in debugging problems.

Usually I find debugging fun! But right now it's more fun to do the thing I want to do, not deal with problems I'm causing by not paying attention when I'm doing the thing I want to do, so... 💁‍♂️

---

<small id="footnote-1">* because you're just writing for fun, and moving too fast for tests, and you're allowed to make that decision because you're you, and the code doesn't matter really, but honestly in a professional environment you definitely, absolutely would write tests, and enjoy it, and _actually prefer it_, wouldn't you? 🙃</small>

<small id="footnote-2">** and you spend half an hour winding through your own code mess to find the problem, only to remember that you started a refactor, but 5 mins in you thought of a cool idea, so you started writing that too, and now you haven't committed for 3 hours, and you don't know what you've done, you just know that _NOTHING WORKS_ 🤦‍♂️</small>

<small id="footnote-3">*** but it doesn't matter because I'm me, and you're you, and lets just go our separate ways after this, yeah? just ignore me, you don't want to look at the code, you don't want to [view the source][view-source], you really don't, so don't bother, please don't [view the source][view-source]</small>

[view-source]: {{site.github.repository_url}}/tree/5bdf506565bed9e6ba4de09d3bcedda328fcd98e/admin/
