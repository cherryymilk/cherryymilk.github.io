---
layout: default
title: Blog
icon: fa-solid fa-file-lines
order: 1
---

<header class="px-xl-1">
  <h1 class="dynamic-title">Blog</h1>
</header>

<div id="post-list" class="flex-grow-1 px-xl-1 mt-4">
  {% for post in site.posts %}
    <article class="card-wrapper card">
      <a href="{{ post.url | relative_url }}" class="post-preview row g-0 flex-md-row-reverse">
        {% if post.image %}
          <div class="col-md-5 preview-img">
            <img src="{{ post.image.path | default: post.image | relative_url }}" alt="{{ post.title }}">
          </div>
          <div class="col-md-7 content-wrapper">
        {% else %}
          <div class="col-md-12">
        {% endif %}
          <div class="card-body d-flex flex-column">
            <h1 class="card-title my-2 mt-md-0">{{ post.title }}</h1>
            <div class="card-text content mt-0 mb-3">
              <p>
                {% if post.description %}
                  {{ post.description | strip_html | truncatewords: 30 }}
                {% else %}
                  {{ post.excerpt | strip_html | truncatewords: 30 }}
                {% endif %}
              </p>
            </div>
            <div class="post-meta flex-grow-1 d-flex align-items-end">
              <div class="me-auto text-muted">
                <i class="far fa-calendar fa-fw me-1"></i>
                {{ post.date | date: "%b %d, %Y" }}
                {% if post.categories.size > 0 %}
                  <i class="far fa-folder-open fa-fw mx-2"></i>
                  {{ post.categories | join: ', ' }}
                {% endif %}
              </div>
            </div>
          </div>
        </div>
      </a>
    </article>
  {% endfor %}
</div>
