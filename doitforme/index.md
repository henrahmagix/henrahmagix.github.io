---
layout: default
title: Do it for me
class: post
---

## Do it for me

What can I do for you?

<form id="doit">
    <input id="doit-input" type="text" placeholder="Tell me what to do">
    <button type="submit">Please?</button>
</form>

<img id="doit-image" hidden alt="bitches get stuff done" src="https://media.giphy.com/media/3oEjHQ3gPBJYsQ1b2w/giphy.gif">

<script>
var form = document.getElementById('doit');
var input = document.getElementById('doit-input');
var image = document.getElementById('doit-image');
form.addEventListener('submit', function (event) {
    event.preventDefault();
    image.hidden = false;
});
</script>
