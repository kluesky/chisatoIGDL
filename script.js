document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('url-input');
    const downloadBtn = document.getElementById('download-btn');
    const resultContainer = document.getElementById('result-container');
    const previewContainer = document.getElementById('preview-container');
    const downloadOptions = document.getElementById('download-options');
    const loadingElement = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Function to validate Instagram URL
    function isValidInstagramUrl(url) {
        const regex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+\/?/;
        return regex.test(url);
    }

    // Function to fetch data from FastDL.app API
    async function fetchInstagramData(url) {
        // Using a proxy to avoid CORS issues
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = `https://fastdl.app/api/instagram?url=${encodeURIComponent(url)}`;
        
        try {
            const response = await fetch(proxyUrl + apiUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            // First check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error('Invalid response from server');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch data from Instagram');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error('Failed to connect to the service. Please try again later.');
        }
    }

    // Function to display the result
    function displayResult(data) {
        // Clear previous results
        previewContainer.innerHTML = '';
        downloadOptions.innerHTML = '';
        
        // Check if data has the expected structure
        if (!data || (!data.url && !data.items)) {
            throw new Error('Invalid data received from server');
        }
        
        // Display media preview
        if (data.type === 'image') {
            const img = document.createElement('img');
            img.src = data.url;
            img.alt = 'Instagram Image';
            previewContainer.appendChild(img);
        } else if (data.type === 'video') {
            const video = document.createElement('video');
            video.src = data.url;
            video.controls = true;
            video.autoplay = true;
            video.muted = true;
            video.setAttribute('playsinline', '');
            previewContainer.appendChild(video);
        } else if (data.type === 'carousel' && data.items) {
            const carouselTitle = document.createElement('h3');
            carouselTitle.textContent = 'Carousel Content (Multiple Items)';
            carouselTitle.style.marginBottom = '1rem';
            carouselTitle.style.textAlign = 'center';
            previewContainer.appendChild(carouselTitle);
            
            if (data.items.length > 0) {
                const firstItem = data.items[0];
                if (firstItem.type === 'image') {
                    const img = document.createElement('img');
                    img.src = firstItem.url;
                    img.alt = 'Instagram Carousel Image';
                    previewContainer.appendChild(img);
                } else if (firstItem.type === 'video') {
                    const video = document.createElement('video');
                    video.src = firstItem.url;
                    video.controls = true;
                    video.autoplay = true;
                    video.muted = true;
                    video.setAttribute('playsinline', '');
                    previewContainer.appendChild(video);
                }
            }
        }
        
        // Create download buttons
        if (data.type === 'carousel' && data.items) {
            data.items.forEach((item, index) => {
                if (!item.url) return;
                
                const btn = document.createElement('button');
                btn.className = 'download-btn';
                btn.innerHTML = `<i class="fas fa-download"></i> Download ${item.type === 'image' ? 'Image' : 'Video'} ${index + 1}`;
                btn.onclick = () => downloadMedia(item.url, `${data.type}_${index + 1}`);
                downloadOptions.appendChild(btn);
            });
        } else if (data.url) {
            const btn = document.createElement('button');
            btn.className = 'download-btn';
            btn.innerHTML = `<i class="fas fa-download"></i> Download ${data.type === 'image' ? 'Image' : 'Video'}`;
            btn.onclick = () => downloadMedia(data.url, data.type);
            downloadOptions.appendChild(btn);
        }
        
        // Show the result container
        resultContainer.classList.remove('hidden');
    }

    // Function to handle media download
    function downloadMedia(url, type) {
        if (!url) {
            showError('Invalid download URL');
            return;
        }
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `instagram_${type}_${Date.now()}.${url.includes('.mp4') ? 'mp4' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Function to show error message
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    // Event listener for download button
    downloadBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        
        // Hide previous results/errors
        resultContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
        
        // Validate URL
        if (!url) {
            showError('Please enter an Instagram URL');
            return;
        }
        
        if (!isValidInstagramUrl(url)) {
            showError('Please enter a valid Instagram post/reel URL');
            return;
        }
        
        // Show loading
        loadingElement.classList.remove('hidden');
        
        try {
            // Fetch data from API
            const data = await fetchInstagramData(url);
            
            // Hide loading and display result
            loadingElement.classList.add('hidden');
            displayResult(data);
        } catch (error) {
            console.error('Error:', error);
            loadingElement.classList.add('hidden');
            showError(error.message || 'Failed to download content. Please try again.');
        }
    });

    // Event listener for Enter key
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            downloadBtn.click();
        }
    });
});