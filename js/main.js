/* ==========================================================================
   National Sports Website — Main JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileMenu();
    initRevealAnimations();
    initCounterAnimation();
    initSmoothScroll();
});

/* ---------- Header Scroll Effect ---------- */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }

        lastScroll = currentScroll;
    }, { passive: true });
}

/* ---------- Mobile Menu ---------- */
function initMobileMenu() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');

    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
        burger.classList.toggle('burger--active');
        nav.classList.toggle('nav--open');
        document.body.style.overflow = nav.classList.contains('nav--open') ? 'hidden' : '';
    });

    nav.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('burger--active');
            nav.classList.remove('nav--open');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !burger.contains(e.target) && nav.classList.contains('nav--open')) {
            burger.classList.remove('burger--active');
            nav.classList.remove('nav--open');
            document.body.style.overflow = '';
        }
    });
}

/* ---------- Reveal on Scroll (Intersection Observer) ---------- */
function initRevealAnimations() {
    const reveals = document.querySelectorAll('.sport-card, .event-card, .news-card, .value-card, .stat-item, .team-card, .contact-info__item, .sport-detail, [class*="reveal"]');

    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('reveal--visible');
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) translateX(0) scale(1)';
                }, index * 80);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => {
        if (!el.classList.contains('reveal--visible')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }
        observer.observe(el);
    });
}

/* ---------- Counter Animation ---------- */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-item__number[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.target);
    const duration = 2000;
    const start = performance.now();

    function formatNumber(num) {
        if (num >= 10000) return Math.floor(num / 1000) + ' 000+';
        return num.toString();
    }

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);

        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);

        element.textContent = formatNumber(current);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatNumber(target);
        }
    }

    requestAnimationFrame(update);
}

/* ---------- Smooth Scroll for Anchor Links ---------- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('header')?.offsetHeight || 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* ---------- Contact Form (simple validation) ---------- */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        let isValid = true;

        formData.forEach((value, key) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && input.hasAttribute('required') && !value.trim()) {
                input.style.borderColor = 'var(--color-primary)';
                isValid = false;
            } else if (input) {
                input.style.borderColor = '';
            }
        });

        if (isValid) {
            const btn = form.querySelector('.btn');
            const originalText = btn.textContent;
            btn.textContent = 'Отправлено!';
            btn.style.backgroundColor = 'var(--color-accent)';
            btn.style.borderColor = 'var(--color-accent)';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.style.borderColor = '';
                form.reset();
            }, 3000);
        }
    });
}

document.addEventListener('DOMContentLoaded', initContactForm);
