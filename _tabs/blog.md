---
layout: page
title: Blog
icon: fa-solid fa-file-lines
order: 1
---

<div id="post-list" class="flex-grow-1 px-xl-1">
  {% for post in site.posts %}
    <article class="card-wrapper card">
      <a href="{{ post.url | relative_url }}" class="post-preview row g-0 flex-md-row-reverse">
        {% if post.image %}
          <div class="col-md-5 preview-img">
            <img src="{{ post.image.path | default: post.image | relative_url }}" alt="{{ post.title }}">
          </div>
          <div class="col-md-7 content-wrapper">
        {% else %}
          <div class="col-md-12 p-3">
        {% endif %}
          <h2 class="pt-0 my-1">{{ post.title }}</h2>
          <div class="post-meta text-muted d-flex align-items-center space-x-2">
            <span>
              <i class="far fa-calendar fa-fw"></i>
              {{ post.date | date: "%B %d, %Y" }}
            </span>
            {% if post.categories.size > 0 %}
              <span>
                <i class="far fa-folder-open fa-fw"></i>
                {{ post.categories | first }}
              </span>
            {% endif %}
          </div>
          <div class="my-2 text-sm">
            <p>{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
          </div>
        </div>
      </a>
    </article>
  {% endfor %}
</div>
