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
    // ... other elements ...

    // 3. STATE VARIABLES
    let browseCurrentPage = 1;
    let searchCurrentPage = 0; // NEW: Page tracker for search results
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // 4. CORE FUNCTIONS
    const renderTools = (tools) => {
        if (tools && tools.length > 0) {
            tools.forEach(tool => toolsGrid.appendChild(createToolCard(tool)));
        }
    };
    
    const loadBrowseItems = async () => { /* ... unchanged from previous final version ... */ };
    
    // NEW: Function to specifically load more search results
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
                searchCurrentPage++; // Increment the search page number
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
        
        if (searchTerm === currentSearchTerm) return; // Don't re-search for the same term

        currentSearchTerm = searchTerm;
        toolsGrid.innerHTML = '';
        isLoading = false; 

        if (!currentSearchTerm) {
            window.location.reload(); 
            return;
        }

        // Reset state specifically for a new search
        searchCurrentPage = 0;
        allDataLoaded = false;
        
        gtag('event', 'search', { search_term: searchTerm });

        // Load the FIRST page of search results
        await loadMoreSearchResults(); 
    };
    
    // --- 5. EVENT LISTENERS ---
    const handleScroll = () => {
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200;
        if (!isAtBottom || isLoading || allDataLoaded) return;

        // MODIFIED: Now checks if we are in search mode or browse mode
        if (currentSearchTerm) {
            loadMoreSearchResults(); // Load more search results
        } else {
            loadBrowseItems(); // Load more browse results
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    searchForm.addEventListener('submit', handleSearch);
    // ... all other listeners for modal, etc. are unchanged ...

    // --- 6. INITIAL LOAD LOGIC (Unchanged) ---
    const checkAndFillScreen = async () => { /* ... */ };
    window.onload = checkAndFillScreen;

    // --- Helper functions and other listeners for brevity ---
    (function(){const t=a=>a?a.split(",").map(a=>`<span class="tag">${a.trim()}</span>`).join(""):"" ,e=a=>{const e=document.createElement("a");return e.href=a.tool_link,e.target="_blank",e.className="tool-card",e.dataset.toolName=a.tool_name,e.dataset.toolRank=a.ranking,e.innerHTML=`\n            <h3 class="tool-card__name"><span class="rank-badge">${a.ranking}</span> ${a.tool_name}\n            </h3>\n            <p class="tool-card__description">${a.description}</p>\n            <div class="tool-card__tags">${t(a.tags)}</div>\n        `,e};createToolCard=e;const o=async()=>{if(isLoading||allDataLoaded)return;isLoading=!0,loadingIndicator.innerText="Loading...",loadingIndicator.style.display="block";const t=browseCurrentPage*ITEMS_PER_PAGE,{data:n,error:a}=await supabase.from("tools").select("*").eq("language",TARGET_LANGUAGE).order("ranking",{ascending:!0}).range(t,t+ITEMS_PER_PAGE-1);isLoading=!1,a?(console.error("Error fetching browse data:",a),loadingIndicator.innerText="Error loading data."):(n&&n.length>0?(renderTools(n),browseCurrentPage++):void 0,n&&n.length<ITEMS_PER_PAGE?(allDataLoaded=!0,loadingIndicator.innerText="All tools have been loaded."):loadingIndicator.style.display="none")};loadBrowseItems=o;const n={};const a=document.getElementById("openFeedbackBtn"),i=document.getElementById("feedbackModalOverlay"),s=document.getElementById("closeFeedbackBtn"),c=document.getElementById("feedbackForm");n.openModal=()=>{i.classList.add("active")},n.closeModal=()=>{i.classList.remove("active");const t=document.getElementById("formStatus"),e=document.getElementById("feedbackSubmitBtn");setTimeout(()=>{t.textContent="",t.style.color="",c.reset(),e.disabled=!1,e.textContent="Submit Feedback"},300)},n.handleFeedbackSubmit=async t=>{t.preventDefault();const a=document.getElementById("feedbackSubmitBtn"),i=document.getElementById("formStatus"),s=document.getElementById("feedbackMessage").value.trim();if(!s)return i.textContent="Message field cannot be empty.",void(i.style.color="red");a.disabled=!0,a.textContent="Submitting...",i.textContent="";const{data:r,error:l}=await supabase.from("feedback").insert([{name:document.getElementById("feedbackName").value.trim(),email:document.getElementById("feedbackEmail").value.trim(),message:s}]);l?(console.error("Error submitting feedback:",l),i.textContent="Sorry, there was an error.",i.style.color="red",a.disabled=!1):(i.textContent="Thank you! Your feedback has been submitted successfully.",i.style.color="green",setTimeout(n.closeModal,2e3))},modalLogicFunctions=n;const r=async()=>{if(isLoading||allDataLoaded||currentSearchTerm)return;if(document.documentElement.scrollHeight<=window.innerHeight)await loadBrowseItems(),requestAnimationFrame(r)};checkAndFillScreen=r,a.addEventListener("click",n.openModal),s.addEventListener("click",n.closeModal),i.addEventListener("click",t=>{t.target===i&&n.closeModal()}),c.addEventListener("submit",n.handleFeedbackSubmit),toolsGrid.addEventListener("click",t=>{const e=t.target.closest(".tool-card");if(e){const o=e.dataset.toolName,n=e.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${n}`,content_name:o})}})})();
});
