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

    // 3. STATE VARIABLES
    let currentPage = 1; 
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // 4. CORE FUNCTIONS
    // This function loads tools for standard Browse and infinite scroll
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
    
    // All other functions like handleSearch, modal logic, etc. are unchanged
    // ...

    // --- 5. THE NEW, ROBUST LOADING LOGIC ---
    // This function will check if the screen is full and load items if needed.
    // It will call itself recursively until the condition is met.
    const fillScreen = async () => {
        if (isLoading || allDataLoaded || currentSearchTerm) return;
        
        // Check if the document's content is shorter than the window's visible area
        if (document.documentElement.scrollHeight <= window.innerHeight) {
            await loadBrowseItems();
            // After loading, wait for the next animation frame and check again.
            // This is a robust way to handle dynamic content height.
            requestAnimationFrame(fillScreen);
        }
    };


    // --- 6. EVENT LISTENERS ---
    const handleScroll = () => {
        // Trigger when user scrolls to the bottom 200px of the page
        if (!currentSearchTerm && window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadBrowseItems();
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    // All other event listeners remain the same
    // ...

    // --- 7. INITIAL KICK-OFF ---
    // After the page loads, run the initial fill-screen check.
    // We use window.onload to be extra sure all assets like images are loaded and heights are correct.
    window.onload = () => {
        fillScreen();
    };

    // --- Helper functions and other listeners for brevity ---
    (function(){const t=a=>a?a.split(",").map(a=>`<span class="tag">${a.trim()}</span>`).join(""):"" ,e=a=>{const e=document.createElement("a");return e.href=a.tool_link,e.target="_blank",e.className="tool-card",e.dataset.toolName=a.tool_name,e.dataset.toolRank=a.ranking,e.innerHTML=`\n            <h3 class="tool-card__name">\n                <span class="rank-badge">${a.ranking}</span> ${a.tool_name}\n            </h3>\n            <p class="tool-card__description">${a.description}</p>\n            <div class="tool-card__tags">${t(a.tags)}</div>\n        `,e};createToolCard=e,renderTools=t=>{t&&t.length>0&&t.forEach(t=>{toolsGrid.appendChild(createToolCard(t))})};const o=async()=>{const t=searchInput.value.trim();if(currentSearchTerm=t.toLowerCase(),toolsGrid.innerHTML="",isLoading=!1,!currentSearchTerm)return currentPage=1,allDataLoaded=!1,location.reload(),void(loadingIndicator.style.display="none");allDataLoaded=!0,loadingIndicator.innerText="Searching for semantically similar tools...",loadingIndicator.style.display="block",gtag("event","search",{search_term:t});try{const e=await fetch(WORKER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:t})});if(!e.ok){const n=await e.json();throw new Error(n.error||"Request to worker failed")}const a=await e.json();renderTools(a),loadingIndicator.innerText=a&&a.length>0?`Found ${a.length} matching tools.`:"No matching tools found."}catch(e){console.error("Error with semantic search:",e),loadingIndicator.innerText="Error during search. Please try again."}};handleSearch=o;const n={};const a=document.getElementById("openFeedbackBtn"),i=document.getElementById("feedbackModalOverlay"),s=document.getElementById("closeFeedbackBtn"),c=document.getElementById("feedbackForm");n.openModal=()=>{i.classList.add("active")},n.closeModal=()=>{i.classList.remove("active");const t=document.getElementById("formStatus"),o=document.getElementById("feedbackSubmitBtn");setTimeout(()=>{t.textContent="",t.style.color="",c.reset(),o.disabled=!1,o.textContent="Submit Feedback"},300)},n.handleFeedbackSubmit=async t=>{t.preventDefault();const a=document.getElementById("feedbackName").value.trim(),i=document.getElementById("feedbackEmail").value.trim(),s=document.getElementById("feedbackMessage").value.trim(),r=document.getElementById("formStatus"),l=document.getElementById("feedbackSubmitBtn");if(!s)return r.textContent="Message field cannot be empty.",void(r.style.color="red");l.disabled=!0,l.textContent="Submitting...",r.textContent="";const{data:m,error:u}=await supabase.from("feedback").insert([{name:a,email:i,message:s}]);u?(console.error("Error submitting feedback:",u),r.textContent="Sorry, there was an error. Please try again.",r.style.color="red",l.disabled=!1):(r.textContent="Thank you! Your feedback has been submitted successfully.",r.style.color="green",setTimeout(n.closeModal,2e3))},modalLogicFunctions=n,searchForm.addEventListener("submit",t=>{t.preventDefault(),handleSearch()}),a.addEventListener("click",n.openModal),s.addEventListener("click",n.closeModal),i.addEventListener("click",t=>{t.target===i&&n.closeModal()}),c.addEventListener("submit",n.handleFeedbackSubmit),toolsGrid.addEventListener("click",a=>{const t=a.target.closest(".tool-card");if(t){const o=t.dataset.toolName,e=t.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${e}`,content_name:o})}})})();
});
