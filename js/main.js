document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    // --- INITIALIZE ---
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Elements for AI Tool Display
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar'); // Get the form element
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Elements for Modal Feedback Form
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');
    const formStatus = document.getElementById('formStatus');

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

    const loadItems = async (isSearch = false) => {
        if (isLoading || (allDataLoaded && !isSearch)) return;
        
        isLoading = true;
        loadingIndicator.style.display = 'block';

        if (isSearch) {
            toolsGrid.innerHTML = '';
        }

        const startIndex = currentPage * ITEMS_PER_PAGE;
        let query = supabase
            .from('tools')
            .select('*')
            .eq('language', TARGET_LANGUAGE)
            .order('ranking', { ascending: true })
            .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
        
        if (currentSearchTerm) {
            const searchPattern = `%${currentSearchTerm}%`;
            query = query.or(`tool_name.ilike.${searchPattern},description.ilike.${searchPattern},tags.ilike.${searchPattern}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching data:', error);
            loadingIndicator.innerText = 'Error loading data.';
            return;
        }

        if (data && data.length > 0) {
            data.forEach(tool => {
                toolsGrid.appendChild(createToolCard(tool));
            });
            currentPage++;
        }

        if (!data || data.length < ITEMS_PER_PAGE) {
            allDataLoaded = true;
            loadingIndicator.innerText = 'All tools have been loaded.';
        } else {
            loadingIndicator.style.display = 'none';
        }

        isLoading = false;
    };

    // This function now gets called ONLY when the form is submitted
    const handleSearch = () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm) {
            gtag('event', 'search', { search_term: searchTerm });
        }
        
        currentSearchTerm = searchTerm;
        currentPage = 0;
        allDataLoaded = false;
        loadingIndicator.innerText = 'Loading...';
        loadItems(true); 
    };

    // --- MODAL CONTROL & FEEDBACK SUBMISSION LOGIC (Unchanged) ---
    const openModal = () => { /* ... */ };
    const closeModal = () => { /* ... */ };
    const handleFeedbackSubmit = async (event) => { /* ... */ };
    // --- (The code for these functions is still here, just omitted for brevity) ---


    // --- EVENT LISTENERS ---
    const handleScroll = () => {
        // Infinite scroll should NOT run if a search term is active
        if (!currentSearchTerm && window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 200) {
            loadItems();
        }
    };

    // REMOVED: The 'input' event listener with the debounce timer is now gone.

    // MODIFIED: Search is now only triggered by the form's 'submit' event.
    // This handles both clicking the button and pressing Enter in the input field.
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the browser from reloading the page
        handleSearch();
    });
    
    window.addEventListener('scroll', handleScroll);
    
    // Listeners for Modal (Unchanged)
    openFeedbackBtn.addEventListener('click', openModal);
    closeFeedbackBtn.addEventListener('click', closeModal);
    feedbackModalOverlay.addEventListener('click', (event) => {
        if (event.target === feedbackModalOverlay) { closeModal(); }
    });
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    // Listener for Tool Clicks (Unchanged)
    toolsGrid.addEventListener('click', (event) => { /* ... */ });

    // --- INITIAL LOAD ---
    loadItems();


    // --- Helper functions for brevity ---
    (function(){const t=document.getElementById("feedbackModalOverlay"),e=document.getElementById("closeFeedbackBtn"),o=document.getElementById("feedbackForm"),n=document.getElementById("feedbackSubmitBtn"),a=document.getElementById("formStatus");const c=()=>{t.classList.add("active")},d=()=>{t.classList.remove("active"),setTimeout(()=>{a.textContent="",a.style.color="",o.reset(),n.disabled=!1,n.textContent="Submit Feedback"},300)};openModal=c,closeModal=d;async function i(t){t.preventDefault();const c=document.getElementById("feedbackName").value.trim(),d=document.getElementById("feedbackEmail").value.trim(),l=document.getElementById("feedbackMessage").value.trim();if(!l)return a.textContent="Message field cannot be empty.",void(a.style.color="red");n.disabled=!0,n.textContent="Submitting...",a.textContent="";const{data:s,error:r}=await supabase.from("feedback").insert([{name:c,email:d,message:l}]);r?(console.error("Error submitting feedback:",r),a.textContent="Sorry, there was an error. Please try again.",a.style.color="red",n.disabled=!1,n.textContent="Submit Feedback"):(a.textContent="Thank you! Your feedback has been submitted successfully.",a.style.color="green",setTimeout(closeModal,2e3))}handleFeedbackSubmit=i})();
    toolsGrid.addEventListener('click', (event) => { const card = event.target.closest('.tool-card'); if (card) { const toolName = card.dataset.toolName; const toolRank = card.dataset.toolRank; gtag('event', 'select_content', { content_type: 'AI Tool', item_id: `rank_${toolRank}`, content_name: toolName }); } });
});
