---
# the default layout is 'page'
title: Contact
icon: fa-solid fa-location-dot
order: 3
is_homepage: true
---

For questions about my writing, collaborations, or anything weird, email is the best way to reach me.
 
{::nomarkdown}
<ul class="contact-list">
<li>
<span class="contact-label">Email</span>
<a class="contact-value" id="contact-email" href="#">Email me <span class="contact-note">(needs JavaScript)</span></a>
</li>
<li>
<span class="contact-label">LinkedIn</span>
<!-- replace the address in href and in the text -->
<a class="contact-value" href="https://www.linkedin.com/in/your-name" target="_blank" rel="noopener">linkedin.com/in/lyn-ballegeer <span class="contact-arrow" aria-hidden="true">↗</span></a>
</li>
<li>
<span class="contact-label">Instagram</span>
<a class="contact-value" href="https://www.instagram.com/lynballegeer" target="_blank" rel="noopener">instagram.com/lynballegeer <span class="contact-arrow" aria-hidden="true">↗</span></a>
</li>
<li>
<span class="contact-label">Website</span>
<a class="contact-value" href="https://lynballegeer.com" target="_blank" rel="noopener">lynballegeer.com <span class="contact-arrow" aria-hidden="true">↗</span></a>
</li>
</ul>
<script>
(function () {
  var a = document.getElementById('contact-email');
  if (!a) return;
  var addr = ['lyn.ballegeer', 'outlook.com'].join('@');
  a.href = 'mailto:' + addr;
  a.textContent = addr;
})();
</script>
{:/nomarkdown}