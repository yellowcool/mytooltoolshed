// ... (所有配置、初始化、UI函数保持不变) ...

    const handleSearch = async () => {
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) return; // Do nothing if search is empty

        // --- NEW SEMANTIC SEARCH LOGIC ---
        isLoading = true;
        toolsGrid.innerHTML = ''; // Clear previous results
        loadingIndicator.innerText = 'Searching for semantically similar tools...';
        loadingIndicator.style.display = 'block';
        allDataLoaded = false; // Reset for new search

        // Track the search event in Google Analytics
        gtag('event', 'search', { search_term: searchTerm });

        try {
            // Invoke the serverless edge function
            const { data, error } = await supabase.functions.invoke('semantic-search', {
                body: { query: searchTerm },
            });

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                data.forEach(tool => {
                    toolsGrid.appendChild(createToolCard(tool));
                });
                loadingIndicator.innerText = `Found ${data.length} matching tools.`;
            } else {
                loadingIndicator.innerText = 'No matching tools found.';
            }

        } catch (error) {
            console.error('Error with semantic search:', error);
            loadingIndicator.innerText = 'Error during search. Please try again.';
        }

        isLoading = false;
        // Search results are not paginated, so we mark as "all loaded"
        allDataLoaded = true;
    };

// ... (其余所有代码，如事件监听、滚动加载、弹窗逻辑等，保持不变) ...
