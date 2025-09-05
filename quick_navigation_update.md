
# QUICK NAVIGATION UPDATE SCRIPT

## Apply This Navigation to All Pages:

### 1. Replace <header> section with:

<header>
    <nav class="container">
        <div class="logo">Smart Prompt Solutions</div>
        <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/features">Features</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li class="dropdown">
                <a href="/resources" class="dropdown-toggle">Resources</a>
                <ul class="dropdown-menu">
                    <li><a href="/case-studies">Case Studies</a></li>
                    <li><a href="/faq">FAQ</a></li>
                    <li><a href="/blog">Blog</a></li>
                    <li><a href="/documentation">Documentation</a></li>
                </ul>
            </li>
            <li><a href="/free-trial" class="cta-nav">Try Free</a></li>
            <li><a href="/contact">Contact</a></li>
        </ul>
        <div class="mobile-menu-toggle">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </nav>
</header>

### 2. Add JavaScript before </body>:

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuToggle && navLinks) {
            mobileMenuToggle.addEventListener('click', function() {
                navLinks.classList.toggle('active');

                const spans = mobileMenuToggle.querySelectorAll('span');
                spans.forEach((span, index) => {
                    if (navLinks.classList.contains('active')) {
                        if (index === 0) span.style.transform = 'rotate(45deg) translate(9px, 9px)';
                        if (index === 1) span.style.opacity = '0';
                        if (index === 2) span.style.transform = 'rotate(-45deg) translate(9px, -9px)';
                    } else {
                        span.style.transform = 'none';
                        span.style.opacity = '1';
                    }
                });
            });

            const navLinksItems = document.querySelectorAll('.nav-links a');
            navLinksItems.forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    const spans = mobileMenuToggle.querySelectorAll('span');
                    spans.forEach(span => {
                        span.style.transform = 'none';
                        span.style.opacity = '1';
                    });
                });
            });
        }
    });
</script>

### 3. Pages to Update:
- free-trial.html
- faq.html  
- case-studies.html
- terms-of-service.html
- privacy-policy.html
- Your main website pages

Done! Your navigation will now be consistent and conversion-optimized across all pages.
