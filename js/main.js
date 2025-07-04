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
    const searchForm = document.getElementById('searchForm');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const initialGridHTML = toolsGrid.innerHTML;

    // 3. STATE MANAGEMENT
    let isLoading = false;
    let currentSearchTerm = '';
    const state = {
        browse: { page: 1, allLoaded: false },
        search: { page: 0, allLoaded: false }
    };
    
    // 4. HELPER & CORE FUNCTIONS
    function createTagsHTML(tagsString) {
        return tagsString ? tagsString.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '';
    }

    function createToolCard(tool) {
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
    }
    
    function renderTools(tools) {
        if (tools && tools.length > 0) {
            tools.forEach(tool => toolsGrid.appendChild(createToolCard(tool)));
        }
    }

    async function loadBrowseItems() {
        if (isLoading || state.browse.allLoaded) return;
        isLoading = true;
        loadingIndicator.innerText = 'Loading...';
        loadingIndicator.style.display = 'block';

        const startIndex = 12 + ((state.browse.page - 1) * ITEMS_PER_PAGE);
        
        try {
            const { data, error } = await supabase.from('tools').select('*').eq('language', TARGET_LANGUAGE).order('ranking', { ascending: true }).range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
            if (error) throw error;

            if (data) {
                renderTools(data);
                state.browse.page++;
                if (data.length < ITEMS_PER_PAGE) {
                    state.browse.allLoaded = true;
                    loadingIndicator.innerText = 'All tools have been loaded.';
                } else {
                    loadingIndicator.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error fetching browse data:', error);
            loadingIndicator.innerText = 'Error loading data.';
        } finally {
            isLoading = false;
        }
    }

    async function loadSearchResults() {
        if (isLoading || state.search.allLoaded) return;
        isLoading = true;
        loadingIndicator.innerText = state.search.page === 0 ? 'Searching for semantically similar tools...' : 'Loading more results...';
        loadingIndicator.style.display = 'block';

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: currentSearchTerm, page: state.search.page }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Request to worker failed');
            }
            const data = await response.json();
            
            if (data) {
                renderTools(data);
                state.search.page++;
                if (data.length < SEARCH_ITEMS_PER_PAGE) {
                    state.search.allLoaded = true;
                    loadingIndicator.innerText = toolsGrid.children.length > 0 ? 'All matching tools have been loaded.' : 'No matching tools found.';
                } else {
                    loadingIndicator.style.display = 'none';
                }
            }
        } catch (e) {
            console.error('Error with semantic search:', e);
            loadingIndicator.innerText = 'Error during search. Please try again.';
        } finally {
            isLoading = false;
        }
    }

    async function handleSearch(event) {
        event.preventDefault();
        searchInput.blur();
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm.toLowerCase() === currentSearchTerm) return;

        toolsGrid.innerHTML = '';
        isLoading = false;
        currentSearchTerm = searchTerm.toLowerCase();

        if (!currentSearchTerm) {
            state.browse = { page: 1, allLoaded: false };
            toolsGrid.innerHTML = initialGridHTML;
            loadingIndicator.style.display = 'none';
            await checkAndFillScreen();
            return;
        }
        
        state.search = { page: 0, allLoaded: false };
        if (typeof gtag === 'function') gtag('event', 'search', { search_term: searchTerm });
        await loadSearchResults();
    }
    
    async function checkAndFillScreen() {
        if (currentSearchTerm || isLoading || state.browse.allLoaded) return;
        if (document.documentElement.scrollHeight <= window.innerHeight) {
            await loadBrowseItems();
            requestAnimationFrame(checkAndFillScreen);
        }
    }
    
    // --- 5. EVENT LISTENERS ---
    let scrollThrottleTimeout;
    function handleScroll() {
        if (scrollThrottleTimeout) return;
        scrollThrottleTimeout = setTimeout(() => {
            const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200;
            if (isAtBottom && !isLoading) {
                if (currentSearchTerm) {
                    if (!state.search.allLoaded) loadSearchResults();
                } else {
                    if (!state.browse.allLoaded) loadBrowseItems();
                }
            }
            scrollThrottleTimeout = null;
        }, 200);
    }
    
    searchForm.addEventListener('submit', handleSearch);
    window.addEventListener('scroll', handleScroll);

    // --- 6. INITIAL KICK-OFF & OTHER LISTENERS ---
    window.onload = checkAndFillScreen;

    (function(){const t=document.getElementById("openFeedbackBtn"),e=document.getElementById("feedbackModalOverlay"),o=document.getElementById("closeFeedbackBtn"),n=document.getElementById("feedbackForm");const a={openModal:()=>{e.classList.add("active")},closeModal:()=>{e.classList.remove("active");setTimeout(()=>{document.getElementById("formStatus").textContent="",n.reset(),document.getElementById("feedbackSubmitBtn").disabled=!1,document.getElementById("feedbackSubmitBtn").textContent="Submit Feedback"},300)},handleFeedbackSubmit:async t=>{t.preventDefault();const e=document.getElementById("feedbackSubmitBtn"),o=document.getElementById("formStatus"),i=document.getElementById("feedbackMessage").value.trim();if(!i)return o.textContent="Message field cannot be empty.",void(o.style.color="red");e.disabled=!0,e.textContent="Submitting...",o.textContent="";const{error:s}=await supabase.from("feedback").insert([{name:document.getElementById("feedbackName").value.trim(),email:document.getElementById("feedbackEmail").value.trim(),message:i}]);s?(console.error("Error submitting feedback:",s),o.textContent="Sorry, there was an error.",o.style.color="red",e.disabled=!1):(o.textContent="Thank you! Your feedback has been submitted.",o.style.color="green",setTimeout(a.closeModal,2e3))}};t.addEventListener("click",a.openModal),o.addEventListener("click",a.closeModal),e.addEventListener("click",t=>{t.target===e&&a.closeModal()}),n.addEventListener("submit",a.handleFeedbackSubmit);if(typeof gtag==='function'){toolsGrid.addEventListener("click",t=>{const e=t.target.closest(".tool-card");if(e){const o=e.dataset.toolName,n=e.dataset.toolRank;gtag("event","select_content",{content_type:"AI Tool",item_id:`rank_${n}`,content_name:o})}})}})();
});
