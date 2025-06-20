document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURATION
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // 2. DOM ELEMENTS INITIALIZATION
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');

    // 3. STATE VARIABLES
    let currentPage = 1;
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // 4. CORE FUNCTIONS
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
        isLoading = false;
        if (error) {
            console.error('Error fetching browse data:', error);
            loadingIndicator.innerText = 'Error loading data.';
            return;
        }
        if (data && data.length > 0) {
            renderTools(data);
            currentPage++;
        }
        if (!data || data.length < ITEMS_PER_PAGE) {
            allDataLoaded = true;
            loadingIndicator.innerText = 'All tools have been loaded.';
        } else {
            loadingIndicator.style.display = 'none';
        }
    };

    const handleSearch = async () => {
        const searchTerm = searchInput.value.trim();
        currentSearchTerm = searchTerm.toLowerCase();
        toolsGrid.innerHTML = '';
        isLoading = false;
        if (!currentSearchTerm) {
            window.location.reload(); // Cleanest way to restore pre-rendered state
            return;
        }
        allDataLoaded = true;
        loadingIndicator.innerText = 'Searching for semantically similar tools...';
        loadingIndicator.style.display = 'block';
        gtag('event', 'search', { search_term: searchTerm });
        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchTerm }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Request to worker failed');
            }
            const data = await response.json();
            renderTools(data);
            loadingIndicator.innerText = data && data.length > 0 ? `Found ${data.length} matching tools.` : 'No matching tools found.';
        } catch (error) {
            console.error('Error with semantic search:', error);
            loadingIndicator.innerText = 'Error during search. Please try again.';
        }
    };

    const modalLogicFunctions = {
        openModal: () => { feedbackModalOverlay.classList.add('active'); },
        closeModal: () => {
            feedbackModalOverlay.classList.remove('active');
            setTimeout(() => {
                document.getElementById('formStatus').textContent = '';
                document.getElementById('feedbackForm').reset();
                document.getElementById('feedbackSubmitBtn').disabled = false;
                document.getElementById('feedbackSubmitBtn').textContent = 'Submit Feedback';
            }, 300);
        },
        handleFeedbackSubmit: async (event) => {
            event.preventDefault();
            const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
            const formStatus = document.getElementById('formStatus');
            const message = document.getElementById('feedbackMessage').value.trim();
            if (!message) {
                formStatus.textContent = 'Message field cannot be empty.';
                return;
            }
            feedbackSubmitBtn.disabled = true;
            feedbackSubmitBtn.textContent = 'Submitting...';
            const { error } = await supabase.from('feedback').insert([{ 
                name: document.getElementById('feedbackName').value.trim(), 
                email: document.getElementById('feedbackEmail').value.trim(), 
                message: message 
            }]);
            if (error) {
                formStatus.textContent = 'Sorry, there was an error.';
                feedbackSubmitBtn.disabled = false;
            } else {
                formStatus.textContent = 'Thank you! Your feedback has been submitted.';
                setTimeout(modalLogicFunctions.closeModal, 2000);
            }
        }
    };
    
    // --- EVENT LISTENERS ---
    const checkAndLoadMore = async () => {
        if (isLoading || allDataLoaded || currentSearchTerm) return;
        const shouldLoad = document.documentElement.scrollHeight <= window.innerHeight;
        if (shouldLoad) {
            await loadBrowseItems();
            requestAnimationFrame(checkAndLoadMore);
        }
    };
    
    window.addEventListener('scroll', () => {
        if (!currentSearchTerm && window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadBrowseItems();
        }
    });
    
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); handleSearch(); });
    openFeedbackBtn.addEventListener('click', modalLogicFunctions.openModal);
    closeFeedbackBtn.addEventListener('click', modalLogicFunctions.closeModal);
    feedbackModalOverlay.addEventListener('click', (event) => { if (event.target === event.currentTarget) { modalLogicFunctions.closeModal(); }});
    feedbackForm.addEventListener('submit', modalLogicFunctions.handleFeedbackSubmit);
    toolsGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.tool-card');
        if (card) {
            const toolName = card.dataset.toolName;
            const toolRank = card.dataset.toolRank;
            gtag('event', 'select_content', { content_type: 'AI Tool', item_id: `rank_${toolRank}`, content_name: toolName });
        }
    });

    // --- INITIAL KICK-OFF ---
    window.onload = () => {
        checkAndLoadMore();
    };
});
