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
            const target = +counter.getAttribute('data-target').replace(/,/g, '');
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
        
        // Clear previous results and errors
        resultSection.classList.remove('hidden');
        loadingCard.classList.remove('hidden');
        resultsCard.classList.add('hidden');
        errorCard.classList.add('hidden');
        mediaPreview.innerHTML = '';
        optionsGrid.innerHTML = '';

        if (!url) {
            showError('Please enter an Instagram URL');
            return;
        }

        if (!isValidInstagramUrl(url)) {
            showError('Please enter a valid Instagram URL\n\nExamples:\n- Posts: https://www.instagram.com/p/ABC123/\n- Reels: https://www.instagram.com/reel/XYZ456/\n- Stories: https://www.instagram.com/stories/username/123456789/');
            return;
        }

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

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Check if the API returned an error
            if (data.contents.includes('error')) {
                const errorData = JSON.parse(data.contents);
                throw new Error(errorData.error || 'Instagram returned an error');
            }

            const parsedData = JSON.parse(data.contents);

            if (parsedData.error) {
                throw new Error(parsedData.error);
            }

            displayResults(parsedData);
        } catch (error) {
            console.error('Download Error:', error);
            
            let userMessage = 'Failed to download content. ';
            
            if (error.message.includes('Network')) {
                userMessage += 'Please check your internet connection.';
            } else if (error.message.includes('Instagram')) {
                userMessage += 'Instagram may be blocking this request.';
            } else {
                userMessage += 'Please try again later.';
            }
            
            showError(userMessage);
        }
    }

    function isValidInstagramUrl(url) {
        // More comprehensive Instagram URL validation
        const instagramRegex = /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels\/|stories|story|tv)\/([^\/?#&]+)\/?/i;
        return instagramRegex.test(url);
    }

    function displayResults(data) {
        loadingCard.classList.add('hidden');
        
        // Clear previous results
        mediaPreview.innerHTML = '';
        optionsGrid.innerHTML = '';

        if (!data || (!data.url && !data.media)) {
            showError('No downloadable content found in this URL');
            return;
        }

        if (data.type === 'image' && data.url) {
            // Single image
            const img = document.createElement('img');
            img.src = data.url;
            img.alt = 'Instagram Image';
            img.loading = 'lazy';
            img.onerror = () => showError('Failed to load image');
            mediaPreview.appendChild(img);
            
            createDownloadOption(data.url, 'HD Image', 'image', 'highest-quality');
        } 
        else if (data.type === 'video' && data.url) {
            // Single video
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-container';
            
            const video = document.createElement('video');
            video.src = data.url;
            video.controls = true;
            video.autoplay = false;
            video.muted = true;
            video.loading = 'lazy';
            video.onerror = () => showError('Failed to load video');
            
            const source = document.createElement('source');
            source.src = data.url;
            source.type = 'video/mp4';
            video.appendChild(source);
            
            videoContainer.appendChild(video);
            mediaPreview.appendChild(videoContainer);
            
            createDownloadOption(data.url, 'HD Video', 'video', 'highest-quality');
            if (data.audio_url) {
                createDownloadOption(data.audio_url, 'Audio Only', 'audio', 'audio-track');
            }
        } 
        else if (data.type === 'carousel' && data.media) {
            // Carousel (multiple media)
            data.media.forEach((media, index) => {
                const mediaContainer = document.createElement('div');
                mediaContainer.className = 'carousel-item';
                
                if (media.type === 'image') {
                    const img = document.createElement('img');
                    img.src = media.url;
                    img.alt = `Instagram Image ${index + 1}`;
                    img.loading = 'lazy';
                    img.onerror = () => showError(`Failed to load image ${index + 1}`);
                    mediaContainer.appendChild(img);
                    createDownloadOption(media.url, `Image ${index + 1}`, 'image', `image-${index}`);
                } 
                else if (media.type === 'video') {
                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container';
                    
                    const video = document.createElement('video');
                    video.src = media.url;
                    video.controls = true;
                    video.autoplay = false;
                    video.muted = true;
                    video.loading = 'lazy';
                    video.onerror = () => showError(`Failed to load video ${index + 1}`);
                    
                    const source = document.createElement('source');
                    source.src = media.url;
                    source.type = 'video/mp4';
                    video.appendChild(source);
                    
                    videoContainer.appendChild(video);
                    mediaContainer.appendChild(videoContainer);
                    createDownloadOption(media.url, `Video ${index + 1}`, 'video', `video-${index}`);
                    if (media.audio_url) {
                        createDownloadOption(media.audio_url, `Audio ${index + 1}`, 'audio', `audio-${index}`);
                    }
                }
                
                mediaPreview.appendChild(mediaContainer);
            });
        } 
        else {
            showError('Unsupported content type or invalid response from server');
            return;
        }

        resultsCard.classList.remove('hidden');
    }

    function createDownloadOption(url, text, type, id) {
        const a = document.createElement('a');
        a.href = url;
        a.className = 'download-option';
        a.id = id;
        a.setAttribute('download', '');
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        
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
        errorMessage.innerHTML = message.replace(/\n/g, '<br>');
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            if (!errorCard.classList.contains('hidden')) {
                errorCard.classList.add('hidden');
            }
        }, 5000);
    }
});