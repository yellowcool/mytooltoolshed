document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // --- INITIALIZE ---
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Elements for AI Tool Display
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Elements for Modal Feedback Form
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
    const formStatus = document.getElementById('formStatus');

    let currentPage = 0;
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // --- AI TOOL DISPLAY LOGIC ---
    const createTagsHTML = (tagsString) => {
        if (!tagsString) return '';
        return tagsString.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('');
    };

    const createToolCard = (tool) => {
        const card = document.createElement('a');
        card.href = tool.tool_link;
        card.target = '_blank';
        card.className = 'tool-card';
        card.innerHTML = `
            <h3 class="tool-card__name">
                <span class="rank-badge">${tool.ranking}</span> ${tool.tool_name}
            </h3>
            <p class="tool-card__description">${tool.description}</p>
            <div class="tool-card__tags">${createTagsHTML(tool.tags)}</div>
        `;
        return card;
    };

    const loadItems = async () => {
        if (isLoading || allDataLoaded) return;
        
        isLoading = true;
        loadingIndicator.style.display = 'block';

        const startIndex = currentPage * ITEMS_PER_PAGE;
        let query = supabase
            .from('tools')
            .select('*')
            .eq('language', TARGET_LANGUAGE)
            .order('ranking', { ascending: true })
            .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
        if (currentSearchTerm) {
            const searchPattern = `%${currentSearchTerm}%`;
            query = query.or(`tool_name.ilike.${searchPattern},description.ilike.${searchPattern},tags.ilike.${searchPattern}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching data:', error);
            loadingIndicator.innerText = 'Error loading data.';
            return;
        }

        if (data && data.length > 0) {
            data.forEach(tool => {
                toolsGrid.appendChild(createToolCard(tool));
            });
            currentPage++;
        }

        if (!data || data.length < ITEMS_PER_PAGE) {
            allDataLoaded = true;
            loadingIndicator.innerText = 'All tools have been loaded.';
        } else {
            loadingIndicator.style.display = 'none';
        }

        isLoading = false;
    };

    const handleSearch = () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        currentSearchTerm = searchTerm;
        toolsGrid.innerHTML = '';
        currentPage = 0;
        allDataLoaded = false;
        loadingIndicator.innerText = 'Loading...';
        loadItems();
    };

    // --- MODAL CONTROL LOGIC ---
    const openModal = () => {
        feedbackModalOverlay.classList.add('active');
    };

    const closeModal = () => {
        feedbackModalOverlay.classList.remove('active');
        setTimeout(() => {
            formStatus.textContent = '';
            formStatus.style.color = '';
            feedbackForm.reset();
            feedbackSubmitBtn.disabled = false;
            feedbackSubmitBtn.textContent = 'Submit Feedback';
        }, 300);
    };

    const handleFeedbackSubmit = async (event) => {
        event.preventDefault();
        
        const name = document.getElementById('feedbackName').value.trim();
        const email = document.getElementById('feedbackEmail').value.trim();
        const message = document.getElementById('feedbackMessage').value.trim();

        if (!message) {
            formStatus.textContent = 'Message field cannot be empty.';
            formStatus.style.color = 'red';
            return;
        }

        feedbackSubmitBtn.disabled = true;
        feedbackSubmitBtn.textContent = 'Submitting...';
        formStatus.textContent = '';

        const { data, error } = await supabase
            .from('feedback')
            .insert([{ name: name, email: email, message: message }]);

        if (error) {
            console.error('Error submitting feedback:', error);
            formStatus.textContent = 'Sorry, there was an error. Please try again.';
            formStatus.style.color = 'red';
            feedbackSubmitBtn.disabled = false;
            feedbackSubmitBtn.textContent = 'Submit Feedback';
        } else {
            formStatus.textContent = 'Thank you! Your feedback has been submitted successfully.';
            formStatus.style.color = 'green';
            setTimeout(closeModal, 2000);
        }
    };
    
    // --- EVENT LISTENERS ---
    const handleScroll = () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadItems();
        }
    };

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            handleSearch();
        }, 500);
    });

    document.querySelector('.search-bar').addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(debounceTimer);
        handleSearch();
    });
    
    window.addEventListener('scroll', handleScroll);
    
    // Listeners for Modal
    openFeedbackBtn.addEventListener('click', openModal);
    closeFeedbackBtn.addEventListener('click', closeModal);
    feedbackModalOverlay.addEventListener('click', (event) => {
        if (event.target === feedbackModalOverlay) {
            closeModal();
        }
    });
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    // --- INITIAL LOAD ---
    loadItems();
});
