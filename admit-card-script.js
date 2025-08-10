document.addEventListener('DOMContentLoaded', () => {

    
// --- DARK MODE LOGIC ---
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const darkModeWarningModal = document.getElementById('dark-mode-warning-modal');
    const darkModeWarningCloseBtn = document.getElementById('dark-mode-warning-close-btn');

    // REMOVE hasSeenDarkModeWarning and markSeenDarkModeWarning functions:
    // const hasSeenDarkModeWarning = () => localStorage.getItem('seenDarkModeWarning') === 'true';
    // const markSeenDarkModeWarning = () => localStorage.setItem('seenDarkModeWarning', 'true');

    // Initial check on page load
    if (darkModeToggle && localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');

                // SHOW WARNING EVERY TIME dark mode is enabled
                if (darkModeWarningModal) { // Just check if the modal element exists
                    openModal(darkModeWarningModal); // Use your existing openModal function
                    // REMOVE markSeenDarkModeWarning();
                }
            } else {
                body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
            }
        });
    }

    // Add event listener for the warning modal close button
    if (darkModeWarningCloseBtn) {
        darkModeWarningCloseBtn.addEventListener('click', () => {
            closeModal(darkModeWarningModal);
        });
    }

    // Ensure clicks outside modal also close it for the warning modal
    if (darkModeWarningModal) {
        document.addEventListener('click', (e) => {
            if (e.target === darkModeWarningModal && darkModeWarningModal.classList.contains('modal-active')) {
                closeModal(darkModeWarningModal);
            }
        });
    }


    // --- NOTIFICATION LOADER ---
    const notificationList = document.getElementById('notification-list');
    if (notificationList && typeof notifications !== 'undefined' && notifications.length > 0) {
        const now = new Date();
        const twentyFourHoursAgo = now.getTime() - (24 * 60 * 60 * 1000);
        notificationList.innerHTML = '';
        notifications.forEach(note => {
            const li = document.createElement('li');
            li.classList.add('notification-item'); // Add a class to the li for flexible styling if needed

            // Create Date object from timestamp (e.g., "2025-07-05T21:12:00Z")
            const noteTimestampAsDate = new Date(note.timestamp);

            // Format date as DD-MM-YYYY
            const displayDate = noteTimestampAsDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '-');

            // Format time as HH:MM (24-hour)
            const displayTime = noteTimestampAsDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            // Start building the notification HTML
            let noteHTML = `<span class="notification-text">${note.text}</span>`; // Wrap original text in a span

            // Add the date and time "badges"
            noteHTML += `
                <span class="notification-date-badge">${displayDate}</span>
                <span class="notification-time-badge">${displayTime}</span>
            `;

            // Add the "NEW" badge if applicable
            if (noteTimestampAsDate.getTime() > twentyFourHoursAgo) {
                noteHTML += ' <span class="new-badge">NEW</span>';
            }

            li.innerHTML = noteHTML;
            notificationList.appendChild(li);
        });
    }



    // --- DATABASE LOADING LOGIC ---
    // Make sure 'allCandidates' is globally available, typically from 'database.js'
    // If it's not defined, the script will stop here.
    if (typeof allCandidates === 'undefined' || !Array.isArray(allCandidates)) {
        console.error('Candidate database is not loaded or invalid. Make sure database.js is loaded correctly.');
        // Optionally, display a user-friendly error message on the page.
        const initialViewWrapper = document.querySelector('.initial-view-wrapper');
        if (initialViewWrapper) {
            initialViewWrapper.innerHTML = '<div class="content-panel"><p style="color:red; text-align:center;">Error loading candidate data. Please try again later or contact support.</p></div>';
        }
        return;
    }

    // --- DOM ELEMENT SELECTION ---
    const mainWrapper = document.querySelector('.main-content-wrapper');
    const previewViewWrapper = mainWrapper.querySelector('.preview-view-wrapper');
    const candidateNameInput = document.getElementById('candidate-name');
    const nameSuggestions = document.getElementById('name-suggestions');
    const searchResultDiv = document.getElementById('search-result');
    const secondaryCriteriaContainer = document.getElementById('secondary-criteria');
    const notFoundContainer = document.getElementById('not-found-container');
    const findRecordBtn = document.getElementById('find-record-btn');

    // Modals
    const instructionModal = document.getElementById('instruction-modal');
    const findRecordModal = document.getElementById('find-record-modal');

    let currentCandidate = null;

    function resetFlow() {
        mainWrapper.classList.remove('layout-preview-active');
        if (secondaryCriteriaContainer) {
            secondaryCriteriaContainer.innerHTML = '';
            secondaryCriteriaContainer.classList.remove('visible');
        }
        if (searchResultDiv) searchResultDiv.textContent = '';
        if (notFoundContainer) notFoundContainer.style.display = 'block'; // Make it visible by default after a search attempt
        if (candidateNameInput) candidateNameInput.value = '';
        currentCandidate = null;
        // Hide the preview wrapper completely when resetting flow
        previewViewWrapper.innerHTML = ''; // Clear content
    }

    function handleNameSelection(selectedName) {
        const matchingCandidates = allCandidates.filter(c => c['NAME OF THE APPLICANT'] === selectedName);
        if (matchingCandidates.length > 0) {
            populateSecondaryCriteria(matchingCandidates);
        }
    }

    function populateSecondaryCriteria(candidates) {
        const selectHTML = `
            <p class="step-description"><strong>Step 2:</strong> Select your details to confirm.</p>
            <div class="form-group"><label for="father-select">Father's Name:</label><select id="father-select"></select></div>
            <div class="form-group"><label for="gender-select">Gender:</label><select id="gender-select"></select></div>
            <div class="form-group"><label for="subject-select">Applied Programme:</label><select id="subject-select"></select></div>
            <p class="confirmation-question">Is this information correct?</p>
            <div class="confirmation-buttons">
                <button type="button" id="confirm-yes-btn">Yes, This is me</button>
                <button type="button" id="confirm-no-btn" class="secondary-button">No, Advanced Search</button>
            </div>
        `;
        secondaryCriteriaContainer.innerHTML = selectHTML;
        secondaryCriteriaContainer.classList.add('visible');

        const fatherSelect = document.getElementById('father-select');
        const genderSelect = document.getElementById('gender-select');
        const subjectSelect = document.getElementById('subject-select');

        // Modified populate function to add a default "-- Select --" option
        const populate = (select, key, defaultPrompt) => { // Added defaultPrompt parameter
            select.innerHTML = ''; // Clear any existing options
            // Add the default "Please Select" option first
            const defaultOption = document.createElement('option');
            defaultOption.value = ''; // Important: Value should be empty or a special indicator
            defaultOption.textContent = `-- Select ${defaultPrompt} --`;
            defaultOption.disabled = true; // Make this option unselectable
            defaultOption.selected = true; // Make this option pre-selected
            select.appendChild(defaultOption);

            const options = [...new Set(candidates.map(c => c[key]))];
            options.sort((a, b) => (a || '').localeCompare(b || ''));
            options.forEach(val => {
                if (val) { // Ensure value is not null/empty before adding
                    select.add(new Option(val, val));
                }
            });
        };

        // Call populate with specific prompts
        populate(fatherSelect, "FATHER'S NAME", "Father's Name");
        populate(genderSelect, 'GENDER', "Gender");
        populate(subjectSelect, 'PROGRAMME APPLIED', "Programme");

        document.getElementById('confirm-yes-btn').addEventListener('click', onConfirmYes);
        // Changed to open advanced modal directly
        document.getElementById('confirm-no-btn').addEventListener('click', openFindRecordModal);
    }

    function onConfirmYes() {
        const name = candidateNameInput.value;
        const father = document.getElementById('father-select').value;
        const gender = document.getElementById('gender-select').value;
        const subject = document.getElementById('subject-select').value;

        // Add validation to ensure all dropdowns are selected
        if (!father || !gender || !subject) {
            searchResultDiv.textContent = 'Please select Father\'s Name, Gender, and Programme Applied.';
            return; // Stop the function if validation fails
        }

        // Corrected syntax for FATHER'S NAME key access
        const finalCandidate = allCandidates.find(c =>
            c['NAME OF THE APPLICANT'] === name &&
            c["FATHER'S NAME"] === father &&
            c['GENDER'] === gender &&
            c['PROGRAMME APPLIED'] === subject
        );
        if (finalCandidate) {
            searchResultDiv.textContent = '';
            displayAdmitCard(finalCandidate);
        } else {
            searchResultDiv.textContent = 'Could not find a unique record. Please refine your search or try the advanced search.';
            // Log this specific scenario for debugging/support
            const queries = JSON.parse(localStorage.getItem('pget2025_queries') || '[]');
            queries.push({
                type: 'Confirmation Mismatch',
                details: `User selected name "${name}" but additional criteria (Father: ${father}, Gender: ${gender}, Programme: ${subject}) did not yield a unique match.`,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('pget2025_queries', JSON.stringify(queries));
        }
    }

    function displayAdmitCard(data) {
        currentCandidate = data;

        const previewHTML = `
            <div class="preview-admit-card">
                ${getAdmitCardInnerHtml(data)}
            </div>
            <div class="content-panel actions-panel">
                <h4>Actions</h4>
                <button id="print-admit-card-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.74.14 1.095.272.367.138.661.34.868.582A2.25 2.25 0 0118 8.5v4.5a2.25 2.25 0 01-2.25 2.25H4.25A2.25 2.25 0 012 13V8.5a2.25 2.25 0 011.033-1.844.887.887 0 01.868-.582 5.024 5.024 0 001.095-.272V2.75zm1.75-.25a.25.25 0 00-.25.25v2.5c0 .138.112.25.25.25h6.5a.25.25 0 00.25-.25v-2.5a.25.25 0 00-.25-.25h-6.5zm-3.5 6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h14.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75H3.25z" clip-rule="evenodd" /></svg>
                    Print Admit Card
                </button>
                <button id="new-search-btn" class="secondary-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" /></svg>
                    Start New Search
                </button>
            </div>
        `;

        if (previewViewWrapper) {
            previewViewWrapper.innerHTML = previewHTML;
            mainWrapper.classList.add('layout-preview-active');
            document.getElementById('print-admit-card-btn').addEventListener('click', () => {
                if (currentCandidate) {
                    const printLogs = JSON.parse(localStorage.getItem('pget2025_print_logs') || '[]');
                    printLogs.push({
                        timestamp: new Date().toISOString(),
                        rollNumber: currentCandidate['ROLL NUMBER'],
                        name: currentCandidate['NAME OF THE APPLICANT'],
                        programme: currentCandidate['PROGRAMME APPLIED'],
                    });
                    localStorage.setItem('pget2025_print_logs', JSON.stringify(printLogs));
                }
                window.print();
            });
            document.getElementById('new-search-btn').addEventListener('click', resetFlow);
        }
    }

    function getAdmitCardInnerHtml(data) {
        return `
            <div class="admit-card-a4">
                <div class="ac-watermark"><img src="Logo.png" alt="Watermark"></div>
                <div class="ac-content">
                    <header class="ac-header">
                        <div class="ac-logo-area"><img src="Logo.png" alt="Logo" class="ac-logo"></div>
                        <div class="ac-title-area">
                            <h1>BHATTADEV UNIVERSITY</h1>
                            <p>Pathsala, Bajali, 781325, Assam</p>
                            <h2>ADMIT CARD</h2>
                            <h3>Ph.D. Entrance Test (PET) - 2025</h3>
                        </div>
                    </header>
                    <section class="ac-general-instructions-box">
                        <h4><u>General Instructions:</u></h4>
                        <ol>
                            <li>You are asked to bring one valid <strong>Photo ID Proof</strong> (e.g., Aadhaar Card, PAN Card, Driving License, Voter ID, or Passport) on the day of the entrance test.</li>
                            <li>You must bring the successful <strong>payment receipt </strong> to examination on the day of the entrance test.</li>
                            <li>Candidates must bring their own <strong class="text-blue">blue</strong>/<strong class="text-black">black</strong> inked pen. No borrowing of stationery will be allowed during the exam.</li>
                        </ol>
                        _______________________________________________
                    </section>
                    <hr class="admit-card-separator">
                    <section class="ac-candidate-details">
                        <div class="ac-details-grid">
                            <div class="ac-detail-label">Roll Number</div><div class="ac-detail-value">${data['ROLL NUMBER'] || 'N/A'}</div>
                            <div class="ac-detail-label">Candidate's Name</div><div class="ac-detail-value">${data['NAME OF THE APPLICANT'] || 'N/A'}</div>
                            <div class="ac-detail-label">Father's Name</div><div class="ac-detail-value">${data["FATHER'S NAME"] || 'N/A'}</div>
                            <div class="ac-detail-label">Gender</div><div class="ac-detail-value">${data['GENDER'] || 'N/A'}</div>
                            <div class="ac-detail-label">Examination Centre</div><div class="ac-detail-value">BHATTADEV UNIVERSITY</div>
                            <div class="ac-detail-label"> </div><div class="ac-detail-value">${data['HALL NO'] || ' '}</div>
                        </div>
                        <div class="ac-details-right"><div class="ac-photo-box">Paste a recent passport size photograph here. (Do not staple)</div></div>
                    </section>
                    <section class="ac-data-table">
                        <table>
                            <thead><tr><th>Programme Applied For</th><th>Date of Entrance Test</th><th>Time of Entrance Test</th></tr></thead>
                            <tbody><tr><td>${data['PROGRAMME APPLIED'] || 'N/A'}</td><td>${formatDate(data['DATE OF ENTRANCE TEST'])}</td><td>${data['TIME OF ENTRANCE TEST'] || 'N/A'}</td></tr></tbody>
                        </table>
                    </section>
                    <section class="ac-signatures">
                        <div class="ac-sign-box"><div class="ac-sign-placeholder"></div><p>Signature of Candidate</p></div>
                        <div class="ac-sign-box"><div class="ac-sign-placeholder"></div><p>Signature of Invigilator</p></div>
                        <div class="ac-sign-box controller-sign"><img src="sign.png" alt="Signature" class="controller-sign-img"><p>Dr. Utpal Misra<br><strong>Controller of Examinations</strong></p></div>
                    </section>
                    <section class="ac-final-instructions">
                        <h2 class="instruction-heading"><u>INSTRUCTIONS TO THE CANDIDATES</u></h2>
                        <ol class="ac-detailed-list">
                            <li>The Candidates will be permitted to occupy their allotted seats 20 minutes before the scheduled commencement of the examination.</li>
                            <li>The Candidates must carry the Admit Card in original to the examination hall on the day of examinations.</li>
                            <li>A Candidate must not write his/her name, institution name, phone no. or put any identifying mark anywhere in the Answer Script.</li>
                            <li>Candidates are forbidden to carry into the Examination Hall any book, note paper, writing, scribbling or other materials except Admit Cards.</li>
                            <li class="highlight-red">Use of electronic gadgets / Mobile phone is not allowed inside the Examination Hall.</li>
                            <li>The Officer-in-Charge is fully empowered to take appropriate decisions in case of any breach of the rules or in cases of adoption of any unfair means by the Candidates.</li>
                            <li>At the end of the examination, a candidate has to hand over the Questions - Answer Booklet to the invigilator.</li>
                            <li>This examination will commence on the date according to the Programme given in admit card.</li>
                            <li>Candidates are warned that any attempt to use any unfair means at the examination will render them liable to expulsion by the Officer-In-Charge from the examination or any part thereof.</li>
                        </ol>
                    </section>
                </div>
            </div>`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        // Date constructor expects YYYY-MM-DD for reliable parsing, or YYYY, MM-1, DD
        const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
        if (isNaN(dateObject.getTime())) return dateStr;
        const day = dateObject.getDate().toString().padStart(2, '0');
        const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObject.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Generic modal open function
    function openModal(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'flex';
        // Force reflow to ensure display change is rendered before opacity/transform change
        modalElement.offsetWidth;
        modalElement.classList.add('modal-active');
    }

    // Generic modal close function
    function closeModal(modalElement) {
        if (!modalElement) return;
        modalElement.classList.remove('modal-active');
        modalElement.addEventListener('transitionend', function handler() {
            modalElement.style.display = 'none';
            modalElement.removeEventListener('transitionend', handler);
        }, {
            once: true
        }); // Use { once: true } to automatically remove listener
    }

    function openFindRecordModal() {
        if (!findRecordModal) return;
        populateModalProgrammeSelect();
        // Only pre-fill name if it's already typed in the main input
        if (candidateNameInput && candidateNameInput.value.trim().length >= 3) {
            findRecordModal.querySelector('#modal-name-input').value = candidateNameInput.value.trim();
        } else {
            findRecordModal.querySelector('#modal-name-input').value = '';
        }
        findRecordModal.querySelector('#modal-search-results').innerHTML = '<p>Select your programme and start typing your name.</p>';
        openModal(findRecordModal);
        // If a valid name query already exists, perform initial search in modal
        if (findRecordModal.querySelector('#modal-name-input').value.length >= 3 && findRecordModal.querySelector('#modal-programme-select').value) {
            searchInModal();
        }
    }

    if (candidateNameInput) {
        candidateNameInput.addEventListener('input', () => {
            if (mainWrapper.classList.contains('layout-preview-active')) {
                resetFlow();
            }
            const query = candidateNameInput.value.toLowerCase();
            if (nameSuggestions) nameSuggestions.innerHTML = '';
            secondaryCriteriaContainer.classList.remove('visible'); // Hide secondary criteria on new input
            if (query.length < 3) {
                if (notFoundContainer) notFoundContainer.style.display = 'none';
                return;
            }
            if (notFoundContainer) notFoundContainer.style.display = 'block';

            const filtered = allCandidates.filter(c =>
                c['NAME OF THE APPLICANT'] && c['NAME OF THE APPLICANT'].toLowerCase().includes(query)
            );
            const uniqueNames = [...new Set(filtered.map(item => item['NAME OF THE APPLICANT']))];
            // Sort unique names alphabetically
            uniqueNames.sort((a, b) => a.localeCompare(b));

            nameSuggestions.innerHTML = '';
            if (uniqueNames.length > 0) {
                uniqueNames.slice(0, 5).forEach(name => {
                    const div = document.createElement('div');
                    div.textContent = name;
                    div.classList.add('suggestion-item');
                    div.addEventListener('click', () => {
                        candidateNameInput.value = name;
                        nameSuggestions.innerHTML = '';
                        notFoundContainer.style.display = 'none';
                        handleNameSelection(name);
                    });
                    if (nameSuggestions) nameSuggestions.appendChild(div);
                });
            } else {
                // No suggestions found, keep secondary criteria hidden
                secondaryCriteriaContainer.classList.remove('visible');
            }
        });
    }

    if (findRecordBtn) findRecordBtn.addEventListener('click', openFindRecordModal);

    function populateModalProgrammeSelect() {
        if (!findRecordModal) return;
        const modalProgrammeSelect = findRecordModal.querySelector('#modal-programme-select');
        modalProgrammeSelect.innerHTML = '<option value="">-- Select Programme --</option>';
        const programmes = [...new Set(allCandidates.map(c => c['PROGRAMME APPLIED']))];
        programmes.sort().forEach(p => {
            if (p) {
                const option = document.createElement('option');
                option.value = p;
                option.textContent = p;
                modalProgrammeSelect.appendChild(option);
            }
        });
    }

    function searchInModal() {
        if (!findRecordModal) return;
        const modalProgrammeSelect = findRecordModal.querySelector('#modal-programme-select');
        const modalNameInput = findRecordModal.querySelector('#modal-name-input');
        const modalSearchResults = findRecordModal.querySelector('#modal-search-results');

        const programme = modalProgrammeSelect.value;
        const nameQuery = modalNameInput.value.toLowerCase().trim();

        if (!programme || nameQuery.length < 3) {
            modalSearchResults.innerHTML = '<p>Please select a programme and enter at least 3 letters of your name.</p>';
            return;
        }

        const results = allCandidates.filter(c =>
            c['PROGRAMME APPLIED'] === programme &&
            c['NAME OF THE APPLICANT'].toLowerCase().includes(nameQuery)
        );
        // Sort results alphabetically by name for better UX
        results.sort((a, b) => (a['NAME OF THE APPLICANT'] || '').localeCompare(b['NAME OF THE APPLICANT'] || ''));

        modalSearchResults.innerHTML = '';

        if (results.length === 0) {
            modalSearchResults.innerHTML = '<p>No matching records found. Please check your spelling or contact support if the issue persists.</p>';
        } else {
            results.forEach(candidate => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'modal-result-item';
                // Corrected syntax for FATHER'S NAME key access
                itemDiv.innerHTML = `<strong>${candidate['NAME OF THE APPLICANT']}</strong><span>Father's Name: ${candidate["FATHER'S NAME"]}</span><br><span>Gender: ${candidate['GENDER']}</span><br><span>Roll No: ${candidate['ROLL NUMBER'] || 'N/A'}</span>`;
                itemDiv.addEventListener('click', () => selectCandidateFromModal(candidate));
                modalSearchResults.appendChild(itemDiv);
            });
        }
    }

    function selectCandidateFromModal(candidate) {
        closeModal(findRecordModal); // Use the new close function
        // Pre-fill the main input with the selected name from modal
        if (candidateNameInput) {
            candidateNameInput.value = candidate['NAME OF THE APPLICANT'];
        }
        // Hide name suggestions after selection
        if (nameSuggestions) nameSuggestions.innerHTML = '';
        if (notFoundContainer) notFoundContainer.style.display = 'none';

        // Now call handleNameSelection to populate the secondary criteria,
        // but DO NOT pre-select values. The user will select manually.
        handleNameSelection(candidate['NAME OF THE APPLICANT']);

        secondaryCriteriaContainer.classList.add('visible'); // Ensure it's visible
        // Do NOT call displayAdmitCard here. It should only be called after user confirms via "Yes, this is me" button.
    }

    if (findRecordModal) {
        findRecordModal.querySelector('.modal-close').addEventListener('click', () => {
            closeModal(findRecordModal);
        });
        findRecordModal.querySelector('#modal-programme-select').addEventListener('change', searchInModal);
        findRecordModal.querySelector('#modal-name-input').addEventListener('input', searchInModal);
        findRecordModal.querySelector('#modal-not-found-btn').addEventListener('click', () => {
            // Log the 'not found' query before closing modal
            const queries = JSON.parse(localStorage.getItem('pget2025_queries') || '[]');
            queries.push({
                type: 'Advanced Search Not Found',
                details: `User clicked 'My name is not in this list' after searching for Programme: ${findRecordModal.querySelector('#modal-programme-select').value || 'N/A'}, Name Query: ${findRecordModal.querySelector('#modal-name-input').value || 'N/A'}.`,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('pget2025_queries', JSON.stringify(queries));

            closeModal(findRecordModal);
            if (instructionModal) openModal(instructionModal);
        });
    }

    if (instructionModal) {
        instructionModal.querySelector('.modal-close').addEventListener('click', () => {
            closeModal(instructionModal);
        });
    }

    document.addEventListener('click', (e) => {
        // Hide name suggestions if click is outside autocomplete container
        if (nameSuggestions && !e.target.closest('.autocomplete')) {
            nameSuggestions.innerHTML = '';
        }

        // Close modals if click is outside modal content, but only if they are active
        if (findRecordModal && e.target === findRecordModal && findRecordModal.classList.contains('modal-active')) {
            closeModal(findRecordModal);
        }
        if (instructionModal && e.target === instructionModal && instructionModal.classList.contains('modal-active')) {
            closeModal(instructionModal);
        }
    });
});