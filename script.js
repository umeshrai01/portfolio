/* ==========================================================================
   Portfolio Website — Main Script
   GSAP Animations · Interactions · UI Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 0. GLOBAL HELPERS & FEATURE DETECTION
  // ---------------------------------------------------------------------------

  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /** Safely query a single element */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  /** Safely query all elements */
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** Throttle helper */
  const throttle = (fn, ms = 16) => {
    let last = 0;
    return (...args) => {
      const now = performance.now();
      if (now - last >= ms) {
        last = now;
        fn(...args);
      }
    };
  };

  /** Debounce helper */
  const debounce = (fn, ms = 100) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  };

  /** Linear interpolation */
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Clamp */
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  // Default GSAP settings for premium feel
  gsap.defaults({ ease: 'power3.out', duration: 0.8 });

  // Store mouse position globally
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  window.addEventListener(
    'mousemove',
    throttle((e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, 8)
  );

  // ---------------------------------------------------------------------------
  // 1. PAGE LOADER
  // ---------------------------------------------------------------------------

  const initLoader = () => {
    const loader = $('#page-loader');
    if (!loader) return Promise.resolve();

    const letters = $$('.loader-letter[data-index]', loader).sort(
      (a, b) => +a.dataset.index - +b.dataset.index
    );
    const barFill = $('#loader-bar-fill', loader);
    const loaderText = $('.loader-text', loader);

    // Prevent scroll while loading
    document.body.style.overflow = 'hidden';

    return new Promise((resolve) => {
      if (prefersReducedMotion) {
        loader.remove();
        document.body.style.overflow = '';
        resolve();
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          // Slide loader up
          gsap.to(loader, {
            yPercent: -100,
            duration: 0.8,
            ease: 'power4.inOut',
            onComplete: () => {
              loader.remove();
              document.body.style.overflow = '';
              resolve();
            },
          });
        },
      });

      // Animate letters in
      tl.fromTo(
        letters,
        { opacity: 0, y: 30, rotateX: -90 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.7)',
        }
      );

      // Fill progress bar
      if (barFill) {
        tl.fromTo(
          barFill,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.6, ease: 'power2.inOut', transformOrigin: 'left center' },
          '-=0.3'
        );
      }

      // Loader text pulse
      if (loaderText) {
        tl.fromTo(
          loaderText,
          { opacity: 0 },
          { opacity: 1, duration: 0.4 },
          '-=1.6'
        );
        tl.to(loaderText, { opacity: 0.4, duration: 0.3, yoyo: true, repeat: 3 }, '-=1.2');
      }

      // Brief pause at end so the user sees 100%
      tl.to({}, { duration: 0.3 });
    });
  };

  // ---------------------------------------------------------------------------
  // 2. CUSTOM CURSOR
  // ---------------------------------------------------------------------------

  const initCursor = () => {
    if (isTouchDevice) return;

    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    if (!dot || !ring) return;

    // Hide default cursor
    document.body.style.cursor = 'none';

    let ringX = mouse.x;
    let ringY = mouse.y;

    // Render loop for smooth follow
    const render = () => {
      // Dot follows tightly
      gsap.set(dot, { x: mouse.x, y: mouse.y });

      // Ring follows with lerp
      ringX = lerp(ringX, mouse.x, 0.15);
      ringY = lerp(ringY, mouse.y, 0.15);
      gsap.set(ring, { x: ringX, y: ringY });

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    // Interactive targets expand the ring
    const interactiveTargets = 'a, button, .magnetic, input, textarea, select, .filter-btn, .project-detail-btn, .nav-link, .social-link, #back-to-top, #nav-toggle';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveTargets)) {
        gsap.to(ring, {
          scale: 1.8,
          borderColor: 'rgba(99, 102, 241, 0.6)',
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.to(dot, { scale: 0.5, duration: 0.3 });
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveTargets)) {
        gsap.to(ring, {
          scale: 1,
          borderColor: '',
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.to(dot, { scale: 1, duration: 0.3 });
      }
    });

    // Hide cursor when it leaves the viewport
    document.addEventListener('mouseleave', () => {
      gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    });
    document.addEventListener('mouseenter', () => {
      gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
    });

    // Pressed state
    document.addEventListener('mousedown', () => {
      gsap.to(dot, { scale: 0.7, duration: 0.15 });
      gsap.to(ring, { scale: 0.8, duration: 0.15 });
    });
    document.addEventListener('mouseup', () => {
      gsap.to(dot, { scale: 1, duration: 0.15 });
      gsap.to(ring, { scale: 1, duration: 0.15 });
    });
  };

  // ---------------------------------------------------------------------------
  // 3. NAVIGATION
  // ---------------------------------------------------------------------------

  const initNavigation = () => {
    const nav = $('#main-nav');
    const toggle = $('#nav-toggle');
    const mobileNav = $('#mobile-nav');
    const navLinks = $$('.nav-link');
    const sections = $$('section[id]');

    // --- Scrolled state (opaque background) ---
    if (nav) {
      ScrollTrigger.create({
        trigger: document.body,
        start: '100px top',
        onEnter: () => nav.classList.add('scrolled'),
        onLeaveBack: () => nav.classList.remove('scrolled'),
      });
    }

    // --- Mobile menu toggle ---
    if (toggle && mobileNav) {
      let mobileOpen = false;

      const openMobile = () => {
        mobileOpen = true;
        mobileNav.classList.add('active');
        mobileNav.setAttribute('aria-hidden', 'false');
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';

        // Animate links in
        const links = $$('.nav-link', mobileNav);
        gsap.fromTo(
          links,
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.07, ease: 'power3.out', delay: 0.15 }
        );
      };

      const closeMobile = () => {
        mobileOpen = false;
        mobileNav.classList.remove('active');
        mobileNav.setAttribute('aria-hidden', 'true');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      };

      toggle.addEventListener('click', () => {
        mobileOpen ? closeMobile() : openMobile();
      });

      // Close mobile nav on link click
      $$('.nav-link', mobileNav).forEach((link) => {
        link.addEventListener('click', closeMobile);
      });
    }

    // --- Smooth scroll for nav links ---
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || !href.startsWith('#')) return;
        e.preventDefault();

        const target = $(href);
        if (!target) return;

        const navHeight = nav ? nav.offsetHeight : 0;

        gsap.to(window, {
          scrollTo: { y: target, offsetY: navHeight + 20 },
          duration: 1,
          ease: 'power3.inOut',
        });
      });
    });

    // --- Active link tracking ---
    if (sections.length && navLinks.length) {
      sections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 40%',
          end: 'bottom 40%',
          onToggle: (self) => {
            if (self.isActive) {
              navLinks.forEach((l) => l.classList.remove('active'));
              const id = section.getAttribute('id');
              navLinks.forEach((l) => {
                if (l.getAttribute('href') === `#${id}`) {
                  l.classList.add('active');
                }
              });
            }
          },
        });
      });
    }
  };

  // ---------------------------------------------------------------------------
  // 4. HERO ANIMATIONS
  // ---------------------------------------------------------------------------

  const initHero = () => {
    const heroTl = gsap.timeline({ delay: 0.2 });

    // --- Title words staggered reveal ---
    const titleWords = $$('.title-word');
    if (titleWords.length) {
      heroTl.fromTo(
        titleWords,
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power4.out',
        }
      );
    }

    // --- Hero badge ---
    const badge = $('.hero-badge');
    if (badge) {
      heroTl.fromTo(
        badge,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.5'
      );
    }

    // --- Hero description ---
    const desc = $('.hero-description');
    if (desc) {
      heroTl.fromTo(
        desc,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.3'
      );
    }

    // --- CTA buttons ---
    const ctas = $$('.hero-cta');
    if (ctas.length) {
      heroTl.fromTo(
        ctas,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.12 },
        '-=0.2'
      );
    }

    // --- Stats counter ---
    const statNumbers = $$('.hero-stats .stat-number, .hero-stats [data-target]');
    if (statNumbers.length) {
      heroTl.add(() => animateCounters(statNumbers), '-=0.2');
    }

    // --- Scroll indicator ---
    const scrollInd = $('#scroll-indicator');
    if (scrollInd) {
      heroTl.fromTo(
        scrollInd,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5 },
        '+=0.2'
      );

      // Fade out scroll indicator on scroll
      ScrollTrigger.create({
        trigger: scrollInd,
        start: 'top 85%',
        end: 'top 20%',
        onLeave: () => gsap.to(scrollInd, { opacity: 0, duration: 0.3 }),
        onEnterBack: () => gsap.to(scrollInd, { opacity: 1, duration: 0.3 }),
      });

      // Gentle bounce animation
      gsap.to(scrollInd, {
        y: 8,
        duration: 1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // 4b. TYPING EFFECT
  // ---------------------------------------------------------------------------

  const initTypingEffect = () => {
    const el = $('.hero-typing');
    if (!el) return;

    const strings = [
      'AI-powered applications',
      'production ML systems',
      'intelligent chatbots',
      'data-driven insights',
      'GenAI solutions',
    ];

    let stringIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    // Ensure a blinking cursor via CSS (we add a span)
    let cursorSpan = el.querySelector('.typing-cursor');
    if (!cursorSpan) {
      cursorSpan = document.createElement('span');
      cursorSpan.className = 'typing-cursor';
      cursorSpan.textContent = '|';
      cursorSpan.style.cssText =
        'animation: blink-cursor 0.7s step-end infinite; font-weight: 200; margin-left: 2px;';
      el.parentNode.insertBefore(cursorSpan, el.nextSibling);

      // Inject keyframes if not already present
      if (!$('#typing-cursor-style')) {
        const style = document.createElement('style');
        style.id = 'typing-cursor-style';
        style.textContent = `@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}`;
        document.head.appendChild(style);
      }
    }

    const type = () => {
      const current = strings[stringIndex];

      if (isDeleting) {
        charIndex--;
        el.textContent = current.substring(0, charIndex);
      } else {
        charIndex++;
        el.textContent = current.substring(0, charIndex);
      }

      let delay = isDeleting ? 40 : 80;

      // Finished typing
      if (!isDeleting && charIndex === current.length) {
        delay = 2000; // Pause before deleting
        isDeleting = true;
      }

      // Finished deleting
      if (isDeleting && charIndex === 0) {
        isDeleting = false;
        stringIndex = (stringIndex + 1) % strings.length;
        delay = 400; // Short pause before next string
      }

      setTimeout(type, delay);
    };

    // Start after hero animation
    setTimeout(type, 1500);
  };

  // ---------------------------------------------------------------------------
  // 5. MAGNETIC BUTTONS
  // ---------------------------------------------------------------------------

  const initMagneticButtons = () => {
    if (isTouchDevice || prefersReducedMotion) return;

    const magnetics = $$('.magnetic');
    const MAX_MOVE = 12; // px

    magnetics.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);

        gsap.to(el, {
          x: dx * MAX_MOVE,
          y: dy * MAX_MOVE,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.4)',
        });
      });
    });
  };

  // ---------------------------------------------------------------------------
  // 6. SECTION REVEAL ANIMATIONS
  // ---------------------------------------------------------------------------

  const initSectionReveals = () => {
    if (prefersReducedMotion) return;

    // --- Reveal text (clip from bottom) ---
    $$('.reveal-text').forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(100% 0% 0% 0%)', y: 30 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          y: 0,
          duration: 0.9,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // --- Reveal elements (fade + translate) ---
    $$('.reveal-element').forEach((el) => {
      gsap.fromTo(
        el,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // --- Section lines ---
    $$('.section-line').forEach((el) => {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          transformOrigin: 'left center',
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // --- Section tags ---
    $$('.section-tag').forEach((el) => {
      gsap.fromTo(
        el,
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  };

  // ---------------------------------------------------------------------------
  // 7. ABOUT SECTION
  // ---------------------------------------------------------------------------

  const initAbout = () => {
    // --- Image parallax ---
    const imageCard = $('.about-image-card');
    if (imageCard) {
      gsap.to(imageCard, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: imageCard,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }

    // --- Floating cards ---
    const float1 = $('.float-card-1');
    const float2 = $('.float-card-2');

    if (float1) {
      gsap.to(float1, {
        y: -10,
        x: 5,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }
    if (float2) {
      gsap.to(float2, {
        y: 10,
        x: -5,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.5,
      });
    }

    // --- About content staggered reveal ---
    const aboutContent = $('.about-content');
    if (aboutContent) {
      const children = [...aboutContent.children];
      if (children.length) {
        gsap.fromTo(
          children,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: aboutContent,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }

    // --- Detail items ---
    const detailItems = $$('.about-details .detail-item');
    if (detailItems.length) {
      gsap.fromTo(
        detailItems,
        { y: 25, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: {
            trigger: detailItems[0],
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // --- Social links ---
    const socialLinks = $$('.social-link');
    if (socialLinks.length) {
      gsap.fromTo(
        socialLinks,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: 0.08,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: socialLinks[0],
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  };

  // ---------------------------------------------------------------------------
  // 8. SKILLS SECTION
  // ---------------------------------------------------------------------------

  const initSkills = () => {
    const categories = $$('.skill-category');

    // --- Staggered reveal ---
    if (categories.length) {
      gsap.fromTo(
        categories,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: categories[0],
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // --- Skill tags pop-in per category ---
      categories.forEach((cat) => {
        const tags = $$('.skill-tag', cat);
        if (tags.length) {
          gsap.fromTo(
            tags,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.35,
              stagger: 0.05,
              ease: 'back.out(2)',
              scrollTrigger: {
                trigger: cat,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });

      // --- Hover tilt on skill cards ---
      if (!isTouchDevice && !prefersReducedMotion) {
        categories.forEach((card) => {
          card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(card, {
              rotateY: x * 8,
              rotateX: -y * 8,
              transformPerspective: 600,
              duration: 0.3,
              ease: 'power2.out',
            });
          });

          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              rotateY: 0,
              rotateX: 0,
              duration: 0.5,
              ease: 'power3.out',
            });
          });
        });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 9. PROJECTS SECTION
  // ---------------------------------------------------------------------------

  /** Project data for modal */
  const projectData = {
    ipl: {
      title: 'IPL Winning Prediction',
      description:
        'Machine learning model to predict IPL match outcomes using historical data, team performance metrics, and player statistics. Uses ensemble methods including Random Forest, XGBoost, and neural networks for probability estimation.',
      tech: ['Python', 'Scikit-Learn', 'Pandas', 'Streamlit', 'NumPy'],
      features: [
        'Match outcome prediction with probability scores',
        'Historical data analysis of 15+ IPL seasons',
        'Team and player performance feature engineering',
        'Interactive Streamlit dashboard for predictions',
      ],
      github: 'https://github.com/umeshrai01',
    },
    sales: {
      title: 'Sales Forecasting',
      description:
        'End-to-end time series forecasting pipeline for predicting sales and demand patterns. Combines ARIMA, Prophet, and gradient boosting models with automated feature engineering.',
      tech: ['Python', 'Prophet', 'XGBoost', 'Power BI', 'Pandas'],
      features: [
        'Multi-model ensemble forecasting',
        'Automated feature extraction from time series',
        'Power BI dashboard for business stakeholders',
        'Seasonality and trend decomposition',
      ],
      github: 'https://github.com/umeshrai01',
    },
    appbuilder: {
      title: 'AI App Builder',
      description:
        'An AI-powered platform that generates full-stack web applications from natural language descriptions. Uses LLMs for code generation and understanding user intent.',
      tech: ['React', 'Node.js', 'OpenAI API', 'FastAPI', 'MongoDB'],
      features: [
        'Natural language to code generation',
        'Full-stack app scaffolding',
        'AI-powered code review and optimization',
        'Template library with 50+ components',
      ],
      github: 'https://github.com/umeshrai01',
    },
    studentszone: {
      title: 'Students Zone',
      description:
        'Comprehensive educational platform with AI-powered tutoring, course management, and interactive learning modules designed for modern students.',
      tech: ['React', 'Node.js', 'MongoDB', 'AI Integration', 'Express'],
      features: [
        'AI-powered personalized tutoring',
        'Course management and progress tracking',
        'Interactive quizzes and assessments',
        'Collaborative study groups',
      ],
      github: 'https://github.com/umeshrai01',
    },
    sentiment: {
      title: 'Sentiment Analysis Engine',
      description:
        'Deep learning-based sentiment classification system using LSTM and CNN architectures with attention mechanisms for high-accuracy text analysis.',
      tech: ['Python', 'TensorFlow', 'Keras', 'NLP', 'NLTK'],
      features: [
        'Multi-class sentiment classification',
        'Custom word embeddings and attention layers',
        'Real-time inference API',
        'Confusion matrix and ROC analysis',
      ],
      github:
        'https://www.kaggle.com/code/umeshkumarrai123/sentiment-analysis-with-neural-networks/',
    },
    houseprice: {
      title: 'House Price Prediction',
      description:
        'Advanced regression model for predicting house sale prices with comprehensive EDA, feature engineering, and model stacking.',
      tech: ['Python', 'XGBoost', 'LightGBM', 'Scikit-Learn', 'Stacking'],
      features: [
        '80+ engineered features from raw data',
        'Stacked ensemble of 5 base models',
        'Comprehensive EDA with 30+ visualizations',
        'Top percentile Kaggle submission',
      ],
      github:
        'https://www.kaggle.com/code/umeshkumarrai123/house-price-prediction',
    },
  };

  const initProjects = () => {
    const filterBtns = $$('.filter-btn');
    const projectCards = $$('.project-card');

    // --- Filter buttons ---
    if (filterBtns.length && projectCards.length) {
      filterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          // Active state
          filterBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');

          const category = btn.dataset.category || btn.dataset.filter || btn.textContent.trim().toLowerCase();

          projectCards.forEach((card) => {
            const cardCat = card.dataset.category;
            const shouldShow = category === 'all' || cardCat === category;

            if (shouldShow) {
              gsap.to(card, {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: 'power2.out',
                onStart: () => {
                  card.style.display = '';
                  card.style.pointerEvents = '';
                },
              });
            } else {
              gsap.to(card, {
                scale: 0.9,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                  card.style.display = 'none';
                  card.style.pointerEvents = 'none';
                },
              });
            }
          });

          // Refresh ScrollTrigger after DOM layout change
          setTimeout(() => ScrollTrigger.refresh(), 500);
        });
      });
    }

    // --- 3D tilt on project cards ---
    if (!isTouchDevice && !prefersReducedMotion) {
      projectCards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;

          gsap.to(card, {
            rotateY: x * 10,
            rotateX: -y * 10,
            transformPerspective: 800,
            duration: 0.4,
            ease: 'power2.out',
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.6,
            ease: 'power3.out',
          });
        });
      });
    }

    // --- Stagger reveal on scroll ---
    if (projectCards.length && !prefersReducedMotion) {
      gsap.fromTo(
        projectCards,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: projectCards[0].parentElement,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // --- Detail buttons (open modal) ---
    $$('.project-detail-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const projectKey =
          btn.dataset.project || btn.closest('.project-card')?.dataset.project;
        if (projectKey && projectData[projectKey]) {
          openProjectModal(projectKey);
        }
      });
    });
  };

  // ---------------------------------------------------------------------------
  // 10. PROJECT MODAL
  // ---------------------------------------------------------------------------

  const initModal = () => {
    const modal = $('#project-modal');
    if (!modal) return;

    const backdrop = $('#modal-backdrop');
    const closeBtn = $('#modal-close');

    // Close on backdrop click
    if (backdrop) {
      backdrop.addEventListener('click', closeProjectModal);
    }

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', closeProjectModal);
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeProjectModal();
      }
    });
  };

  /** Open the project modal with data */
  const openProjectModal = (key) => {
    const modal = $('#project-modal');
    if (!modal) return;

    const data = projectData[key];
    if (!data) return;

    // Populate content
    const titleEl = modal.querySelector('.modal-title, #modal-title, h2, h3');
    const descEl = modal.querySelector('.modal-description, #modal-description, .modal-desc');
    const techContainer = modal.querySelector('.modal-tech, #modal-tech, .modal-tags');
    const featuresContainer = modal.querySelector('.modal-features, #modal-features');
    const githubLink = modal.querySelector('.modal-github, #modal-github, .modal-link');

    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.description;

    if (techContainer) {
      techContainer.innerHTML = data.tech
        .map((t) => `<span class="modal-tech-tag">${t}</span>`)
        .join('');
    }

    if (featuresContainer) {
      featuresContainer.innerHTML = data.features
        .map((f) => `<li>${f}</li>`)
        .join('');
    }

    if (githubLink) {
      githubLink.href = data.github;
      githubLink.target = '_blank';
      githubLink.rel = 'noopener noreferrer';
    }

    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // GSAP entrance
    const backdrop = $('#modal-backdrop');
    const content = modal.querySelector('.modal-content, .modal-body, .modal-inner');

    gsap.fromTo(
      backdrop,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );

    if (content) {
      gsap.fromTo(
        content,
        { scale: 0.9, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.1 }
      );
    }
  };

  /** Close the project modal */
  const closeProjectModal = () => {
    const modal = $('#project-modal');
    if (!modal) return;

    const backdrop = $('#modal-backdrop');
    const content = modal.querySelector('.modal-content, .modal-body, .modal-inner');

    const tl = gsap.timeline({
      onComplete: () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      },
    });

    if (content) {
      tl.to(content, { scale: 0.9, opacity: 0, y: 30, duration: 0.3, ease: 'power2.in' });
    }
    if (backdrop) {
      tl.to(backdrop, { opacity: 0, duration: 0.25 }, '-=0.15');
    }
  };

  // ---------------------------------------------------------------------------
  // 11. TIMELINE SECTION
  // ---------------------------------------------------------------------------

  const initTimeline = () => {
    const items = $$('.timeline-item');
    const line = $('.timeline-line');

    // --- Timeline line grows with scroll ---
    if (line) {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: 'top center',
          scrollTrigger: {
            trigger: line.parentElement || line,
            start: 'top 70%',
            end: 'bottom 30%',
            scrub: 1,
          },
        }
      );
    }

    // --- Items alternate reveal ---
    if (items.length && !prefersReducedMotion) {
      items.forEach((item, i) => {
        const side = item.dataset.side || (i % 2 === 0 ? 'left' : 'right');
        const fromX = side === 'left' ? -60 : 60;

        gsap.fromTo(
          item,
          { x: fromX, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }

    // --- Dot pulse animation ---
    $$('.timeline-dot .dot-pulse, .dot-pulse').forEach((pulse) => {
      ScrollTrigger.create({
        trigger: pulse,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(
            pulse,
            { scale: 0.5, opacity: 0 },
            {
              scale: 1.5,
              opacity: 0,
              duration: 1.2,
              repeat: -1,
              ease: 'power2.out',
            }
          );
        },
        once: true,
      });
    });
  };

  // ---------------------------------------------------------------------------
  // 12. ACHIEVEMENTS SECTION
  // ---------------------------------------------------------------------------

  const initAchievements = () => {
    const counterEls = $$('.counter-number[data-target]');
    const cards = $$('.achievement-card');

    // --- Counter animation on scroll ---
    if (counterEls.length) {
      ScrollTrigger.create({
        trigger: counterEls[0].closest('section') || counterEls[0],
        start: 'top 75%',
        once: true,
        onEnter: () => animateCounters(counterEls),
      });
    }

    // --- Staggered card reveal ---
    if (cards.length && !prefersReducedMotion) {
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cards[0],
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // --- Subtle hover float on cards ---
    if (!isTouchDevice && !prefersReducedMotion) {
      cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: -6, duration: 0.3, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { y: 0, duration: 0.4, ease: 'power3.out' });
        });
      });
    }
  };

  /** Animate counter elements from 0 to data-target */
  const animateCounters = (elements) => {
    elements.forEach((el) => {
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;

      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = prefix + Math.round(obj.val) + suffix;
        },
      });
    });
  };

  // ---------------------------------------------------------------------------
  // 13. CONTACT FORM
  // ---------------------------------------------------------------------------

  const initContactForm = () => {
    const form = $('#contact-form');
    if (!form) return;

    // --- Floating labels ---
    const formGroups = $$('.form-group', form);
    formGroups.forEach((group) => {
      const input = group.querySelector('input, textarea');
      const label = group.querySelector('label');
      const formLine = group.querySelector('.form-line');

      if (!input) return;

      // Focus / blur handlers for floating label
      input.addEventListener('focus', () => {
        group.classList.add('focused');
        if (label) {
          gsap.to(label, {
            y: -22,
            scale: 0.8,
            color: '#6366f1',
            duration: 0.3,
            ease: 'power2.out',
          });
        }
        if (formLine) {
          gsap.to(formLine, {
            scaleX: 1,
            backgroundColor: '#6366f1',
            duration: 0.4,
            transformOrigin: 'center',
          });
        }
      });

      input.addEventListener('blur', () => {
        group.classList.remove('focused');
        if (!input.value.trim()) {
          if (label) {
            gsap.to(label, {
              y: 0,
              scale: 1,
              color: '',
              duration: 0.3,
            });
          }
        }
        if (formLine) {
          gsap.to(formLine, {
            scaleX: input.value.trim() ? 1 : 0,
            backgroundColor: '',
            duration: 0.3,
          });
        }
      });

      // Handle pre-filled values
      if (input.value.trim() && label) {
        gsap.set(label, { y: -22, scale: 0.8 });
      }
    });

    // --- Form submission ---
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      const submitBtn = form.querySelector('.btn-submit, button[type="submit"]');
      const loadingState = form.querySelector('.btn-submit-loading');
      const successState = form.querySelector('.btn-submit-success');

      // Show loading
      if (submitBtn) submitBtn.disabled = true;
      if (loadingState) loadingState.style.display = 'flex';
      if (successState) successState.style.display = 'none';

      // Simulate async / mailto approach
      setTimeout(() => {
        if (loadingState) loadingState.style.display = 'none';
        if (successState) {
          successState.style.display = 'flex';
          gsap.fromTo(
            successState,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
          );
        }

        // Trigger mailto
        const name = form.querySelector('[name="name"]')?.value || '';
        const email = form.querySelector('[name="email"]')?.value || '';
        const subject = form.querySelector('[name="subject"]')?.value || '';
        const message = form.querySelector('[name="message"]')?.value || '';

        const mailtoLink = `mailto:ukrai.ukr@gmail.com?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\n\n${message}`
        )}`;

        // Open mail client silently
        window.open(mailtoLink, '_blank');

        // Reset after delay
        setTimeout(() => {
          form.reset();
          if (submitBtn) submitBtn.disabled = false;
          if (successState) successState.style.display = 'none';

          // Reset floating labels
          formGroups.forEach((group) => {
            const label = group.querySelector('label');
            const formLine = group.querySelector('.form-line');
            if (label) gsap.to(label, { y: 0, scale: 1, color: '', duration: 0.3 });
            if (formLine) gsap.to(formLine, { scaleX: 0, duration: 0.3 });
          });
        }, 2500);
      }, 1500);
    });
  };

  /** Validate the contact form */
  const validateForm = (form) => {
    let isValid = true;

    // Clear previous errors
    $$('.form-error', form).forEach((err) => {
      err.textContent = '';
      err.style.display = 'none';
    });

    // Name
    const name = form.querySelector('[name="name"]');
    if (name && !name.value.trim()) {
      showFieldError(name, 'Please enter your name');
      isValid = false;
    }

    // Email
    const email = form.querySelector('[name="email"]');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email) {
      if (!email.value.trim()) {
        showFieldError(email, 'Please enter your email');
        isValid = false;
      } else if (!emailRegex.test(email.value.trim())) {
        showFieldError(email, 'Please enter a valid email');
        isValid = false;
      }
    }

    // Subject
    const subject = form.querySelector('[name="subject"]');
    if (subject && !subject.value.trim()) {
      showFieldError(subject, 'Please enter a subject');
      isValid = false;
    }

    // Message
    const message = form.querySelector('[name="message"]');
    if (message && !message.value.trim()) {
      showFieldError(message, 'Please enter your message');
      isValid = false;
    }

    return isValid;
  };

  /** Show an error message for a form field */
  const showFieldError = (input, msg) => {
    const group = input.closest('.form-group');
    if (!group) return;

    let errorEl = group.querySelector('.form-error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-error';
      group.appendChild(errorEl);
    }
    errorEl.textContent = msg;
    errorEl.style.display = 'block';

    // Shake animation
    gsap.fromTo(
      input,
      { x: -4 },
      { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
    );
  };

  // ---------------------------------------------------------------------------
  // 14. FOOTER
  // ---------------------------------------------------------------------------

  const initFooter = () => {
    // --- Current year ---
    const yearEl = $('#footer-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    // --- Back to top ---
    const backToTop = $('#back-to-top');
    if (backToTop) {
      // Show/hide based on scroll
      ScrollTrigger.create({
        trigger: document.body,
        start: '500px top',
        onEnter: () =>
          gsap.to(backToTop, { opacity: 1, scale: 1, pointerEvents: 'auto', duration: 0.3 }),
        onLeaveBack: () =>
          gsap.to(backToTop, { opacity: 0, scale: 0.8, pointerEvents: 'none', duration: 0.3 }),
      });

      // Initial state: hidden
      gsap.set(backToTop, { opacity: 0, scale: 0.8, pointerEvents: 'none' });

      backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        gsap.to(window, {
          scrollTo: { y: 0 },
          duration: 1.2,
          ease: 'power3.inOut',
        });
      });
    }
  };

  // ---------------------------------------------------------------------------
  // 15. SMOOTH SCROLL (for any remaining anchor links)
  // ---------------------------------------------------------------------------

  const initSmoothScroll = () => {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      // Skip if it's a nav link (already handled)
      if (link.classList.contains('nav-link')) return;

      const target = $(href);
      if (!target) return;

      e.preventDefault();

      const nav = $('#main-nav');
      const offset = nav ? nav.offsetHeight + 20 : 20;

      gsap.to(window, {
        scrollTo: { y: target, offsetY: offset },
        duration: 1,
        ease: 'power3.inOut',
      });
    });
  };

  // ---------------------------------------------------------------------------
  // 16. PERFORMANCE — Reduced motion handling already integrated above
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // INITIALIZATION — Orchestrate everything
  // ---------------------------------------------------------------------------

  const init = async () => {
    // Start loader, then run the rest after it completes
    await initLoader();

    // Non-dependent inits
    initCursor();
    initNavigation();
    initMagneticButtons();
    initSectionReveals();
    initAbout();
    initSkills();
    initProjects();
    initModal();
    initTimeline();
    initAchievements();
    initContactForm();
    initFooter();
    initSmoothScroll();

    // Hero animations run after loader
    initHero();
    initTypingEffect();

    // Refresh ScrollTrigger after all DOM work
    ScrollTrigger.refresh();
  };

  init();
});
