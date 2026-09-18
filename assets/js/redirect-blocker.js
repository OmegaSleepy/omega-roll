/**
 * Redirect Blocker - Prevents unauthorized redirects to external sites
 * Only allows redirects to myanimelist.net and Tenrai API
 */

window.siteRoot = /github\.io/i.test(window.location.hostname) ? '/omega-roll' : '';
window.resolveSitePath = (path) => `${window.siteRoot}${path.startsWith('/') ? path : '/' + path}`;

const ALLOWED_DOMAINS = [
  'myanimelist.net',
  'www.myanimelist.net',
  'api.tenrai.org',
  'tenrai.org',
  'api.jikan.moe',
  'jikan.moe'
];

const BLOCKED_DOMAINS = [
  'gambling',
  'casino',
  'bet',
  'poker',
  'slots',
  'blackjack',
  'roulette',
  'sports-bet'
];

/**
 * Check if a URL is safe to redirect to
 * @param {string} url - The URL to check
 * @returns {boolean} - True if safe, false if blocked
 */
function isSafeRedirect(url) {
  if (!url) return false;
  
  // Allow relative URLs and internal navigation
  if (url.startsWith('/') || url.startsWith('#') || url === window.resolveSitePath('/index.html') || 
      url.startsWith(window.resolveSitePath('/index.html')) || url.startsWith(window.resolveSitePath('/pages/anime.html')) || 
      url.startsWith(window.resolveSitePath('/pages/explore.html')) || url.startsWith(window.resolveSitePath('/pages/genres.html')) ||
      url.startsWith(window.resolveSitePath('/pages/search.html')) || url.startsWith(window.resolveSitePath('/pages/watch-later.html')) ||
      url.startsWith(window.resolveSitePath('/pages/watch.html')) || url.startsWith(window.resolveSitePath('/pages/about.html'))) {
    return true;
  }
  
  // Check for javascript: protocol
  if (url.startsWith('javascript:')) {
    console.warn('🚫 Blocked JavaScript protocol redirect:', url);
    return false;
  }
  
  // Check for data: protocol
  if (url.startsWith('data:')) {
    console.warn('🚫 Blocked data protocol redirect:', url);
    return false;
  }
  
  try {
    const urlObj = new URL(url, window.location.href);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Allow same-origin navigation
    if (hostname === window.location.hostname) {
      return true;
    }
    
    // Check if domain is in allowed list
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    if (isAllowed) {
      console.log('✅ Allowed redirect to:', hostname);
      return true;
    }
    
    // Check if domain contains blocked keywords
    const isBlocked = BLOCKED_DOMAINS.some(keyword => 
      hostname.toLowerCase().includes(keyword)
    );
    
    if (isBlocked) {
      console.warn('🚫 Blocked redirect to gambling/casino domain:', hostname);
      return false;
    }
    
    // Block any external domain not explicitly allowed
    console.warn('🚫 Blocked redirect to unauthorized external domain:', hostname);
    return false;
    
  } catch (error) {
    console.error('Error parsing URL:', url, error);
    return false;
  }
}

/**
 * Override window.open to prevent popup redirects
 */
const originalOpen = window.open;
window.open = function(url, target, features) {
  if (!isSafeRedirect(url)) {
    console.warn('🚫 Blocked window.open redirect attempt:', url);
    return null;
  }
  return originalOpen.call(window, url, target, features);
};

/**
 * Monitor all anchor tag clicks
 */
document.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  
  const href = link.getAttribute('href');
  if (!isSafeRedirect(href)) {
    event.preventDefault();
    event.stopPropagation();
    console.warn('🚫 Blocked anchor redirect:', href);
    alert('⚠️ This link has been blocked for security reasons.');
    return false;
  }
}, true);

/**
 * Monitor all form submissions to prevent redirect forms
 */
document.addEventListener('submit', (event) => {
  const form = event.target;
  const action = form.getAttribute('action');
  
  if (action && !isSafeRedirect(action)) {
    event.preventDefault();
    console.warn('🚫 Blocked form submission to:', action);
    alert('⚠️ This form submission has been blocked for security reasons.');
    return false;
  }
}, true);

/**
 * Intercept fetch requests to prevent redirect chains
 */
const originalFetch = window.fetch;
window.fetch = function(resource, config) {
  const url = typeof resource === 'string' ? resource : resource.url;
  
  if (!isSafeRedirect(url)) {
    console.warn('🚫 Blocked fetch request to:', url);
    return Promise.reject(new Error('Fetch request blocked for security reasons'));
  }
  
  return originalFetch.apply(this, arguments);
};

/**
 * Monitor XMLHttpRequest (AJAX) calls
 */
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
  if (!isSafeRedirect(url)) {
    console.warn('🚫 Blocked XMLHttpRequest to:', url);
    throw new Error('XMLHttpRequest blocked for security reasons');
  }
  return originalXHROpen.apply(this, arguments);
};

/**
 * Wrap `location.assign` and `location.replace` to block unsafe navigations.
 * Note: browsers do not allow redefining the `window.location` property itself
 * (it's non-configurable), so we avoid attempting that to prevent runtime errors.
 */
try {
  if (typeof window.location.replace === 'function') {
    const origReplace = window.location.replace.bind(window.location);
    window.location.replace = function(url) {
      if (!isSafeRedirect(url)) {
        console.warn('🚫 Blocked location.replace to:', url);
        return;
      }
      return origReplace(url);
    };
  }
  if (typeof window.location.assign === 'function') {
    const origAssign = window.location.assign.bind(window.location);
    window.location.assign = function(url) {
      if (!isSafeRedirect(url)) {
        console.warn('🚫 Blocked location.assign to:', url);
        return;
      }
      return origAssign(url);
    };
  }
} catch (e) {
  console.warn('Redirect blocker: could not wrap location methods safely:', e);
}

// Note: direct assignment like `window.location = url` or `window.location.href = url`
// cannot be intercepted in all browsers since `window.location` is non-configurable.
// The script blocks most common redirect vectors (links, forms, window.open, fetch, XHR,
// and the assign/replace methods). If a page uses direct assignment, it will not be
// prevented by this script.

console.log('🛡️ Redirect blocker initialized - Allowed: myanimelist.net, Tenrai API');
