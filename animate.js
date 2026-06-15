// ========================================
// TRUSTCORE FINANCE - MAIN.JS
// Professional Animation & Interaction System
// ========================================

'use strict';

// ========================================
// 1. GLOBAL STATE & CONFIGURATION
// ========================================

const TrustCore = {
    // Animation settings
    animations: {
        duration: {
            fast: 200,
            normal: 300,
            slow: 500
        },
        easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
        reducedMotion: false
    },
    
    // UI State
    state: {
        sidebarCollapsed: false,
        currentPage: 'dashboard-home',
        modalsOpen: [],
        toastQueue: []
    },
    
    // Intersection Observer for scroll animations
    observers: {},
    
    // Animation frame ID for ticker
    tickerAnimationId: null
};

// ========================================
// 2. INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    checkReducedMotion();
    
    // Initialize all animations and interactions
    initAnimations();
    initUIInteractions();
    initScrollAnimations();
    initTickerAnimation();
    initModalSystem();
    initToastSystem();
    initProfileMenu();
    initSidebar();
    initPageNavigation();
    initChartAnimations();
    initMiscEnhancements();
    
    // Show welcome animation on first load
    showWelcomeAnimation();
    
    console.log('🚀 TrustCore Finance Dashboard Initialized');
});

// ========================================
// 3. REDUCED MOTION CHECK
// ========================================

function checkReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    TrustCore.animations.reducedMotion = prefersReducedMotion.matches;
    
    if (TrustCore.animations.reducedMotion) {
        document.body.classList.add('reduced-motion');
        console.log('⚡ Reduced motion mode enabled');
    }
    
    // Listen for changes
    prefersReducedMotion.addEventListener('change', (e) => {
        TrustCore.animations.reducedMotion = e.matches;
        document.body.classList.toggle('reduced-motion', e.matches);
    });
}

// ========================================
// 4. CORE ANIMATION UTILITIES
// ========================================

function animate(element, properties, options = {}) {
    if (TrustCore.animations.reducedMotion && !options.force) {
        return Promise.resolve();
    }
    
    const duration = options.duration || TrustCore.animations.duration.normal;
    const easing = options.easing || TrustCore.animations.easing;
    const delay = options.delay || 0;
    
    return new Promise((resolve) => {
        setTimeout(() => {
            element.style.transition = `all ${duration}ms ${easing}`;
            
            Object.keys(properties).forEach(prop => {
                element.style[prop] = properties[prop];
            });
            
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        }, delay);
    });
}

function fadeIn(element, duration = 300, delay = 0) {
    if (TrustCore.animations.reducedMotion) {
        element.style.opacity = '1';
        return Promise.resolve();
    }
    
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    return animate(element, {
        opacity: '1',
        transform: 'translateY(0)'
    }, { duration, delay });
}

function fadeOut(element, duration = 300) {
    if (TrustCore.animations.reducedMotion) {
        element.style.opacity = '0';
        return Promise.resolve();
    }
    
    return animate(element, {
        opacity: '0',
        transform: 'translateY(-10px)'
    }, { duration });
}

function slideIn(element, direction = 'right', duration = 300) {
    if (TrustCore.animations.reducedMotion) {
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
        return Promise.resolve();
    }
    
    const translateValue = direction === 'right' ? '100%' : '-100%';
    element.style.opacity = '0';
    element.style.transform = `translateX(${translateValue})`;
    
    return animate(element, {
        opacity: '1',
        transform: 'translateX(0)'
    }, { duration });
}

function countUp(element, start, end, duration = 1000) {
    if (TrustCore.animations.reducedMotion) {
        element.textContent = end.toLocaleString();
        return;
    }
    
    const startTime = performance.now();
    const range = end - start;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + range * easeProgress);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ========================================
// 5. CRYPTO TICKER ANIMATION
// ========================================

function initTickerAnimation() {
    const ticker = document.querySelector('.ticker-content');
    if (!ticker) return;
    
    // Duplicate content for seamless loop
    const tickerItems = ticker.innerHTML;
    ticker.innerHTML = tickerItems + tickerItems;
    
    let position = 0;
    let isPaused = false;
    
    function animateTicker() {
        if (!isPaused && !TrustCore.animations.reducedMotion) {
            position -= 0.5; // Scroll speed
            
            // Reset when first set scrolls completely
            if (Math.abs(position) >= ticker.scrollWidth / 2) {
                position = 0;
            }
            
            ticker.style.transform = `translateX(${position}px)`;
        }
        
        TrustCore.tickerAnimationId = requestAnimationFrame(animateTicker);
    }
    
    // Pause on hover
    ticker.addEventListener('mouseenter', () => isPaused = true);
    ticker.addEventListener('mouseleave', () => isPaused = false);
    
    // Start animation
    animateTicker();
}

// ========================================
// 6. SIDEBAR ANIMATIONS
// ========================================

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const mainContent = document.getElementById('main-content');
    const footer = document.getElementById('main-footer');
    
    if (!sidebar || !collapseBtn) return;
    
    collapseBtn.addEventListener('click', () => {
        TrustCore.state.sidebarCollapsed = !TrustCore.state.sidebarCollapsed;
        
        if (TrustCore.state.sidebarCollapsed) {
            sidebar.style.width = '80px';
            mainContent.style.marginLeft = '80px';
            if (footer) footer.style.marginLeft = '80px';
            
            // Hide text, show only icons
            document.querySelectorAll('.sidebar-text').forEach(text => {
                fadeOut(text, 200);
            });
            
            // Rotate collapse icon
            collapseBtn.querySelector('i').style.transform = 'rotate(180deg)';
        } else {
            sidebar.style.width = '280px';
            mainContent.style.marginLeft = '280px';
            if (footer) footer.style.marginLeft = '280px';
            
            // Show text
            setTimeout(() => {
                document.querySelectorAll('.sidebar-text').forEach(text => {
                    fadeIn(text, 200);
                });
            }, 200);
            
            // Rotate collapse icon back
            collapseBtn.querySelector('i').style.transform = 'rotate(0deg)';
        }
    });
    
    // Sidebar menu hover effects
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('mouseenter', function() {
            if (!TrustCore.animations.reducedMotion) {
                const icon = this.querySelector('i');
                if (icon) {
                    icon.style.transform = 'rotate(6deg) scale(1.1)';
                }
            }
        });
        
        link.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'rotate(0deg) scale(1)';
            }
        });
    });
}

// ========================================
// 7. PAGE NAVIGATION SYSTEM
// ========================================

function initPageNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-link, [href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Check if it's a page navigation link
            if (href && href.startsWith('#') && !href.includes('modal')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetSection = document.getElementById(`${targetId}-section`);
                
                if (targetSection) {
                    navigateToPage(targetId, targetSection);
                    
                    // Update active state in sidebar
                    document.querySelectorAll('.sidebar-menu-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    this.closest('.sidebar-menu-item')?.classList.add('active');
                }
            }
        });
    });
}

function navigateToPage(pageId, targetSection) {
    // Fade out current page
    const currentSection = document.querySelector('.content-section.active');
    
    if (currentSection) {
        fadeOut(currentSection, 200).then(() => {
            currentSection.classList.remove('active');
            
            // Fade in new page
            targetSection.classList.add('active');
            fadeIn(targetSection, 300);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Update page title
            updatePageTitle(pageId);
        });
    }
    
    TrustCore.state.currentPage = pageId;
}

function updatePageTitle(pageId) {
    const pageTitleElement = document.getElementById('page-title');
    if (!pageTitleElement) return;
    
    const titles = {
        'dashboard-home': 'Dashboard',
        'invest-now': 'Invest Now',
        'earnings-rewards': 'Earnings & Rewards',
        'referrals': 'Referrals',
        'transactions': 'Transaction History',
        'tasks': 'Tasks & Challenges',
        'settings': 'Settings',
        'help-support': 'Help & Support'
    };
    
    const newTitle = titles[pageId] || 'Dashboard';
    
    fadeOut(pageTitleElement, 150).then(() => {
        pageTitleElement.textContent = newTitle;
        fadeIn(pageTitleElement, 150);
    });
}

// ========================================
// 8. SCROLL ANIMATIONS
// ========================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    TrustCore.observers.scroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Add stagger delay based on index
                const index = Array.from(element.parentElement.children).indexOf(element);
                const delay = index * 80;
                
                fadeIn(element, 400, delay);
                
                // Unobserve after animation
                TrustCore.observers.scroll.unobserve(element);
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    const animatableElements = document.querySelectorAll(`
        .stat-card,
        .action-card,
        .activity-item,
        .notification-preview-item,
        .task-item,
        .help-card,
        .benefit-item
    `);
    
    animatableElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        TrustCore.observers.scroll.observe(el);
    });
}

// ========================================
// 9. CARD HOVER ANIMATIONS
// ========================================

function initAnimations() {
    // Stat card animations
    document.querySelectorAll('.stat-card, .action-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (TrustCore.animations.reducedMotion) return;
            
            const icon = this.querySelector('.stat-icon, .action-icon');
            if (icon) {
                icon.style.transform = 'rotate(12deg) scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.stat-icon, .action-icon');
            if (icon) {
                icon.style.transform = 'rotate(0deg) scale(1)';
            }
        });
    });
}

// ========================================
// 10. CHART & NUMBER ANIMATIONS
// ========================================

function initChartAnimations() {
    // Animate numbers on page load
    setTimeout(() => {
        const balanceElement = document.querySelector('.balance-amount');
        if (balanceElement) {
            const balanceText = balanceElement.textContent.replace(/[₦,]/g, '');
            const balanceValue = parseFloat(balanceText);
            if (!isNaN(balanceValue)) {
                countUp(balanceElement, 0, balanceValue, 1500);
            }
        }
        
        // Animate stat values
        document.querySelectorAll('.stat-value').forEach(stat => {
            const text = stat.textContent.replace(/[₦,]/g, '');
            const value = parseFloat(text);
            if (!isNaN(value)) {
                countUp(stat, 0, value, 1200);
            }
        });
    }, 500);
    
    // Animate progress bars
    animateProgressBars();
}

function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const targetWidth = bar.style.width || '0%';
                
                bar.style.width = '0%';
                
                setTimeout(() => {
                    bar.style.transition = 'width 1s cubic-bezier(0.2, 0.8, 0.3, 1)';
                    bar.style.width = targetWidth;
                }, 100);
                
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// ========================================
// 11. MODAL SYSTEM
// ========================================

function initModalSystem() {
    // Open modal triggers
    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            openModal(modalId);
        });
    });
    
    // Close modal buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && TrustCore.state.modalsOpen.length > 0) {
            const lastModal = TrustCore.state.modalsOpen[TrustCore.state.modalsOpen.length - 1];
            closeModal(lastModal);
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'flex';
    TrustCore.state.modalsOpen.push(modalId);
    document.body.style.overflow = 'hidden';
    
    if (TrustCore.animations.reducedMotion) {
        modal.style.opacity = '1';
        return;
    }
    
    // Animate overlay
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        animate(overlay, { opacity: '1' }, { duration: 200 });
    }
    
    // Animate container
    const container = modal.querySelector('.modal-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'scale(0.94) translateY(20px)';
        
        setTimeout(() => {
            animate(container, {
                opacity: '1',
                transform: 'scale(1) translateY(0)'
            }, { duration: 300 });
        }, 50);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const container = modal.querySelector('.modal-container');
    const overlay = modal.querySelector('.modal-overlay');
    
    if (TrustCore.animations.reducedMotion) {
        modal.style.display = 'none';
        TrustCore.state.modalsOpen = TrustCore.state.modalsOpen.filter(id => id !== modalId);
        if (TrustCore.state.modalsOpen.length === 0) {
            document.body.style.overflow = '';
        }
        return;
    }
    
    // Animate out
    if (container) {
        animate(container, {
            opacity: '0',
            transform: 'scale(0.98) translateY(-10px)'
        }, { duration: 200 });
    }
    
    if (overlay) {
        animate(overlay, { opacity: '0' }, { duration: 200 });
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
        TrustCore.state.modalsOpen = TrustCore.state.modalsOpen.filter(id => id !== modalId);
        if (TrustCore.state.modalsOpen.length === 0) {
            document.body.style.overflow = '';
        }
    }, 250);
}

// ========================================
// 12. TOAST NOTIFICATION SYSTEM
// ========================================

function initToastSystem() {
    // Auto-dismiss toasts
    document.querySelectorAll('.toast').forEach(toast => {
        setupToastBehavior(toast);
    });
}

function setupToastBehavior(toast) {
    let dismissTimer;
    
    // Auto-dismiss after 5 seconds
    dismissTimer = setTimeout(() => {
        dismissToast(toast);
    }, 5000);
    
    // Pause timer on hover
    toast.addEventListener('mouseenter', () => {
        clearTimeout(dismissTimer);
    });
    
    toast.addEventListener('mouseleave', () => {
        dismissTimer = setTimeout(() => {
            dismissToast(toast);
        }, 2000);
    });
    
    // Manual close
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(dismissTimer);
            dismissToast(toast);
        });
    }
}

function dismissToast(toast) {
    if (TrustCore.animations.reducedMotion) {
        toast.style.display = 'none';
        return;
    }
    
    animate(toast, {
        opacity: '0',
        transform: 'translateX(400px)'
    }, { duration: 300 }).then(() => {
        toast.style.display = 'none';
    });
}

function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-triangle-exclamation',
        info: 'fa-info-circle',
        error: 'fa-circle-xmark'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <h4 class="toast-title">${title}</h4>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close" aria-label="Close Toast">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Slide in animation
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(400px)';
    
    requestAnimationFrame(() => {
        animate(toast, {
            opacity: '1',
            transform: 'translateX(0)'
        }, { duration: 300 });
    });
    
    setupToastBehavior(toast);
}

// ========================================
// 13. PROFILE MENU & DROPDOWNS
// ========================================

function initProfileMenu() {
    // Notification dropdown toggle
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(notificationDropdown);
        });
    }
    
    // Profile dropdown (handled by CSS hover, but add click for mobile)
    const profileBtn = document.getElementById('user-profile-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 768) {
                toggleDropdown(profileDropdown);
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.profile-dropdown-menu, .notification-dropdown').forEach(dropdown => {
            if (dropdown.style.opacity === '1') {
                hideDropdown(dropdown);
            }
        });
    });
}

function toggleDropdown(dropdown) {
    if (dropdown.style.opacity === '1') {
        hideDropdown(dropdown);
    } else {
        showDropdown(dropdown);
    }
}

function showDropdown(dropdown) {
    dropdown.style.display = 'block';
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'translateY(-10px)';
    
    requestAnimationFrame(() => {
        animate(dropdown, {
            opacity: '1',
            transform: 'translateY(0)'
        }, { duration: 200 });
    });
}

function hideDropdown(dropdown) {
    animate(dropdown, {
        opacity: '0',
        transform: 'translateY(-10px)'
    }, { duration: 200 }).then(() => {
        dropdown.style.display = 'none';
    });
}

// ========================================
// 14. COPY TO CLIPBOARD
// ========================================

function initUIInteractions() {
    // Copy buttons
    document.querySelectorAll('.copy-btn, .copy-code-btn, .copy-link-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const textToCopy = this.previousElementSibling?.textContent || 
                              this.parentElement.querySelector('code')?.textContent || '';
            
            copyToClipboard(textToCopy, this);
        });
    });
    
    // Button click feedback
    document.querySelectorAll('.action-btn, .modal-btn, .task-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (TrustCore.animations.reducedMotion) return;
            
            // Press animation
            this.style.transform = 'scale(0.96)';
            
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // FAQ Accordion
    initFAQAccordion();
    
    // Settings tabs
    initSettingsTabs();
    
    // Theme toggle
    initThemeToggle();
    
    // Back to top button
    initBackToTop();
    
    // Form interactions
    initFormInteractions();
}

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // Success feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        button.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        
        showToast('success', 'Copied!', 'Text copied to clipboard successfully');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
        }, 2000);
    }).catch(err => {
        showToast('error', 'Error', 'Failed to copy text');
        console.error('Copy failed:', err);
    });
}

// ========================================
// 15. FAQ ACCORDION
// ========================================

function initFAQAccordion() {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const answer = faqItem.querySelector('.faq-answer');
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                    const otherAnswer = item.querySelector('.faq-answer');
                    if (otherAnswer) otherAnswer.style.maxHeight = '0';
                }
            });
            
            // Toggle current FAQ
            if (isActive) {
                faqItem.classList.remove('active');
                answer.style.maxHeight = '0';
            } else {
                faqItem.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
}

// ========================================
// 16. SETTINGS TABS
// ========================================

function initSettingsTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active from all tabs and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const targetContent = document.getElementById(`${tabName}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
                fadeIn(targetContent, 300);
            }
        });
    });
}

// ========================================
// 17. THEME TOGGLE
// ========================================

function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (!themeToggleBtn) return;
    
    let currentTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    themeToggleBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.style.transition = 'background-color 0.4s, color 0.4s';
        document.body.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        
        // Rotate icon
        const icon = themeToggleBtn.querySelector('i');
        if (icon) {
            icon.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                updateThemeIcon(currentTheme);
                icon.style.transform = 'rotate(0deg)';
            }, 200);
        }
        
        showToast('info', 'Theme Changed', `Switched to ${currentTheme} mode`);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn i');
    if (!icon) return;
    
    icon.className = theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}

// ========================================
// 18. BACK TO TOP BUTTON
// ========================================

function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            if (backToTopBtn.style.display !== 'flex') {
                backToTopBtn.style.display = 'flex';
                fadeIn(backToTopBtn, 300);
            }
        } else {
            if (backToTopBtn.style.display === 'flex') {
                fadeOut(backToTopBtn, 300).then(() => {
                    backToTopBtn.style.display = 'none';
                });
            }
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Pulse animation
        if (!TrustCore.animations.reducedMotion) {
            backToTopBtn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                backToTopBtn.style.transform = '';
            }, 200);
        }
    });
}

// ========================================
// 19. FORM INTERACTIONS
// ========================================

function initFormInteractions() {
    // Floating label effect
    document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(input => {
        // Focus effect
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
            
            if (!TrustCore.animations.reducedMotion) {
                this.style.transform = 'scale(1.01)';
            }
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            this.style.transform = '';
            
            if (this.value) {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }
        });
    });
    
    // Toggle switches
    document.querySelectorAll('.toggle-input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const label = this.nextElementSibling;
            const slider = label?.querySelector('.toggle-slider');
            
            if (slider && !TrustCore.animations.reducedMotion) {
                slider.style.transform = this.checked ? 'translateX(24px) scale(1.1)' : 'translateX(0) scale(1.1)';
                
                setTimeout(() => {
                    slider.style.transform = this.checked ? 'translateX(24px)' : 'translateX(0)';
                }, 150);
            }
        });
    });
    
    // Form submission feedback
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = this.querySelector('[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
                submitBtn.disabled = true;
                
                // Simulate processing
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    showToast('success', 'Success!', 'Your request has been processed');
                }, 2000);
            }
        });
    });
}

// ========================================
// 20. WELCOME ANIMATION
// ========================================

function showWelcomeAnimation() {
    // Check if user has seen welcome animation
    const hasSeenWelcome = sessionStorage.getItem('welcomeShown');
    
    if (!hasSeenWelcome) {
        setTimeout(() => {
            // Stagger animation for dashboard elements
            const greetingCard = document.querySelector('.greeting-card');
            const balanceCard = document.querySelector('.current-balance-card');
            const statCards = document.querySelectorAll('.stat-card');
            
            if (greetingCard) fadeIn(greetingCard, 400, 0);
            if (balanceCard) fadeIn(balanceCard, 400, 100);
            
            statCards.forEach((card, index) => {
                fadeIn(card, 400, 200 + (index * 80));
            });
            
            // Optional: Show welcome modal
            // openModal('welcome-modal');
            
            sessionStorage.setItem('welcomeShown', 'true');
        }, 300);
    }
}

// ========================================
// 21. MISCELLANEOUS ENHANCEMENTS
// ========================================

function initMiscEnhancements() {
    // Add ripple effect to buttons
    document.querySelectorAll('.action-btn, .modal-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (TrustCore.animations.reducedMotion) return;
            
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
            ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Animate notification badge
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge && !TrustCore.animations.reducedMotion) {
        setInterval(() => {
            notificationBadge.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                notificationBadge.style.animation = '';
            }, 500);
        }, 3000);
    }
    
    // Online status pulse
    const onlineStatus = document.querySelector('.online-status');
    if (onlineStatus && !TrustCore.animations.reducedMotion) {
        onlineStatus.style.animation = 'pulse 2s infinite';
    }
    
    // Add hover sound effect preparation (optional)
    document.querySelectorAll('.sidebar-link, .action-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            // Could add subtle sound effect here
            // playHoverSound();
        });
    });
    
    // Parallax effect on scroll (subtle)
    initParallaxEffect();
    
    // Loading screen fadeout
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        setTimeout(() => {
            fadeOut(loadingOverlay, 500).then(() => {
                loadingOverlay.style.display = 'none';
            });
        }, 1000);
    }
}

function initParallaxEffect() {
    if (TrustCore.animations.reducedMotion) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        // Subtle parallax on header elements
        const header = document.getElementById('main-header');
        if (header && scrolled > 0) {
            header.style.boxShadow = `0 2px ${8 + scrolled * 0.05}px rgba(0, 0, 0, ${0.04 + scrolled * 0.0001})`;
        }
    });
}

// ========================================
// 22. TRANSACTION & TABLE INTERACTIONS
// ========================================

function initTableInteractions() {
    // Highlight table rows on hover
    document.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('mouseenter', function() {
            if (!TrustCore.animations.reducedMotion) {
                this.style.transform = 'scale(1.01)';
            }
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Action button click in tables
    document.querySelectorAll('.action-icon-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = this.closest('tr');
            
            // Highlight the row briefly
            if (row) {
                row.style.background = '#F0F7FF';
                setTimeout(() => {
                    row.style.background = '';
                }, 500);
            }
            
            // Open transaction details modal or perform action
            showToast('info', 'Details', 'Transaction details would load here');
        });
    });
}

// ========================================
// 23. FILTER & SORT ANIMATIONS
// ========================================

function initFilterAnimations() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from siblings
            this.parentElement.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active to clicked
            this.classList.add('active');
            
            // Animate content refresh
            const contentArea = document.querySelector('.chart-placeholder, .reward-logs-table');
            if (contentArea && !TrustCore.animations.reducedMotion) {
                contentArea.style.opacity = '0.5';
                contentArea.style.transform = 'scale(0.98)';
                
                setTimeout(() => {
                    contentArea.style.opacity = '1';
                    contentArea.style.transform = 'scale(1)';
                }, 300);
            }
        });
    });
}

// ========================================
// 24. DRAWER MODAL SYSTEM
// ========================================

function openDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;
    
    drawer.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    if (TrustCore.animations.reducedMotion) {
        drawer.style.opacity = '1';
        return;
    }
    
    const overlay = drawer.querySelector('.drawer-overlay');
    const container = drawer.querySelector('.drawer-container');
    
    if (overlay) {
        overlay.style.opacity = '0';
        animate(overlay, { opacity: '1' }, { duration: 200 });
    }
    
    if (container) {
        container.style.transform = 'translateX(100%)';
        animate(container, { transform: 'translateX(0)' }, { duration: 300 });
    }
}

function closeDrawer(drawerId) {
    const drawer = document.getElementById(drawerId);
    if (!drawer) return;
    
    const container = drawer.querySelector('.drawer-container');
    const overlay = drawer.querySelector('.drawer-overlay');
    
    if (TrustCore.animations.reducedMotion) {
        drawer.style.display = 'none';
        document.body.style.overflow = '';
        return;
    }
    
    if (container) {
        animate(container, { transform: 'translateX(100%)' }, { duration: 300 });
    }
    
    if (overlay) {
        animate(overlay, { opacity: '0' }, { duration: 200 });
    }
    
    setTimeout(() => {
        drawer.style.display = 'none';
        document.body.style.overflow = '';
    }, 350);
}

// Initialize drawer close buttons
document.querySelectorAll('.drawer-close-btn, .drawer-overlay').forEach(el => {
    el.addEventListener('click', function() {
        const drawer = this.closest('.drawer-modal');
        if (drawer) closeDrawer(drawer.id);
    });
});

// ========================================
// 25. NOTIFICATION SYSTEM
// ========================================

function markNotificationAsRead(notificationId) {
    const notification = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (!notification) return;
    
    notification.classList.remove('unread');
    
    // Update badge count
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent);
        if (currentCount > 0) {
            badge.textContent = currentCount - 1;
            
            if (currentCount - 1 === 0) {
                fadeOut(badge, 300).then(() => {
                    badge.style.display = 'none';
                });
            }
        }
    }
}

function addNotification(title, message, type = 'info') {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    const icons = {
        success: 'fa-gift',
        info: 'fa-check-circle',
        warning: 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification-item unread';
    notification.innerHTML = `
        <i class="fa-solid ${icons[type]} notification-icon"></i>
        <div class="notification-content">
            <p class="notification-text">${message}</p>
            <small class="notification-time">Just now</small>
        </div>
    `;
    
    notificationList.insertBefore(notification, notificationList.firstChild);
    
    // Animate in
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    requestAnimationFrame(() => {
        animate(notification, {
            opacity: '1',
            transform: 'translateY(0)'
        }, { duration: 300 });
    });
    
    // Update badge
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const count = parseInt(badge.textContent || '0');
        badge.textContent = count + 1;
        badge.style.display = 'flex';
        
        // Pulse animation
        if (!TrustCore.animations.reducedMotion) {
            badge.style.animation = 'pulse 0.5s ease-in-out';
        }
    }
}

// ========================================
// 26. SEARCH FUNCTIONALITY
// ========================================

function initSearchModal() {
    const searchBtn = document.getElementById('search-btn');
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.querySelector('.search-modal-input');
    
    if (searchBtn && searchModal) {
        searchBtn.addEventListener('click', () => {
            openModal('search-modal');
            setTimeout(() => searchInput?.focus(), 100);
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            performSearch(query);
        });
    }
}

function performSearch(query) {
    const resultsContainer = document.querySelector('.search-results-list');
    const suggestionsContainer = document.querySelector('.search-suggestions');
    const resultsSection = document.querySelector('.search-results');
    
    if (!query) {
        suggestionsContainer.style.display = 'block';
        resultsSection.style.display = 'none';
        return;
    }
    
    // Show results section
    suggestionsContainer.style.display = 'none';
    resultsSection.style.display = 'block';
    
    // Simulate search (in real app, this would query backend)
    const mockResults = [
        { title: 'Dashboard Overview', url: '#dashboard-home', icon: 'fa-home' },
        { title: 'Investment Guide', url: '#invest-now', icon: 'fa-briefcase' },
        { title: 'Referral Program', url: '#referrals', icon: 'fa-users' }
    ].filter(item => item.title.toLowerCase().includes(query));
    
    resultsContainer.innerHTML = mockResults.map(result => `
        <a href="${result.url}" class="search-suggestion-item">
            <i class="fa-solid ${result.icon}"></i>
            <span>${result.title}</span>
        </a>
    `).join('');
}

// ========================================
// 27. WITHDRAWAL & INVESTMENT FLOWS
// ========================================

function initTransactionFlows() {
    // Withdrawal form validation
    const withdrawalForm = document.querySelector('#withdrawal-modal form');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amount = this.querySelector('#withdrawal-amount').value;
            const method = this.querySelector('#withdrawal-method').value;
            const securityKey = this.querySelector('#withdrawal-security-key').value;
            
            if (!amount || !method || !securityKey) {
                showToast('warning', 'Incomplete', 'Please fill all required fields');
                return;
            }
            
            // Show processing
            const submitBtn = this.querySelector('[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                closeModal('withdrawal-modal');
                showToast('success', 'Request Submitted', 'Your withdrawal request is being processed');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// ========================================
// 28. REFERRAL LINK SHARING
// ========================================

function initReferralSharing() {
    document.querySelectorAll('.share-btn, .share-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.className.includes('whatsapp') ? 'WhatsApp' :
                           this.className.includes('facebook') ? 'Facebook' :
                           this.className.includes('twitter') ? 'Twitter' :
                           this.className.includes('telegram') ? 'Telegram' :
                           this.className.includes('email') ? 'Email' : 'Social Media';
            
            showToast('info', 'Opening...', `Opening ${platform} to share your referral link`);
            
            // In real app, would open sharing dialog or redirect
        });
    });
}

// ========================================
// 29. TASK COMPLETION ANIMATIONS
// ========================================

function completeTask(taskId) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskItem) return;
    
    // Show completion animation
    const taskIcon = taskItem.querySelector('.task-icon');
    const taskBtn = taskItem.querySelector('.task-btn');
    
    if (taskBtn) {
        taskBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Completing...';
        taskBtn.disabled = true;
    }
    
    setTimeout(() => {
        // Change icon to checkmark
        if (taskIcon) {
            taskIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
            taskIcon.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        }
        
        // Update button
        if (taskBtn) {
            taskBtn.innerHTML = '<i class="fa-solid fa-check"></i> Completed';
            taskBtn.classList.remove('primary');
            taskBtn.style.background = '#D1FAE5';
            taskBtn.style.color = '#059669';
        }
        
        // Show reward earned
        showToast('success', 'Task Completed!', 'You earned ₦15 for completing this task');
        
        // Open reward modal
        setTimeout(() => {
            openModal('reward-modal');
        }, 1000);
    }, 1500);
}

// ========================================
// 30. PERFORMANCE MONITORING
// ========================================

function monitorPerformance() {
    // Log animation performance
    if (window.performance) {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('📊 Page Load Time:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
    }
    
    // FPS monitoring (optional)
    let lastTime = performance.now();
    let frames = 0;
    
    function measureFPS() {
        const currentTime = performance.now();
        frames++;
        
        if (currentTime >= lastTime + 1000) {
            const fps = Math.round((frames * 1000) / (currentTime - lastTime));
            if (fps < 30) {
                console.warn('⚠️ Low FPS detected:', fps);
            }
            frames = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
    }
    
    // measureFPS(); // Uncomment for FPS monitoring
}

// ========================================
// 31. KEYBOARD SHORTCUTS
// ========================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openModal('search-modal');
        }
        
        // Ctrl/Cmd + B for sidebar toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            document.getElementById('sidebar-collapse-btn')?.click();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="display: flex"]');
            if (openModals.length > 0) {
                closeModal(openModals[openModals.length - 1].id);
            }
        }
    });
}

// ========================================
// 32. REAL-TIME UPDATES SIMULATION
// ========================================

function simulateRealTimeUpdates() {
    // Simulate receiving a new notification every 30 seconds (for demo)
    setInterval(() => {
        const notifications = [
            { title: 'New Referral', message: 'Someone joined using your referral link!', type: 'success' },
            { title: 'Task Available', message: 'New daily task is ready to complete', type: 'info' },
            { title: 'Earning Update', message: 'You earned ₦10 from video watching', type: 'success' }
        ];
        
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        addNotification(randomNotification.title, randomNotification.message, randomNotification.type);
        showToast(randomNotification.type, randomNotification.title, randomNotification.message);
    }, 30000);
}

// ========================================
// 33. RESPONSIVE BEHAVIOR
// ========================================

function initResponsiveBehavior() {
    let resizeTimer;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const width = window.innerWidth;
            
            // Auto-collapse sidebar on mobile
            if (width <= 992 && !TrustCore.state.sidebarCollapsed) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.style.transform = 'translateX(-100%)';
            }
            
            // Adjust ticker speed on mobile
            if (width <= 768) {
                // Slower ticker on mobile
                console.log('Adjusted for mobile view');
            }
        }, 250);
    });
}

// ========================================
// 34. ERROR HANDLING
// ========================================

window.addEventListener('error', (e) => {
    console.error('Global error:', e.message);
    // Could show user-friendly error message
    // showToast('error', 'Something went wrong', 'Please refresh the page');
});

// ========================================
// 35. INITIALIZATION COMPLETE
// ========================================

// Initialize additional features after DOM load
window.addEventListener('load', () => {
    initTableInteractions();
    initFilterAnimations();
    initSearchModal();
    initTransactionFlows();
    initReferralSharing();
    initKeyboardShortcuts();
    initResponsiveBehavior();
    monitorPerformance();
    
    // Optional: Start real-time updates simulation
    // simulateRealTimeUpdates();
    
    console.log('✅ TrustCore Dashboard Fully Loaded');
});

// ========================================
// 36. EXPORT PUBLIC API
// ========================================

// Make certain functions globally accessible
window.TrustCore = {
    ...TrustCore,
    openModal,
    closeModal,
    showToast,
    completeTask,
    copyToClipboard,
    navigateToPage,
    addNotification,
    markNotificationAsRead
};

// ========================================
// 37. ADD RIPPLE ANIMATION KEYFRAME
// ========================================

// Inject ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
`;
document.head.appendChild(style);

// ========================================
// END OF MAIN.JS
// ========================================