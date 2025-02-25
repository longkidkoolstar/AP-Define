document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultDiv = document.getElementById('result');
    const wordDiv = document.getElementById('word');
    const phoneticDiv = document.getElementById('phonetic');
    const audioContainer = document.getElementById('audio-container');
    const meaningsContainer = document.getElementById('meanings-container');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const historyContainer = document.getElementById('history-container');
    
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');

    // Max search history items to store
    const MAX_HISTORY = 5;
    
    // Load search history from localStorage
    let searchHistory = JSON.parse(localStorage.getItem('apDefineHistory')) || [];
    
    // API URL for Free Dictionary API
    const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    
    // Initialize the app
    function init() {
        // Display search history
        updateHistoryDisplay();
        
        // Add animations for page load
        document.querySelector('header').classList.add('fade-in');
        document.querySelector('.search-wrapper').classList.add('fade-in');
        document.querySelector('.result-container').classList.add('fade-in');
    }
    
    // Function to fetch word data
    async function fetchWordData(word) {
        try {
            showLoading();
            
            const response = await fetch(`${API_URL}${word}`);
            
            if (!response.ok) {
                throw new Error('Word not found');
            }
            
            const data = await response.json();
            
            // Add to search history
            addToHistory(word);
            
            displayResult(data);
        } catch (error) {
            showError();
        }
    }
    
    // Function to add word to search history
    function addToHistory(word) {
        // Convert to lowercase for consistency
        word = word.toLowerCase();
        
        // Remove if already exists
        const index = searchHistory.indexOf(word);
        if (index !== -1) {
            searchHistory.splice(index, 1);
        }
        
        // Add to the beginning of the array
        searchHistory.unshift(word);
        
        // Limit history size
        if (searchHistory.length > MAX_HISTORY) {
            searchHistory.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('apDefineHistory', JSON.stringify(searchHistory));
        
        // Update display
        updateHistoryDisplay();
    }
    
    // Function to update history display
    function updateHistoryDisplay() {
        historyContainer.innerHTML = '';
        
        searchHistory.forEach(word => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = word;
            historyItem.addEventListener('click', () => {
                searchInput.value = word;
                fetchWordData(word);
            });
            historyContainer.appendChild(historyItem);
        });
    }
    
    // Function to display the search result
    function displayResult(data) {
        // Clear previous results
        wordDiv.textContent = '';
        phoneticDiv.textContent = '';
        audioContainer.innerHTML = '';
        meaningsContainer.innerHTML = '';
        
        // Get the first result
        const wordData = data[0];
        
        // Display word and phonetic
        wordDiv.textContent = wordData.word;
        
        // Check if phonetic exists
        if (wordData.phonetic) {
            phoneticDiv.textContent = wordData.phonetic;
        } else if (wordData.phonetics && wordData.phonetics.length > 0 && wordData.phonetics[0].text) {
            phoneticDiv.textContent = wordData.phonetics[0].text;
        }
        
        // Add audio if available
        const audioUrl = getAudioUrl(wordData.phonetics);
        if (audioUrl) {
            const audioButton = document.createElement('button');
            audioButton.className = 'audio-button';
            audioButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            audioButton.addEventListener('click', () => {
                playAudio(audioUrl);
                
                // Add playing animation
                audioButton.classList.add('playing');
                setTimeout(() => {
                    audioButton.classList.remove('playing');
                }, 1000);
            });
            audioContainer.appendChild(audioButton);
        }
        
        // Display meanings
        wordData.meanings.forEach(meaning => {
            const meaningDiv = document.createElement('div');
            meaningDiv.className = 'meaning';
            
            const partOfSpeech = document.createElement('h3');
            partOfSpeech.className = 'part-of-speech';
            partOfSpeech.textContent = meaning.partOfSpeech;
            meaningDiv.appendChild(partOfSpeech);
            
            const definitionsList = document.createElement('div');
            definitionsList.className = 'definitions';
            
            meaning.definitions.forEach((def, index) => {
                // Limit to first 3 definitions to keep UI clean
                if (index < 3) {
                    const definitionItem = document.createElement('div');
                    definitionItem.className = 'definition';
                    definitionItem.textContent = def.definition;
                    
                    if (def.example) {
                        const exampleEl = document.createElement('div');
                        exampleEl.className = 'example';
                        exampleEl.textContent = `"${def.example}"`;
                        definitionItem.appendChild(exampleEl);
                    }
                    
                    definitionsList.appendChild(definitionItem);
                }
            });
            
            meaningDiv.appendChild(definitionsList);
            
            // Add synonyms if available
            if (meaning.synonyms && meaning.synonyms.length > 0) {
                const synonymsDiv = document.createElement('div');
                synonymsDiv.className = 'synonyms';
                synonymsDiv.innerHTML = '<strong>Synonyms:</strong>';
                
                meaning.synonyms.slice(0, 5).forEach(synonym => {
                    const synonymSpan = document.createElement('span');
                    synonymSpan.textContent = synonym;
                    synonymSpan.addEventListener('click', () => {
                        searchInput.value = synonym;
                        fetchWordData(synonym);
                    });
                    synonymsDiv.appendChild(synonymSpan);
                });
                
                meaningDiv.appendChild(synonymsDiv);
            }
            
            // Add antonyms if available
            if (meaning.antonyms && meaning.antonyms.length > 0) {
                const antonymsDiv = document.createElement('div');
                antonymsDiv.className = 'antonyms';
                antonymsDiv.innerHTML = '<strong>Antonyms:</strong>';
                
                meaning.antonyms.slice(0, 5).forEach(antonym => {
                    const antonymSpan = document.createElement('span');
                    antonymSpan.textContent = antonym;
                    antonymSpan.addEventListener('click', () => {
                        searchInput.value = antonym;
                        fetchWordData(antonym);
                    });
                    antonymsDiv.appendChild(antonymSpan);
                });
                
                meaningDiv.appendChild(antonymsDiv);
            }
            
            meaningsContainer.appendChild(meaningDiv);
        });
        
        // Show the result and hide loading
        hideLoading();
        resultDiv.classList.remove('hidden');
        
        // Scroll to result if not visible
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Function to get audio URL from phonetics array
    function getAudioUrl(phonetics) {
        if (!phonetics || phonetics.length === 0) return null;
        
        for (const phonetic of phonetics) {
            if (phonetic.audio) return phonetic.audio;
        }
        
        return null;
    }
    
    // Function to play audio
    function playAudio(url) {
        const audio = new Audio(url);
        audio.play();
    }
    
    // Function to show loading state
    function showLoading() {
        loadingDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
    }
    
    // Function to hide loading state
    function hideLoading() {
        loadingDiv.classList.add('hidden');
    }
    
    // Function to show error
    function showError() {
        hideLoading();
        errorDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
    }
    
    // Event listeners
    searchBtn.addEventListener('click', () => {
        const word = searchInput.value.trim();
        if (word) {
            fetchWordData(word);
        }
    });
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const word = searchInput.value.trim();
            if (word) {
                fetchWordData(word);
            }
        }
    });
    
    // Add dark mode toggle
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
    }
    
    // Initialize app
    init();
    
    // Focus the input on page load
    searchInput.focus();
});