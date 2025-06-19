// --- CONFIGURATION ---
const SUPABASE_URL = 'https://cxofdwevigzyyqilfnak.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4b2Zkd2V2aWd6eXlxaWxmbmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjExMjEsImV4cCI6MjA2NTYzNzEyMX0.lCU-Gh6V6gSH6maMUa9aUoO_WEsBtVJ89BugrieB36k';

// --- INITIALIZATION ---
const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const fileUploader = document.getElementById('fileUploader');
const processButton = document.getElementById('processButton');
const logArea = document.getElementById('logArea');

// --- FUNCTIONS ---
function log(message) {
    console.log(message);
    logArea.textContent += message + '\n';
    logArea.scrollTop = logArea.scrollHeight;
}

async function processFile() {
    logArea.textContent = ''; // Clear log
    processButton.disabled = true;
    processButton.textContent = 'Processing...';

    const file = fileUploader.files[0];
    if (!file) {
        log('❌ Error: No file selected.');
        processButton.disabled = false;
        processButton.textContent = 'Process File';
        return;
    }

    log(`Step 1: Reading file "${file.name}"...`);

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const newTools = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (newTools.length === 0) {
            throw new Error('No data found in the file.');
        }
        log(`Step 2: Found ${newTools.length} records in the file.`);

        log('Step 3: Fetching existing tool links from the database...');
        const { data: existingTools, error: fetchError } = await supabase
            .from('tools')
            .select('tool_link');

        if (fetchError) throw fetchError;

        const existingLinks = new Set(existingTools.map(t => t.tool_link));
        log(` -> Found ${existingLinks.size} existing tools.`);

        log('Step 4: Filtering for new tools (deduplication)...');
        const toolsToInsert = [];
        let skippedCount = 0;

        for (const tool of newTools) {
            const toolLink = tool.tool_link?.trim();
            if (toolLink && !existingLinks.has(toolLink)) {
                toolsToInsert.push({
                    ranking: tool.ranking,
                    tool_name: tool.tool_name,
                    tool_link: toolLink,
                    description: tool.description,
                    tags: tool.tags,
                    language: tool.language || 'English',
                });
                existingLinks.add(toolLink); // Avoid duplicates within the same file
            } else {
                skippedCount++;
            }
        }
        log(` -> Found ${toolsToInsert.length} new tools to add.`);
        log(` -> Skipped ${skippedCount} duplicate or invalid records.`);

        if (toolsToInsert.length > 0) {
            log('Step 5: Inserting new tools into the database...');
            const { error: insertError } = await supabase
                .from('tools')
                .insert(toolsToInsert);

            if (insertError) throw insertError;
            log(' -> Successfully inserted new tools!');
        }

        log('\n✅ --- Process Complete! ---');

    } catch (error) {
        log(`\n❌ --- An error occurred ---`);
        log(error.message);
    } finally {
        processButton.disabled = false;
        processButton.textContent = 'Process File';
    }
}

// --- EVENT LISTENER ---
processButton.addEventListener('click', processFile);
