---
layout: page
title: Projects
is_homepage: true
icon: fa-solid fa-folder-open
order: 2
---

{::nomarkdown}
<div class="projects">
{% for p in site.data.projects -%}
<div class="proj-row">
{% if p.url %}<a class="proj" href="{{ p.url }}"{% if p.url contains '://' %} target="_blank" rel="noopener"{% endif %}>{% else %}<div class="proj">{% endif %}
{% if p.image -%}
{%- assign img = p.image -%}
{%- unless img contains '://' -%}{%- assign img = img | relative_url -%}{%- endunless -%}
<div class="proj-img" role="img" aria-label="{{ p.title | escape }}"><div class="proj-img-inner" style="background-image: url('{{ img }}')"></div></div>
{%- else -%}
<div class="proj-img proj-img--none" aria-hidden="true"></div>
{%- endif %}
<div class="proj-text">
<h2 class="proj-title">{{ p.title }}</h2>
<p class="proj-desc">{{ p.description }}</p>
{% if p.url %}<span class="proj-go">View project →</span>{% endif %}
</div>
{% if p.url %}</a>{% else %}</div>{% endif %}
</div>
{%- endfor %}
</div>
{:/nomarkdown}