document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURATION
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // 2. DOM ELEMENTS & INITIAL STATE
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Store the initial pre-rendered content
    const initialGridHTML = toolsGrid.innerHTML;

    // State variables
    let currentPage = 1;
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // --- 3. CORE FUNCTIONS ---

    const createTagsHTML = (tagsString) => tagsString ? tagsString.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '';

    const createToolCard = (tool) => {
        const card = document.createElement('a');
        card.href = tool.tool_link;
        card.target = '_blank';
        card.className = 'tool-card';
        card.dataset.toolName = tool.tool_name;
        card.dataset.toolRank = tool.ranking;
        card.innerHTML = `
            <h3 class="tool-card__name"><span class="rank-badge">${tool.ranking}</span> ${tool.tool_name}</h3>
            <p class="tool-card__description">${tool.description}</p>
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

        const startIndex = currentPage * ITEMS_PER_PAGE;
        const { data, error } = await supabase.from('tools').select('*').eq('language', TARGET_LANGUAGE).order('ranking', { ascending: true }).range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
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

    const handleSearch = async (event) => {
        event.preventDefault();
        searchInput.blur();
        
        const searchTerm = searchInput.value.trim();
        
        // --- NEW, SIMPLIFIED LOGIC ---
        
        if (!searchTerm) {
            // If search is cleared, restore the initial state
            currentSearchTerm = '';
            allDataLoaded = false;
            currentPage = 1;
            toolsGrid.innerHTML = initialGridHTML;
            loadingIndicator.style.display = 'none';
            checkAndFillScreen(); // Re-check if the screen needs filling
            return;
        }

        // If a new search is performed
        currentSearchTerm = searchTerm.toLowerCase();
        allDataLoaded = true; // Disable infinite scroll for search results
        toolsGrid.innerHTML = '';
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
    
    const checkAndFillScreen = async () => {
        if (isLoading || allDataLoaded || currentSearchTerm) return;
        if (document.documentElement.scrollHeight <= window.innerHeight) {
            await loadBrowseItems();
            requestAnimationFrame(checkAndFillScreen);
        }
    };

    // --- 4. EVENT LISTENERS ---
    
    searchForm.addEventListener('submit', handleSearch);
    
    window.addEventListener('scroll', () => {
        if (!currentSearchTerm && !isLoading && !allDataLoaded && (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200)) {
            loadBrowseItems();
        }
    });

    // --- 5. INITIAL KICK-OFF ---
    window.onload = checkAndFillScreen;

    // --- Other listeners and functions that don't need to be in the main scope ---
    (function(){const t=document.getElementById("openFeedbackBtn"),o=document.getElementById("feedbackModalOverlay"),e=document.getElementById("closeFeedbackBtn"),n=document.getElementById("feedbackForm");const a={openModal:()=>{o.classList.add("active")},closeModal:()=>{o.classList.remove("active");setTimeout(()=>{document.getElementById("formStatus").textContent="",n.reset(),document.getElementById("feedbackSubmitBtn").disabled=!1,document.getElementById("feedbackSubmitBtn").textContent="Submit Feedback"},300)},handleFeedbackSubmit:async t=>{t.preventDefault();const o=document.getElementById("feedbackSubmitBtn"),e=document.getElementById("formStatus"),c=document.getElementById("feedbackMessage").value.trim();if(!c)return e.textContent="Message field cannot be empty.",void(e.style.color="red");o.disabled=!0,o.textContent="Submitting...",e.textContent="";const{error:i}=await supabase.from("feedback").insert([{name:document.getElementById("feedbackName").value.trim(),email:document.getElementById("feedbackEmail").value.trim(),message:c}]);i?(console.error("Error submitting feedback:",i),e.textContent="Sorry, there was an error.",e.style.color="red",o.disabled=!1):(e.textContent="Thank you! Your feedback has been submitted.",e.style.color="green",setTimeout(a.closeModal,2e3))}};t.addEventListener("click",a.openModal),e.addEventListener("click",a.closeModal),o.addEventListener("click",t=>{t.target===o&&a.closeModal()}),n.addEventListener("submit",a.handleFeedbackSubmit),toolsGrid.addEventListener("click",t=>{const o=t.target.closest(".tool-card");if(o){const e=o.dataset.toolName,n=o.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${n}`,content_name:e})}})})();
});
