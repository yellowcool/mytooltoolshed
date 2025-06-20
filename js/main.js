document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURATION
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const SEARCH_ITEMS_PER_PAGE = 20;
    const TARGET_LANGUAGE = 'English';

    // 2. DOM ELEMENTS & INITIAL STATE
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const initialGridHTML = toolsGrid.innerHTML;

    // 3. STATE MANAGEMENT
    let isLoading = false;
    let currentSearchTerm = '';
    
    // State for Browse
    let browsePage = 1;
    let browseAllLoaded = false;
    
    // State for searching
    let searchPage = 0;
    let searchAllLoaded = false;

    // 4. CORE FUNCTIONS
    const createToolCard = (tool) => { /* This function is correct and remains unchanged */ };
    const renderTools = (tools) => {
        if (tools && tools.length > 0) {
            tools.forEach(tool => toolsGrid.appendChild(createToolCard(tool)));
        }
    };
    
    const loadBrowseItems = async () => {
        if (isLoading || browseAllLoaded) return;
        isLoading = true;
        loadingIndicator.innerText = 'Loading...';
        loadingIndicator.style.display = 'block';

        const startIndex = (browsePage * ITEMS_PER_PAGE) + (initialGridHTML ? 0 : 12);
        
        const { data, error } = await supabase.from('tools').select('*').eq('language', TARGET_LANGUAGE).order('ranking', { ascending: true }).range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
        if (error) { console.error('Error fetching browse data:', error); loadingIndicator.innerText = 'Error loading data.';} 
        else if (data) {
            renderTools(data);
            browsePage++;
            if (data.length < ITEMS_PER_PAGE) {
                browseAllLoaded = true;
                loadingIndicator.innerText = 'All tools have been loaded.';
            } else {
                loadingIndicator.style.display = 'none';
            }
        }
        isLoading = false;
    };

    const loadSearchResults = async () => {
        if (isLoading || searchAllLoaded) return;
        isLoading = true;
        loadingIndicator.innerText = searchPage === 0 ? 'Searching...' : 'Loading more results...';
        loadingIndicator.style.display = 'block';

        try {
            const { data, error } = await supabase.functions.invoke('semantic-search', {
                body: { query: currentSearchTerm, page: searchPage },
            });
            if (error) throw error;
            if (data && data.length > 0) {
                renderTools(data);
                searchPage++;
            }
            if (!data || data.length < SEARCH_ITEMS_PER_PAGE) {
                searchAllLoaded = true;
                loadingIndicator.innerText = toolsGrid.children.length > 0 ? 'All matching tools have been loaded.' : 'No matching tools found.';
            } else {
                loadingIndicator.style.display = 'none';
            }
        } catch (e) {
            console.error('Error with semantic search:', e);
            loadingIndicator.innerText = 'Error during search. Please try again.';
        }
        isLoading = false;
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        searchInput.blur();
        const searchTerm = searchInput.value.trim();

        // If search term is cleared, reset to the initial state
        if (!searchTerm) {
            currentSearchTerm = '';
            browsePage = 1; // Reset browse page counter
            browseAllLoaded = false;
            toolsGrid.innerHTML = initialGridHTML; // Restore pre-rendered content
            loadingIndicator.style.display = 'none';
            checkAndFillScreen(); // Re-check for large screens
            return;
        }
        
        // If it's a new search
        if (searchTerm !== currentSearchTerm) {
            currentSearchTerm = searchTerm;
            toolsGrid.innerHTML = '';
            searchPage = 0;
            searchAllLoaded = false;
            gtag('event', 'search', { search_term: searchTerm });
            await loadSearchResults();
        }
    };
    
    const checkAndFillScreen = async () => {
        if (currentSearchTerm || isLoading || browseAllLoaded) return;
        if (document.documentElement.scrollHeight <= window.innerHeight) {
            await loadBrowseItems();
            requestAnimationFrame(checkAndFillScreen);
        }
    };

    // 5. EVENT LISTENERS
    window.addEventListener('scroll', () => {
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200;
        if (!isAtBottom || isLoading) return;

        if (currentSearchTerm) {
            loadSearchResults();
        } else {
            loadBrowseItems();
        }
    });

    searchForm.addEventListener('submit', handleSearch);

    // Initial check for large screens
    window.onload = checkAndFillScreen;
    
    // --- Helper functions and other listeners for brevity ---
    (function(){createToolCard=t=>{const e=document.createElement("a");return e.href=t.tool_link,e.target="_blank",e.className="tool-card",e.dataset.toolName=t.tool_name,e.dataset.toolRank=t.ranking,e.innerHTML=`\n            <h3 class="tool-card__name"><span class="rank-badge">${t.ranking}</span> ${t.tool_name}\n            </h3>\n            <p class="tool-card__description">${t.description}</p>\n            <div class="tool-card__tags">${createTagsHTML(t.tags)}</div>\n        `,e};const t=document.getElementById("openFeedbackBtn"),e=document.getElementById("feedbackModalOverlay"),o=document.getElementById("closeFeedbackBtn"),n=document.getElementById("feedbackForm"),a={openModal:()=>{e.classList.add("active")},closeModal:()=>{e.classList.remove("active");setTimeout(()=>{document.getElementById("formStatus").textContent="",n.reset(),document.getElementById("feedbackSubmitBtn").disabled=!1,document.getElementById("feedbackSubmitBtn").textContent="Submit Feedback"},300)},handleFeedbackSubmit:async t=>{t.preventDefault();const e=document.getElementById("feedbackSubmitBtn"),o=document.getElementById("formStatus"),i=document.getElementById("feedbackMessage").value.trim();if(!i)return o.textContent="Message field cannot be empty.",void(o.style.color="red");e.disabled=!0,e.textContent="Submitting...",o.textContent="";const{error:s}=await supabase.from("feedback").insert([{name:document.getElementById("feedbackName").value.trim(),email:document.getElementById("feedbackEmail").value.trim(),message:i}]);s?(console.error("Error submitting feedback:",s),o.textContent="Sorry, there was an error.",o.style.color="red",e.disabled=!1):(o.textContent="Thank you! Your feedback has been submitted.",o.style.color="green",setTimeout(a.closeModal,2e3))}};t.addEventListener("click",a.openModal),o.addEventListener("click",a.closeModal),e.addEventListener("click",t=>{t.target===e&&a.closeModal()}),n.addEventListener("submit",a.handleFeedbackSubmit),toolsGrid.addEventListener("click",t=>{const e=t.target.closest(".tool-card");if(e){const o=e.dataset.toolName,n=e.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${n}`,content_name:o})}})})();
});
