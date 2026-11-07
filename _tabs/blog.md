---
layout: page
title: Blog
icon: fa-solid fa-file-lines
order: 2
---

<div id="post-list" class="flex-grow-1 px-xl-1">
  {% for post in site.posts %}
    <article class="card-wrapper card">
      <a href="{{ post.url | relative_url }}" class="post-preview row g-0 flex-md-row-reverse">
        <div class="col-md-12 p-3">
          <h2 class="pt-0 my-1">{{ post.title }}</h2>
          <div class="post-meta text-muted d-flex align-items-center space-x-2">
            <span>{{ post.date | date: "%B %d, %Y" }}</span>
          </div>
          <p class="my-2 text-sm">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
        </div>
      </a>
    </article>
  {% endfor %}
</div>
