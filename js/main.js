document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // --- INITIALIZE ---
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    // ... other element initializations ...
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');

    // --- STATE VARIABLES ---
    let currentPage = 1; // Start at page 1 because page 0 is pre-rendered
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // --- UI & DATA FUNCTIONS (No changes here) ---
    const createTagsHTML = (tagsString) => { /* ... */ };
    const createToolCard = (tool) => { /* ... */ };
    const renderTools = (tools) => { /* ... */ };

    // This function loads tools for standard Browse and infinite scroll
    const loadBrowseItems = async () => {
        if (isLoading || allDataLoaded) return;
        
        isLoading = true;
        loadingIndicator.innerText = 'Loading...';
        loadingIndicator.style.display = 'block';

        // If currentPage is 0, it means we are resetting, so we load the very first batch
        // This will replace the pre-rendered content with dynamically loaded identical content
        const startIndex = currentPage * ITEMS_PER_PAGE;
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .eq('language', TARGET_LANGUAGE)
            .order('ranking', { ascending: true })
            .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
        if (error) {
            console.error('Error fetching browse data:', error);
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
        currentSearchTerm = searchTerm.toLowerCase();

        // Always clear the grid for a new action
        toolsGrid.innerHTML = '';
        isLoading = false; 

        // --- THIS IS THE FIX ---
        if (!currentSearchTerm) {
            // If search is cleared, reset state for Browse mode
            currentPage = 0; // Reset to load the first page
            allDataLoaded = false; // <<< CRITICAL FIX: Allow infinite scroll again
            loadingIndicator.style.display = 'none';
            // We don't need to call loadBrowseItems() here, because the pre-rendered content
            // should become visible again. A page reload is the cleanest way to restore state.
            // A simpler non-reload approach is to just load the first page dynamically.
            loadBrowseItems();
            return;
        }

        // If there is a search term, proceed with semantic search
        allDataLoaded = true; // Disable infinite scroll for search results
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
    
    // --- MODAL & FEEDBACK LOGIC (No changes, omitted for brevity) ---
    const openModal = () => { /* ... */ };
    const closeModal = () => { /* ... */ };
    const handleFeedbackSubmit = async (event) => { /* ... */ };

    // --- EVENT LISTENERS ---
    const handleScroll = () => {
        if (!currentSearchTerm && window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadBrowseItems();
        }
    };
    
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); handleSearch(); });
    window.addEventListener('scroll', handleScroll);
    openFeedbackBtn.addEventListener('click', openModal);
    // ... other listeners ...

    // --- INITIAL LOAD ---
    // No initial load needed
    
    // --- Helper functions for brevity ---
    (function(){const t=document.getElementById("feedbackModalOverlay"),o=document.getElementById("closeFeedbackBtn"),e=document.getElementById("feedbackForm"),n=document.getElementById("feedbackSubmitBtn"),a=document.getElementById("formStatus");const c=()=>{t.classList.add("active")},d=()=>{t.classList.remove("active"),setTimeout(()=>{a.textContent="",a.style.color="",e.reset(),n.disabled=!1,n.textContent="Submit Feedback"},300)};openModal=c,closeModal=d;async function l(t){t.preventDefault();const c=document.getElementById("feedbackName").value.trim(),d=document.getElementById("feedbackEmail").value.trim(),i=document.getElementById("feedbackMessage").value.trim();if(!i)return a.textContent="Message field cannot be empty.",void(a.style.color="red");n.disabled=!0,n.textContent="Submitting...",a.textContent="";const{data:s,error:r}=await supabase.from("feedback").insert([{name:c,email:d,message:i}]);r?(console.error("Error submitting feedback:",r),a.textContent="Sorry, there was an error. Please try again.",a.style.color="red",n.disabled=!1):(a.textContent="Thank you! Your feedback has been submitted successfully.",a.style.color="green",setTimeout(closeModal,2e3))}handleFeedbackSubmit=l,closeFeedbackBtn.addEventListener("click",closeModal),t.addEventListener("click",t=>{t.target===t&&closeModal()}),e.addEventListener("submit",handleFeedbackSubmit),toolsGrid.addEventListener("click",t=>{const o=t.target.closest(".tool-card");if(o){const e=o.dataset.toolName,n=o.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${n}`,content_name:e})}})})()
});
