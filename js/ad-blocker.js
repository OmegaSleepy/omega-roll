async function checkAdBlocker() {
    let isBlocked = false;

    // TEST 1: Network Fetch Test (catches uBlock Origin, Adblock Plus, etc.)
    const targetUrl = 'https://googleads.g.doubleclick.net/pagead/script/f.txt';
    
    try {
        await fetch(new Request(targetUrl), { mode: 'no-cors' });
    } catch (error) {
        // If fetch fails, an ad blocker stopped it
        isBlocked = true;
    }

    // TEST 2: Visual Bait Test (backup for cosmetic-only blockers)
    if (!isBlocked) {
        const dummyAd = document.createElement('div');
        dummyAd.className = 'adsbox ads-banner advertisementpub';
        dummyAd.setAttribute('style', 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px;');
        document.body.appendChild(dummyAd);

        // Wait for cosmetic filters to process
        await new Promise(resolve => setTimeout(resolve, 100));

        isBlocked =
            dummyAd.offsetHeight === 0 ||
            window.getComputedStyle(dummyAd).display === 'none';
        
        dummyAd.remove();
    }

    // Show notice if ad blocker is detected
    if (!isBlocked) {
        document.getElementById('ad-blocker-notice').style.display = 'block';
    }
}

// Run the check after page loads
window.addEventListener('DOMContentLoaded', checkAdBlocker);
