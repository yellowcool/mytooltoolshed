document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const WORKER_URL = 'https://semantic-search-handler.coolyellow110.workers.dev'; 
    const ITEMS_PER_PAGE = 12;
    const SEARCH_ITEMS_PER_PAGE = 20;
    const TARGET_LANGUAGE = 'English';

    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');

    let browseCurrentPage = 1;
    let searchCurrentPage = 0;
    let isLoading = false;
    let allDataLoaded = false;
    let currentSearchTerm = '';

    const createTagsHTML = (tagsString) => tagsString ? tagsString.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '';

    const createToolCard = (tool) => {
        const card = document.createElement('a');
        card.href = tool.tool_link;
        card.target = '_blank';
        card.className = 'tool-card';
        card.dataset.toolName = tool.tool_name;
        card.dataset.toolRank = tool.ranking;
        card.innerHTML = `<h3 class="tool-card__name"><span class="rank-badge">${tool.ranking}</span> ${tool.tool_name}</h3><p class="tool-card__description">${tool.description}</p><div class="tool-card__tags">${createTagsHTML(tool.tags)}</div>`;
        return card;
    };

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
        const startIndex = browseCurrentPage * ITEMS_PER_PAGE;
        const { data, error } = await supabase.from('tools').select('*').eq('language', TARGET_LANGUAGE).order('ranking', { ascending: true }).range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        isLoading = false;
        if (error) {
            console.error('Error fetching browse data:', error);
            loadingIndicator.innerText = 'Error loading data.';
            return;
        }
        if (data && data.length > 0) {
            renderTools(data);
            browseCurrentPage++;
        }
        if (!data || data.length < ITEMS_PER_PAGE) {
            allDataLoaded = true;
            loadingIndicator.innerText = 'All tools have been loaded.';
        } else {
            loadingIndicator.style.display = 'none';
        }
    };

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
                searchCurrentPage++;
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

    const handleSearch = async () => {
        const searchTerm = searchInput.value.trim();
        searchInput.blur();
        currentSearchTerm = searchTerm;
        toolsGrid.innerHTML = '';
        isLoading = false;
        if (!currentSearchTerm) {
            window.location.reload();
            return;
        }
        searchCurrentPage = 0;
        allDataLoaded = false;
        gtag('event', 'search', { search_term: searchTerm });
        await loadMoreSearchResults();
    };

    const handleScroll = () => {
        const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200;
        if (!isAtBottom) return;
        if (currentSearchTerm) {
            loadMoreSearchResults();
        } else {
            loadBrowseItems();
        }
    };
    
    const checkAndFillScreen = async () => {
        if (isLoading || allDataLoaded || currentSearchTerm) return;
        if (document.documentElement.scrollHeight <= window.innerHeight) {
            await loadBrowseItems();
            requestAnimationFrame(checkAndFillScreen);
        }
    };

    const modalLogicFunctions = { /* Omitted for brevity */ };
    (function(){const t={};const e=document.getElementById("openFeedbackBtn"),o=document.getElementById("feedbackModalOverlay"),n=document.getElementById("closeFeedbackBtn"),a=document.getElementById("feedbackForm");t.openModal=()=>{o.classList.add("active")},t.closeModal=()=>{o.classList.remove("active");const e=document.getElementById("formStatus"),t=document.getElementById("feedbackSubmitBtn");setTimeout(()=>{e.textContent="",e.style.color="",a.reset(),t.disabled=!1,t.textContent="Submit Feedback"},300)},t.handleFeedbackSubmit=async e=>{e.preventDefault();const o=document.getElementById("feedbackSubmitBtn"),c=document.getElementById("formStatus"),i=document.getElementById("feedbackMessage").value.trim();if(!i)return c.textContent="Message field cannot be empty.",void(c.style.color="red");o.disabled=!0,o.textContent="Submitting...",c.textContent="";const{data:s,error:r}=await supabase.from("feedback").insert([{name:document.getElementById("feedbackName").value.trim(),email:document.getElementById("feedbackEmail").value.trim(),message:i}]);r?(console.error("Error submitting feedback:",r),c.textContent="Sorry, there was an error.",c.style.color="red",o.disabled=!1):(c.textContent="Thank you! Your feedback has been submitted.",c.style.color="green",setTimeout(t.closeModal,2e3))},modalLogicFunctions=t,e.addEventListener("click",t.openModal),n.addEventListener("click",t.closeModal),o.addEventListener("click",e=>{e.target===o&&t.closeModal()}),a.addEventListener("submit",t.handleFeedbackSubmit)})();
    
    searchForm.addEventListener('submit', (e) => { e.preventDefault(); handleSearch(); });
    window.addEventListener('scroll', handleScroll);
    toolsGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.tool-card');
        if (card) {
            const toolName = card.dataset.toolName;
            const toolRank = card.dataset.toolRank;
            gtag('event', 'select_content', { content_type: 'AI Tool', item_id: `rank_${toolRank}`, content_name: toolName });
        }
    });

    window.onload = () => { checkAndFillScreen(); };
});
