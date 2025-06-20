// Particle system
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const config = window.themeConfig || {};
    const particleCount = config.particleCount || 50;
    const particleColor = config.particleColor || '#00ff88';

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particle.style.background = particleColor;
        particlesContainer.appendChild(particle);
    }
}

// Counter animation
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const config = window.themeConfig || {};
    const duration = config.statsAnimationDuration || 2000;
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 16);
    });
}

// Intersection Observer for counter animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
});

// Mobile nav functionality
function closeMobileNav() {
    document.getElementById('mobileNav').classList.remove('open');
}
function openMobileNav() {
    document.getElementById('mobileNav').classList.add('open');
}
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    observer.observe(document.querySelector('.stats'));
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    const hamburger = document.getElementById('hamburger-menu');
    const mobileNav = document.getElementById('mobileNav');
    const closeBtn = document.getElementById('closeMobileNav');
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            openMobileNav();
        });
        hamburger.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                openMobileNav();
            }
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMobileNav();
        });
    }
    // Prevent clicks inside the sidebar from closing it
    if (mobileNav) {
        mobileNav.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    // Close mobile nav on outside click
    document.addEventListener('click', function(e) {
        if (mobileNav.classList.contains('open')) {
            closeMobileNav();
        }
    });
});
