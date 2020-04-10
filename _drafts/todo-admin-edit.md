---
layout: post
class: post
title: "TODO: admin edit"
subtitle: ""
---

Add tweet button after publishing
Change html editing to rendered html, not the content markdown

Allow viewing and editing the raw markdown of the whole post, including front matter

Simplify syndications list to set specific types, so I only need to give a twitter url and not a whole generic object describing the link text and icon

List changes in localStorage

——-

### Help it become a useable module for others

Show admin interface on blogs list page instead of /admin

Use `data-editable="my-frontmatter-key"` to match editable elements to frontmatter or content, then EditPost can be entirely generic: on load it queries all data-editable elements and, if logged in, allows editing.
