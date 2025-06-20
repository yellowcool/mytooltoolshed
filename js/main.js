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
    let allDataLoaded = { browse: false, search: false };
    let currentSearchTerm = '';
    
    const initialGridHTML = toolsGrid.innerHTML;

    // 4. CORE FUNCTIONS
    const renderTools = (tools) => {
        if (tools && tools.length > 0) {
            tools.forEach(tool => toolsGrid.appendChild(createToolCard(tool)));
        }
    };
    
    const loadBrowseItems = async () => {
        if (isLoading || allDataLoaded.browse) return;
        isLoading = true;
        loadingIndicator.innerText = 'Loading...';
        loadingIndicator.style.display = 'block';

        const startIndex = (browseCurrentPage - 1) * ITEMS_PER_PAGE + 12;
        
        const { data, error } = await supabase.from('tools').select('*').eq('language', TARGET_LANGUAGE).order('ranking', { ascending: true }).range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
        if (error) { console.error('Error fetching browse data:', error); loadingIndicator.innerText = 'Error loading data.'; }
        else if (data) {
            renderTools(data);
            browseCurrentPage++;
            if (data.length < ITEMS_PER_PAGE) {
                allDataLoaded.browse = true;
                loadingIndicator.innerText = 'All tools have been loaded.';
            } else {
                loadingIndicator.style.display = 'none';
            }
        }
        isLoading = false;
    };

    const loadSearchResults = async () => {
        if (isLoading || allDataLoaded.search) return;
        isLoading = true;
        loadingIndicator.innerText = searchPage === 0 ? 'Searching...' : 'Loading more results...';
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
                allDataLoaded.search = true;
                loadingIndicator.innerText = toolsGrid.children.length > 0 ? 'All matching tools have been loaded.' : 'No matching tools found.';
            } else {
                loadingIndicator.style.display = 'none';
            }
        } catch (e) {
            console.error('Error fetching search results:', e);
            loadingIndicator.innerText = 'Error during search.';
        }
        isLoading = false;
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        searchInput.blur();
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            currentSearchTerm = '';
            browsePage = 1;
            allDataLoaded.browse = false;
            toolsGrid.innerHTML = initialGridHTML;
            loadingIndicator.style.display = 'none';
            await checkAndFillScreen();
            return;
        }
        
        if (searchTerm.toLowerCase() === currentSearchTerm) return;

        currentSearchTerm = searchTerm.toLowerCase();
        toolsGrid.innerHTML = '';
        searchPage = 0;
        allDataLoaded.search = false;
        gtag('event', 'search', { search_term: searchTerm });
        await loadSearchResults();
    };
    
    const checkAndFillScreen = async () => {
        if (currentSearchTerm) return;
        while (!isLoading && !allDataLoaded.browse && document.documentElement.scrollHeight <= window.innerHeight) {
            await loadBrowseItems();
        }
    };
    
    // 5. EVENT LISTENERS
    const handleScroll = () => {
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200;
        if (!isAtBottom || isLoading) return;
        if (currentSearchTerm) {
            loadSearchResults();
        } else {
            loadBrowseItems();
        }
    };
    
    searchForm.addEventListener('submit', handleSearch);
    window.addEventListener('scroll', handleScroll);

    // --- All other functions and listeners (modal, GA clicks) are unchanged and included here ---
    (function(){createToolCard=t=>{const e=document.createElement("a");return e.href=t.tool_link,e.target="_blank",e.className="tool-card",e.dataset.toolName=t.tool_name,e.dataset.toolRank=t.ranking,e.innerHTML=`\n            <h3 class="tool-card__name"><span class="rank-badge">${t.ranking}</span> ${t.tool_name}\n            </h3>\n            <p class="tool-card__description">${t.description}</p>\n            <div class="tool-card__tags">${createTagsHTML(t.tags)}</div>\n        `,e};const t=()=>{const t=document.getElementById("feedbackModalOverlay"),e=document.getElementById("closeFeedbackBtn"),o=document.getElementById("feedbackForm");const n={openModal:()=>{t.classList.add("active")},closeModal:()=>{t.classList.remove("active");setTimeout(()=>{document.getElementById("formStatus").textContent="",o.reset(),document.getElementById("feedbackSubmitBtn").disabled=!1,document.getElementById("feedbackSubmitBtn").textContent="Submit Feedback"},300)},handleFeedbackSubmit:async t=>{t.preventDefault();const e=document.getElementById("feedbackSubmitBtn"),n=document.getElementById("formStatus"),a=document.getElementById("feedbackMessage").value.trim();if(!a)return n.textContent="Message field cannot be empty.",void(n.style.color="red");e.disabled=!0,e.textContent="Submitting...",n.textContent="";const{error:i}=await supabase.from("feedback").insert([{name:document.getElementById("feedbackName").value.trim(),email:document.getElementById("feedbackEmail").value.trim(),message:a}]);i?(console.error("Error submitting feedback:",i),n.textContent="Sorry, there was an error.",n.style.color="red",e.disabled=!1):(n.textContent="Thank you! Your feedback has been submitted.",n.style.color="green",setTimeout(n.closeModal,2e3))}};document.getElementById("openFeedbackBtn").addEventListener("click",n.openModal),e.addEventListener("click",n.closeModal),t.addEventListener("click",e=>{e.target===t&&n.closeModal()}),o.addEventListener("submit",n.handleFeedbackSubmit),toolsGrid.addEventListener("click",t=>{const e=t.target.closest(".tool-card");if(e){const o=e.dataset.toolName,n=e.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${n}`,content_name:o})}})};t()})();

    // 6. INITIAL KICK-OFF
    checkAndFillScreen();
});
