document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURATION
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const SEARCH_ITEMS_PER_PAGE = 20;
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
    let browseCurrentPage = 1;
    let searchCurrentPage = 0;
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    const initialGridHTML = toolsGrid.innerHTML;

    // 4. CORE FUNCTIONS
    const createTagsHTML = (tagsString) => tagsString ? tagsString.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '';

    const createToolCard = (tool) => {
        const card = document.createElement('a');
        card.href = tool.tool_link;
        card.target = '_blank';
        card.className = 'tool-card';
        card.dataset.toolName = tool.tool_name;
        card.dataset.toolRank = tool.ranking;
        card.innerHTML = `
            <h3 class="tool-card__name"><span class="rank-badge">${tool.ranking}</span> <span class="math-inline">\{tool\.tool\_name\}</h3\>
<p class\="tool\-card\_\_description"\></span>{tool.description}</p>
            <div class="tool-card__tags">${createTagsHTML(tool.tags)}</div>`;
        return card;
    };
    
    const renderTools = (tools) => {
        if (tools && tools.length > 0) {
            tools.forEach(tool => toolsGrid.appendChild(createToolCard(tool)));
        }
    };
    
    const loadBrowseItems = async () => {
        if (isLoading || allDataLoaded) return;
        isLoading = true;
        loadingIndicator.innerText = 'Loading...';
        loadingIndicator.style.display = 'block';
        const startIndex = browseCurrentPage * ITEMS_PER_PAGE;
        const { data, error } = await supabase.from('tools').select('*').eq('language', TARGET_LANGUAGE).order('ranking', { ascending: true }).range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        isLoading = false;
        if (error) {
            console.error('Error fetching browse data:', error);
            loadingIndicator.innerText = 'Error loading data.';
            return;
        }
        if (data && data.length > 0) {
            renderTools(data);
            browseCurrentPage++;
        }
        if (!data || data.length < ITEMS_PER_PAGE) {
            allDataLoaded = true;
            loadingIndicator.innerText = 'All tools have been loaded.';
        } else {
            loadingIndicator.style.display = 'none';
        }
    };

    const loadMoreSearchResults = async () => {
        if (isLoading || allDataLoaded) return;
        isLoading = true;
        loadingIndicator.innerText = 'Loading more results...';
        loadingIndicator.style.display = 'block';
        try {
            const { data, error } = await supabase.functions.invoke('semantic-search', {
                body: { query: currentSearchTerm, page: searchCurrentPage },
            });
            if (error) throw error;
            if (data && data.length > 0) {
                renderTools(data);
                searchCurrentPage++;
            }
            if (!data || data.length < SEARCH_ITEMS_PER_PAGE) {
                allDataLoaded = true;
                loadingIndicator.innerText = 'All matching tools have been loaded.';
            } else {
                loadingIndicator.style.display = 'none';
            }
        } catch (e) {
            console.error('Error fetching more search results:', e);
            loadingIndicator.innerText = 'Error loading more results.';
        }
        isLoading = false;
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        searchInput.blur();
        
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm === currentSearchTerm) return;

        toolsGrid.innerHTML = '';
        isLoading = false;
        currentSearchTerm = searchTerm;

        if (!currentSearchTerm) {
            // Restore initial state if search is cleared
            allDataLoaded = false;
            browseCurrentPage = 1;
            toolsGrid.innerHTML = initialGridHTML;
            loadingIndicator.style.display = 'none';
            checkAndFillScreen();
            return;
        }
        
        // Reset state for a NEW search
        searchCurrentPage = 0;
        allDataLoaded = false; // <<< THE CRITICAL FIX IS HERE
        
        gtag('event', 'search', { search_
