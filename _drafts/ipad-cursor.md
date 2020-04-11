---
layout: post
class: post
title: How I built the iPadOS Cursor for the Web
subtitle: ''
---

![wefwef](/images/ipad-cursor-preview.jpg)

This is a draft.

Colour contrast checker: https://webaim.org/resources/contrastchecker/
How to create an svg element: http://xahlee.info/js/js_scritping_svg_basics.html
How to build an svg path: https://stackoverflow.com/a/38118843/3150057
Note about performance of `instanceof` when detecting inputs in labels: https://stackoverflow.com/a/14694772/3150057

"Don't try to detect touch!" – I wanted to only show the feature to mouse users, i.e. hide from touch users, but either way it would flash in or flash away because I had to wait for an interaction to detect, as per: https://codeburst.io/the-only-way-to-detect-touch-with-javascript-7791a3346685

How to get empty placeholder for title/subtitle: https://stackoverflow.com/a/24827239/3150057
