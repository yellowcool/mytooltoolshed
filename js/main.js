document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION & INITIALIZE (No changes here) ---
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const ITEMS_PER_PAGE = 12;
    const TARGET_LANGUAGE = 'English';

    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Elements for AI Tool Display
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // --- NEW: Elements for Modal Feedback Form ---
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
    
    // --- AI TOOL DISPLAY LOGIC (No changes here, so it's omitted for brevity) ---
    const loadItems = async () => { /* ... same as before ... */ };
    const handleSearch = () => { /* ... same as before ... */ };
    const handleScroll = () => { /* ... same as before ... */ };
    // ... all the functions for loading and searching tools are still here ...


    // ====================================================
    // NEW: MODAL CONTROL LOGIC
    // ====================================================
    const openModal = () => {
        feedbackModalOverlay.classList.add('active');
    };

    const closeModal = () => {
        feedbackModalOverlay.classList.remove('active');
        // Reset form status when closing
        setTimeout(() => {
            formStatus.textContent = '';
            formStatus.style.color = '';
            feedbackForm.reset();
            feedbackSubmitBtn.disabled = false;
            feedbackSubmitBtn.textContent = 'Submit Feedback';
        }, 300); // Delay to allow fade-out animation
    };

    openFeedbackBtn.addEventListener('click', openModal);
    closeFeedbackBtn.addEventListener('click', closeModal);

    // Close modal if user clicks on the dark overlay area
    feedbackModalOverlay.addEventListener('click', (event) => {
        if (event.target === feedbackModalOverlay) {
            closeModal();
        }
    });

    // --- FEEDBACK FORM SUBMISSION LOGIC (Slightly modified) ---
    const handleFeedbackSubmit = async (event) => {
        event.preventDefault(); 
        
        const name = document.getElementById('feedbackName').value.trim();
        const email = document.getElementById('feedbackEmail').value.trim();
        const message = document.getElementById('feedbackMessage').value.trim();

        if (!message) {
            formStatus.textContent = 'Message field cannot be empty.';
            formStatus.style.color = 'red';
            return;
        }

        feedbackSubmitBtn.disabled = true;
        feedbackSubmitBtn.textContent = 'Submitting...';
        formStatus.textContent = '';

        const { data, error } = await supabase
            .from('feedback')
            .insert([{ name: name, email: email, message: message }]);

        if (error) {
            console.error('Error submitting feedback:', error);
            formStatus.textContent = 'Sorry, there was an error. Please try again.';
            formStatus.style.color = 'red';
            feedbackSubmitBtn.disabled = false;
            feedbackSubmitBtn.textContent = 'Submit Feedback';
        } else {
            formStatus.textContent = 'Thank you! Your feedback has been submitted successfully.';
            formStatus.style.color = 'green';
            // NEW: Close the modal automatically after successful submission
            setTimeout(closeModal, 2000); // Close after 2 seconds
        }
    };
    
    // Add event listener for the feedback form
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    // --- EVENT LISTENERS for tool loading (omitted for brevity, they are still here) ---
    // searchInput.addEventListener ...
    // window.addEventListener('scroll', handleScroll);

    // --- INITIAL LOAD for tools (omitted for brevity, it is still here) ---
    // loadItems();

});

// NOTE: I've omitted the unchanged parts of the JS file for clarity. 
// In your actual file, you should merge the new logic with the existing logic.
// The provided full code below has everything merged correctly.
