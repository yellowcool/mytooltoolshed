document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // --- INITIALIZE (No changes) ---
    // ...

    // --- STATE VARIABLES ---
    // MODIFIED: Start at page 1, since page 0 (the first 12 items) is pre-rendered.
    let currentPage = 1; 
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';
    
    // --- FUNCTIONS (All functions like createToolCard, loadBrowseItems, handleSearch, modal logic, etc., remain exactly the same) ---
    // ...


    // --- EVENT LISTENERS (No changes) ---
    // ...

    // --- INITIAL LOAD ---
    // REMOVED: The initial call to loadItems() is no longer needed
    // because the first page of content is already in the HTML.
    // The next items will be loaded by the scroll listener.


    // --- Helper functions for brevity ---
    const supabase=self.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY),toolsGrid=document.getElementById("toolsGrid"),searchInput=document.getElementById("searchInput"),searchForm=document.querySelector(".search-bar"),loadingIndicator=document.getElementById("loadingIndicator"),openFeedbackBtn=document.getElementById("openFeedbackBtn"),feedbackModalOverlay=document.getElementById("feedbackModalOverlay"),closeFeedbackBtn=document.getElementById("closeFeedbackBtn"),feedbackForm=document.getElementById("feedbackForm"),feedbackSubmitBtn=document.getElementById("feedbackSubmitBtn"),formStatus=document.getElementById("formStatus");const createTagsHTML=a=>a?a.split(",").map(a=>`<span class="tag">${a.trim()}</span>`).join(""):"" ,createToolCard=a=>{const e=document.createElement("a");return e.href=a.tool_link,e.target="_blank",e.className="tool-card",e.dataset.toolName=a.tool_name,e.dataset.toolRank=a.ranking,e.innerHTML=`\n            <h3 class="tool-card__name">\n                <span class="rank-badge">${a.ranking}</span> ${a.tool_name}\n            </h3>\n            <p class="tool-card__description">${a.description}</p>\n            <div class="tool-card__tags">${createTagsHTML(a.tags)}</div>\n        `,e},renderTools=a=>{a&&a.length>0&&a.forEach(a=>{toolsGrid.appendChild(createToolCard(a))})},loadBrowseItems=async()=>{if(isLoading||allDataLoaded)return;isLoading=!0,loadingIndicator.innerText="Loading...",loadingIndicator.style.display="block";const a=currentPage*ITEMS_PER_PAGE,{data:e,error:t}=await supabase.from("tools").select("*").eq("language",TARGET_LANGUAGE).order("ranking",{ascending:!0}).range(a,a+ITEMS_PER_PAGE-1);if(t)return console.error("Error fetching browse data:",t),loadingIndicator.innerText="Error loading data.",void(isLoading=!1);renderTools(e),currentPage++,e&&e.length<ITEMS_PER_PAGE?(allDataLoaded=!0,loadingIndicator.innerText="All tools have been loaded."):loadingIndicator.style.display="none",isLoading=!1},handleSearch=async()=>{const a=searchInput.value.trim();if(currentSearchTerm=a,toolsGrid.innerHTML="",allDataLoaded=!0,!a)return currentPage=0,loadingIndicator.style.display="none",void loadBrowseItems();isLoading=!0,loadingIndicator.innerText="Searching for semantically similar tools...",loadingIndicator.style.display="block",gtag("event","search",{search_term:a});try{const t=await fetch(WORKER_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:a})});if(!t.ok){const e=await t.json();throw new Error(e.error||"Request to worker failed")}const o=await t.json();renderTools(o),loadingIndicator.innerText=o&&o.length>0?`Found ${o.length} matching tools.`:"No matching tools found."}catch(e){console.error("Error with semantic search:",e),loadingIndicator.innerText="Error during search. Please try again."}isLoading=!1,allDataLoaded=!0},openModal=()=>{feedbackModalOverlay.classList.add("active")},closeModal=()=>{feedbackModalOverlay.classList.remove("active"),setTimeout(()=>{formStatus.textContent="",formStatus.style.color="",feedbackForm.reset(),feedbackSubmitBtn.disabled=!1,feedbackSubmitBtn.textContent="Submit Feedback"},300)},handleFeedbackSubmit=async a=>{a.preventDefault();const e=document.getElementById("feedbackName").value.trim(),t=document.getElementById("feedbackEmail").value.trim(),o=document.getElementById("feedbackMessage").value.trim();if(!o)return formStatus.textContent="Message field cannot be empty.",void(formStatus.style.color="red");feedbackSubmitBtn.disabled=!0,feedbackSubmitBtn.textContent="Submitting...",formStatus.textContent="";const{data:n,error:i}=await supabase.from("feedback").insert([{name:e,email:t,message:o}]);i?(console.error("Error submitting feedback:",i),formStatus.textContent="Sorry, there was an error. Please try again.",formStatus.style.color="red",feedbackSubmitBtn.disabled=!1):(formStatus.textContent="Thank you! Your feedback has been submitted successfully.",formStatus.style.color="green",setTimeout(closeModal,2e3))},handleScroll=()=>{currentSearchTerm||window.innerHeight+window.scrollY<document.documentElement.offsetHeight-200||loadBrowseItems()};searchForm.addEventListener("submit",a=>{a.preventDefault(),handleSearch()}),window.addEventListener("scroll",handleScroll),openFeedbackBtn.addEventListener("click",openModal),closeFeedbackBtn.addEventListener("click",closeModal),feedbackModalOverlay.addEventListener("click",a=>{a.target===feedbackModalOverlay&&closeModal()}),feedbackForm.addEventListener("submit",handleFeedbackSubmit),toolsGrid.addEventListener("click",a=>{const e=a.target.closest(".tool-card");if(e){const t=e.dataset.toolName,o=e.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${o}`,content_name:t})}});
});
