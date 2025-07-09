document.addEventListener('DOMContentLoaded', () => {
    // --- DOM SELECTORS ---
    const adminContent = document.getElementById('admin-content');
    const passwordOverlay = document.getElementById('password-prompt-overlay');
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    const loginSubmitBtn = document.getElementById('admin-login-submit');
    const passwordError = document.getElementById('password-error');
    
    // Notification and Modals
    const notificationBell = document.getElementById('notification-bell');
    const notificationCount = document.getElementById('notification-count');
    const queryModal = document.getElementById('query-modal');
    const queryModalCloseBtn = document.getElementById('query-modal-close-btn');
    const queryListContainer = document.getElementById('query-list-modal');

    // Dashboard sections
    const dbStatsContainer = document.getElementById('db-stats');
    const printLogTableBody = document.querySelector('#print-log-table tbody');
    const tableBody = document.querySelector('#candidate-table tbody');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    
    // --- STATE ---
    let candidates = [];
    let queries = [];
    let printLogs = [];

    // --- AUTHENTICATION ---
    const STORED_USERNAME = 'adminpget';
    const STORED_OBFUSCATED_PASS = 'MTIzNDU2Nzg5MTA=';

    function checkLogin() {
        passwordError.textContent = '';
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const obfuscatedInput = btoa(password);

        if (username === STORED_USERNAME && obfuscatedInput === STORED_OBFUSCATED_PASS) {
            passwordOverlay.style.display = 'none';
            adminContent.style.display = 'block';
            initializeAdminPanel();
        } else {
            passwordError.textContent = 'Invalid username or password.';
        }
    }
    
    loginSubmitBtn.addEventListener('click', checkLogin);
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkLogin();
        });
    });

    // --- INITIALIZATION ---
    function initializeAdminPanel() {
        loadData();
        renderDbStats();
        renderQueries();
        renderPrintLogs();
        renderTable();
        populateFilterOptions();
        
        setupCollapsibles();
        setupNotificationModal();

        searchInput.addEventListener('input', renderTable);
        filterSelect.addEventListener('change', renderTable);
    }

    // --- DATA HANDLING ---
    function loadData() {
        candidates = [...allCandidates];
        const storedQueries = localStorage.getItem('pget2025_queries');
        queries = storedQueries ? JSON.parse(storedQueries) : [];
        queries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const storedLogs = localStorage.getItem('pget2025_print_logs');
        printLogs = storedLogs ? JSON.parse(storedLogs) : [];
        printLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    function saveQueries() {
        localStorage.setItem('pget2025_queries', JSON.stringify(queries));
    }
    
    function formatTimestamp(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    // --- UI INTERACTIONS ---
    function setupCollapsibles() {
        const headers = document.querySelectorAll('.admin-section .section-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('active');
            });
        });
    }

    function setupNotificationModal() {
        notificationBell.addEventListener('click', () => {
            queryModal.style.display = 'flex';
        });
        queryModalCloseBtn.addEventListener('click', () => {
            queryModal.style.display = 'none';
        });
        queryModal.addEventListener('click', (e) => {
            if (e.target === queryModal) {
                queryModal.style.display = 'none';
            }
        });
    }

    // --- RENDERING FUNCTIONS ---
    function renderDbStats() {
        dbStatsContainer.innerHTML = `
            <p><strong>Total Candidates:</strong> ${candidates.length}</p>
            <p><strong>Total Programmes:</strong> ${[...new Set(candidates.map(c => c['PROGRAMME APPLIED']))].length}</p>
            <p><strong>Total Admit Downloads:</strong> ${printLogs.length}</p>
        `;
    }

    function renderQueries() {
        queryListContainer.innerHTML = '';
        const unresolvedQueries = queries.filter(q => !q.resolved);
        
        notificationCount.textContent = unresolvedQueries.length;
        if(unresolvedQueries.length > 0) {
            notificationCount.classList.remove('hidden');
        } else {
            notificationCount.classList.add('hidden');
        }

        if (queries.length === 0) {
            queryListContainer.innerHTML = '<p>No user-reported issues found. Everything looks good!</p>';
            return;
        }

        queries.forEach((query, index) => {
            const queryDiv = document.createElement('div');
            queryDiv.className = 'query-item';
            if (query.resolved) {
                queryDiv.classList.add('is-resolved');
            }
            queryDiv.innerHTML = `
                <div class="query-text">
                    <strong>${query.type}:</strong> ${query.details}
                </div>
                <div class="query-actions">
                    <span class="query-timestamp">${formatTimestamp(query.timestamp)}</span>
                    <span class="resolve-toggle ${query.resolved ? 'is-resolved' : ''}" onclick="toggleResolved(${index})" title="Toggle Actioned Status"></span>
                </div>
            `;
            queryListContainer.appendChild(queryDiv);
        });
    }
    
    function renderPrintLogs() {
        printLogTableBody.innerHTML = '';
        if (printLogs.length === 0) {
            printLogTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No download logs found yet.</td></tr>`;
            return;
        }
        printLogs.forEach(log => {
            const row = printLogTableBody.insertRow();
            row.innerHTML = `
                <td>${formatTimestamp(log.timestamp)}</td>
                <td>${log.rollNumber}</td>
                <td>${log.name}</td>
                <td>${log.programme}</td>
            `;
        });
    }

    function populateFilterOptions() {
        filterSelect.innerHTML = '<option value="all">All Programmes</option>';
        const programmes = [...new Set(candidates.map(c => c['PROGRAMME APPLIED']))];
        programmes.sort().forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            filterSelect.appendChild(option);
        });
    }

    function renderTable() {
        tableBody.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filterValue = filterSelect.value;
        const filteredCandidates = candidates.filter(candidate => {
            const nameMatch = candidate['NAME OF THE APPLICANT'].toLowerCase().includes(searchTerm);
            const rollMatch = (candidate['ROLL NUMBER'] || '').toLowerCase().includes(searchTerm);
            const programmeMatch = (filterValue === 'all' || candidate['PROGRAMME APPLIED'] === filterValue);
            return (nameMatch || rollMatch) && programmeMatch;
        });

        if (filteredCandidates.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No candidates match the current search/filter.</td></tr>`;
        } else {
            filteredCandidates.forEach(candidate => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${candidate['ROLL NUMBER'] || ''}</td>
                    <td>${candidate['NAME OF THE APPLICANT']}</td>
                    <td>${candidate['PROGRAMME APPLIED']}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }

    // --- GLOBAL ACTIONS ---
    window.toggleResolved = (index) => {
        queries[index].resolved = !queries[index].resolved;
        saveQueries();
        renderQueries(); // Re-render to update both the list and the notification badge
    };
});