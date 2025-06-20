document.addEventListener('DOMContentLoaded', () => {
    // 1. 配置常量
    const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';
    const ITEMS_PER_PAGE = 12;
    const SEARCH_ITEMS_PER_PAGE = 20;
    const TARGET_LANGUAGE = 'English';

    // 2. DOM元素初始化
    const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const toolsGrid = document.getElementById('toolsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.querySelector('.search-bar');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // 克隆初始网格作为模板
    const initialGridClone = toolsGrid.cloneNode(true);

    // 3. 状态管理变量
    let isLoading = false;
    let currentSearchTerm = '';
    let state = {
        browse: { page: 1, allLoaded: false },
        search: { page: 0, allLoaded: false }
    };
    let lastScrollTime = 0;

    // 4. 核心功能函数
    function createTagsHTML(tags) {
        if (!tags) return '';
        const tagArray = tags.split(',').map(tag => tag.trim());
        return tagArray.map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    function createToolCard(tool) {
        const card = document.createElement('a');
        card.href = tool.tool_link || '#';
        card.target = '_blank';
        card.className = 'tool-card';
        card.dataset.toolName = tool.tool_name;
        card.dataset.toolRank = tool.ranking;
        
        card.innerHTML = `
            <h3 class="tool-card__name"><span class="rank-badge">${tool.ranking}</span> ${tool.tool_name}</h3>
            <p class="tool-card__description">${tool.description}</p>
            <div class="tool-card__tags">${createTagsHTML(tool.tags)}</div>
        `;
        
        return card;
    }

    function renderTools(tools) {
        if (!tools || tools.length === 0) {
            if (toolsGrid.children.length === 0) {
                toolsGrid.innerHTML = `<p class="no-results">未找到匹配的工具。请尝试其他搜索词。</p>`;
            }
            return;
        }
        
        tools.forEach(tool => {
            toolsGrid.appendChild(createToolCard(tool));
        });
    }

    async function loadBrowseItems() {
        if (isLoading || state.browse.allLoaded) return;
        
        isLoading = true;
        loadingIndicator.innerText = '正在加载工具...';
        loadingIndicator.style.display = 'block';
        
        // 修正索引计算：第一页已经显示，所以下一页从12开始
        const startIndex = (state.browse.page - 1) * ITEMS_PER_PAGE + 12;
        
        try {
            const { data, error } = await supabase
                .from('tools')
                .select('*')
                .eq('language', TARGET_LANGUAGE)
                .order('ranking', { ascending: true })
                .range(startIndex, startIndex + ITEMS_PER_PAGE - 1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                renderTools(data);
                state.browse.page++;
                
                // 检查是否加载了所有数据
                if (data.length < ITEMS_PER_PAGE) {
                    state.browse.allLoaded = true;
                    loadingIndicator.innerText = '所有工具已加载完成。';
                } else {
                    loadingIndicator.style.display = 'none';
                }
            } else if (state.browse.page === 1 && (!data || data.length === 0)) {
                state.browse.allLoaded = true;
                loadingIndicator.innerText = '所有工具已加载完成。';
            } else {
                state.browse.allLoaded = true;
                loadingIndicator.innerText = toolsGrid.children.length > 0 
                    ? '所有工具已加载完成。' 
                    : '未找到工具。';
            }
        } catch (error) {
            console.error('浏览数据加载错误:', error);
            loadingIndicator.innerText = '加载工具时出错，请稍后重试。';
        } finally {
            isLoading = false;
        }
    }

    async function loadSearchResults() {
        if (isLoading || state.search.allLoaded) return;
        
        isLoading = true;
        loadingIndicator.innerText = state.search.page === 0 
            ? '正在搜索相似工具...' 
            : '正在加载更多结果...';
        loadingIndicator.style.display = 'block';
        
        try {
            const { data, error } = await supabase.functions.invoke('semantic-search', {
                body: { 
                    query: currentSearchTerm, 
                    page: state.search.page 
                }
            });
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                renderTools(data);
                state.search.page++;
                
                // 检查是否还有更多结果
                if (data.length < SEARCH_ITEMS_PER_PAGE) {
                    state.search.allLoaded = true;
                    loadingIndicator.innerText = toolsGrid.children.length > 0 
                        ? '已加载所有匹配工具。' 
                        : '未找到匹配工具。';
                } else {
                    loadingIndicator.style.display = 'none';
                }
            } else {
                state.search.allLoaded = true;
                loadingIndicator.innerText = toolsGrid.children.length > 0 
                    ? '已加载所有匹配工具。' 
                    : '未找到匹配工具。';
            }
        } catch (error) {
            console.error('搜索错误:', error);
            loadingIndicator.innerText = '搜索过程中出错，请稍后重试。';
        } finally {
            isLoading = false;
        }
    }

    async function handleSearch(event) {
        event.preventDefault();
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        // 如果搜索词相同且不为空，则不执行新搜索
        if (searchTerm === currentSearchTerm) return;
        
        currentSearchTerm = searchTerm;
        
        // 重置搜索结果网格
        toolsGrid.innerHTML = '';
        loadingIndicator.style.display = 'none';
        
        // 重置加载状态
        isLoading = false;
        state.search = { page: 0, allLoaded: false };
        
        if (!currentSearchTerm) {
            // 重置为浏览模式
            state.browse = { page: 1, allLoaded: false };
            
            // 重新克隆初始网格
            const newGrid = initialGridClone.cloneNode(true);
            toolsGrid.replaceWith(newGrid);
            toolsGrid = document.getElementById('toolsGrid');
            
            // 检查是否需要填充更多内容
            checkAndFillScreen();
            return;
        }
        
        // Google Analytics 事件跟踪
        if (typeof gtag === 'function') {
            gtag('event', 'search', { search_term: searchTerm });
        }
        
        await loadSearchResults();
    }
    
    // 5. 辅助功能函数
    function resetGridToInitial() {
        const newGrid = initialGridClone.cloneNode(true);
        toolsGrid.replaceWith(newGrid);
        return document.getElementById('toolsGrid');
    }
    
    function checkAndFillScreen() {
        if (currentSearchTerm || isLoading) return;
        
        // 如果内容不足一屏，则尝试加载更多
        if (document.documentElement.scrollHeight <= window.innerHeight && !state.browse.allLoaded) {
            loadBrowseItems()
                .then(() => {
                    // 添加延迟避免密集加载
                    setTimeout(checkAndFillScreen, 100);
                })
                .catch(() => {
                    // 错误处理
                });
        }
    }
    
    function isScrolledToBottom() {
        return window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 300;
    }

    // 6. 滚动处理（带节流）
    function handleScroll() {
        const now = Date.now();
        // 200ms节流控制
        if (now - lastScrollTime < 200) return;
        lastScrollTime = now;
        
        if (!isScrolledToBottom() || isLoading) return;
        
        if (currentSearchTerm) {
            loadSearchResults();
        } else {
            loadBrowseItems();
        }
    }

    // 7. 事件监听器
    searchForm.addEventListener('submit', handleSearch);
    window.addEventListener('scroll', handleScroll);
    
    // 8. 初始加载
    checkAndFillScreen();
    
    // 9. 反馈功能
    const openFeedbackBtn = document.getElementById('openFeedbackBtn');
    const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (openFeedbackBtn && feedbackModalOverlay && closeFeedbackBtn && feedbackForm) {
        const feedbackHandler = {
            openModal: () => {
                feedbackModalOverlay.classList.add('active');
            },
            
            closeModal: () => {
                feedbackModalOverlay.classList.remove('active');
                setTimeout(() => {
                    const status = document.getElementById('formStatus');
                    if (status) status.textContent = '';
                    feedbackForm.reset();
                    
                    const submitBtn = document.getElementById('feedbackSubmitBtn');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = '提交反馈';
                    }
                }, 300);
            },
            
            handleSubmit: async (event) => {
                event.preventDefault();
                
                const nameInput = document.getElementById('feedbackName');
                const emailInput = document.getElementById('feedbackEmail');
                const messageInput = document.getElementById('feedbackMessage');
                const submitBtn = document.getElementById('feedbackSubmitBtn');
                const status = document.getElementById('formStatus');
                
                if (!nameInput || !emailInput || !messageInput || !submitBtn || !status) return;
                
                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                const message = messageInput.value.trim();
                
                if (!message) {
                    status.textContent = '消息不能为空。';
                    status.style.color = '#e74c3c';
                    return;
                }
                
                // 禁用按钮并显示加载状态
                submitBtn.disabled = true;
                submitBtn.textContent = '提交中...';
                status.textContent = '';
                
                try {
                    const { error } = await supabase
                        .from('feedback')
                        .insert([{ 
                            name: name || null, 
                            email: email || null, 
                            message: message 
                        }]);
                    
                    if (error) throw error;
                    
                    status.textContent = '感谢您的反馈！';
                    status.style.color = '#2ecc71';
                    
                    // 3秒后关闭模态框
                    setTimeout(feedbackHandler.closeModal, 3000);
                } catch (error) {
                    console.error('提交反馈错误:', error);
                    status.textContent = '提交失败，请重试。';
                    status.style.color = '#e74c3c';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '提交反馈';
                }
            }
        };
        
        openFeedbackBtn.addEventListener('click', feedbackHandler.openModal);
        closeFeedbackBtn.addEventListener('click', feedbackHandler.closeModal);
        feedbackModalOverlay.addEventListener('click', (event) => {
            if (event.target === feedbackModalOverlay) feedbackHandler.closeModal();
        });
        feedbackForm.addEventListener('submit', feedbackHandler.handleSubmit);
    }
    
    // 10. 工具卡点击跟踪
    if (typeof gtag === 'function' && toolsGrid) {
        toolsGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.tool-card');
            if (card) {
                const toolName = card.dataset.toolName;
                const toolRank = card.dataset.toolRank;
                
                gtag('event', 'select_content', {
                    content_type: 'AI工具',
                    item_id: `rank_${toolRank}`,
                    content_name: toolName
                });
            }
        });
    }
});
