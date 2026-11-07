---
layout: page
title: Blog
icon: fa-solid fa-file-lines
order: 1
---

<div id="post-list" class="flex-grow-1 px-xl-1">
  {% assign posts = site.posts %}
  {% include post-list.html %}
</div>
