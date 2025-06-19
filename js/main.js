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
    // ... all other elements for modal ...
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');

    // 3. STATE VARIABLES
    let currentPage = 1; // Start at page 1 as page 0 is pre-rendered
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // 4. CORE FUNCTIONS (Refactored for clarity and correctness)

    const createTagsHTML = (tagsString) => { /* ... unchanged ... */ };
    const createToolCard = (tool) => { /* ... unchanged ... */ };
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
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .eq('language', TARGET_LANGUAGE)
            .order('ranking', { ascending: true })
            .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
        isLoading = false; // Set isLoading to false early

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

    const handleSearch = async () => { /* ... unchanged ... */ };
    const modalLogicFunctions = { /* ... unchanged ... */ };


    // --- 5. THE NEW, ROBUST LOADING LOGIC ---

    // This function checks if we should load more items, either by scroll or because the screen is not full.
    const checkAndLoadMore = async () => {
        if (isLoading || allDataLoaded || currentSearchTerm) return;

        // Condition to check: either user has scrolled to the bottom OR the content does not fill the viewport.
        const shouldLoad = (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) || 
                           (document.documentElement.scrollHeight <= window.innerHeight);
        
        if (shouldLoad) {
            await loadBrowseItems();
            // After loading, check again in case the screen is still not full
            // requestAnimationFrame is a smooth way to do this without a busy loop
            requestAnimationFrame(checkAndLoadMore);
        }
    };

    // --- 6. EVENT LISTENERS ---
    
    // We only need one listener for scroll now
    window.addEventListener('scroll', checkAndLoadMore);

    // All other listeners
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); handleSearch(); });
    openFeedbackBtn.addEventListener('click', modalLogicFunctions.openModal);
    closeFeedbackBtn.addEventListener('click', modalLogicFunctions.closeModal);
    feedbackModalOverlay.addEventListener('click', (event) => { if (event.target === event.currentTarget) { modalLogicFunctions.closeModal(); }});
    feedbackForm.addEventListener('submit', modalLogicFunctions.handleFeedbackSubmit);
    toolsGrid.addEventListener('click', (event) => { /* ... GA tracking logic ... */ });


    // --- 7. INITIAL KICK-OFF ---
    // After the page loads, run the check once to fill the screen on large monitors.
    setTimeout(checkAndLoadMore, 200);


    // --- Unchanged helper functions for brevity, DO NOT DELETE THEM ---
    (function(){createTagsHTML=a=>a?a.split(",").map(a=>`<span class="tag">${a.trim()}</span>`).join(""):"" ,createToolCard=a=>{const t=document.createElement("a");return t.href=a.tool_link,t.target="_blank",t.className="tool-card",t.dataset.toolName=a.tool_name,t.dataset.toolRank=a.ranking,t.innerHTML=`\n            <h3 class="tool-card__name">\n                <span class="rank-badge">${a.ranking}</span> ${a.tool_name}\n            </h3>\n            <p class="tool-card__description">${a.description}</p>\n            <div class="tool-card__tags">${createTagsHTML(a.tags)}</div>\n        `,t};const t=async()=>{const t=searchInput.value.trim();if(currentSearchTerm=t.toLowerCase(),toolsGrid.innerHTML="",isLoading=!1,!currentSearchTerm)return currentPage=0,allDataLoaded=!1,loadingIndicator.style.display="none",void loadBrowseItems();allDataLoaded=!0,loadingIndicator.innerText="Searching for semantically similar tools...",loadingIndicator.style.display="block",gtag("event","search",{search_term:t});try{const o=await fetch(WORKER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:t})});if(!o.ok){const n=await o.json();throw new Error(n.error||"Request to worker failed")}const i=await o.json();renderTools(i),loadingIndicator.innerText=i&&i.length>0?`Found ${i.length} matching tools.`:"No matching tools found."}catch(o){console.error("Error with semantic search:",o),loadingIndicator.innerText="Error during search. Please try again."}};handleSearch=t;const o={};const e=document.getElementById("feedbackSubmitBtn"),n=document.getElementById("formStatus");o.openModal=()=>{feedbackModalOverlay.classList.add("active")},o.closeModal=()=>{feedbackModalOverlay.classList.remove("active"),setTimeout(()=>{n.textContent="",n.style.color="",feedbackForm.reset(),e.disabled=!1,e.textContent="Submit Feedback"},300)},o.handleFeedbackSubmit=async t=>{t.preventDefault();const o=document.getElementById("feedbackName").value.trim(),c=document.getElementById("feedbackEmail").value.trim(),i=document.getElementById("feedbackMessage").value.trim();if(!i)return n.textContent="Message field cannot be empty.",void(n.style.color="red");e.disabled=!0,e.textContent="Submitting...",n.textContent="";const{data:l,error:s}=await supabase.from("feedback").insert([{name:o,email:c,message:i}]);s?(console.error("Error submitting feedback:",s),n.textContent="Sorry, there was an error. Please try again.",n.style.color="red",e.disabled=!1):(n.textContent="Thank you! Your feedback has been submitted successfully.",n.style.color="green",setTimeout(o.closeModal,2e3))},modalLogicFunctions=o,toolsGrid.addEventListener("click",a=>{const t=a.target.closest(".tool-card");if(t){const o=t.dataset.toolName,e=t.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${e}`,content_name:o})}})})()
});
