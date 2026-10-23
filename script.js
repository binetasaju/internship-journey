const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = reduceMotionQuery.matches;

let lenis = null;

function initLenis() {
  if (prefersReducedMotion || typeof window.Lenis === 'undefined' || typeof window.gsap === 'undefined') {
    return null;
  }

  lenis = new window.Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  lenis.on('scroll', () => {
    if (typeof window.ScrollTrigger !== 'undefined') {
      window.ScrollTrigger.update();
    }
  });

  window.gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  window.gsap.ticker.lagSmoothing(0);

  return lenis;
}

function setMenuState(isOpen) {
  const toggle = document.getElementById('mobile-nav-toggle');
  const menu = document.getElementById('mobile-nav');

  if (!toggle || !menu) return;

  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  menu.hidden = !isOpen;
}

function scrollToTarget(target) {
  if (!target) return;

  if (lenis) {
    lenis.scrollTo(target, { offset: -80, duration: 1.5 });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const coverPage = document.getElementById('cover-page');
  const openBtn = document.getElementById('open-journal-btn');
  const progressBar = document.getElementById('progress-bar');
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const mobileMenu = document.getElementById('mobile-nav');

  initLenis();

  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.setTimeout(() => {
      window.ScrollTrigger.refresh();
    }, 100);
  }

  if (coverPage && openBtn) {
    if (lenis) {
      lenis.stop();
    }

    openBtn.addEventListener('click', () => {
      coverPage.style.transform = 'translateY(-100%)';
      if (lenis) {
        lenis.start();
      }

      window.setTimeout(() => {
        coverPage.style.display = 'none';
        if (typeof window.ScrollTrigger !== 'undefined') {
          window.ScrollTrigger.refresh();
        }
      }, prefersReducedMotion ? 0 : 1000);
    });
  }

  if (progressBar) {
    if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
      window.gsap.to(progressBar, {
        width: '100%',
        ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 0.1 },
      });
    } else {
      progressBar.style.width = '100%';
    }
  }

  document
    .querySelectorAll([
      '#start .mx-auto > *',
      '#bus .mx-auto > *',
      'section[id] > .grid > *',
      'section[id] .space-y-5 > *',
      '#mentor .mx-auto > *',
      '#learned .mx-auto > *',
      'footer > div > *',
    ].join(','))
    .forEach((el) => {
      if (!el.classList.contains('gsap-reveal')) {
        el.classList.add('gsap-reveal');
      }
    });

  const revealElements = [...document.querySelectorAll('.gsap-reveal')].filter((el) => {
    const computed = window.getComputedStyle(el);
    return !(el.classList.contains('absolute') && computed.display === 'none');
  });
  const canAnimateReveals = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  function showRevealElement(el) {
    el.classList.add('is-visible');
    el.style.opacity = '1';
    el.style.visibility = 'visible';
    el.style.transform = 'none';
  }

  if (!prefersReducedMotion && !canAnimateReveals && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        showRevealElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    revealElements.forEach((el) => {
      el.style.transform = 'translateY(40px)';
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach((el) => {
      if (prefersReducedMotion || !canAnimateReveals) {
        showRevealElement(el);
        return;
      }

      window.gsap.set(el, { y: 40, opacity: 0, autoAlpha: 0 });
      window.gsap.to(el, {
        y: 0,
        opacity: 1,
        autoAlpha: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (event) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target);

      if (window.innerWidth < 768) {
        setMenuState(false);
      }
    });
  });

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileToggle.getAttribute('aria-expanded') === 'true';
      setMenuState(!isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      setMenuState(false);
    }
  });

  const busRoute = document.getElementById('bus-route');
  const busSprite = document.getElementById('bus-sprite');
  const busSection = document.getElementById('bus');
  if (busRoute && busSprite && busSection && typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    const totalLen = busRoute.getTotalLength();

    function updateBus(progress) {
      const len = progress * totalLen;
      const pt = busRoute.getPointAtLength(len);
      const ptPrev = busRoute.getPointAtLength(Math.max(0, len - 2));
      const angle = Math.atan2(pt.y - ptPrev.y, pt.x - ptPrev.x) * (180 / Math.PI);
      busSprite.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(${angle})`);
    }

    updateBus(0);

    window.ScrollTrigger.create({
      trigger: busSection,
      start: 'top 70%',
      end: 'bottom 20%',
      scrub: 2,
      onUpdate: (self) => {
        updateBus(self.progress);
      },
    });
  }

  const scrollArrow = document.getElementById('scroll-arrow');
  if (scrollArrow) {
    if (typeof window.gsap !== 'undefined' && !prefersReducedMotion) {
      window.gsap.to(scrollArrow, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.3,
        scrollTrigger: {
          trigger: 'body',
          start: 'top -300px',
          toggleActions: 'play none none reverse',
        },
      });
    } else {
      scrollArrow.style.opacity = '1';
      scrollArrow.style.pointerEvents = 'auto';
    }

    scrollArrow.addEventListener('click', (event) => {
      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.5 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
});
