---
layout: default
title: Do it for me
class: post
---

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
var message = document.createElement('p');
message.textContent = '🎉it is done 🎉';
form.addEventListener('submit', function (event) {
    event.preventDefault();
    image.hidden = false;
    form.replaceWith(message);
});
</script>
