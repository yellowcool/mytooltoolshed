document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION (No changes) ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // --- INITIALIZE (No changes) ---
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    // ... other element initializations ...

    // --- STATE VARIABLES (No changes) ---
    let currentPage = 1; 
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // --- UI & DATA FUNCTIONS (No changes) ---
    const createTagsHTML = (tagsString) => { /* ... */ };
    const createToolCard = (tool) => { /* ... */ };
    const renderTools = (tools) => { /* ... */ };
    const loadBrowseItems = async () => { /* ... */ };
    const handleSearch = async () => { /* ... */ };
    const openModal = () => { /* ... */ };
    const closeModal = () => { /* ... */ };
    const handleFeedbackSubmit = async (event) => { /* ... */ };

    // --- NEW: Function to check if content fills the viewport ---
    async function initialLoadCheck() {
        // Keep loading more items until a scrollbar appears or all data is loaded
        while (!isLoading && !allDataLoaded && (document.documentElement.scrollHeight <= window.innerHeight)) {
            console.log('Content is shorter than viewport, loading more...');
            await loadBrowseItems();
        }
    }

    // --- EVENT LISTENERS ---
    const handleScroll = () => {
        if (!currentSearchTerm && window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadBrowseItems();
        }
    };
    
    // All other event listeners remain the same
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); handleSearch(); });
    window.addEventListener('scroll', handleScroll);
    // ... etc.

    // --- INITIAL LOAD ---
    // MODIFIED: After the page loads, we run the initial check.
    // Use a small timeout to ensure the pre-rendered content has fully settled.
    setTimeout(initialLoadCheck, 100);


    // --- Helper functions for brevity ---
    (function(){const t=document.getElementById("feedbackModalOverlay"),o=document.getElementById("closeFeedbackBtn"),e=document.getElementById("feedbackForm"),n=document.getElementById("feedbackSubmitBtn"),a=document.getElementById("formStatus");const c=()=>{t.classList.add("active")},d=()=>{t.classList.remove("active"),setTimeout(()=>{a.textContent="",a.style.color="",e.reset(),n.disabled=!1,n.textContent="Submit Feedback"},300)};openModal=c,closeModal=d;async function l(t){t.preventDefault();const c=document.getElementById("feedbackName").value.trim(),d=document.getElementById("feedbackEmail").value.trim(),i=document.getElementById("feedbackMessage").value.trim();if(!i)return a.textContent="Message field cannot be empty.",void(a.style.color="red");n.disabled=!0,n.textContent="Submitting...",a.textContent="";const{data:s,error:r}=await supabase.from("feedback").insert([{name:c,email:d,message:i}]);r?(console.error("Error submitting feedback:",r),a.textContent="Sorry, there was an error. Please try again.",a.style.color="red",n.disabled=!1):(a.textContent="Thank you! Your feedback has been submitted successfully.",a.style.color="green",setTimeout(closeModal,2e3))}handleFeedbackSubmit=l;const s=()=>{const t=searchInput.value.trim();(currentSearchTerm=t.toLowerCase(),toolsGrid.innerHTML="",isLoading=!1,!currentSearchTerm)?(currentPage=0,allDataLoaded=!1,loadingIndicator.style.display="none",loadBrowseItems()):(allDataLoaded=!0,loadingIndicator.innerText="Searching for semantically similar tools...",loadingIndicator.style.display="block",gtag("event","search",{search_term:t}),async function(){try{const t=await fetch(WORKER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:searchInput.value.trim()})});if(!t.ok){const o=await t.json();throw new Error(o.error||"Request to worker failed")}const e=await t.json();renderTools(e),loadingIndicator.innerText=e&&e.length>0?`Found ${e.length} matching tools.`:"No matching tools found."}catch(t){console.error("Error with semantic search:",t),loadingIndicator.innerText="Error during search. Please try again."}}())};handleSearch=s,openFeedbackBtn.addEventListener("click",openModal),closeFeedbackBtn.addEventListener("click",closeModal),t.addEventListener("click",t=>{t.target===t&&closeModal()}),e.addEventListener("submit",handleFeedbackSubmit),toolsGrid.addEventListener("click",t=>{const o=t.target.closest(".tool-card");if(o){const e=o.dataset.toolName,n=o.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${n}`,content_name:e})}})})();
    const r=a=>a?a.split(",").map(a=>`<span class="tag">${a.trim()}</span>`).join(""):"" ,d=a=>{const t=document.createElement("a");return t.href=a.tool_link,t.target="_blank",t.className="tool-card",t.dataset.toolName=a.tool_name,t.dataset.toolRank=a.ranking,t.innerHTML=`\n            <h3 class="tool-card__name">\n                <span class="rank-badge">${a.ranking}</span> ${a.tool_name}\n            </h3>\n            <p class="tool-card__description">${a.description}</p>\n            <div class="tool-card__tags">${r(a.tags)}</div>\n        `,t},a=a=>{a&&a.length>0&&a.forEach(a=>{toolsGrid.appendChild(d(a))})};renderTools=a;const i=async()=>{if(isLoading||allDataLoaded)return;isLoading=!0,loadingIndicator.innerText="Loading...",loadingIndicator.style.display="block";const t=currentPage*ITEMS_PER_PAGE,{data:o,error:e}=await supabase.from("tools").select("*").eq("language",TARGET_LANGUAGE).order("ranking",{ascending:!0}).range(t,t+ITEMS_PER_PAGE-1);if(e)return console.error("Error fetching browse data:",e),loadingIndicator.innerText="Error loading data.",void(isLoading=!1);a(o),currentPage++,o&&o.length<ITEMS_PER_PAGE?(allDataLoaded=!0,loadingIndicator.innerText="All tools have been loaded."):loadingIndicator.style.display="none",isLoading=!1};loadBrowseItems=i;
});
