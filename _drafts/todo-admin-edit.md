---
layout: post
class: post
title: 'TODO: admin edit'
subtitle: ''
---

- In HTML mode, when placing the cursor into a paragraph (or other block), swap out the paragraph for a `&lt;textarea&gt;` with the raw markdown, because using showdown to convert html into markdown will never match up to the source, meaning one change rewrites the whole document to showdown's format, producing a massive diff.
- Render a post-list preview
- Allow inserting images into content
- Refresh build waiting every second, and don’t reload the page
- Show build status always - success or waiting

<!-- -->

### Help it become a useable module for others

- Use data-editable="my-frontmatter-key" to match editable elements to frontmatter or content, then EditPost can be entirely generic: on load it queries all data-editable elements and, if logged in, allows editing.
- Ask for image before publishing: confirm(add image?) then click a file input, hopefully that will open the file chooser immediately. Name the image the same as the filename (can it be the published filename?) Obvs only do this if it doesn’t have an image yet
- Add formatting buttons like wysiwyg editors, ul/ol, headings and such

<!-- -->
