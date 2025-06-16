document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const ITEMS_PER_PAGE = 12;
    // Set the language for the data you want to display.
    // Change to 'English' when you have English data in Supabase.
    const TARGET_LANGUAGE = 'English';

    // --- INITIALIZE ---
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
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
            .eq('language', TARGET_LANGUAGE) // Fetch data for the target language
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
        
        // No need to check if search term is the same, just re-run.
        currentSearchTerm = searchTerm;
        toolsGrid.innerHTML = '';
        currentPage = 0;
        allDataLoaded = false;
        loadingIndicator.innerText = 'Loading...';
        loadItems();
    };

    // --- EVENT LISTENERS ---
    const handleScroll = () => {
        // Load more when user is 200px from the bottom
        if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadItems();
        }
    };

    // Use 'debounce' to prevent search from firing on every single keystroke
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            handleSearch();
        }, 500); // Wait for 500ms of no typing before searching
    });

    document.querySelector('.search-bar').addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(debounceTimer);
        handleSearch();
    });
    
    window.addEventListener('scroll', handleScroll);

    // --- INITIAL LOAD ---
    loadItems();
});
