document.addEventListener('DOMContentLoaded', () => {
    // --- DATABASE LOADING LOGIC ---
    const storedCandidates = localStorage.getItem('pget2025_candidates');
    if (storedCandidates) {
        window.allCandidates = JSON.parse(storedCandidates);
    }

    // --- DOM ELEMENT SELECTION ---
    const layoutWrapper = document.querySelector('.main-content-wrapper');
    const candidateNameInput = document.getElementById('candidate-name');
    const nameSuggestions = document.getElementById('name-suggestions');
    const searchResultDiv = document.getElementById('search-result');
    const secondaryCriteriaContainer = document.getElementById('secondary-criteria');
    const fatherSelect = document.getElementById('father-select');
    const genderSelect = document.getElementById('gender-select');
    const subjectSelect = document.getElementById('subject-select');
    const confirmationSection = document.getElementById('confirmation-section');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    const admitCardView = document.getElementById('admit-card-view');
    const printBtn = document.getElementById('print-btn');
    const notFoundContainer = document.getElementById('not-found-container');
    const findRecordBtn = document.getElementById('find-record-btn');
    
    // Instruction Modal
    const instructionModal = document.getElementById('instruction-modal');
    const instructionModalCloseBtn = document.getElementById('instruction-modal-close-btn');

    // Find Record Modal
    const findRecordModal = document.getElementById('find-record-modal');
    const findRecordModalCloseBtn = document.getElementById('find-record-modal-close-btn');
    const modalProgrammeSelect = document.getElementById('modal-programme-select');
    const modalNameInput = document.getElementById('modal-name-input');
    const modalSearchResults = document.getElementById('modal-search-results');
    const modalNotFoundBtn = document.getElementById('modal-not-found-btn');

    // --- STATE MANAGEMENT ---
    let currentCandidate = null; // To track the currently displayed candidate for logging
    
    // --- INITIALIZATION ---
    if (typeof allCandidates === 'undefined' || allCandidates.length === 0) {
        searchResultDiv.textContent = 'Error: Candidate database could not be loaded.';
        return;
    }

    // --- CORE FUNCTIONS ---
    function resetFlow() {
        layoutWrapper.classList.remove('layout-active');
        admitCardView.classList.remove('visible');
        secondaryCriteriaContainer.classList.remove('visible');
        confirmationSection.classList.remove('visible');
        printBtn.classList.remove('visible');
        searchResultDiv.textContent = '';
        notFoundContainer.style.display = 'none';
        currentCandidate = null;
    }

    function handleNameSelection(selectedName) {
        const matchingCandidates = allCandidates.filter(c => c['NAME OF THE APPLICANT'] === selectedName);
        if (matchingCandidates.length > 0) {
            populateSecondaryCriteria(matchingCandidates);
            secondaryCriteriaContainer.classList.add('visible');
            confirmationSection.classList.add('visible');
        }
    }

    function populateSecondaryCriteria(candidates) {
        const populateSelect = (selectElement, dataKey) => {
            selectElement.innerHTML = '';
            const options = [...new Set(candidates.map(c => c[dataKey]))];
            options.forEach(optionValue => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionValue;
                selectElement.appendChild(option);
            });
        };
        populateSelect(fatherSelect, "FATHER'S NAME");
        populateSelect(genderSelect, 'GENDER');
        populateSelect(subjectSelect, 'PROGRAMME APPLIED');
    }

    function displayAdmitCard(data) {
        currentCandidate = data; // Set the current candidate for logging
        document.getElementById('admit-roll').textContent = data['ROLL NUMBER'] || 'N/A';
        document.getElementById('admit-name').textContent = data['NAME OF THE APPLICANT'] || 'N/A';
        document.getElementById('admit-father').textContent = data["FATHER'S NAME"] || 'N/A';
        document.getElementById('admit-gender').textContent = data['GENDER'] || 'N/A';
        document.getElementById('admit-programme').textContent = data['PROGRAMME APPLIED'] || 'N/A';
        
        if (data['DATE OF ENTRANCE TEST']) {
            const parts = data['DATE OF ENTRANCE TEST'].split('-');
            const dateObject = new Date(parts[2], parts[1] - 1, parts[0]);
            if (!isNaN(dateObject.getTime())) {
                const day = dateObject.getDate().toString().padStart(2, '0');
                const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
                const year = dateObject.getFullYear();
                document.getElementById('admit-date').textContent = `${day}-${month}-${year}`;
            } else {
                document.getElementById('admit-date').textContent = data['DATE OF ENTRANCE TEST'];
            }
        } else {
            document.getElementById('admit-date').textContent = 'N/A';
        }
        document.getElementById('admit-time').textContent = data['TIME OF ENTRANCE TEST'] || 'N/A';
        
        layoutWrapper.classList.add('layout-active');
        admitCardView.classList.add('visible');
        printBtn.classList.add('visible');
    }

    // --- EVENT LISTENERS ---
    candidateNameInput.addEventListener('input', () => {
        resetFlow();
        const query = candidateNameInput.value.toLowerCase();
        nameSuggestions.innerHTML = '';
        if (query.length < 3) {
            notFoundContainer.style.display = 'none';
            return;
        }
        notFoundContainer.style.display = 'block';

        const filtered = allCandidates.filter(c => 
            c['NAME OF THE APPLICANT'] && c['NAME OF THE APPLICANT'].toLowerCase().includes(query)
        );
        const uniqueNames = [...new Set(filtered.map(item => item['NAME OF THE APPLICANT']))];
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
            nameSuggestions.appendChild(div);
        });
    });

    confirmYesBtn.addEventListener('click', () => {
        const selectedName = candidateNameInput.value;
        const selectedFather = fatherSelect.value;
        const selectedGender = genderSelect.value;
        const selectedSubject = subjectSelect.value;
        const finalCandidate = allCandidates.find(c => 
            c['NAME OF THE APPLICANT'] === selectedName &&
            c["FATHER'S NAME"] === selectedFather &&
            c['GENDER'] === selectedGender &&
            c['PROGRAMME APPLIED'] === selectedSubject
        );
        if (finalCandidate) {
            searchResultDiv.textContent = '';
            displayAdmitCard(finalCandidate);
            confirmationSection.classList.remove('visible');
        } else {
            searchResultDiv.textContent = 'Could not find a unique record with the selected details.';
        }
    });

    confirmNoBtn.addEventListener('click', () => {
        const name = candidateNameInput.value.trim();
        const father = fatherSelect.value;
        const gender = genderSelect.value;
        const programme = subjectSelect.value;

        const queries = JSON.parse(localStorage.getItem('pget2025_queries') || '[]');
        queries.push({
            type: 'Data Mismatch (Confirmation)',
            details: `User found their name "${name}" but clicked "No" on the confirmation step. The selected (but incorrect) details were: Father: ${father}, Gender: ${gender}, Programme: ${programme}. Opening advanced search.`,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('pget2025_queries', JSON.stringify(queries));
        
        // Open the advanced find record modal
        populateModalProgrammeSelect();
        modalNameInput.value = name; // Pre-fill the name
        findRecordModal.style.display = 'flex';
        searchInModal(); // Immediately perform a search with the pre-filled name and selected programme
    });

    // --- FIND YOUR RECORD MODAL LOGIC ---

    function populateModalProgrammeSelect() {
        modalProgrammeSelect.innerHTML = '<option value="">-- Select Programme --</option>';
        const programmes = [...new Set(allCandidates.map(c => c['PROGRAMME APPLIED']))];
        programmes.sort().forEach(p => {
            if (p) { // Ensure programme name is not empty
                const option = document.createElement('option');
                option.value = p;
                option.textContent = p;
                modalProgrammeSelect.appendChild(option);
            }
        });
    }

    function searchInModal() {
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

        modalSearchResults.innerHTML = ''; // Clear previous results

        if (results.length === 0) {
            modalSearchResults.innerHTML = '<p>No matching records found. Please check your spelling or contact support if the issue persists.</p>';
        } else {
            results.forEach(candidate => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'modal-result-item';
                itemDiv.innerHTML = `
                    <strong>${candidate['NAME OF THE APPLICANT']}</strong>
                    <span>Father's Name: ${candidate["FATHER'S NAME"]}</span><br>
                    <span>Gender: ${candidate['GENDER']}</span><br>
                    <span>Roll No: ${candidate['ROLL NUMBER'] || 'N/A'}</span>
                `;
                itemDiv.addEventListener('click', () => {
                    selectCandidateFromModal(candidate);
                });
                modalSearchResults.appendChild(itemDiv);
            });
        }
    }

    function selectCandidateFromModal(candidate) {
        findRecordModal.style.display = 'none';
        searchResultDiv.textContent = '';
        nameSuggestions.innerHTML = '';
        
        candidateNameInput.value = candidate['NAME OF THE APPLICANT'];
        
        populateSecondaryCriteria([candidate]); 
        fatherSelect.value = candidate["FATHER'S NAME"];
        genderSelect.value = candidate['GENDER'];
        subjectSelect.value = candidate['PROGRAMME APPLIED'];
        
        secondaryCriteriaContainer.classList.add('visible');
        confirmationSection.classList.remove('visible');
        notFoundContainer.style.display = 'block';
        displayAdmitCard(candidate);
    }

    findRecordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        populateModalProgrammeSelect();
        modalNameInput.value = "";
        modalSearchResults.innerHTML = "<p>Select your programme and start typing your name.</p>";
        findRecordModal.style.display = 'flex';
    });
    
    modalNotFoundBtn.addEventListener('click', () => {
        const queries = JSON.parse(localStorage.getItem('pget2025_queries') || '[]');
        queries.push({
            type: 'Name Not Found (Advanced Search)',
            details: `User searched in the 'Find Your Record' modal for programme "${modalProgrammeSelect.value}" with name query "${modalNameInput.value}" and clicked the 'not in list' button.`,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('pget2025_queries', JSON.stringify(queries));

        findRecordModal.style.display = 'none';
        instructionModal.style.display = 'flex';
    });

    [findRecordModalCloseBtn, instructionModalCloseBtn].forEach(btn => btn.addEventListener('click', () => {
        findRecordModal.style.display = 'none';
        instructionModal.style.display = 'none';
    }));

    [findRecordModal, instructionModal].forEach(modal => modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    }));
    
    modalProgrammeSelect.addEventListener('change', searchInModal);
    modalNameInput.addEventListener('input', searchInModal);

    printBtn.addEventListener('click', () => { 
        if(currentCandidate) {
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

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete')) { nameSuggestions.innerHTML = ''; }
    });
});