document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const urlInput = document.getElementById('url-input');
    const downloadBtn = document.getElementById('download-btn');
    const resultSection = document.querySelector('.result-section');
    const loadingCard = document.querySelector('.loading-card');
    const resultsCard = document.querySelector('.results-card');
    const errorCard = document.querySelector('.error-card');
    const errorMessage = document.querySelector('.error-message');
    const mediaPreview = document.querySelector('.media-preview');
    const optionsGrid = document.querySelector('.options-grid');
    const retryBtn = document.querySelector('.retry-btn');

    // Event Listeners
    downloadBtn.addEventListener('click', fetchInstagramData);
    retryBtn.addEventListener('click', resetForm);

    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchInstagramData();
        }
    });

    // Animate stats counters
    animateCounters();

    // Functions
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        const speed = 200;
        
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace(/,/g, '');
            const increment = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment).toLocaleString();
                setTimeout(animateCounters, 1);
            } else {
                counter.innerText = target.toLocaleString();
            }
        });
    }

    function resetForm() {
        resultSection.classList.add('hidden');
        urlInput.value = '';
        urlInput.focus();
    }

    async function fetchInstagramData() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter an Instagram URL');
            return;
        }

        if (!isValidInstagramUrl(url)) {
            showError('Please enter a valid Instagram URL (Post, Reel, Story, or IGTV)');
            return;
        }

        // Show loading state
        resultSection.classList.remove('hidden');
        loadingCard.classList.remove('hidden');
        resultsCard.classList.add('hidden');
        errorCard.classList.add('hidden');

        try {
            // Using a proxy to avoid CORS issues
            const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://api.instantdp.com/igdl');
            
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                    'Referer': 'https://www.instantdp.com/instagram'
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error('Failed to fetch data from server');
            }

            const parsedData = JSON.parse(data.contents);

            if (parsedData.error) {
                showError(parsedData.error);
                return;
            }

            displayResults(parsedData);
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to fetch data. Please try again later or check the URL.');
        }
    }

    function isValidInstagramUrl(url) {
        const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|stories|tv)\/[a-zA-Z0-9_-]+\/?/;
        return instagramRegex.test(url);
    }

    function displayResults(data) {
        loadingCard.classList.add('hidden');
        
        // Clear previous results
        mediaPreview.innerHTML = '';
        optionsGrid.innerHTML = '';

        if (data.type === 'image') {
            // Single image
            const img = document.createElement('img');
            img.src = data.url;
            img.alt = 'Instagram Image';
            img.loading = 'lazy';
            mediaPreview.appendChild(img);
            
            createDownloadOption(data.url, 'HD Image', 'image');
        } else if (data.type === 'video') {
            // Single video
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-container';
            
            const video = document.createElement('video');
            video.src = data.url;
            video.controls = true;
            video.autoplay = false;
            video.muted = true;
            video.loading = 'lazy';
            
            const source = document.createElement('source');
            source.src = data.url;
            source.type = 'video/mp4';
            video.appendChild(source);
            
            videoContainer.appendChild(video);
            mediaPreview.appendChild(videoContainer);
            
            createDownloadOption(data.url, 'HD Video', 'video');
            createDownloadOption(data.url, 'Audio Only', 'audio');
        } else if (data.type === 'carousel') {
            // Carousel (multiple media)
            data.media.forEach((media, index) => {
                const mediaContainer = document.createElement('div');
                mediaContainer.className = 'carousel-item';
                
                if (media.type === 'image') {
                    const img = document.createElement('img');
                    img.src = media.url;
                    img.alt = `Instagram Image ${index + 1}`;
                    img.loading = 'lazy';
                    mediaContainer.appendChild(img);
                    createDownloadOption(media.url, `Image ${index + 1}`, 'image');
                } else {
                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container';
                    
                    const video = document.createElement('video');
                    video.src = media.url;
                    video.controls = true;
                    video.autoplay = false;
                    video.muted = true;
                    video.loading = 'lazy';
                    
                    const source = document.createElement('source');
                    source.src = media.url;
                    source.type = 'video/mp4';
                    video.appendChild(source);
                    
                    videoContainer.appendChild(video);
                    mediaContainer.appendChild(videoContainer);
                    createDownloadOption(media.url, `Video ${index + 1}`, 'video');
                    createDownloadOption(media.url, `Audio ${index + 1}`, 'audio');
                }
                
                mediaPreview.appendChild(mediaContainer);
            });
        }

        resultsCard.classList.remove('hidden');
    }

    function createDownloadOption(url, text, type) {
        const a = document.createElement('a');
        a.href = url;
        a.className = 'download-option';
        a.setAttribute('download', '');
        a.target = '_blank';
        
        const icon = document.createElement('i');
        icon.className = type === 'image' ? 'fas fa-image' : 
                         type === 'video' ? 'fas fa-video' : 'fas fa-music';
        
        const span = document.createElement('span');
        span.textContent = text;
        
        a.appendChild(icon);
        a.appendChild(document.createElement('br'));
        a.appendChild(span);
        
        optionsGrid.appendChild(a);
    }

    function showError(message) {
        loadingCard.classList.add('hidden');
        resultsCard.classList.add('hidden');
        errorCard.classList.remove('hidden');
        errorMessage.textContent = message;
    }
});