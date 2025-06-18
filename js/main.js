document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // --- INITIALIZE ---
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Get all DOM elements
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
    const formStatus = document.getElementById('formStatus');

    // --- STATE VARIABLES ---
    let currentPage = 0;
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // --- UI & DATA FUNCTIONS ---
    const createTagsHTML = (tagsString) => {
        if (!tagsString) return '';
        return tagsString.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('');
    };

    const createToolCard = (tool) => {
        const card = document.createElement('a');
        card.href = tool.tool_link;
        card.target = '_blank';
        card.className = 'tool-card';
        card.dataset.toolName = tool.tool_name;
        card.dataset.toolRank = tool.ranking;
        card.innerHTML = `
            <h3 class="tool-card__name">
                <span class="rank-badge">${tool.ranking}</span> ${tool.tool_name}
            </h3>
            <p class="tool-card__description">${tool.description}</p>
            <div class="tool-card__tags">${createTagsHTML(tool.tags)}</div>
        `;
        return card;
    };

    const renderTools = (tools) => {
        if (tools && tools.length > 0) {
            tools.forEach(tool => {
                toolsGrid.appendChild(createToolCard(tool));
            });
        }
    };

    // This function loads tools for Browse and infinite scroll
    const loadBrowseItems = async () => {
        if (isLoading || allDataLoaded) return;
        
        isLoading = true;
        loadingIndicator.innerText = 'Loading...';
        loadingIndicator.style.display = 'block';

        const startIndex = currentPage * ITEMS_PER_PAGE;
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .eq('language', TARGET_LANGUAGE)
            .order('ranking', { ascending: true })
            .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
        if (error) {
            console.error('Error fetching data:', error);
            loadingIndicator.innerText = 'Error loading data.';
            isLoading = false;
            return;
        }

        renderTools(data);
        currentPage++;

        if (!data || data.length < ITEMS_PER_PAGE) {
            allDataLoaded = true;
            loadingIndicator.innerText = 'All tools have been loaded.';
        } else {
            loadingIndicator.style.display = 'none';
        }

        isLoading = false;
    };

    // This function handles the new semantic search
    const handleSearch = async () => {
        const searchTerm = searchInput.value.trim();
        currentSearchTerm = searchTerm;

        // Clear the grid and reset state for any new search action
        toolsGrid.innerHTML = '';
        allDataLoaded = true; // Disable infinite scroll during search

        // If search box is empty, reset to browse mode
        if (!searchTerm) {
            currentPage = 0;
            loadingIndicator.style.display = 'none';
            loadBrowseItems();
            return;
        }

        // --- SEMANTIC SEARCH LOGIC ---
        isLoading = true;
        loadingIndicator.innerText = 'Searching for semantically similar tools...';
        loadingIndicator.style.display = 'block';

        gtag('event', 'search', { search_term: searchTerm });

        try {
            const { data, error } = await supabase.functions.invoke('semantic-search', {
                body: { query: searchTerm },
            });

            if (error) throw error;
            
            renderTools(data);
            loadingIndicator.innerText = data && data.length > 0 ? `Found ${data.length} matching tools.` : 'No matching tools found.';

        } catch (error) {
            console.error('Error with semantic search:', error);
            loadingIndicator.innerText = 'Error during search. Please try again.';
        }

        isLoading = false;
    };

    // --- MODAL CONTROL & FEEDBACK SUBMISSION LOGIC ---
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
            .insert([{ name, email, message }]);

        if (error) {
            console.error('Error submitting feedback:', error);
            formStatus.textContent = 'Sorry, there was an error. Please try again.';
            formStatus.style.color = 'red';
            feedbackSubmitBtn.disabled = false;
        } else {
            formStatus.textContent = 'Thank you! Your feedback has been submitted successfully.';
            formStatus.style.color = 'green';
            setTimeout(closeModal, 2000);
        }
    };
    
    // --- EVENT LISTENERS ---
    const handleScroll = () => {
        // Only trigger infinite scroll if not in a search context
        if (!currentSearchTerm && window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadBrowseItems();
        }
    };
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSearch();
    });
    
    window.addEventListener('scroll', handleScroll);
    
    openFeedbackBtn.addEventListener('click', openModal);
    closeFeedbackBtn.addEventListener('click', closeModal);
    feedbackModalOverlay.addEventListener('click', (event) => {
        if (event.target === feedbackModalOverlay) {
            closeModal();
        }
    });
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    toolsGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.tool-card');
        if (card) {
            const toolName = card.dataset.toolName;
            const toolRank = card.dataset.toolRank;
            
            gtag('event', 'select_content', {
                content_type: 'AI Tool',
                item_id: `rank_${toolRank}`,
                content_name: toolName
            });
        }
    });

    // --- INITIAL LOAD ---
    loadBrowseItems();
});
