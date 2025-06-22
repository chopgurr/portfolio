// Debounce helper to limit how often a function runs (for scroll events)
function debounce(fn, delay = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Get the navbar element
const navbar = document.getElementById('navbar');

// --- Navbar scroll effect with debounce and smarter visibility ---
let lastScrollY = 0; // Initialize lastScrollY outside to persist its value
let ticking = false; // Flag to control requestAnimationFrame

function handleNavbarScroll() {
    const currentScrollY = window.scrollY;

    // Standard navbar shrinking/shadow effect
    if (currentScrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Sticky Navbar Show/Hide on Scroll Direction (more responsive)
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past initial header height
        navbar.style.transform = 'translateY(-100%)';
        navbar.style.opacity = '0'; // Add opacity for smoother disappearance
    } else {
        // Scrolling up or at the very top
        navbar.style.transform = 'translateY(0)';
        navbar.style.opacity = '1'; // Add opacity for smoother appearance
    }

    lastScrollY = currentScrollY;
    ticking = false; // Reset the flag for the next animation frame
}

// Use requestAnimationFrame for scroll events for performance
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(handleNavbarScroll);
        ticking = true;
    }
});

// Run initially in case the user loads the page already scrolled
handleNavbarScroll();

// --- Smooth scrolling for navigation links with focus management and history ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);

        if (target) {
            // Scroll smoothly
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Update URL hash without jumping the page
            if (history.pushState) {
                history.pushState(null, null, targetId);
            } else {
                window.location.hash = targetId;
            }

            // Make target focusable and focus for accessibility
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        }
    });
});

// --- IntersectionObserver for animations (refined) ---
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px' // Start animating a bit before it enters viewport fully
};

const generalObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            obs.unobserve(entry.target); // Animate only once
        }
    });
}, observerOptions);

document.querySelectorAll('.skill-category, .timeline-item, .project-card, .cert-item, .hero-subtitle, .hero-title, .hero-description, .hero-stats, .social-links, .hero-image, .section-title, .about-text').forEach(el => {
    el.classList.add('animate'); // Ensure elements have the base animate class
    generalObserver.observe(el);
});

// --- Dynamic Active Nav Link Highlighting (improved logic) ---
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const highlightObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const currentSectionId = entry.target.id;
            navLinks.forEach(link => {
                link.classList.remove('active'); // Remove active from all first
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active'); // Add active to the intersecting section's link
                }
            });
        }
    });
}, {
    rootMargin: '-30% 0px -70% 0px', // Adjust these values to control when the link becomes active
    threshold: 0 // Observe as soon as any part of the section enters the rootMargin
});

sections.forEach(section => {
    highlightObserver.observe(section);
});

// Fallback for initial load or if user lands on a specific section via URL
window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash) {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        });
        // Scroll to the hash element after a slight delay to ensure rendering
        setTimeout(() => {
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
});


// --- Lazy load images with IntersectionObserver (already great!) ---
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries, imgObs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imgObs.unobserve(img);
        }
    });
}, { rootMargin: '100px 0px' });

lazyImages.forEach(img => imageObserver.observe(img));

// --- Dark Mode Toggle with Persistence (improved toggle state) ---
// Ensure you have a button with id="darkModeToggle" in your HTML
// And a CSS class `dark-mode` on `html` or `body` that defines dark theme variables
const darkModeToggle = document.getElementById('darkModeToggle');

function setDarkMode(enabled) {
    if (enabled) {
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        if (darkModeToggle) {
            darkModeToggle.textContent = 'Light Mode'; // Update button text
            darkModeToggle.setAttribute('aria-pressed', 'true');
        }
    } else {
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        if (darkModeToggle) {
            darkModeToggle.textContent = 'Dark Mode'; // Update button text
            darkModeToggle.setAttribute('aria-pressed', 'false');
        }
    }
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark-mode');
        setDarkMode(!isDark);
    });

    // Initialize based on saved preference or system
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference === 'enabled' || (savedPreference === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
    } else {
        setDarkMode(false); // Ensure button text is correct if starting in light mode
    }
}

// --- New: Dynamic Typewriter Effect for Hero Title ---
// Add a span with data-typewriter-text to your hero title for this to work
// e.g., <h1 class="hero-title">Hi, I'm <span class="highlight" data-typewriter-text="A Developer.,A Designer.,A Creator."></span></h1>
function typewriterEffect(element, phrases, speed = 100) {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentPhrase = phrases[phraseIndex];
        let displayText = '';

        if (isDeleting) {
            displayText = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            displayText = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }

        element.textContent = displayText;

        let typeSpeed = speed;
        if (isDeleting) {
            typeSpeed /= 2; // Faster deletion
        }

        if (!isDeleting && charIndex === currentPhrase.length + 1) {
            typeSpeed = 1500; // Pause at end of typing
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // Pause at end of deletion before next phrase
        }

        setTimeout(type, typeSpeed);
    }

    type(); // Start the effect
}

const typewriterElement = document.querySelector('.hero-title .highlight[data-typewriter-text]');
if (typewriterElement) {
    const phrases = typewriterElement.dataset.typewriterText.split(',');
    typewriterEffect(typewriterElement, phrases);
}

// --- New: Scroll-to-Top Button ---
// Add a button in your HTML with id="scrollToTopBtn"
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

if (scrollToTopBtn) {
    window.addEventListener('scroll', debounce(() => {
        if (window.scrollY > 300) { // Show button after scrolling 300px
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    }, 50));

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


