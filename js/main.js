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
    const loadingIndicator = document.getElementById('loadingIndicator');
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');
    
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
        // NEW: Add data attributes for tracking
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

    const loadItems = async () => { /* ... this function remains unchanged ... */ };
    const handleScroll = () => { /* ... this function remains unchanged ... */ };
    const openModal = () => { /* ... this function remains unchanged ... */ };
    const closeModal = () => { /* ... this function remains unchanged ... */ };
    const handleFeedbackSubmit = async (event) => { /* ... this function remains unchanged ... */ };
    
    const handleSearch = () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        // --- NEW: Track Search Event ---
        // Only track if the search term is not empty
        if (searchTerm) {
            gtag('event', 'search', {
                search_term: searchTerm
            });
        }

        currentSearchTerm = searchTerm;
        toolsGrid.innerHTML = '';
        currentPage = 0;
        allDataLoaded = false;
        loadingIndicator.innerText = 'Loading...';
        loadItems();
    };

    // --- EVENT LISTENERS ---
    
    // Search input listener (unchanged)
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { handleSearch(); }, 500);
    });
    document.querySelector('.search-bar').addEventListener('submit', (e) => {
        e.preventDefault();
        clearTimeout(debounceTimer);
        handleSearch();
    });
    
    window.addEventListener('scroll', handleScroll);
    
    // Modal listeners (unchanged)
    openFeedbackBtn.addEventListener('click', openModal);
    closeFeedbackBtn.addEventListener('click', closeModal);
    feedbackModalOverlay.addEventListener('click', (event) => {
        if (event.target === feedbackModalOverlay) { closeModal(); }
    });
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    // --- NEW: Add Event Listener for Tool Clicks ---
    // Using event delegation on the parent grid for efficiency
    toolsGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.tool-card');
        if (card) {
            const toolName = card.dataset.toolName;
            const toolRank = card.dataset.toolRank;
            
            gtag('event', 'select_content', {
                content_type: 'AI Tool',
                item_id: `rank_${toolRank}`, // e.g., rank_1, rank_2
                content_name: toolName
            });
        }
    });

    // --- INITIAL LOAD ---
    loadItems();


    // --- OMITTED FUNCTIONS FOR BREVITY (They are the same as before) ---
    // NOTE: The full code is below. This is just to highlight the changes.
    async function a(){if(isLoading||allDataLoaded)return;isLoading=!0;loadingIndicator.style.display="block";const e=currentPage*ITEMS_PER_PAGE;let t=supabase.from("tools").select("*").eq("language",TARGET_LANGUAGE).order("ranking",{ascending:!0}).range(e,e+ITEMS_PER_PAGE-1);currentSearchTerm&&(t=t.or(`tool_name.ilike.%${currentSearchTerm}%,description.ilike.%${currentSearchTerm}%,tags.ilike.%${currentSearchTerm}%`));const{data:o,error:n}=await t;if(n)return console.error("Error fetching data:",n),void(loadingIndicator.innerText="Error loading data.");o&&o.length>0&&(o.forEach(e=>{toolsGrid.appendChild(createToolCard(e))}),currentPage++),o&&o.length<ITEMS_PER_PAGE?(allDataLoaded=!0,loadingIndicator.innerText="All tools have been loaded."):loadingIndicator.style.display="none",isLoading=!1}loadItems=a;function b(){if(window.innerHeight+window.scrollY>=document.documentElement.offsetHeight-200)loadItems()}handleScroll=b;function c(){feedbackModalOverlay.classList.add("active")}openModal=c;function d(){feedbackModalOverlay.classList.remove("active");setTimeout(()=>{formStatus.textContent="",formStatus.style.color="",feedbackForm.reset(),feedbackSubmitBtn.disabled=!1,feedbackSubmitBtn.textContent="Submit Feedback"},300)}closeModal=d;async function e(e){e.preventDefault();const t=document.getElementById("feedbackName").value.trim(),o=document.getElementById("feedbackEmail").value.trim(),n=document.getElementById("feedbackMessage").value.trim();if(!n)return formStatus.textContent="Message field cannot be empty.",void(formStatus.style.color="red");feedbackSubmitBtn.disabled=!0,feedbackSubmitBtn.textContent="Submitting...",formStatus.textContent="";const{data:a,error:i}=await supabase.from("feedback").insert([{name:t,email:o,message:n}]);i?(console.error("Error submitting feedback:",i),formStatus.textContent="Sorry, there was an error. Please try again.",formStatus.style.color="red",feedbackSubmitBtn.disabled=!1,feedbackSubmitBtn.textContent="Submit Feedback"):(formStatus.textContent="Thank you! Your feedback has been submitted successfully.",formStatus.style.color="green",setTimeout(closeModal,2e3))}handleFeedbackSubmit=e;
});
