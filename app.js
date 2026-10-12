// CallingManager Application
// Main application logic

class CallingManager {
    constructor() {
        this.originalData = null; // Store the original loaded data
        this.scenarios = []; // Array of scenarios, each with its own data
        this.currentScenarioId = null;
        this.nextScenarioId = 1;
        
        this.callingsData = null;
        this.outOfUnitData = null;
        this.memberList = [];
        this.hiddenCallings = new Set();
        this.hiddenMembers = new Set();
        this.filteredData = null;
        this.currentOrg = null;
        this.pendingAssignment = null; // Store org/calling for member selection
        this.pendingMember = null; // Store member during existing-callings modal flow
        this.currentTab = 'callings';
        this.changeHistory = []; // Track changes for undo
        this.changedCallings = new Set(); // Track which callings have been modified
        this.hiddenOrgGroups = new Set(); // Top-level org groups that are hidden in the filter
        this.orgValidationRules = {}; // Custom age/gender rules per org, keyed by org id
        this.hiddenColumns = new Set(); // Columns hidden by user (sustained, setApart, timeInCalling)
        this.pendingCascadeRelease = null; // Pending cascade release data for presidency releases

        // When a president/bishop is released, their counselors must also be released
        this.PRESIDENCY_CASCADE_MAP = {
            'Bishop': ['Bishopric First Counselor', 'Bishopric Second Counselor'],
            'Elders Quorum President': ['Elders Quorum First Counselor', 'Elders Quorum Second Counselor'],
            'Relief Society President': ['Relief Society First Counselor', 'Relief Society Second Counselor'],
            'Priests Quorum President': ['Priests Quorum First Assistant', 'Priests Quorum Second Assistant'],
            'Teachers Quorum President': ['Teachers Quorum First Counselor', 'Teachers Quorum Second Counselor'],
            'Deacons Quorum President': ['Deacons Quorum First Counselor', 'Deacons Quorum Second Counselor'],
            'Young Women President': ['Young Women First Counselor', 'Young Women Second Counselor'],
            'Young Women Class President': ['Young Women Class First Counselor', 'Young Women Class Second Counselor'],
            'Sunday School President': ['Sunday School First Counselor', 'Sunday School Second Counselor'],
            'Primary President': ['Primary First Counselor', 'Primary Second Counselor'],
        };

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.checkStoredData();
        this.checkForResumableSession();
    }

    attachEventListeners() {
        // Home section buttons
        const launchDemoBtn = document.getElementById('launch-demo-btn');
        const submitDataBtn = document.getElementById('submit-data-btn');
        
        if (launchDemoBtn) {
            launchDemoBtn.addEventListener('click', () => this.loadDemoData());
        }
        
        if (submitDataBtn) {
            submitDataBtn.addEventListener('click', () => this.submitData());
        }

        // Import button on home page
        const importDataBtn = document.getElementById('import-data-btn');
        const importFileInput = document.getElementById('import-file-input');
        if (importDataBtn && importFileInput) {
            importDataBtn.addEventListener('click', () => importFileInput.click());
            importFileInput.addEventListener('change', (e) => this.importData(e));
        }

        // Manager section controls
        const backBtn = document.getElementById('back-btn');
        const exportBtn = document.getElementById('export-btn');
        const searchInput = document.getElementById('search-input');
        const toggleVisibilityBtn = document.getElementById('toggle-visibility-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showHome());
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undoChange());
        }

        const printChangesBtn = document.getElementById('print-changes-btn');
        if (printChangesBtn) {
            printChangesBtn.addEventListener('click', () => this.showPrintChanges());
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchCallings(e.target.value));
        }
        
        if (toggleVisibilityBtn) {
            toggleVisibilityBtn.addEventListener('click', () => this.showVisibilityModal());
        }

        // Scenario management
        const addScenarioBtn = document.getElementById('add-scenario-btn');
        if (addScenarioBtn) {
            addScenarioBtn.addEventListener('click', () => this.addScenario());
        }

        // Member search
        const memberSearchInput = document.getElementById('member-search');
        if (memberSearchInput) {
            memberSearchInput.addEventListener('input', (e) => this.filterMembers(e.target.value));
        }

        // Clipboard import button
        const importClipboardBtn = document.getElementById('import-clipboard-btn');
        if (importClipboardBtn) {
            importClipboardBtn.addEventListener('click', () => this.importFromClipboard());
        }

        // Organization filter dropdown
        const orgFilterBtn = document.getElementById('org-filter-btn');
        const orgFilterDropdown = document.getElementById('org-filter-dropdown');
        if (orgFilterBtn && orgFilterDropdown) {
            orgFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = orgFilterDropdown.classList.toggle('open');
                orgFilterBtn.classList.toggle('active', isOpen);
            });
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!orgFilterDropdown.contains(e.target) && e.target !== orgFilterBtn) {
                    orgFilterDropdown.classList.remove('open');
                    orgFilterBtn.classList.remove('active');
                }
            });
            // "All Organizations" checkbox
            const allCheckbox = document.getElementById('org-filter-all');
            if (allCheckbox) {
                allCheckbox.addEventListener('change', () => this.toggleAllOrgFilters(allCheckbox.checked));
            }
        }

        // Validation rules button
        const validationRulesBtn = document.getElementById('validation-rules-btn');
        if (validationRulesBtn) {
            validationRulesBtn.addEventListener('click', () => this.showValidationRulesModal());
        }

        // Build and set the bookmarklet href
        this.initBookmarklet();

        // Privacy link (footer)
        const footerPrivacy = document.getElementById('footer-privacy-link');
        if (footerPrivacy) {
            footerPrivacy.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('privacy-modal').classList.add('active');
            });
        }

        // About link (footer)
        const footerAbout = document.getElementById('footer-about-link');
        if (footerAbout) {
            footerAbout.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('about-modal').classList.add('active');
            });
        }

        this.initReportForm();
    }

    initReportForm() {
        const REPORT_URL = 'https://callingmanager-report.timberandlightcreations.workers.dev';
        const TURNSTILE_SITE_KEY = '0x4AAAAAAFUMq9RKewomSlgo';
        const link = document.getElementById('footer-report-link');
        const modal = document.getElementById('report-modal');
        const form = document.getElementById('report-form');
        if (!link || !modal || !form) return;

        const status = document.getElementById('report-status');
        const submit = document.getElementById('report-submit');
        let widgetId = null;
        let scriptPromise = null;

        const loadTurnstile = () => {
            if (!scriptPromise) {
                scriptPromise = new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                    s.onload = resolve;
                    s.onerror = reject;
                    document.head.appendChild(s);
                });
            }
            return scriptPromise;
        };

        const setStatus = (msg, isErr) => {
            status.textContent = msg;
            status.className = 'import-status ' + (isErr ? 'error' : 'success');
        };

        link.addEventListener('click', async (e) => {
            e.preventDefault();
            modal.classList.add('active');
            try {
                await loadTurnstile();
                if (widgetId === null) {
                    widgetId = window.turnstile.render('#report-turnstile', { sitekey: TURNSTILE_SITE_KEY });
                }
            } catch (err) {
                setStatus('Could not load the bot check. Please try again later.', true);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = widgetId !== null ? window.turnstile.getResponse(widgetId) : '';
            if (!token) {
                setStatus('Please complete the bot check.', true);
                return;
            }
            submit.disabled = true;
            setStatus('Submitting...', false);
            try {
                const res = await fetch(REPORT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: document.getElementById('report-title').value,
                        details: document.getElementById('report-details').value,
                        website: document.getElementById('report-website').value,
                        turnstileToken: token
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.message || 'Submission failed');
                setStatus(data.message || 'Thanks! Your report was submitted.', false);
                form.reset();
            } catch (err) {
                setStatus(err.message || 'Submission failed. Please try again.', true);
            } finally {
                submit.disabled = false;
                window.turnstile.reset(widgetId);
            }
        });
    }

    checkStoredData() {
        const stored = localStorage.getItem('callingManagerData');
        if (stored) {
            try {
                this.callingsData = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading stored data:', e);
            }
        }

        const storedMembers = localStorage.getItem('callingManagerMembers');
        if (storedMembers) {
            try {
                this.memberList = JSON.parse(storedMembers);
            } catch (e) {
                console.error('Error loading stored members:', e);
            }
        }

        const storedHidden = localStorage.getItem('callingManagerHidden');
        if (storedHidden) {
            try {
                this.hiddenCallings = new Set(JSON.parse(storedHidden));
            } catch (e) {
                console.error('Error loading hidden callings:', e);
            }
        }

        const storedHiddenMembers = localStorage.getItem('callingManagerHiddenMembers');
        if (storedHiddenMembers) {
            try {
                this.hiddenMembers = new Set(JSON.parse(storedHiddenMembers));
            } catch (e) {
                console.error('Error loading hidden members:', e);
            }
        }

        const storedRules = localStorage.getItem('callingManagerValidationRules');
        if (storedRules) {
            try {
                this.orgValidationRules = JSON.parse(storedRules);
            } catch (e) {
                console.error('Error loading validation rules:', e);
            }
        }

        const storedHiddenCols = localStorage.getItem('callingManagerHiddenColumns');
        if (storedHiddenCols) {
            try {
                this.hiddenColumns = new Set(JSON.parse(storedHiddenCols));
            } catch (e) {
                console.error('Error loading hidden columns:', e);
            }
        }
    }

    checkForResumableSession() {
        const hasSession = localStorage.getItem('callingManagerSession');
        if (!hasSession || !this.callingsData) return;

        // Check if the session has any actual changes worth resuming
        try {
            const session = JSON.parse(hasSession);
            const totalChanges = (session.scenarios || []).reduce((sum, s) => {
                return sum + (s.changeHistory ? s.changeHistory.length : 0);
            }, 0);
            const scenarioNames = (session.scenarios || []).map(s => s.name).join(', ');

            const modal = document.getElementById('resume-session-modal');
            document.getElementById('resume-session-scenarios').textContent = scenarioNames;
            document.getElementById('resume-session-changes').textContent = totalChanges;
            modal.classList.add('active');
        } catch (e) {
            console.error('Error checking resumable session:', e);
            this.clearSessionState();
        }
    }

    resumeSessionYes() {
        document.getElementById('resume-session-modal').classList.remove('active');
        if (this.restoreSessionState()) {
            this.showManager();
        }
    }

    resumeSessionNo() {
        document.getElementById('resume-session-modal').classList.remove('active');
        this.clearSessionState();
    }

    loadDemoData() {
        // Demo data using real ward org structure with historical/scriptural names
        const demoCallings = {"subOrgs":[{"id":404686,"name":"Bishopric","callings":[{"id":49142007,"name":"Bishop","member":{"id":100248,"name":"Kopischke, Loren"},"activeDate":"2022-03-06","setApartDate":"2022-03-06"},{"id":49142128,"name":"Bishopric First Counselor","member":{"id":100054,"name":"Hales, Ezra"},"activeDate":"2022-03-06","setApartDate":"2022-03-06"},{"id":49142046,"name":"Bishopric Second Counselor","member":{"id":100148,"name":"Stevenson, Franklin"},"activeDate":"2022-03-06","setApartDate":"2022-03-06"},{"id":51333333,"name":"Ward Executive Secretary","member":{"id":100057,"name":"Tuttle, Barnabas"},"activeDate":"2023-03-12","setApartDate":"2023-03-12"},{"id":"404686-Ward Assistant Executive Secretary","name":"Ward Assistant Executive Secretary","member":null,"activeDate":null,"setApartDate":null},{"id":"404686-Ward Assistant Executive Secretary","name":"Ward Assistant Executive Secretary","member":null,"activeDate":null,"setApartDate":null},{"id":54664798,"name":"Ward Clerk","member":{"id":100221,"name":"Cordon, Joshua"},"activeDate":"2024-10-20","setApartDate":"2024-10-20"},{"id":45894930,"name":"Ward Assistant Clerk","member":{"id":100077,"name":"Bateman, Loren"},"activeDate":"2020-03-08","setApartDate":"2024-10-20"},{"id":47866552,"name":"Ward Assistant Clerk--Membership","member":{"id":100192,"name":"Aoyagi, Eli"},"activeDate":"2021-08-08","setApartDate":"2021-08-08"},{"id":31048657,"name":"Ward Assistant Clerk--Finance","member":{"id":100077,"name":"Bateman, Loren"},"activeDate":"2014-08-24","setApartDate":"2014-08-24"}]},{"id":2334516,"name":"Elders Quorum Presidency","callings":[{"id":49189768,"name":"Elders Quorum President","member":{"id":100318,"name":"Eyring, Luke"},"activeDate":"2022-03-13","setApartDate":"2022-03-13"},{"id":63112380,"name":"Elders Quorum First Counselor","member":{"id":100097,"name":"Grant, Barnabas"},"activeDate":"2025-06-01","setApartDate":"2025-06-01"},{"id":63112368,"name":"Elders Quorum Second Counselor","member":{"id":100112,"name":"Christofferson, Zoram"},"activeDate":"2025-06-01","setApartDate":"2025-06-01"},{"id":63249303,"name":"Elders Quorum Secretary","member":{"id":100069,"name":"Harris, Ether"},"activeDate":"2025-06-15","setApartDate":null},{"id":"2334516-Elders Quorum Assistant Secretary","name":"Elders Quorum Assistant Secretary","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962095,"name":"Elders Quorum - Teachers","callings":[{"id":53019567,"name":"Elders Quorum Teacher","member":{"id":100141,"name":"Widtsoe, Isaac"},"activeDate":"2024-01-28","setApartDate":null},{"id":"3962095-Elders Quorum Teacher","name":"Elders Quorum Teacher","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962093,"name":"Elders Quorum - Ministering","callings":[{"id":"3962093-Elders Quorum Ministering Secretary","name":"Elders Quorum Ministering Secretary","member":null,"activeDate":null,"setApartDate":null},{"id":"3962093-Elders Quorum Ministering Secretary","name":"Elders Quorum Ministering Secretary","member":null,"activeDate":null,"setApartDate":null}]},{"id":8919439,"name":"Elders Quorum - Activities","callings":[{"id":"8919439-Elders Quorum Activity Coordinator","name":"Elders Quorum Activity Coordinator","member":null,"activeDate":null,"setApartDate":null},{"id":"8919439-Elders Quorum Assistant Activity Coordinator","name":"Elders Quorum Assistant Activity Coordinator","member":null,"activeDate":null,"setApartDate":null},{"id":"8919439-Elders Quorum Activity Committee Member","name":"Elders Quorum Activity Committee Member","member":null,"activeDate":null,"setApartDate":null}]},{"id":8919438,"name":"Elders Quorum - Service","callings":[{"id":"8919438-Elders Quorum Service Coordinator","name":"Elders Quorum Service Coordinator","member":null,"activeDate":null,"setApartDate":null},{"id":"8919438-Elders Quorum Assistant Service Coordinator","name":"Elders Quorum Assistant Service Coordinator","member":null,"activeDate":null,"setApartDate":null},{"id":"8919438-Elders Quorum Service Committee Member","name":"Elders Quorum Service Committee Member","member":null,"activeDate":null,"setApartDate":null}]},{"id":2258744,"name":"Relief Society Presidency","callings":[{"id":53056123,"name":"Relief Society President","member":{"id":100173,"name":"Taylor, Sarah"},"activeDate":"2024-02-04","setApartDate":"2024-10-27"},{"id":54742632,"name":"Relief Society First Counselor","member":{"id":100149,"name":"Stevenson, Ruth"},"activeDate":"2024-11-03","setApartDate":"2024-11-03"},{"id":53057242,"name":"Relief Society Second Counselor","member":{"id":100071,"name":"Harris, Louie"},"activeDate":"2024-02-04","setApartDate":"2024-10-27"},{"id":53056864,"name":"Relief Society Secretary","member":{"id":100091,"name":"Simpson, Ruth"},"activeDate":"2024-02-04","setApartDate":"2024-10-27"},{"id":"2258744-Relief Society Assistant Secretary","name":"Relief Society Assistant Secretary","member":null,"activeDate":null,"setApartDate":null},{"id":50163012,"name":"Humanitarian Leader","member":{"id":100041,"name":"Pratt, Naomi"},"activeDate":"2022-08-14","setApartDate":null},{"id":"2258744-Missionary Meal Coordinator","name":"Missionary Meal Coordinator","member":null,"activeDate":null,"setApartDate":null},{"id":"2258744-Newsletter","name":"Newsletter","member":null,"activeDate":null,"setApartDate":null},{"id":63243614,"name":"Relief Society Newsletter","member":{"id":100049,"name":"Lund, Martha"},"activeDate":"2023-02-26","setApartDate":"2025-06-15"},{"id":63243630,"name":"Relief Society Something Special Chair","member":{"id":100213,"name":"Oaks, Isabel"},"activeDate":"2023-01-29","setApartDate":"2025-06-15"},{"id":"2258744-Relief Society Something Special Rep","name":"Relief Society Something Special Rep","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962160,"name":"Relief Society - Teachers","callings":[{"id":"3962160-Relief Society Teacher","name":"Relief Society Teacher","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962163,"name":"Relief Society - Ministering","callings":[{"id":"3962163-Relief Society Ministering Secretary","name":"Relief Society Ministering Secretary","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962164,"name":"Relief Society - Activities","callings":[{"id":54744901,"name":"Relief Society Activity Coordinator","member":{"id":100025,"name":"Young, Sophia"},"activeDate":"2024-11-03","setApartDate":null},{"id":"3962164-Relief Society Assistant Activity Coordinator","name":"Relief Society Assistant Activity Coordinator","member":null,"activeDate":null,"setApartDate":null},{"id":63249260,"name":"Relief Society Activity Committee Member","member":{"id":100104,"name":"Page, Susa"},"activeDate":"2025-06-15","setApartDate":null},{"id":55781643,"name":"Relief Society Activity Committee Member","member":{"id":100288,"name":"Faust, Cora"},"activeDate":"2025-02-09","setApartDate":null}]},{"id":3962162,"name":"Relief Society - Music","callings":[{"id":"3962162-Relief Society Music Leader","name":"Relief Society Music Leader","member":null,"activeDate":null,"setApartDate":null},{"id":"3962162-Relief Society Pianist","name":"Relief Society Pianist","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962167,"name":"Relief Society - Service","callings":[{"id":49439666,"name":"Relief Society Service Coordinator","member":{"id":100143,"name":"Kearon, Leah"},"activeDate":"2022-05-01","setApartDate":"2022-05-01"},{"id":"3962167-Relief Society Assistant Service Coordinator","name":"Relief Society Assistant Service Coordinator","member":null,"activeDate":null,"setApartDate":null},{"id":49469391,"name":"Relief Society Service Committee Member","member":{"id":100075,"name":"Patten, Louie"},"activeDate":"2022-05-08","setApartDate":null}]},{"id":8697472,"name":"Aaronic Priesthood Quorums - Presidency of the Aaronic Priesthood","callings":[{"id":49142007,"name":"Bishop","member":{"id":100248,"name":"Kopischke, Loren"},"activeDate":"2022-03-06","setApartDate":"2022-03-06"},{"id":49142128,"name":"Bishopric First Counselor","member":{"id":100054,"name":"Hales, Ezra"},"activeDate":"2022-03-06","setApartDate":"2022-03-06"},{"id":49142046,"name":"Bishopric Second Counselor","member":{"id":100148,"name":"Stevenson, Franklin"},"activeDate":"2022-03-06","setApartDate":"2022-03-06"}]},{"id":3962098,"name":"Priests Quorum Presidency","callings":[{"id":49145858,"name":"Priests Quorum President","member":{"id":100248,"name":"Kopischke, Loren"},"activeDate":"2022-03-06","setApartDate":"2022-03-06"},{"id":55759922,"name":"Priests Quorum First Assistant","member":{"id":100154,"name":"Morrison, James"},"activeDate":"2024-07-28","setApartDate":"2025-02-09"},{"id":55760006,"name":"Priests Quorum Second Assistant","member":{"id":100260,"name":"Richards, Stephen"},"activeDate":"2024-07-28","setApartDate":"2025-02-09"},{"id":"3962098-Priests Quorum Secretary","name":"Priests Quorum Secretary","member":null,"activeDate":null,"setApartDate":null}]},{"id":8697397,"name":"Priests Quorum Adult Leaders","callings":[{"id":64138921,"name":"Priests Quorum Adviser","member":{"id":100315,"name":"Merrill, Ezra"},"activeDate":"2025-11-09","setApartDate":"2025-11-16"},{"id":"8697397-Priests Quorum Specialist","name":"Priests Quorum Specialist","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962149,"name":"Teachers Quorum Presidency","callings":[{"id":55760292,"name":"Teachers Quorum President","member":{"id":100014,"name":"Lee, Thomas"},"activeDate":"2025-02-02","setApartDate":"2025-02-09"},{"id":"3962149-Teachers Quorum First Counselor","name":"Teachers Quorum First Counselor","member":null,"activeDate":null,"setApartDate":null},{"id":"3962149-Teachers Quorum Second Counselor","name":"Teachers Quorum Second Counselor","member":null,"activeDate":null,"setApartDate":null},{"id":"3962149-Teachers Quorum Secretary","name":"Teachers Quorum Secretary","member":null,"activeDate":null,"setApartDate":null}]},{"id":8697446,"name":"Teachers Quorum Adult Leaders","callings":[{"id":"8697446-Teachers Quorum Adviser","name":"Teachers Quorum Adviser","member":null,"activeDate":null,"setApartDate":null},{"id":"8697446-Teachers Quorum Specialist","name":"Teachers Quorum Specialist","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962151,"name":"Deacons Quorum Presidency","callings":[{"id":55760356,"name":"Deacons Quorum President","member":{"id":100021,"name":"Renlund, Andrew"},"activeDate":"2025-02-02","setApartDate":"2025-03-16"},{"id":55760357,"name":"Deacons Quorum First Counselor","member":{"id":100293,"name":"Rasband, Hosea"},"activeDate":"2025-02-02","setApartDate":"2025-03-16"},{"id":55760389,"name":"Deacons Quorum Second Counselor","member":{"id":100308,"name":"Petersen, Donald"},"activeDate":"2025-02-02","setApartDate":null},{"id":55760078,"name":"Deacons Quorum Secretary","member":{"id":100150,"name":"Stevenson, Dieter"},"activeDate":"2025-02-02","setApartDate":"2025-03-16"}]},{"id":8697468,"name":"Deacons Quorum Adult Leaders","callings":[{"id":53106023,"name":"Deacons Quorum Adviser","member":{"id":100006,"name":"Bowen, Zoram"},"activeDate":"2024-02-11","setApartDate":"2024-03-10"},{"id":63194017,"name":"Deacons Quorum Adviser","member":{"id":100027,"name":"Young, Brent"},"activeDate":"2025-06-08","setApartDate":"2025-06-08"},{"id":48431884,"name":"Deacons Quorum Specialist","member":{"id":100156,"name":"Morrison, Jedediah"},"activeDate":"2021-11-14","setApartDate":null}]},{"id":3962156,"name":"Additional Aaronic Priesthood Quorums Callings","callings":[{"id":"3962156-Aaronic Priesthood Quorums Specialist - Camp Director","name":"Aaronic Priesthood Quorums Specialist - Camp Director","member":null,"activeDate":null,"setApartDate":null},{"id":"3962156-Aaronic Priesthood Quorums Specialist - Assistant Camp Director","name":"Aaronic Priesthood Quorums Specialist - Assistant Camp Director","member":null,"activeDate":null,"setApartDate":null},{"id":"3962156-Young Men Stake Youth Committee Member","name":"Young Men Stake Youth Committee Member","member":null,"activeDate":null,"setApartDate":null},{"id":"3962156-Young Men Specialist - Sports","name":"Young Men Specialist - Sports","member":null,"activeDate":null,"setApartDate":null},{"id":"3962156-Young Men Specialist - Sports Assistant","name":"Young Men Specialist - Sports Assistant","member":null,"activeDate":null,"setApartDate":null},{"id":47159417,"name":"Aaronic Priesthood Quorums Specialist","member":{"id":100018,"name":"Renlund, Enos"},"activeDate":"2021-02-07","setApartDate":"2021-03-28"},{"id":54599879,"name":"Ward FSY Representative","member":{"id":100248,"name":"Kopischke, Loren"},"activeDate":"2024-10-06","setApartDate":null}]},{"id":2598853,"name":"Young Women Presidency","callings":[{"id":51066196,"name":"Young Women President","member":{"id":100230,"name":"Hyde, Amelia"},"activeDate":"2023-01-29","setApartDate":"2023-02-05"},{"id":54743176,"name":"Young Women First Counselor","member":{"id":100225,"name":"Cordon, Hannah"},"activeDate":"2024-11-03","setApartDate":"2024-11-03"},{"id":51066152,"name":"Young Women Second Counselor","member":{"id":100013,"name":"Lee, Rebecca"},"activeDate":"2023-01-29","setApartDate":"2023-02-05"},{"id":52457943,"name":"Young Women Secretary","member":{"id":100157,"name":"Morrison, Anne"},"activeDate":"2023-10-22","setApartDate":"2023-10-22"},{"id":"2598853-Young Women Specialist","name":"Young Women Specialist","member":null,"activeDate":null,"setApartDate":null}]},{"id":8473449,"name":"Young Women 12-18 Class Presidency","callings":[{"id":64617437,"name":"Young Women Class President","member":{"id":100226,"name":"Hyde, Deborah"},"activeDate":"2026-01-25","setApartDate":"2026-01-25"},{"id":64617522,"name":"Young Women Class First Counselor","member":{"id":100022,"name":"Young, Lucile"},"activeDate":"2026-01-25","setApartDate":"2026-01-25"},{"id":64617462,"name":"Young Women Class Second Counselor","member":{"id":100011,"name":"Lee, Emily"},"activeDate":"2026-01-25","setApartDate":"2026-01-25"},{"id":64617554,"name":"Young Women Class Secretary","member":{"id":100042,"name":"Lund, Cora"},"activeDate":"2026-01-25","setApartDate":"2026-01-25"}]},{"id":8473447,"name":"Young Women 12-18 Class Adult Leaders","callings":[{"id":55040464,"name":"Young Women Class Adviser","member":{"id":100210,"name":"Young, Esther"},"activeDate":"2024-11-03","setApartDate":"2025-01-05"},{"id":52458055,"name":"Young Women Class Adviser","member":{"id":100278,"name":"Romney, Hope"},"activeDate":"2023-10-22","setApartDate":"2023-11-05"},{"id":"8473447-Young Women Specialist","name":"Young Women Specialist","member":null,"activeDate":null,"setApartDate":null}]},{"id":1098992,"name":"Additional Young Women Callings","callings":[{"id":"1098992-Young Women Specialist","name":"Young Women Specialist","member":null,"activeDate":null,"setApartDate":null},{"id":"1098992-Young Women Specialist - Activities","name":"Young Women Specialist - Activities","member":null,"activeDate":null,"setApartDate":null},{"id":"1098992-Young Women Specialist - Camp Director","name":"Young Women Specialist - Camp Director","member":null,"activeDate":null,"setApartDate":null},{"id":"1098992-Young Women Specialist - Assistant Camp Director","name":"Young Women Specialist - Assistant Camp Director","member":null,"activeDate":null,"setApartDate":null},{"id":"1098992-Young Women Stake Youth Committee","name":"Young Women Stake Youth Committee","member":null,"activeDate":null,"setApartDate":null},{"id":"1098992-Young Women Specialist - Sports","name":"Young Women Specialist - Sports","member":null,"activeDate":null,"setApartDate":null},{"id":"1098992-Young Women Specialist - Sports Assistant","name":"Young Women Specialist - Sports Assistant","member":null,"activeDate":null,"setApartDate":null},{"id":54599877,"name":"Ward FSY Representative","member":{"id":100230,"name":"Hyde, Amelia"},"activeDate":"2024-10-06","setApartDate":null}]},{"id":2532627,"name":"Sunday School Presidency","callings":[{"id":63194184,"name":"Sunday School President","member":{"id":100046,"name":"Lund, Peter"},"activeDate":"2025-06-08","setApartDate":"2025-06-29"},{"id":63574943,"name":"Sunday School First Counselor","member":{"id":100103,"name":"Page, Elias"},"activeDate":"2025-08-10","setApartDate":null},{"id":"2532627-Sunday School Second Counselor","name":"Sunday School Second Counselor","member":null,"activeDate":null,"setApartDate":null},{"id":"2532627-Sunday School Secretary","name":"Sunday School Secretary","member":null,"activeDate":null,"setApartDate":null}]},{"id":404666,"name":"Sunday School - Gospel Doctrine","callings":[{"id":54698897,"name":"Sunday School Teacher","member":{"id":100084,"name":"Romney, Ruth"},"activeDate":"2024-10-27","setApartDate":"2024-12-01"},{"id":64139083,"name":"Sunday School Teacher","member":{"id":100172,"name":"Falabella, Howard"},"activeDate":"2025-11-09","setApartDate":"2025-11-16"},{"id":63450504,"name":"Sunday School Class President","member":{"id":100316,"name":"Rasband, Sidney"},"activeDate":"2025-07-20","setApartDate":"2025-07-27"}]},{"id":1464178,"name":"Sunday School - Course 16+","callings":[{"id":63112409,"name":"Sunday School Teacher","member":{"id":100209,"name":"Young, Earl"},"activeDate":"2025-06-01","setApartDate":"2025-06-01"},{"id":63112467,"name":"Sunday School Teacher","member":{"id":100251,"name":"McKay, Neil"},"activeDate":"2025-06-01","setApartDate":"2025-06-08"}]},{"id":1969766,"name":"Sunday School - Course 13, 14, & 15","callings":[{"id":63249362,"name":"Sunday School Teacher","member":{"id":100017,"name":"Renlund, Eve"},"activeDate":"2025-06-15","setApartDate":"2025-07-13"},{"id":63289462,"name":"Sunday School Teacher","member":{"id":100298,"name":"Kimball, Ardeth"},"activeDate":"2025-06-22","setApartDate":"2025-06-29"}]},{"id":1859142,"name":"Sunday School - Course 11, Course 12","callings":[{"id":63367060,"name":"Sunday School Teacher","member":{"id":100055,"name":"Hales, Abigail"},"activeDate":"2025-07-06","setApartDate":"2025-07-20"},{"id":54742717,"name":"Sunday School Teacher","member":{"id":100146,"name":"Funk, Ida"},"activeDate":"2024-11-03","setApartDate":"2024-11-03"}]},{"id":3962181,"name":"Sunday School - Unassigned Teachers","callings":[{"id":23836194,"name":"Sunday School Teacher","member":{"id":100249,"name":"Kopischke, Chieko"},"activeDate":"2012-11-04","setApartDate":null}]},{"id":3962179,"name":"Sunday School - Resource Center","callings":[{"id":50127923,"name":"Resource Center Specialist","member":{"id":100091,"name":"Simpson, Ruth"},"activeDate":"2022-08-14","setApartDate":"2022-08-14"},{"id":30223812,"name":"Resource Center Specialist","member":{"id":100284,"name":"Simpson, Phoebe"},"activeDate":"2006-06-25","setApartDate":"2006-06-25"}]},{"id":2454015,"name":"Primary Presidency","callings":[{"id":53381866,"name":"Primary President","member":{"id":100319,"name":"Eyring, Eve"},"activeDate":"2024-03-24","setApartDate":"2024-03-24"},{"id":53381903,"name":"Primary First Counselor","member":{"id":100076,"name":"Bateman, Dorcas"},"activeDate":"2024-03-24","setApartDate":"2024-03-24"},{"id":53381986,"name":"Primary Second Counselor","member":{"id":100134,"name":"Bednar, Charity"},"activeDate":"2024-03-24","setApartDate":"2024-03-24"},{"id":53382028,"name":"Primary Secretary","member":{"id":100002,"name":"Bowen, Ardeth"},"activeDate":"2024-03-24","setApartDate":"2024-05-05"}]},{"id":3962177,"name":"Primary - Music","callings":[{"id":38535693,"name":"Primary Pianist","member":{"id":100261,"name":"Richards, Faith"},"activeDate":"2017-06-18","setApartDate":"2017-06-25"},{"id":53056433,"name":"Primary Music Leader","member":{"id":100170,"name":"Falabella, Clara"},"activeDate":"2024-02-04","setApartDate":"2024-02-04"}]},{"id":9400581,"name":"Primary - Valiant 9, Valiant 10","callings":[{"id":53051654,"name":"Primary Teacher","member":{"id":100082,"name":"McConkie, Phoebe"},"activeDate":"2022-12-25","setApartDate":"2024-02-04"},{"id":53051675,"name":"Primary Teacher","member":{"id":100314,"name":"Merrill, Sheri"},"activeDate":"2022-12-25","setApartDate":"2024-02-04"}]},{"id":9760312,"name":"Primary - CTR 6,7,8","callings":[{"id":44946186,"name":"Primary Teacher","member":{"id":100165,"name":"Packer, Craig"},"activeDate":"2019-10-20","setApartDate":"2023-08-27"},{"id":47406199,"name":"Primary Teacher","member":{"id":100168,"name":"Packer, Elisabeth"},"activeDate":"2021-01-24","setApartDate":"2021-07-11"}]},{"id":404673,"name":"Primary - CTR 4, CTR 5","callings":[{"id":51862821,"name":"Primary Teacher","member":{"id":100160,"name":"Condie, Adelaide"},"activeDate":"2023-07-02","setApartDate":"2023-09-03"},{"id":51933646,"name":"Primary Teacher","member":{"id":100307,"name":"Petersen, Patience"},"activeDate":"2023-07-16","setApartDate":"2023-08-06"}]},{"id":9760285,"name":"Primary - Sunbeam","callings":[{"id":64412339,"name":"Primary Teacher","member":{"id":100120,"name":"Rasband, Emily"},"activeDate":"2024-05-05","setApartDate":"2026-01-03"},{"id":64412347,"name":"Primary Teacher","member":{"id":100287,"name":"Grant, Bertha"},"activeDate":"2021-07-25","setApartDate":"2026-01-03"}]},{"id":1782705,"name":"Primary - Nursery","callings":[{"id":53051777,"name":"Nursery Leader","member":{"id":100058,"name":"Tuttle, Lavina"},"activeDate":"2022-01-02","setApartDate":"2024-02-04"},{"id":64267395,"name":"Nursery Leader","member":{"id":100250,"name":"McKay, Jane"},"activeDate":"2025-06-01","setApartDate":"2026-01-03"}]},{"id":3962178,"name":"Primary - Unassigned Teachers","callings":[{"id":"3962178-Primary Teacher","name":"Primary Teacher","member":null,"activeDate":null,"setApartDate":null}]},{"id":8697553,"name":"Primary Activities - Boys","callings":[{"id":51830187,"name":"Valiant Activities Leader","member":{"id":100136,"name":"Bednar, Timothy"},"activeDate":"2023-06-25","setApartDate":"2023-08-27"},{"id":64363375,"name":"Valiant Activities Leader","member":{"id":100286,"name":"Simpson, Joseph"},"activeDate":"2025-12-21","setApartDate":"2025-12-28"}]},{"id":5256259,"name":"Primary Activities - Girls","callings":[{"id":53056647,"name":"Valiant Activities Leader","member":null,"activeDate":"2026-01-25","setApartDate":null},{"id":51478091,"name":"Valiant Activities Leader","member":null,"activeDate":"2026-01-25","setApartDate":null}]},{"id":1098998,"name":"Ward Missionaries","callings":[{"id":63112533,"name":"Ward Mission Leader","member":{"id":100289,"name":"Faust, Noah"},"activeDate":"2025-06-01","setApartDate":"2025-06-01"},{"id":"1098998-Assistant Ward Mission Leader","name":"Assistant Ward Mission Leader","member":null,"activeDate":null,"setApartDate":null},{"id":46965211,"name":"Ward Missionary","member":{"id":100175,"name":"Tingey, Jedediah"},"activeDate":"2021-02-07","setApartDate":"2021-08-12"},{"id":46965284,"name":"Ward Missionary","member":{"id":100176,"name":"Tingey, Mary"},"activeDate":"2021-02-07","setApartDate":"2021-08-12"},{"id":64363484,"name":"Ward Missionary","member":{"id":100244,"name":"Bangerter, Ardeth"},"activeDate":"2025-12-21","setApartDate":"2025-12-28"},{"id":64363371,"name":"Ward Missionary","member":{"id":100245,"name":"Bangerter, Hosea"},"activeDate":"2025-12-21","setApartDate":"2025-12-28"},{"id":"1098998-Missionary Support Specialist","name":"Missionary Support Specialist","member":null,"activeDate":null,"setApartDate":null},{"id":"1098998-Missionary Support Specialist","name":"Missionary Support Specialist","member":null,"activeDate":null,"setApartDate":null},{"id":"1098998-Missionary Support Specialist","name":"Missionary Support Specialist","member":null,"activeDate":null,"setApartDate":null}]},{"id":-5,"name":"Full-Time Missionaries","callings":[{"id":-1,"name":"Missionary","member":{"id":100012,"name":"Lee, Peter"},"activeDate":"2025-03-17","setApartDate":null},{"id":-1,"name":"Missionary","member":{"id":100147,"name":"Stevenson, Brigham"},"activeDate":"2024-08-19","setApartDate":null}]},{"id":1098995,"name":"Temple and Family History","callings":[{"id":63289247,"name":"Ward Temple and Family History Leader","member":{"id":100197,"name":"Worthen, Titus"},"activeDate":"2025-06-22","setApartDate":null},{"id":50790168,"name":"Ward Temple and Family History Consultant","member":{"id":100041,"name":"Pratt, Naomi"},"activeDate":"2022-12-25","setApartDate":"2024-07-01"},{"id":63312173,"name":"Ward Temple and Family History Consultant","member":{"id":100071,"name":"Harris, Louie"},"activeDate":"2024-02-04","setApartDate":null},{"id":49232014,"name":"Ward Temple and Family History Consultant","member":{"id":100097,"name":"Grant, Barnabas"},"activeDate":"2022-03-13","setApartDate":"2022-03-20"},{"id":53106192,"name":"Ward Temple and Family History Consultant","member":{"id":100124,"name":"Cook, Emily"},"activeDate":"2024-02-11","setApartDate":"2024-03-10"},{"id":54742926,"name":"Ward Temple and Family History Consultant","member":{"id":100133,"name":"Samuelson, Phoebe"},"activeDate":"2024-11-03","setApartDate":"2024-11-24"},{"id":47958752,"name":"Ward Temple and Family History Consultant","member":{"id":100198,"name":"Worthen, Joy"},"activeDate":"2021-08-22","setApartDate":"2024-07-01"},{"id":63312103,"name":"Ward Temple and Family History Consultant","member":{"id":100227,"name":"Hyde, Lois"},"activeDate":"2024-11-10","setApartDate":null},{"id":63312172,"name":"Ward Temple and Family History Consultant","member":{"id":100260,"name":"Richards, Stephen"},"activeDate":"2024-07-28","setApartDate":null},{"id":"1098995-Ward Temple and Family History Consultant","name":"Ward Temple and Family History Consultant","member":null,"activeDate":null,"setApartDate":null},{"id":"1098995-Indexing Worker","name":"Indexing Worker","member":null,"activeDate":null,"setApartDate":null}]},{"id":404690,"name":"Other Callings - Young Single Adult","callings":[{"id":"404690-Relief Society Adviser to Young Single Adult Sisters","name":"Relief Society Adviser to Young Single Adult Sisters","member":null,"activeDate":null,"setApartDate":null},{"id":"404690-Young Single Adult Adviser","name":"Young Single Adult Adviser","member":null,"activeDate":null,"setApartDate":null},{"id":"404690-Young Single Adult Leader","name":"Young Single Adult Leader","member":null,"activeDate":null,"setApartDate":null},{"id":"404690-Young Single Adult Committee Chair","name":"Young Single Adult Committee Chair","member":null,"activeDate":null,"setApartDate":null},{"id":"404690-Young Single Adult Committee Member","name":"Young Single Adult Committee Member","member":null,"activeDate":null,"setApartDate":null},{"id":55258119,"name":"Single Adult Representative","member":{"id":100261,"name":"Richards, Faith"},"activeDate":"2025-01-26","setApartDate":null}]},{"id":3962175,"name":"Other Callings - Church Magazines","callings":[{"id":"3962175-Magazine Representative","name":"Magazine Representative","member":null,"activeDate":null,"setApartDate":null}]},{"id":1098994,"name":"Other Callings - Facilities","callings":[{"id":63243247,"name":"Building Representative","member":{"id":100059,"name":"Kopischke, Amelia"},"activeDate":"2025-03-16","setApartDate":"2025-06-15"},{"id":"1098994-Scheduler--Building  1","name":"Scheduler--Building  1","member":null,"activeDate":null,"setApartDate":null},{"id":"1098994-Scheduler--Building  2","name":"Scheduler--Building  2","member":null,"activeDate":null,"setApartDate":null},{"id":"1098994-Scheduler--Building  3","name":"Scheduler--Building  3","member":null,"activeDate":null,"setApartDate":null},{"id":"1098994-Scheduler--Building  4","name":"Scheduler--Building  4","member":null,"activeDate":null,"setApartDate":null},{"id":"1098994-Scheduler--Building  5","name":"Scheduler--Building  5","member":null,"activeDate":null,"setApartDate":null}]},{"id":9047476,"name":"Other Callings - For the Strength of Youth","callings":[{"id":"9047476-FSY Conferences Representative","name":"FSY Conferences Representative","member":null,"activeDate":null,"setApartDate":null}]},{"id":3962176,"name":"Other Callings - History","callings":[{"id":48542956,"name":"History Specialist","member":{"id":100076,"name":"Bateman, Dorcas"},"activeDate":"2021-12-05","setApartDate":null}]},{"id":1098996,"name":"Other Callings - Music","callings":[{"id":"1098996-Priesthood Pianist or Organist","name":"Priesthood Pianist or Organist","member":null,"activeDate":null,"setApartDate":null},{"id":"1098996-Priesthood Music Director","name":"Priesthood Music Director","member":null,"activeDate":null,"setApartDate":null},{"id":"1098996-Choir Accompanist","name":"Choir Accompanist","member":null,"activeDate":null,"setApartDate":null},{"id":"1098996-Music Adviser","name":"Music Adviser","member":null,"activeDate":null,"setApartDate":null},{"id":54698709,"name":"Choir Director","member":{"id":100099,"name":"Grant, Phoebe"},"activeDate":"2024-10-27","setApartDate":"2024-10-27"},{"id":45493233,"name":"Accompanist","member":{"id":100127,"name":"Davies, Helen"},"activeDate":"2020-01-19","setApartDate":"2020-02-23"},{"id":45493348,"name":"Accompanist","member":{"id":100170,"name":"Falabella, Clara"},"activeDate":"2020-01-19","setApartDate":"2025-11-09"},{"id":54698765,"name":"Music Leader","member":{"id":100128,"name":"Davies, Hosea"},"activeDate":"2024-10-27","setApartDate":"2024-11-03"},{"id":46965339,"name":"Music Coordinator","member":{"id":100001,"name":"Worthen, Janet"},"activeDate":"2021-02-07","setApartDate":null},{"id":52490582,"name":"Accompanist","member":{"id":100291,"name":"Faust, Harold"},"activeDate":"2023-10-29","setApartDate":"2023-12-03"}]},{"id":1098997,"name":"Other Callings - Technology","callings":[{"id":54816490,"name":"Email Communication Specialist","member":{"id":100114,"name":"Christofferson, Jane"},"activeDate":"2024-11-17","setApartDate":"2024-11-24"},{"id":50290626,"name":"Technology Specialist","member":{"id":100197,"name":"Worthen, Titus"},"activeDate":"2022-09-11","setApartDate":"2022-09-11"},{"id":"1098997-Ward/Branch Interpreter","name":"Ward/Branch Interpreter","member":null,"activeDate":null,"setApartDate":null},{"id":"1098997-Facebook Administrator","name":"Facebook Administrator","member":null,"activeDate":null,"setApartDate":null}]},{"id":1098993,"name":"Other Callings - Welfare and Self-Reliance","callings":[{"id":"1098993-Disability Activity Leader","name":"Disability Activity Leader","member":null,"activeDate":null,"setApartDate":null},{"id":"1098993-Disability Specialist","name":"Disability Specialist","member":null,"activeDate":null,"setApartDate":null},{"id":"1098993-Welfare and Self-Reliance Specialist","name":"Welfare and Self-Reliance Specialist","member":null,"activeDate":null,"setApartDate":null},{"id":"1098993-Self-Reliance Group Facilitator","name":"Self-Reliance Group Facilitator","member":null,"activeDate":null,"setApartDate":null},{"id":46965104,"name":"Emergency Preparedness Specialist","member":{"id":100141,"name":"Widtsoe, Isaac"},"activeDate":"2021-02-07","setApartDate":null},{"id":47592726,"name":"Ward Public Affairs-Just Serve","member":{"id":100085,"name":"Romney, Hartman"},"activeDate":"2021-06-13","setApartDate":null}]},{"id":5541273,"name":"Other Callings - Additional Callings","callings":[{"id":64225143,"name":"Family Home Evening Coordinator","member":{"id":100029,"name":"Oaks, Elaine"},"activeDate":"2025-11-23","setApartDate":null},{"id":64225113,"name":"Family Home Evening Coordinator","member":{"id":100030,"name":"Oaks, Adam"},"activeDate":"2025-11-23","setApartDate":null},{"id":63450229,"name":"Linger Longer coordinator","member":{"id":100323,"name":"Woodruff, Harold"},"activeDate":"2025-07-20","setApartDate":"2025-07-27"}]},{"id":"out-of-unit","name":"Out of Unit Callings","callings":[{"id":63791300,"name":"Stake Presidency Second Counselor","member":{"id":100010,"name":"Lee, Marion"},"activeDate":"2025-09-14","setApartDate":"2025-09-14"},{"id":45387207,"name":"Stake Building Specialist","member":{"id":100130,"name":"Uchtdorf, Samuel"},"activeDate":"2020-01-05","setApartDate":null},{"id":55132451,"name":"Self Reliance Facilitator","member":{"id":100192,"name":"Aoyagi, Eli"},"activeDate":"2025-01-12","setApartDate":"2025-01-15"},{"id":63398075,"name":"Stake Men's Pickleball Specialist","member":{"id":100192,"name":"Aoyagi, Eli"},"activeDate":"2025-07-13","setApartDate":"2025-09-07"},{"id":55132433,"name":"Self Reliance Facilitator","member":{"id":100193,"name":"Aoyagi, Bonnie"},"activeDate":"2025-01-12","setApartDate":"2025-01-15"},{"id":52094263,"name":"Audit Committee Member","member":{"id":100229,"name":"Hyde, Stephen"},"activeDate":"2023-08-13","setApartDate":null},{"id":51929600,"name":"Stake High Councilor","member":{"id":100229,"name":"Hyde, Stephen"},"activeDate":"2023-07-16","setApartDate":"2023-07-23"},{"id":52094269,"name":"Stake Building Representative","member":{"id":100229,"name":"Hyde, Stephen"},"activeDate":"2023-08-13","setApartDate":"2023-08-15"},{"id":64080340,"name":"Stake Sunday School President","member":{"id":100279,"name":"Romney, Spencer"},"activeDate":"2025-10-26","setApartDate":null},{"id":64080335,"name":"Stake High Councilor","member":{"id":100279,"name":"Romney, Spencer"},"activeDate":"2025-10-26","setApartDate":"2025-11-02"},{"id":51116681,"name":"Church Service Mission - Addiction Recovery Program","member":{"id":100319,"name":"Eyring, Eve"},"activeDate":"2023-02-05","setApartDate":"2023-02-06"}]}]};

        const demoMembers = [{"id":100001,"name":"Worthen, Janet","age":66,"gender":"F"},{"id":100002,"name":"Bowen, Ardeth","age":30,"gender":"F"},{"id":100003,"name":"Bowen, Carlos","age":5,"gender":"M"},{"id":100004,"name":"Bowen, Julie","age":3,"gender":"F"},{"id":100005,"name":"Bowen, Spencer","age":1,"gender":"M"},{"id":100006,"name":"Bowen, Zoram","age":29,"gender":"M"},{"id":100007,"name":"Clawson, Pahoran","age":21,"gender":"M"},{"id":100008,"name":"Lee, Leonora","age":11,"gender":"F"},{"id":100009,"name":"Wirthlin, Lois","age":47,"gender":"F"},{"id":100010,"name":"Lee, Marion","age":46,"gender":"M"},{"id":100011,"name":"Lee, Emily","age":17,"gender":"F"},{"id":100012,"name":"Lee, Peter","age":19,"gender":"M"},{"id":100013,"name":"Lee, Rebecca","age":44,"gender":"F"},{"id":100014,"name":"Lee, Thomas","age":14,"gender":"M"},{"id":100015,"name":"Clawson, Ida","age":62,"gender":"F"},{"id":100016,"name":"Renlund, Ezekiel","age":7,"gender":"M"},{"id":100017,"name":"Renlund, Eve","age":43,"gender":"F"},{"id":100018,"name":"Renlund, Enos","age":46,"gender":"M"},{"id":100019,"name":"Renlund, Margaret","age":15,"gender":"F"},{"id":100020,"name":"Renlund, Samuel","age":17,"gender":"M"},{"id":100021,"name":"Renlund, Andrew","age":13,"gender":"M"},{"id":100022,"name":"Young, Lucile","age":15,"gender":"F"},{"id":100023,"name":"Young, Rhoda","age":11,"gender":"F"},{"id":100024,"name":"Young, Eliza","age":13,"gender":"F"},{"id":100025,"name":"Young, Sophia","age":38,"gender":"F"},{"id":100026,"name":"Young, Clara","age":9,"gender":"F"},{"id":100027,"name":"Young, Brent","age":42,"gender":"M"},{"id":100028,"name":"Dunn, Donald","age":43,"gender":"M"},{"id":100029,"name":"Oaks, Elaine","age":71,"gender":"F"},{"id":100030,"name":"Oaks, Adam","age":73,"gender":"M"},{"id":100031,"name":"Callis, Naomi","age":65,"gender":"F"},{"id":100032,"name":"Wells, Emma","age":19,"gender":"F"},{"id":100033,"name":"Benson, Sophia","age":77,"gender":"F"},{"id":100034,"name":"Benson, Russell","age":87,"gender":"M"},{"id":100035,"name":"Rich, Teancum","age":56,"gender":"M"},{"id":100036,"name":"Rich, Esther","age":62,"gender":"F"},{"id":100037,"name":"Pace, Belle","age":82,"gender":"F"},{"id":100038,"name":"Lyman, Camilla","age":80,"gender":"F"},{"id":100039,"name":"Cordon, Zeniff","age":42,"gender":"M"},{"id":100040,"name":"Hyde, Carol","age":88,"gender":"F"},{"id":100041,"name":"Pratt, Naomi","age":75,"gender":"F"},{"id":100042,"name":"Lund, Cora","age":12,"gender":"F"},{"id":100043,"name":"Perry, Joseph","age":39,"gender":"M"},{"id":100044,"name":"Lund, Moses","age":6,"gender":"M"},{"id":100045,"name":"Lund, Heber","age":4,"gender":"M"},{"id":100046,"name":"Lund, Peter","age":39,"gender":"M"},{"id":100047,"name":"Lund, Jared","age":10,"gender":"M"},{"id":100048,"name":"Lund, Silas","age":4,"gender":"M"},{"id":100049,"name":"Lund, Martha","age":35,"gender":"F"},{"id":100050,"name":"Talmage, Gary","age":60,"gender":"M"},{"id":100051,"name":"Didier, Aurelia","age":65,"gender":"F"},{"id":100052,"name":"Whitmer, Dieter","age":22,"gender":"M"},{"id":100053,"name":"Whitmer, Alma","age":20,"gender":"M"},{"id":100054,"name":"Hales, Ezra","age":53,"gender":"M"},{"id":100055,"name":"Hales, Abigail","age":54,"gender":"F"},{"id":100056,"name":"Bangerter, Olive","age":71,"gender":"F"},{"id":100057,"name":"Tuttle, Barnabas","age":74,"gender":"M"},{"id":100058,"name":"Tuttle, Lavina","age":71,"gender":"F"},{"id":100059,"name":"Kopischke, Amelia","age":36,"gender":"F"},{"id":100060,"name":"McKay, Zeniff","age":54,"gender":"M"},{"id":100061,"name":"Hanks, Amy","age":71,"gender":"F"},{"id":100062,"name":"Jensen, Loren","age":33,"gender":"M"},{"id":100063,"name":"Jensen, Carol","age":3,"gender":"F"},{"id":100064,"name":"Jensen, LaVern","age":4,"gender":"F"},{"id":100065,"name":"Jensen, Rachel","age":39,"gender":"F"},{"id":100066,"name":"Jensen, Lydia","age":1,"gender":"F"},{"id":100067,"name":"Featherstone, Elaine","age":67,"gender":"F"},{"id":100068,"name":"Knight, Grace","age":72,"gender":"F"},{"id":100069,"name":"Harris, Ether","age":64,"gender":"M"},{"id":100070,"name":"Cowdery, Lydia","age":31,"gender":"F"},{"id":100071,"name":"Harris, Louie","age":52,"gender":"F"},{"id":100072,"name":"Alvarado, Mercy","age":13,"gender":"F"},{"id":100073,"name":"Alvarado, Ether","age":51,"gender":"M"},{"id":100074,"name":"Alvarado, Lucy","age":47,"gender":"F"},{"id":100075,"name":"Patten, Louie","age":87,"gender":"F"},{"id":100076,"name":"Bateman, Dorcas","age":73,"gender":"F"},{"id":100077,"name":"Bateman, Loren","age":72,"gender":"M"},{"id":100078,"name":"Hinckley, Anna","age":78,"gender":"F"},{"id":100079,"name":"Maxwell, Leah","age":32,"gender":"F"},{"id":100080,"name":"Andersen, Silas","age":48,"gender":"M"},{"id":100081,"name":"McConkie, Bruce","age":71,"gender":"M"},{"id":100082,"name":"McConkie, Phoebe","age":68,"gender":"F"},{"id":100083,"name":"Cowdery, Janette","age":0,"gender":"F"},{"id":100084,"name":"Romney, Ruth","age":80,"gender":"F"},{"id":100085,"name":"Romney, Hartman","age":82,"gender":"M"},{"id":100086,"name":"Eyring, Bonnie","age":35,"gender":"F"},{"id":100087,"name":"Alvarado, Paul","age":20,"gender":"M"},{"id":100088,"name":"Alvarado, Ezekiel","age":25,"gender":"M"},{"id":100089,"name":"Alvarado, Sarah","age":18,"gender":"F"},{"id":100090,"name":"Hillam, Carlos","age":43,"gender":"M"},{"id":100091,"name":"Simpson, Ruth","age":67,"gender":"F"},{"id":100092,"name":"Roberts, Matthew","age":25,"gender":"M"},{"id":100093,"name":"Roberts, Daniel","age":58,"gender":"M"},{"id":100094,"name":"Roberts, Phoebe","age":55,"gender":"F"},{"id":100095,"name":"Grant, Abish","age":21,"gender":"F"},{"id":100096,"name":"Grant, Clarissa","age":16,"gender":"F"},{"id":100097,"name":"Grant, Barnabas","age":52,"gender":"M"},{"id":100098,"name":"Grant, Tabitha","age":25,"gender":"F"},{"id":100099,"name":"Grant, Phoebe","age":49,"gender":"F"},{"id":100100,"name":"Faust, Philip","age":30,"gender":"M"},{"id":100101,"name":"Faust, Ruth","age":62,"gender":"F"},{"id":100102,"name":"Clayton, Carlos","age":78,"gender":"M"},{"id":100103,"name":"Page, Elias","age":76,"gender":"M"},{"id":100104,"name":"Page, Susa","age":74,"gender":"F"},{"id":100105,"name":"Kimball, Hosea","age":84,"gender":"M"},{"id":100106,"name":"Kimball, Abigail","age":80,"gender":"F"},{"id":100107,"name":"Ballard, Annie","age":18,"gender":"F"},{"id":100108,"name":"Ballard, Anna","age":49,"gender":"F"},{"id":100109,"name":"Petersen, Eli","age":36,"gender":"M"},{"id":100110,"name":"Stapley, Mosiah","age":23,"gender":"M"},{"id":100111,"name":"Stapley, Joseph","age":51,"gender":"M"},{"id":100112,"name":"Christofferson, Zoram","age":41,"gender":"M"},{"id":100113,"name":"Christofferson, Julia","age":5,"gender":"F"},{"id":100114,"name":"Christofferson, Jane","age":36,"gender":"F"},{"id":100115,"name":"Christofferson, Mabel","age":10,"gender":"F"},{"id":100116,"name":"Christofferson, Hartman","age":3,"gender":"M"},{"id":100117,"name":"Christofferson, Howard","age":1,"gender":"M"},{"id":100118,"name":"Christofferson, Abish","age":8,"gender":"F"},{"id":100119,"name":"Merrill, Benjamin","age":55,"gender":"M"},{"id":100120,"name":"Rasband, Emily","age":72,"gender":"F"},{"id":100121,"name":"Woodruff, Lavina","age":83,"gender":"F"},{"id":100122,"name":"Snow, Craig","age":47,"gender":"M"},{"id":100123,"name":"Cook, Hyrum","age":82,"gender":"M"},{"id":100124,"name":"Cook, Emily","age":80,"gender":"F"},{"id":100125,"name":"Marsh, Camilla","age":54,"gender":"F"},{"id":100126,"name":"Ivins, Naomi","age":23,"gender":"F"},{"id":100127,"name":"Davies, Helen","age":77,"gender":"F"},{"id":100128,"name":"Davies, Hosea","age":84,"gender":"M"},{"id":100129,"name":"Uchtdorf, Aurelia","age":69,"gender":"F"},{"id":100130,"name":"Uchtdorf, Samuel","age":71,"gender":"M"},{"id":100131,"name":"Poelman, Dorcas","age":54,"gender":"F"},{"id":100132,"name":"Rigdon, Lehi","age":52,"gender":"M"},{"id":100133,"name":"Samuelson, Phoebe","age":80,"gender":"F"},{"id":100134,"name":"Bednar, Charity","age":34,"gender":"F"},{"id":100135,"name":"Bednar, Joy","age":2,"gender":"F"},{"id":100136,"name":"Bednar, Timothy","age":37,"gender":"M"},{"id":100137,"name":"Smith, Marion","age":24,"gender":"M"},{"id":100138,"name":"Sitati, Jeffrey","age":41,"gender":"M"},{"id":100139,"name":"Bednar, Zoram","age":9,"gender":"M"},{"id":100140,"name":"Widtsoe, Adelaide","age":53,"gender":"F"},{"id":100141,"name":"Widtsoe, Isaac","age":56,"gender":"M"},{"id":100142,"name":"Kearon, Zoram","age":70,"gender":"M"},{"id":100143,"name":"Kearon, Leah","age":68,"gender":"F"},{"id":100144,"name":"Kearon, Milton","age":32,"gender":"M"},{"id":100145,"name":"Cannon, Spencer","age":42,"gender":"M"},{"id":100146,"name":"Funk, Ida","age":63,"gender":"F"},{"id":100147,"name":"Stevenson, Brigham","age":21,"gender":"M"},{"id":100148,"name":"Stevenson, Franklin","age":44,"gender":"M"},{"id":100149,"name":"Stevenson, Ruth","age":43,"gender":"F"},{"id":100150,"name":"Stevenson, Dieter","age":13,"gender":"M"},{"id":100151,"name":"Ashton, Russell","age":78,"gender":"M"},{"id":100152,"name":"Whitmer, Leah","age":41,"gender":"F"},{"id":100153,"name":"Morrison, Aurelia","age":24,"gender":"F"},{"id":100154,"name":"Morrison, James","age":19,"gender":"M"},{"id":100155,"name":"Morrison, Naomi","age":15,"gender":"F"},{"id":100156,"name":"Morrison, Jedediah","age":44,"gender":"M"},{"id":100157,"name":"Morrison, Anne","age":45,"gender":"F"},{"id":100158,"name":"Condie, Eldred","age":38,"gender":"M"},{"id":100159,"name":"Condie, Henry","age":10,"gender":"M"},{"id":100160,"name":"Condie, Adelaide","age":36,"gender":"F"},{"id":100161,"name":"Condie, Belle","age":7,"gender":"F"},{"id":100162,"name":"Condie, Jacob","age":4,"gender":"M"},{"id":100163,"name":"Winder, Zoram","age":71,"gender":"M"},{"id":100164,"name":"Romney, Titus","age":21,"gender":"M"},{"id":100165,"name":"Packer, Craig","age":62,"gender":"M"},{"id":100166,"name":"Packer, Eve","age":31,"gender":"F"},{"id":100167,"name":"Soares, Julia","age":22,"gender":"F"},{"id":100168,"name":"Packer, Elisabeth","age":64,"gender":"F"},{"id":100169,"name":"Burton, Elaine","age":85,"gender":"F"},{"id":100170,"name":"Falabella, Clara","age":59,"gender":"F"},{"id":100171,"name":"Falabella, Lois","age":25,"gender":"F"},{"id":100172,"name":"Falabella, Howard","age":60,"gender":"M"},{"id":100173,"name":"Taylor, Sarah","age":64,"gender":"F"},{"id":100174,"name":"Penrose, Patience","age":68,"gender":"F"},{"id":100175,"name":"Tingey, Jedediah","age":84,"gender":"M"},{"id":100176,"name":"Tingey, Mary","age":80,"gender":"F"},{"id":100177,"name":"Hunter, Elijah","age":52,"gender":"M"},{"id":100178,"name":"Hunter, Patience","age":16,"gender":"F"},{"id":100179,"name":"Rector, Naomi","age":32,"gender":"F"},{"id":100180,"name":"Callister, Philip","age":44,"gender":"M"},{"id":100181,"name":"Monson, Anne","age":67,"gender":"F"},{"id":100182,"name":"Monson, Dale","age":27,"gender":"M"},{"id":100183,"name":"Monson, Nephi","age":69,"gender":"M"},{"id":100184,"name":"Monson, Titus","age":29,"gender":"M"},{"id":100185,"name":"Holland, Eli","age":34,"gender":"M"},{"id":100186,"name":"Gong, Quentin","age":24,"gender":"M"},{"id":100187,"name":"Gong, Jedediah","age":58,"gender":"M"},{"id":100188,"name":"Scott, Marion","age":58,"gender":"M"},{"id":100189,"name":"Gong, Miriam","age":57,"gender":"F"},{"id":100190,"name":"Gong, Alma","age":21,"gender":"M"},{"id":100191,"name":"Haight, Amy","age":45,"gender":"F"},{"id":100192,"name":"Aoyagi, Eli","age":78,"gender":"M"},{"id":100193,"name":"Aoyagi, Bonnie","age":77,"gender":"F"},{"id":100194,"name":"Richards, Glen","age":22,"gender":"M"},{"id":100195,"name":"Nelson, Adelaide","age":56,"gender":"F"},{"id":100196,"name":"Paramore, Caleb","age":75,"gender":"M"},{"id":100197,"name":"Worthen, Titus","age":79,"gender":"M"},{"id":100198,"name":"Worthen, Joy","age":74,"gender":"F"},{"id":100199,"name":"Bowen, Eve","age":72,"gender":"F"},{"id":100200,"name":"Bowen, Ezekiel","age":70,"gender":"M"},{"id":100201,"name":"Bowen, Orrin","age":24,"gender":"M"},{"id":100202,"name":"Clawson, Janette","age":39,"gender":"F"},{"id":100203,"name":"Lee, Deborah","age":44,"gender":"F"},{"id":100204,"name":"Wirthlin, Sheri","age":76,"gender":"F"},{"id":100205,"name":"Renlund, Orrin","age":77,"gender":"M"},{"id":100206,"name":"Young, Ezekiel","age":3,"gender":"M"},{"id":100207,"name":"Young, Porter","age":7,"gender":"M"},{"id":100208,"name":"Young, Lamoni","age":6,"gender":"M"},{"id":100209,"name":"Young, Earl","age":35,"gender":"M"},{"id":100210,"name":"Young, Esther","age":35,"gender":"F"},{"id":100211,"name":"Young, Micah","age":1,"gender":"M"},{"id":100212,"name":"Dunn, Frances","age":63,"gender":"F"},{"id":100213,"name":"Oaks, Isabel","age":88,"gender":"F"},{"id":100214,"name":"Callis, Barbara","age":61,"gender":"F"},{"id":100215,"name":"Wells, Edith","age":64,"gender":"F"},{"id":100216,"name":"Benson, Noah","age":40,"gender":"M"},{"id":100217,"name":"Rich, Hartman","age":39,"gender":"M"},{"id":100218,"name":"Pace, Susan","age":47,"gender":"F"},{"id":100219,"name":"Lyman, Tabitha","age":47,"gender":"F"},{"id":100220,"name":"Rich, Bertha","age":71,"gender":"F"},{"id":100221,"name":"Cordon, Joshua","age":32,"gender":"M"},{"id":100222,"name":"Cordon, Helen","age":3,"gender":"F"},{"id":100223,"name":"Cordon, Harriet","age":0,"gender":"F"},{"id":100224,"name":"Cordon, Elijah","age":5,"gender":"M"},{"id":100225,"name":"Cordon, Hannah","age":31,"gender":"F"},{"id":100226,"name":"Hyde, Deborah","age":16,"gender":"F"},{"id":100227,"name":"Hyde, Lois","age":14,"gender":"F"},{"id":100228,"name":"Hyde, Jacob","age":9,"gender":"M"},{"id":100229,"name":"Hyde, Stephen","age":44,"gender":"M"},{"id":100230,"name":"Hyde, Amelia","age":41,"gender":"F"},{"id":100231,"name":"Pratt, Louise","age":65,"gender":"F"},{"id":100232,"name":"Pratt, Helen","age":38,"gender":"F"},{"id":100233,"name":"Pratt, Luke","age":72,"gender":"M"},{"id":100234,"name":"Pratt, Abish","age":35,"gender":"F"},{"id":100235,"name":"Lund, Mary","age":72,"gender":"F"},{"id":100236,"name":"Perry, Stephen","age":17,"gender":"M"},{"id":100237,"name":"Perry, LaVern","age":38,"gender":"F"},{"id":100238,"name":"Talmage, Clara","age":70,"gender":"F"},{"id":100239,"name":"Didier, Elizabeth","age":67,"gender":"F"},{"id":100240,"name":"Didier, Loren","age":77,"gender":"M"},{"id":100241,"name":"Whitmer, Peter","age":36,"gender":"M"},{"id":100242,"name":"Hales, Samuel","age":65,"gender":"M"},{"id":100243,"name":"Hales, Sheri","age":63,"gender":"F"},{"id":100244,"name":"Bangerter, Ardeth","age":72,"gender":"F"},{"id":100245,"name":"Bangerter, Hosea","age":75,"gender":"M"},{"id":100246,"name":"Tuttle, Sophia","age":71,"gender":"F"},{"id":100247,"name":"Wells, Camilla","age":44,"gender":"F"},{"id":100248,"name":"Kopischke, Loren","age":69,"gender":"M"},{"id":100249,"name":"Kopischke, Chieko","age":67,"gender":"F"},{"id":100250,"name":"McKay, Jane","age":60,"gender":"F"},{"id":100251,"name":"McKay, Neil","age":62,"gender":"M"},{"id":100252,"name":"Ivins, Abish","age":46,"gender":"F"},{"id":100253,"name":"Hanks, Adelaide","age":32,"gender":"F"},{"id":100254,"name":"Jensen, Merlin","age":18,"gender":"M"},{"id":100255,"name":"Jensen, Deborah","age":38,"gender":"F"},{"id":100256,"name":"Featherstone, Robert","age":80,"gender":"M"},{"id":100257,"name":"Featherstone, Susan","age":77,"gender":"F"},{"id":100258,"name":"Knight, Emma","age":67,"gender":"F"},{"id":100259,"name":"Harris, Seth","age":57,"gender":"M"},{"id":100260,"name":"Richards, Stephen","age":18,"gender":"M"},{"id":100261,"name":"Richards, Faith","age":42,"gender":"F"},{"id":100262,"name":"Cowdery, Moses","age":21,"gender":"M"},{"id":100263,"name":"Alvarado, Florence","age":4,"gender":"F"},{"id":100264,"name":"Alvarado, Harriet","age":27,"gender":"F"},{"id":100265,"name":"Patten, Dallin","age":21,"gender":"M"},{"id":100266,"name":"Bateman, Alvin","age":70,"gender":"M"},{"id":100267,"name":"Hinckley, Mosiah","age":70,"gender":"M"},{"id":100268,"name":"Maxwell, Martha","age":69,"gender":"F"},{"id":100269,"name":"Andersen, Helen","age":25,"gender":"F"},{"id":100270,"name":"Andersen, Boyd","age":29,"gender":"M"},{"id":100271,"name":"Andersen, Sheri","age":27,"gender":"F"},{"id":100272,"name":"Andersen, Calvin","age":56,"gender":"M"},{"id":100273,"name":"Andersen, Dorcas","age":53,"gender":"F"},{"id":100274,"name":"McConkie, Abraham","age":49,"gender":"M"},{"id":100275,"name":"McConkie, Isabel","age":15,"gender":"F"},{"id":100276,"name":"Romney, Willard","age":16,"gender":"M"},{"id":100277,"name":"Romney, Phoebe","age":14,"gender":"F"},{"id":100278,"name":"Romney, Hope","age":46,"gender":"F"},{"id":100279,"name":"Romney, Spencer","age":45,"gender":"M"},{"id":100280,"name":"Romney, Mercy","age":19,"gender":"F"},{"id":100281,"name":"Eyring, Abish","age":56,"gender":"F"},{"id":100282,"name":"Eyring, Monte","age":29,"gender":"M"},{"id":100283,"name":"Hillam, Minerva","age":51,"gender":"F"},{"id":100284,"name":"Simpson, Phoebe","age":71,"gender":"F"},{"id":100285,"name":"Roberts, Carlos","age":39,"gender":"M"},{"id":100286,"name":"Simpson, Joseph","age":71,"gender":"M"},{"id":100287,"name":"Grant, Bertha","age":75,"gender":"F"},{"id":100288,"name":"Faust, Cora","age":46,"gender":"F"},{"id":100289,"name":"Faust, Noah","age":46,"gender":"M"},{"id":100290,"name":"Faust, Jane","age":20,"gender":"F"},{"id":100291,"name":"Faust, Harold","age":18,"gender":"M"},{"id":100292,"name":"Faust, Leonora","age":16,"gender":"F"},{"id":100293,"name":"Rasband, Hosea","age":12,"gender":"M"},{"id":100294,"name":"Rasband, Mae","age":20,"gender":"F"},{"id":100295,"name":"Clayton, Orrin","age":60,"gender":"M"},{"id":100296,"name":"Page, Loren","age":38,"gender":"M"},{"id":100297,"name":"Kimball, Leonora","age":4,"gender":"F"},{"id":100298,"name":"Kimball, Ardeth","age":27,"gender":"F"},{"id":100299,"name":"Kimball, Ezra","age":30,"gender":"M"},{"id":100300,"name":"Ballard, Hope","age":27,"gender":"F"},{"id":100301,"name":"Kimball, Russell","age":2,"gender":"M"},{"id":100302,"name":"Ballard, Jedediah","age":2,"gender":"M"},{"id":100303,"name":"Ballard, Nathan","age":28,"gender":"M"},{"id":100304,"name":"Ballard, Dotty","age":3,"gender":"F"},{"id":100305,"name":"Kimball, Nathan","age":6,"gender":"M"},{"id":100306,"name":"Petersen, Brent","age":48,"gender":"M"},{"id":100307,"name":"Petersen, Patience","age":46,"gender":"F"},{"id":100308,"name":"Petersen, Donald","age":13,"gender":"M"},{"id":100309,"name":"Petersen, Annie","age":16,"gender":"F"},{"id":100310,"name":"Petersen, Jared","age":10,"gender":"M"},{"id":100311,"name":"Stapley, Philip","age":53,"gender":"M"},{"id":100312,"name":"Petersen, Gerrit","age":17,"gender":"M"},{"id":100313,"name":"Christofferson, Jared","age":75,"gender":"M"},{"id":100314,"name":"Merrill, Sheri","age":63,"gender":"F"},{"id":100315,"name":"Merrill, Ezra","age":66,"gender":"M"},{"id":100316,"name":"Rasband, Sidney","age":77,"gender":"M"},{"id":100317,"name":"Rasband, Eve","age":70,"gender":"F"},{"id":100318,"name":"Eyring, Luke","age":65,"gender":"M"},{"id":100319,"name":"Eyring, Eve","age":60,"gender":"F"},{"id":100320,"name":"Eyring, Benjamin","age":24,"gender":"M"},{"id":100321,"name":"Eyring, Carole","age":15,"gender":"F"},{"id":100322,"name":"Woodruff, Sheri","age":71,"gender":"F"},{"id":100323,"name":"Woodruff, Harold","age":75,"gender":"M"},{"id":100324,"name":"Snow, Bathsheba","age":65,"gender":"F"},{"id":100325,"name":"Cook, Carole","age":76,"gender":"F"},{"id":100326,"name":"Marsh, Eli","age":58,"gender":"M"},{"id":100327,"name":"Ivins, Jane","age":47,"gender":"F"},{"id":100328,"name":"Davies, Nettie","age":66,"gender":"F"},{"id":100329,"name":"Davies, Andrew","age":69,"gender":"M"},{"id":100330,"name":"Uchtdorf, Emma","age":39,"gender":"F"},{"id":100331,"name":"Poelman, Enoch","age":45,"gender":"M"}];

        // Callings data is already in internal format (includes out-of-unit as a subOrg)
        this.callingsData = demoCallings;
        
        // Import member list
        this.importMemberList(demoMembers);
        
        this.saveData();
        this.showManager();
    }

    initBookmarklet() {
        const bookmarkletLink = document.getElementById('lcr-bookmarklet');
        if (!bookmarkletLink) return;

        // Two-step bookmarklet: collects data from TWO LCR pages.
        //
        // Step 1 — Organizations page (/orgs/):
        //   Reads the full org tree (sub-orgs, positions incl. vacants)
        //   from self.__next_f → unitOrgsMap.  Stores in LCR localStorage.
        //
        // Step 2 — Members With Callings report (/mlt/report/member-callings):
        //   Reads membersWithCallings, membersWithoutCallings, BaseUnitOrgs.
        //   Combines with stored org data → copies merged bundle to clipboard.
                const code = `
            (async function(){
    var s=document.createElement('div');
    s.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px 20px;font:14px/1.4 sans-serif;text-align:center;';
    s.style.background='#3a3d40';s.style.color='#fff';
    s.textContent='Extracting LCR data...';
    document.body.appendChild(s);
    function fail(msg){s.style.background='#b00504';s.textContent='Error: '+msg;setTimeout(function(){s.remove()},12000);}
    function ok(msg){s.style.background='#318d43';s.innerHTML=msg;setTimeout(function(){s.remove()},10000);}
    function warn(msg){s.style.background='#c47f00';s.innerHTML=msg;setTimeout(function(){s.remove()},12000);}
    function info(msg){s.style.background='#1a6985';s.textContent=msg;}
    function findKey(o,key){
        if(!o||typeof o!=='object') return null;
        if(!Array.isArray(o)&&o[key]) return o[key];
        if(Array.isArray(o)){for(var i=0;i<o.length;i++){var r=findKey(o[i],key);if(r)return r;}}
        else{for(var k in o){var r=findKey(o[k],key);if(r)return r;}}
        return null;
    }
    function findByPredicate(o,pred){
        if(!o||typeof o!=='object') return null;
        try{if(pred(o)) return o;}catch(e){}
        if(Array.isArray(o)){for(var i=0;i<o.length;i++){var r=findByPredicate(o[i],pred);if(r)return r;}}
        else{for(var k in o){var r=findByPredicate(o[k],pred);if(r)return r;}}
        return null;
    }
    function getChunksFromRuntime(){
        var c=self.__next_f;
        return Array.isArray(c)?c:[];
    }
    function getLikelyDataUrls(mode){
        if(!self.performance||!performance.getEntriesByType) return [];
        var origin=location.origin;
        var keywords=mode==='org'
            ? ['org','organization','unitorg','calling']
            : ['member-callings','members','callings','report'];
        var entries=performance.getEntriesByType('resource')||[];
        var preferred=[];
        var fallback=[];
        for(var i=0;i<entries.length;i++){
            var e=entries[i];
            var name=e&&e.name?String(e.name):'';
            if(!name||name.indexOf(origin)!==0) continue;
            if(e.initiatorType&&e.initiatorType!=='fetch'&&e.initiatorType!=='xmlhttprequest') continue;
            var pathNoQuery=name.split('?')[0].toLowerCase();
            if(
                pathNoQuery.endsWith('.css') ||
                pathNoQuery.endsWith('.js') ||
                pathNoQuery.endsWith('.png') ||
                pathNoQuery.endsWith('.jpg') ||
                pathNoQuery.endsWith('.jpeg') ||
                pathNoQuery.endsWith('.gif') ||
                pathNoQuery.endsWith('.svg') ||
                pathNoQuery.endsWith('.woff') ||
                pathNoQuery.endsWith('.woff2')
            ) continue;
            var lower=name.toLowerCase();
            var hit=false;
            for(var j=0;j<keywords.length;j++){
                if(lower.indexOf(keywords[j])!==-1){hit=true;break;}
            }
            if(hit) preferred.push(name);
            else fallback.push(name);
        }
        preferred.reverse();
        fallback.reverse();
        var urls=preferred.concat(fallback);
        var seen={};
        var unique=[];
        for(var k=0;k<urls.length;k++){
            if(seen[urls[k]]) continue;
            seen[urls[k]]=true;
            unique.push(urls[k]);
        }
        return unique.slice(0,30);
    }
    function extractPayloadsFromText(text){
        if(!text) return [];
        var payloads=[];
        var t=text.trim();
        if(t && (t[0]==='{'||t[0]==='[')){
            try{
                var parsed=JSON.parse(t);
                if(parsed&&typeof parsed==='object') payloads.push(parsed);
            }catch(e){}
        }
        var chunks=[];
        var needle='self.__next_f.push(';
        var pos=0;
        while(true){
            var start=text.indexOf(needle,pos);
            if(start===-1) break;
            var i=start+needle.length;
            var depth=1;
            var inStr=false;
            var quote='';
            var esc=false;
            for(;i<text.length;i++){
                var ch=text[i];
                if(inStr){
                    if(esc){esc=false;continue;}
                    if(ch==='\\\\'){esc=true;continue;}
                    if(ch===quote){inStr=false;quote='';}
                    continue;
                }
                if(ch==='"'||ch==="'"||ch==='\`'){inStr=true;quote=ch;continue;}
                if(ch==='('){depth++;continue;}
                if(ch===')'){
                    depth--;
                    if(depth===0){
                        var arg=text.slice(start+needle.length,i).trim();
                        try{chunks.push(JSON.parse(arg));}catch(e){}
                        pos=i+1;
                        break;
                    }
                }
            }
            if(depth!==0) pos=start+needle.length;
        }
        if(chunks.length){
            var p=extractPayloads(chunks);
            for(var j=0;j<p.length;j++) payloads.push(p[j]);
        }
        return payloads;
    }
    async function fetchJsonCandidates(mode){
        var urls=getLikelyDataUrls(mode);
        for(var i=0;i<urls.length;i++){
            try{
                var res=await fetch(urls[i],{credentials:'include'});
                if(!res.ok) continue;
                var text=await res.text();
                if(!text) continue;
                var payloads=extractPayloadsFromText(text);
                if(!payloads.length) continue;
                if(mode==='org'){
                    var org=findOrgPayload(payloads);
                    if(org) return org;
                }else{
                    var mwc=findMWCPayload(payloads);
                    if(mwc) return mwc;
                }
            }catch(e){}
        }
        return null;
    }
    function getChunksFromScripts(){
        var out=[];
        function extractPushArgs(text){
            var args=[];
            var needle='self.__next_f.push(';
            var pos=0;
            while(true){
                var start=text.indexOf(needle,pos);
                if(start===-1) break;
                var i=start+needle.length;
                var depth=1;
                var inStr=false;
                var quote='';
                var esc=false;
                for(;i<text.length;i++){
                    var ch=text[i];
                    if(inStr){
                        if(esc){esc=false;continue;}
                        if(ch==='\\\\'){esc=true;continue;}
                        if(ch===quote){inStr=false;quote='';}
                        continue;
                    }
                      if(ch==='\"'||ch==="'"||ch==='\`'){inStr=true;quote=ch;continue;}
                    if(ch==='('){depth++;continue;}
                    if(ch===')'){
                        depth--;
                        if(depth===0){
                            args.push(text.slice(start+needle.length,i).trim());
                            pos=i+1;
                            break;
                        }
                    }
                }
                if(depth!==0){
                    pos=start+needle.length;
                }
            }
            return args;
        }
        var scripts=document.querySelectorAll('script');
        for(var i=0;i<scripts.length;i++){
            var txt=scripts[i].textContent||'';
            var args=extractPushArgs(txt);
            for(var j=0;j<args.length;j++){
                try{out.push(JSON.parse(args[j]));}catch(e){}
            }
        }
        if(!out.length){
            var html=(document.documentElement&&document.documentElement.outerHTML)||'';
            var htmlArgs=extractPushArgs(html);
            for(var k=0;k<htmlArgs.length;k++){
                try{out.push(JSON.parse(htmlArgs[k]));}catch(e){}
            }
        }
        return out;
    }
    function extractPayloads(chunks){
        var payloads=[];
        function pushPayload(v){if(v&&typeof v==='object') payloads.push(v);}
        for(var i=0;i<chunks.length;i++){
            var c=chunks[i];
            if(!c||typeof c[1]!=='string') continue;
            var raw=c[1];
            var t=raw.trim();
            if((t[0]==='{'||t[0]==='[')){
                try{pushPayload(JSON.parse(t));}catch(e){}
            }
            var lines=raw.split('\\n');
            for(var j=0;j<lines.length;j++){
                var line=lines[j].trim();
                var ci=line.indexOf(':');
                if(ci<=0||ci>12) continue;
                var body=line.substring(ci+1).trim();
                if(!body) continue;
                var fc=body[0];
                if(fc!=='{'&&fc!=='['&&fc!=='\"') continue;
                try{pushPayload(JSON.parse(body));}catch(e){}
            }
        }
        return payloads;
    }
    function hasTextInChunks(chunks,text){
        for(var i=0;i<chunks.length;i++){
            if(typeof chunks[i][1]==='string'&&chunks[i][1].indexOf(text)!==-1) return true;
        }
        return false;
    }
    function findOrgPayload(payloads){
        for(var i=0;i<payloads.length;i++){
            var uom=findKey(payloads[i],'unitOrgsMap');
            if(uom&&typeof uom==='object'){
                var nums=Object.keys(uom);
                if(nums.length&&uom[nums[0]]&&Array.isArray(uom[nums[0]].unitOrgs)){
                    return {unitOrgs:uom[nums[0]].unitOrgs,unitName:uom[nums[0]].unitName,unitNumber:uom[nums[0]].unitNumber};
                }
            }
        }
        for(var j=0;j<payloads.length;j++){
            var unit=findByPredicate(payloads[j],function(x){
                if(!x||typeof x!=='object'||!Array.isArray(x.unitOrgs)) return false;
                return x.unitOrgs.some(function(u){return u&&(Array.isArray(u.positions)||Array.isArray(u.childUnitOrgs));});
            });
            if(unit){
                return {unitOrgs:unit.unitOrgs,unitName:unit.unitName||unit.name||null,unitNumber:unit.unitNumber||null};
            }
        }
        return null;
    }
    function findMWCPayload(payloads){
        var mwcNode=null;
        var baseNode=null;
        for(var i=0;i<payloads.length;i++){
            var p=payloads[i];
            if(!mwcNode){
                mwcNode=findByPredicate(p,function(x){
                    if(!x||typeof x!=='object') return false;
                    if(x.listOfPersons&&typeof x.listOfPersons==='object') return true;
                    return !!(x.membersWithCallings&&x.membersWithoutCallings);
                });
            }
            if(!baseNode){
                baseNode=findByPredicate(p,function(x){
                    return !!(x&&typeof x==='object'&&x.UnitOrgs&&Array.isArray(x.UnitOrgs));
                });
            }
            if(mwcNode&&baseNode) break;
        }
        if(!mwcNode) return null;
        var lop=mwcNode.listOfPersons&&typeof mwcNode.listOfPersons==='object'
            ? mwcNode.listOfPersons
            : {membersWithCallings:mwcNode.membersWithCallings||{},membersWithoutCallings:mwcNode.membersWithoutCallings||{}};
        var base=(mwcNode.BaseUnitOrgs&&mwcNode.BaseUnitOrgs.UnitOrgs)
            ? mwcNode.BaseUnitOrgs
            : (baseNode||null);
        return {listOfPersons:lop,baseUnitOrgs:(base&&base.UnitOrgs)||[],unitNumber:(base&&base.unitNumber)||mwcNode.unitNumber||null};
    }
    function getPayloadsFromJsonScripts(){
        var out=[];
        var nodes=document.querySelectorAll('script[type="application/json"],script#__NEXT_DATA__');
        for(var i=0;i<nodes.length;i++){
            try{var v=JSON.parse(nodes[i].textContent||'');if(v&&typeof v==='object') out.push(v);}catch(e){}
        }
        return out;
    }
    var KNOWN_ACTIONS={org:['40e024b9f95791ad9e6001d64a1c86f96128b2bc35'],mwc:['60e5b9f4e68e08227ecf20bf99e02561edc9500812']};
    function parseFlightRows(text){
        var out=[];
        var lines=text.split('\\n');
        for(var i=0;i<lines.length;i++){
            var m=/^[0-9a-f]+:([\\[{].*)$/.exec(lines[i]);
            if(!m) continue;
            try{out.push(JSON.parse(m[1]));}catch(e){}
        }
        return out;
    }
    function getLang(){
        var m=/[?&]lang=([a-z]+)/.exec(location.search);
        return m?m[1]:'eng';
    }
    function getUnitNumber(){
        try{return self.mltPlatformConfig.context.user.targetUser.selectedUnitContext.unit.unitNumber||null;}catch(e){return null;}
    }
    async function discoverActionIds(mode){
        var srcs={};
        var nodes=document.querySelectorAll('script[src]');
        for(var i=0;i<nodes.length;i++) srcs[nodes[i].src]=1;
        var entries=(self.performance&&performance.getEntriesByType)?performance.getEntriesByType('resource'):[];
        for(var j=0;j<entries.length;j++){
            var n=String(entries[j].name||'');
            if(n.indexOf('/_next/static/')!==-1&&n.split('?')[0].endsWith('.js')) srcs[n]=1;
        }
        var want=mode==='org'?/org/i:/(member|calling)/i;
        var readish=/^(get|fetch|load|list|find|read|query)/i;
        var unsafe=/(delete|remove|release|update|create|save|set|add|submit|send|approve|reject|cancel|post|put|move|change|edit|sustain|assign)/i;
        var ids=[];
        var urls=Object.keys(srcs).slice(0,80);
        await Promise.all(urls.map(async function(u){
            try{
                var r=await fetch(u,{credentials:'same-origin'});
                if(!r.ok) return;
                var t=await r.text();
                var re=/createServerReference\\)?\\(\\s*"([0-9a-f]{40,64})"[^)]*?"([A-Za-z0-9_$]+)"\\)/g;
                var m;
                while((m=re.exec(t))){
                    if(readish.test(m[2])&&want.test(m[2])&&!unsafe.test(m[2])&&ids.indexOf(m[1])===-1) ids.push(m[1]);
                }
            }catch(e){}
        }));
        return ids;
    }
    async function fetchViaAction(mode){
        var lang=getLang();
        var unit=getUnitNumber();
        var args=mode==='org'?[lang]:(unit?[unit,lang]:null);
        if(!args) return null;
        var ids=KNOWN_ACTIONS[mode].slice();
        var tried={};
        for(var pass=0;pass<2;pass++){
            for(var i=0;i<ids.length;i++){
                if(tried[ids[i]]) continue;
                tried[ids[i]]=1;
                try{
                    var res=await fetch(location.href,{method:'POST',credentials:'include',headers:{'Accept':'text/x-component','Next-Action':ids[i],'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(args)});
                    if(!res.ok) continue;
                    var rows=parseFlightRows(await res.text());
                    var hit=mode==='org'?findOrgPayload(rows):findMWCPayload(rows);
                    if(hit) return hit;
                }catch(e){}
            }
            if(pass===0) ids=await discoverActionIds(mode);
        }
        return null;
    }
    try{
        var chunks=getChunksFromRuntime();
        if(!chunks.length) chunks=getChunksFromScripts();
        var payloads=extractPayloads(chunks).concat(getPayloadsFromJsonScripts());
        var path=(location.pathname||'').toLowerCase();
        var isOrgPage=path.indexOf('/orgs')!==-1;
        var isMWCPage=path.indexOf('/report/member-callings')!==-1;

        if(!isOrgPage&&!isMWCPage){
            var hasOrgs=hasTextInChunks(chunks,'unitOrgsMap')||hasTextInChunks(chunks,'orgs?unitOrgTypeId')||hasTextInChunks(chunks,'\"children\":[\"orgs\"');
            var hasMWC=hasTextInChunks(chunks,'membersWithCallings')||hasTextInChunks(chunks,'member-callings?')||hasTextInChunks(chunks,'\"children\":[\"report\",{\"children\":[\"member-callings\"');
            if(hasOrgs) isOrgPage=true;
            else if(hasMWC) isMWCPage=true;
            else{fail('Not recognized as an LCR Organizations or Members With Callings page.');return;}
        }

        if(isOrgPage){
            info('Step 1/2: Reading organization structure...');
            var orgPayload=findOrgPayload(payloads);
            if(!orgPayload) orgPayload=await fetchViaAction('org');
            if(!orgPayload) orgPayload=await fetchJsonCandidates('org');
            if(orgPayload&&!orgPayload.unitNumber) orgPayload.unitNumber=getUnitNumber();
            if(!orgPayload||!Array.isArray(orgPayload.unitOrgs)||!orgPayload.unitOrgs.length){
                localStorage.removeItem('__cm_orgData');
                warn('Step 1/2 note: this LCR page did not expose the organization tree. You can still continue to the <a href="https://lcr.churchofjesuschrist.org/mlt/report/member-callings?lang=eng" style="color:#fff;font-weight:700;text-decoration:underline">Members With Callings report</a> and run the bookmarklet there. Import will continue in reduced mode without vacancies.');
                return;
            }
            localStorage.setItem('__cm_orgData',JSON.stringify(orgPayload));
            var orgCount=orgPayload.unitOrgs.length;
            ok('Step 1/2 done! '+orgCount+' organizations saved. Now open the <a href=\"https://lcr.churchofjesuschrist.org/mlt/report/member-callings?lang=eng\" style=\"color:#fff;font-weight:700;text-decoration:underline\">Members With Callings report</a> and click this bookmarklet again.');
            return;
        }

        info('Step 2/2: Reading member & callings data...');
        var mwcData=findMWCPayload(payloads);
        if(!mwcData) mwcData=await fetchViaAction('mwc');
        if(!mwcData) mwcData=await fetchJsonCandidates('mwc');
        if(!mwcData||!mwcData.listOfPersons){
            fail('Could not find Members With Callings data on this page. Try refreshing the report page and running the bookmarklet again.');
            return;
        }

        var lop=mwcData.listOfPersons;
        var wc=lop.membersWithCallings||{};
        var woc=lop.membersWithoutCallings||{};
        var storedOrg=localStorage.getItem('__cm_orgData');
        var orgData=null;
        if(storedOrg){try{orgData=JSON.parse(storedOrg);}catch(e){}}

        var bundle={mwcData:{listOfPersons:lop,baseUnitOrgs:mwcData.baseUnitOrgs||[],unitNumber:mwcData.unitNumber||null}};
        if(orgData){
            bundle.orgData=orgData;
            bundle.source='bookmarklet-combined';
            localStorage.removeItem('__cm_orgData');
        } else {
            bundle.source='bookmarklet-mwc-only';
        }

        var json=JSON.stringify(bundle);
        var wcCount=Object.keys(wc).length;
        var wocCount=Object.keys(woc).length;
        navigator.clipboard.writeText(json).then(function(){
            var msg='Done! '+wcCount+' callings + '+wocCount+' members copied ('+Math.round(json.length/1024)+'KB).';
            if(!orgData) msg+=' NOTE: No org structure found — run Step 1 on the Organizations page first for best results.';
            msg+=' Switch to Calling Manager and click "Paste from Clipboard".';
            ok(msg);
        }).catch(function(e){fail(e.message||'Clipboard write failed');});
    }catch(e){fail(e.message||'Unknown error');}
})();`.replace(/\n/g, '').replace(/  +/g, ' ');

    const encodedCode = btoa(unescape(encodeURIComponent(code.trim())));
    bookmarkletLink.href = `javascript:(function(){var d=decodeURIComponent(escape(atob(${JSON.stringify(encodedCode)})));var s=document.createElement('script');s.text=d;(document.head||document.documentElement).appendChild(s);s.remove();})();`;
        
        // Prevent click from navigating (user should drag to bookmarks bar)
        bookmarkletLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Drag this link to your bookmarks bar, then click it while on an LCR page.\n\nIf you can\'t drag it, right-click and choose "Bookmark This Link" or "Add to Favorites".');
        });
    }

    async importFromClipboard() {
        const statusEl = document.getElementById('clipboard-status');
        const setStatus = (msg, isErr) => {
            if (statusEl) {
                statusEl.textContent = msg;
                statusEl.className = 'import-status ' + (isErr ? 'error' : 'success');
            }
        };

        try {
            setStatus('Reading clipboard...', false);

            const text = await navigator.clipboard.readText();
            if (!text || !text.trim()) {
                setStatus('Clipboard is empty. Run the bookmarklet on LCR first.', true);
                return;
            }

            const bundle = JSON.parse(text);

            // Detect format: combined (orgData+mwcData), MWC-only, RSC orgs, or old API
            const isCombinedFormat = !!bundle.mwcData;
            const isMWCFormat = !!bundle.listOfPersons;
            const isRSCFormat = !!bundle.unitOrgsMap;
            const isOldFormat = !!bundle.callings;

            if (!isCombinedFormat && !isMWCFormat && !isRSCFormat && !isOldFormat) {
                setStatus('Clipboard data doesn\'t look like LCR data. Run the bookmarklet on an LCR page first.', true);
                return;
            }

            setStatus('Processing data...', false);

            if (isCombinedFormat) {
                // New two-step format: org tree + MWC data
                const hasBothSources = !!bundle.orgData;
                console.log(`[CallingManager] ${hasBothSources ? 'Combined' : 'MWC-only'} format detected (source: ${bundle.source})`);
                const result = this.convertCombinedData(bundle.orgData, bundle.mwcData);
                this.callingsData = result.callingsData;
                this.memberList = result.memberList;
                const orgCount = this.callingsData.subOrgs.length;
                const memberCount = this.memberList.length;
                console.log(`[CallingManager] Converted ${orgCount} organizations, ${memberCount} members`);
                if (!hasBothSources) {
                    console.warn('[CallingManager] MWC-only mode: no sub-org structure or vacancies. Run Step 1 on Organizations page for full data.');
                }
            } else if (isMWCFormat) {
                // Legacy MWC-only format (backwards compat)
                console.log('[CallingManager] Legacy MWC report format detected');
                const result = this.convertCombinedData(null, bundle);
                this.callingsData = result.callingsData;
                this.memberList = result.memberList;
                console.log(`[CallingManager] Converted ${this.callingsData.subOrgs.length} organizations, ${this.memberList.length} members`);
            } else if (isRSCFormat) {
                // Older RSC format: unitOrgsMap from Organizations page
                const unitNumbers = Object.keys(bundle.unitOrgsMap);
                if (!unitNumbers.length) {
                    setStatus('No unit data found in clipboard.', true);
                    return;
                }
                const unitData = bundle.unitOrgsMap[unitNumbers[0]];
                console.log(`[CallingManager] RSC format: ${unitData.unitName} (${unitData.unitNumber}), ${unitData.unitOrgs.length} top-level orgs`);
                this.callingsData = this.convertLCRData(unitData.unitOrgs);

                // Import member list if available
                if (bundle.members) {
                    this.importMemberList(bundle.members);
                }
            } else {
                // Old API format
                console.log('[CallingManager] Old API format, keys:', Object.keys(bundle.callings));
                this.callingsData = this.convertLCRData(bundle.callings);

                // Handle out-of-unit callings
                if (bundle.outOfUnit) {
                    try {
                        const outOfUnitOrg = {
                            id: 'out-of-unit',
                            name: 'Out of Unit Callings',
                            callings: []
                        };
                        let outOfUnitCallings = [];
                        if (bundle.outOfUnit.LIVING_INSIDE && Array.isArray(bundle.outOfUnit.LIVING_INSIDE)) {
                            outOfUnitCallings = bundle.outOfUnit.LIVING_INSIDE;
                        } else if (Array.isArray(bundle.outOfUnit)) {
                            outOfUnitCallings = bundle.outOfUnit;
                        }
                        outOfUnitCallings.forEach((calling, index) => {
                            outOfUnitOrg.callings.push({
                                id: calling.positionId || `out-of-unit-${index}`,
                                name: calling.position || 'Unknown Position',
                                member: (calling.id && calling.name) ? { id: calling.id, name: calling.name } : null,
                                activeDate: calling.activeDate ? calling.activeDate.split('T')[0] : null,
                                setApartDate: calling.setApartDate ? calling.setApartDate.split('T')[0] : null
                            });
                        });
                        if (outOfUnitOrg.callings.length > 0) {
                            this.callingsData.subOrgs.push(outOfUnitOrg);
                        }
                    } catch (e) {
                        console.error('Error processing out of unit data:', e);
                    }
                }

                if (bundle.members) {
                    this.importMemberList(bundle.members);
                }
            }

            // Warn if conversion produced no results
            if (!this.callingsData.subOrgs || this.callingsData.subOrgs.length === 0) {
                console.warn('[CallingManager] Conversion produced 0 organizations.');
                setStatus('Warning: No organizations found in the data. The LCR format may have changed. Check browser console (F12) for details.', true);
                return;
            }

            this.saveData();
            setStatus('Imported successfully!', false);
            this.showManager();

        } catch (e) {
            if (e.name === 'NotAllowedError') {
                setStatus('Clipboard access denied. Your browser may require HTTPS or a user gesture.', true);
            } else if (e instanceof SyntaxError) {
                setStatus('Clipboard doesn\'t contain valid JSON. Run the bookmarklet on LCR first.', true);
            } else {
                setStatus('Error: ' + e.message, true);
                console.error('Clipboard import error:', e);
            }
        }
    }

    /**
     * Extract self.__next_f chunks from raw HTML page source.
     * Returns an array of parsed chunks (same shape the bookmarklet reads in-page).
     */
    parseNextDataFromHTML(html) {
        const chunks = [];
        const needle = 'self.__next_f.push(';
        let pos = 0;

        while (true) {
            const start = html.indexOf(needle, pos);
            if (start === -1) break;

            let i = start + needle.length;
            let depth = 1;
            let inStr = false;
            let quote = '';
            let esc = false;

            for (; i < html.length; i++) {
                const ch = html[i];

                if (inStr) {
                    if (esc) {
                        esc = false;
                        continue;
                    }
                    if (ch === '\\') {
                        esc = true;
                        continue;
                    }
                    if (ch === quote) {
                        inStr = false;
                        quote = '';
                    }
                    continue;
                }

                if (ch === '"' || ch === '\'' || ch === '`') {
                    inStr = true;
                    quote = ch;
                    continue;
                }

                if (ch === '(') {
                    depth++;
                    continue;
                }

                if (ch === ')') {
                    depth--;
                    if (depth === 0) {
                        const arg = html.slice(start + needle.length, i).trim();
                        try {
                            const arr = JSON.parse(arg);
                            chunks.push(arr);
                        } catch (e) {
                            // Some chunks may not be simple JSON — skip
                        }
                        pos = i + 1;
                        break;
                    }
                }
            }

            if (depth !== 0) {
                pos = start + needle.length;
            }
        }
        return chunks;
    }

    /**
     * Search chunks for a keyword, parse the RSC payload that contains it.
     */
    parseRSCChunk(chunks, keyword) {
        for (const c of chunks) {
            if (typeof c[1] === 'string' && c[1].indexOf(keyword) !== -1) {
                const raw = c[1];
                const ci = raw.indexOf(':');
                if (ci !== -1 && ci < 10) {
                    try { return JSON.parse(raw.substring(ci + 1)); } catch (e) { /* skip */ }
                }
            }
        }
        return null;
    }

    /**
     * Recursively search an object tree for a key.
     */
    deepFindKey(obj, key) {
        if (!obj || typeof obj !== 'object') return null;
        if (!Array.isArray(obj) && obj[key]) return obj[key];
        const items = Array.isArray(obj) ? obj : Object.values(obj);
        for (const v of items) {
            const r = this.deepFindKey(v, key);
            if (r) return r;
        }
        return null;
    }

    /**
     * Recursively search an object tree for { listOfPersons }.
     */
    deepFindMWC(obj) {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.listOfPersons) return obj;
        const items = Array.isArray(obj) ? obj : Object.values(obj);
        for (const v of items) {
            const r = this.deepFindMWC(v);
            if (r) return r;
        }
        return null;
    }

    submitData() {
        const orgsSource = document.getElementById('orgs-page-source')?.value.trim();
        const mwcSource  = document.getElementById('mwc-page-source')?.value.trim();

        if (!orgsSource && !mwcSource) {
            alert('Please paste the page source from at least one LCR page.');
            return;
        }

        try {
            let orgData = null;
            let mwcBundle = null;

            // ── Parse Organizations page source ──
            if (orgsSource) {
                const chunks = this.parseNextDataFromHTML(orgsSource);
                if (!chunks.length) {
                    alert('Could not find page data in the Organizations source. Make sure you pasted the full page source (View Page Source, Select All, Copy).');
                    return;
                }
                const rsc = this.parseRSCChunk(chunks, 'unitOrgsMap');
                const uom = this.deepFindKey(rsc, 'unitOrgsMap');
                if (!uom) {
                    alert('Could not find organization data (unitOrgsMap) in the pasted source. Make sure you are pasting source from the LCR Organizations page.');
                    return;
                }
                const unitNums = Object.keys(uom);
                if (!unitNums.length) {
                    alert('No unit data found in the Organizations page source.');
                    return;
                }
                const ud = uom[unitNums[0]];
                orgData = { unitOrgs: ud.unitOrgs, unitName: ud.unitName, unitNumber: ud.unitNumber };
                console.log(`[CallingManager] Parsed org source: ${ud.unitName} (${ud.unitNumber}), ${ud.unitOrgs?.length || 0} top-level orgs`);
            }

            // ── Parse MWC page source ──
            if (mwcSource) {
                const chunks = this.parseNextDataFromHTML(mwcSource);
                if (!chunks.length) {
                    alert('Could not find page data in the Members With Callings source. Make sure you pasted the full page source.');
                    return;
                }
                const rsc = this.parseRSCChunk(chunks, 'membersWithCallings');
                const mwcData = this.deepFindMWC(rsc);
                if (!mwcData || !mwcData.listOfPersons) {
                    alert('Could not find callings data in the pasted source. Make sure you are pasting source from the Members With Callings report page.');
                    return;
                }
                const lop = mwcData.listOfPersons;
                const baseOrgs = (mwcData.BaseUnitOrgs && mwcData.BaseUnitOrgs.UnitOrgs) || [];
                const unitNum = (mwcData.BaseUnitOrgs && mwcData.BaseUnitOrgs.unitNumber) || mwcData.unitNumber || null;
                mwcBundle = { listOfPersons: lop, baseUnitOrgs: baseOrgs, unitNumber: unitNum };
                const wc = lop.membersWithCallings || {};
                const woc = lop.membersWithoutCallings || {};
                console.log(`[CallingManager] Parsed MWC source: ${Object.keys(wc).length} with callings, ${Object.keys(woc).length} without callings`);
            }

            // ── Convert to internal format ──
            if (mwcBundle) {
                // Best path: combined (or MWC-only if no org source)
                const result = this.convertCombinedData(orgData, mwcBundle);
                this.callingsData = result.callingsData;
                this.memberList = result.memberList;
            } else if (orgData) {
                // Org-only fallback (no member list, but full org tree with vacancies)
                this.callingsData = this.convertLCRData(orgData.unitOrgs);
            }

            if (!this.callingsData || !this.callingsData.subOrgs || this.callingsData.subOrgs.length === 0) {
                alert('No organizations found in the pasted data. Please check the data and try again.');
                return;
            }

            this.saveData();
            this.showManager();
        } catch (e) {
            console.error('Error processing page source:', e);
            alert('Error processing the pasted data: ' + e.message + '\n\nMake sure you used View Page Source (not Inspect Element) and copied the entire page.');
        }
    }

    convertLCRData(rawData) {
        // Check if data is already in our format
        if (rawData.subOrgs) {
            return rawData;
        }

        const subOrgs = [];

        // Detect format: new RSC (array of unitOrgs with positions/childUnitOrgs)
        // vs old API (array of orgs with callings/children)
        const orgs = Array.isArray(rawData) ? rawData : [rawData];
        const isNewFormat = orgs.length > 0 && (orgs[0].positions || orgs[0].childUnitOrgs || orgs[0].unitOrgs);

        if (isNewFormat) {
            // New RSC/unitOrgsMap format
            // Recursive: walks org → childUnitOrgs (which can nest further)
            const processNewOrg = (org, parentName = null) => {
                const results = [];
                const orgName = org.name || 'Unknown Organization';

                // Build display name with parent context
                let displayName = orgName;
                if (parentName) {
                    const baseName = parentName.replace(/\s+(Presidency|Leadership|Organization|Quorums?)$/i, '').trim();
                    if (!orgName.toLowerCase().includes(baseName.toLowerCase())) {
                        displayName = `${baseName} - ${orgName}`;
                    }
                }

                // Process positions (callings) if present
                if (org.positions && org.positions.length > 0) {
                    const convertedOrg = {
                        id: org.uuid || orgName,
                        name: displayName,
                        callings: []
                    };

                    org.positions.forEach((pos) => {
                        const posType = pos.positionType || {};
                        const person = pos.person || null;

                        const convertedCalling = {
                            id: posType.id || pos.uuid || `${org.uuid}-${posType.name}`,
                            name: posType.name || 'Unknown Position',
                            member: null,
                            activeDate: null,
                            setApartDate: null
                        };

                        // Add member if position is filled
                        if (person && person.name) {
                            convertedCalling.member = {
                                id: person.uuid || person.name,
                                name: person.name
                            };

                            // Dates are already ISO format (e.g., "2022-03-06")
                            if (pos.activeDate) {
                                convertedCalling.activeDate = pos.activeDate;
                            }
                            if (pos.setApartDate) {
                                convertedCalling.setApartDate = pos.setApartDate;
                            }
                        }

                        convertedOrg.callings.push(convertedCalling);
                    });

                    results.push(convertedOrg);
                }

                // Process child organizations recursively
                if (org.childUnitOrgs && org.childUnitOrgs.length > 0) {
                    org.childUnitOrgs.forEach(child => {
                        results.push(...processNewOrg(child, orgName));
                    });
                }

                return results;
            };

            orgs.forEach(org => {
                subOrgs.push(...processNewOrg(org));
            });

        } else {
            // Old API format (callings/children)
            const processOldOrg = (org, parentName = null) => {
                const results = [];

                if (org.callings && org.callings.length > 0) {
                    const orgName = org.name || org.defaultOrgName || 'Unknown Organization';
                    let displayName = orgName;
                    if (parentName) {
                        const baseName = parentName.replace(/\s+(Presidency|Leadership|Organization)$/i, '').trim();
                        if (!orgName.toLowerCase().includes(baseName.toLowerCase())) {
                            displayName = `${baseName} - ${orgName}`;
                        }
                    }

                    const convertedOrg = {
                        id: org.subOrgId,
                        name: displayName,
                        callings: []
                    };

                    org.callings.forEach((calling) => {
                        const convertedCalling = {
                            id: calling.positionId || `${org.subOrgId}-${calling.position}`,
                            name: calling.position || 'Unknown Position',
                            member: null,
                            activeDate: null,
                            setApartDate: null
                        };

                        if (calling.memberId && calling.memberName) {
                            convertedCalling.member = {
                                id: calling.memberId,
                                name: calling.memberName
                            };
                            if (calling.activeDate) {
                                const year = calling.activeDate.substring(0, 4);
                                const month = calling.activeDate.substring(4, 6);
                                const day = calling.activeDate.substring(6, 8);
                                convertedCalling.activeDate = `${year}-${month}-${day}`;
                            }
                            if (calling.setApartDate) {
                                const year = calling.setApartDate.substring(0, 4);
                                const month = calling.setApartDate.substring(4, 6);
                                const day = calling.setApartDate.substring(6, 8);
                                convertedCalling.setApartDate = `${year}-${month}-${day}`;
                            }
                        }

                        convertedOrg.callings.push(convertedCalling);
                    });

                    results.push(convertedOrg);
                }

                if (org.children && org.children.length > 0) {
                    const currentOrgName = org.name || org.defaultOrgName || null;
                    org.children.forEach(child => {
                        results.push(...processOldOrg(child, currentOrgName));
                    });
                }

                return results;
            };

            orgs.forEach(org => {
                subOrgs.push(...processOldOrg(org));
            });
        }

        return { subOrgs };
    }

    /**
     * Convert MWC (Members With Callings) report data to internal format.
     * This single page contains: ward callings, out-of-unit callings,
     * members without callings, and class assignments.
     *
     * @param {Object} bundle - { listOfPersons, baseUnitOrgs, unitNumber }
     * @returns {{ callingsData: Object, memberList: Array }}
     */
    convertMWCData(bundle) {
        const lop = bundle.listOfPersons || {};
        const mwc = lop.membersWithCallings || {};
        const mwoc = lop.membersWithoutCallings || {};
        const baseOrgs = bundle.baseUnitOrgs || [];

        // Build a set of ward org IDs from BaseUnitOrgs
        const wardOrgIds = new Set(baseOrgs.map(o => o.orgId));

        // Orgs that should show a "Members" tab (smaller class-based orgs only)
        const classTabOrgIds = new Set();
        const classTabOrgNames = new Set(['Sunday School', 'Young Women', 'Aaronic Priesthood Quorums', 'Primary']);
        baseOrgs.forEach(o => {
            if (o.hasClasses && classTabOrgNames.has(o.name)) {
                classTabOrgIds.add(o.orgId);
            }
        });

        // ── 1. Group callings by organization ──
        // Each MWC entry is keyed "Name - CallingTitle" and looks like:
        // { sex, age, name, callings: { CallingTitle: { organization, name, setApartDate:{date,display}, dateSustained:{date,display}, positionUuid, orgId } }, birthDate, phoneNumber, uuid }
        const orgMap = {}; // orgName → { id, name, callings: [], classMembers: {} }
        const seenPositions = new Set(); // avoid duplicates if same person-calling appears twice

        Object.entries(mwc).forEach(([key, entry]) => {
            if (!entry.callings) return;

            Object.entries(entry.callings).forEach(([callingTitle, callingData]) => {
                const posKey = `${entry.uuid}-${callingData.positionUuid || callingTitle}`;
                if (seenPositions.has(posKey)) return;
                seenPositions.add(posKey);

                const orgName = callingData.organization || 'Other Callings';
                const orgId = callingData.orgId || orgName;

                if (!orgMap[orgName]) {
                    orgMap[orgName] = {
                        id: orgId,
                        name: orgName,
                        callings: [],
                        classMembers: null
                    };
                }

                orgMap[orgName].callings.push({
                    id: callingData.positionUuid || `${orgId}-${callingTitle}-${entry.uuid}`,
                    name: callingData.name || callingTitle,
                    member: {
                        id: entry.uuid,
                        name: entry.name
                    },
                    activeDate: callingData.dateSustained ? callingData.dateSustained.date : null,
                    setApartDate: callingData.setApartDate ? callingData.setApartDate.date : null
                });
            });
        });

        // ── 2. Build class member lists from membersWithoutCallings ──
        // Each entry has: { classes: { "ClassName": { ParentOrg, orgId } } }
        // Skip large classes (EQ, RS, Gospel Doctrine) — too many members to be useful
        const skipClasses = new Set(['Elders Quorum', 'Relief Society', 'Gospel Doctrine']);
        const classMap = {}; // orgName → { className → [member, ...] }

        Object.values(mwoc).forEach(entry => {
            if (!entry.classes) return;

            Object.entries(entry.classes).forEach(([className, classInfo]) => {
                if (!classInfo || !classInfo.orgId) return;
                if (!classTabOrgIds.has(classInfo.orgId)) return; // skip non-class orgs
                if (skipClasses.has(className)) return; // skip large classes

                // Find the parent org name from baseOrgs
                const parentOrg = baseOrgs.find(o => o.orgId === classInfo.orgId);
                const orgName = parentOrg ? parentOrg.name : (classInfo.ParentOrg !== 'null' ? classInfo.ParentOrg : className);

                if (!classMap[orgName]) classMap[orgName] = {};
                if (!classMap[orgName][className]) classMap[orgName][className] = [];

                classMap[orgName][className].push({
                    name: entry.name,
                    age: entry.age,
                    sex: entry.sex,
                    phone: entry.phoneNumber || null,
                    uuid: entry.uuid
                });
            });
        });

        // ── 2b. Add youth WITH callings to class lists ──
        // Youth who have callings don't have a "classes" field in MWC data,
        // so we infer their class from age and gender.
        const currentYear = new Date().getFullYear();

        // Helpers to match age → class name from existing class lists
        const findSSClass = (turningAge, ssClasses) => {
            for (const cn of ssClasses) {
                const nums = cn.match(/\d+/g);
                if (!nums) continue;
                const ages = nums.map(Number);
                if (cn.includes('+') && turningAge >= Math.max(...ages)) return cn;
                if (ages.includes(turningAge)) return cn;
            }
            return null;
        };

        const findYWClass = (turningAge, ywClasses) => {
            if (ywClasses.length === 0) return null;
            if (ywClasses.length === 1) return ywClasses[0];
            for (const cn of ywClasses) {
                const nums = cn.match(/\d+/g);
                if (!nums) continue;
                const ages = nums.map(Number);
                if (turningAge >= Math.min(...ages) && turningAge <= Math.max(...ages)) return cn;
            }
            return ywClasses[0];
        };

        const getAPQuorum = (turningAge) => {
            if (turningAge >= 16) return 'Priests Quorum';
            if (turningAge >= 14) return 'Teachers Quorum';
            if (turningAge >= 12) return 'Deacons Quorum';
            return null;
        };

        const ssOrgName = 'Sunday School';
        const apOrgName = 'Aaronic Priesthood Quorums';
        const ywOrgName = 'Young Women';

        const ssClasses = classMap[ssOrgName] ? Object.keys(classMap[ssOrgName]) : [];
        const ywClasses = classMap[ywOrgName] ? Object.keys(classMap[ywOrgName]) : [];

        // Track existing members per class to avoid duplicates
        const classMemberUuids = {};
        Object.entries(classMap).forEach(([org, classes]) => {
            Object.entries(classes).forEach(([cn, members]) => {
                const key = `${org}::${cn}`;
                classMemberUuids[key] = new Set(members.map(m => m.uuid));
            });
        });

        const addToClass = (orgName, className, memberInfo) => {
            if (!classMap[orgName]) classMap[orgName] = {};
            if (!classMap[orgName][className]) classMap[orgName][className] = [];
            const key = `${orgName}::${className}`;
            if (!classMemberUuids[key]) classMemberUuids[key] = new Set();
            if (classMemberUuids[key].has(memberInfo.uuid)) return;
            classMap[orgName][className].push(memberInfo);
            classMemberUuids[key].add(memberInfo.uuid);
        };

        Object.values(mwc).forEach(entry => {
            if (!entry.birthDate || !entry.birthDate.date) return;
            const birthYear = new Date(entry.birthDate.date).getFullYear();
            const turningAge = currentYear - birthYear;
            if (turningAge < 12 || turningAge > 17) return; // youth only

            const memberInfo = {
                name: entry.name,
                age: entry.age,
                sex: entry.sex,
                phone: entry.phoneNumber || null,
                uuid: entry.uuid,
                hasCalling: true
            };

            // Sunday School (both genders, turning 12+)
            const ssClass = findSSClass(turningAge, ssClasses);
            if (ssClass) addToClass(ssOrgName, ssClass, memberInfo);

            // Aaronic Priesthood (boys only)
            if (entry.sex === 'M') {
                const quorum = getAPQuorum(turningAge);
                if (quorum) addToClass(apOrgName, quorum, memberInfo);
            }

            // Young Women (girls only)
            if (entry.sex === 'F') {
                const ywClass = findYWClass(turningAge, ywClasses);
                if (ywClass) addToClass(ywOrgName, ywClass, memberInfo);
            }
        });

        // Attach classMembers to matching orgs
        Object.entries(classMap).forEach(([orgName, classes]) => {
            if (orgMap[orgName]) {
                orgMap[orgName].classMembers = classes;
            }
        });

        // ── 2c. Sort callings by presidency order ──
        const getCallingPriority = (name) => {
            const n = name.toLowerCase();
            if (n === 'bishop') return 0;
            if (n.includes('president') && !n.includes('counselor')) return 1;
            if (n.includes('first counselor') || n.includes('1st counselor')) return 2;
            if (n.includes('second counselor') || n.includes('2nd counselor')) return 3;
            if (n.includes('executive secretary')) return 4;
            if (n.includes('secretary')) return 5;
            return 100; // rest sorted alphabetically
        };

        Object.values(orgMap).forEach(org => {
            org.callings.sort((a, b) => {
                const pa = getCallingPriority(a.name);
                const pb = getCallingPriority(b.name);
                if (pa !== pb) return pa - pb;
                return a.name.localeCompare(b.name);
            });
        });

        // ── 3. Sort orgs to match BaseUnitOrgs order, then OOU, then leftover ──
        const subOrgs = [];
        const wardOrgs = [];
        const oouOrgs = [];

        Object.values(orgMap).forEach(org => {
            if (wardOrgIds.has(org.id)) {
                wardOrgs.push(org);
            } else {
                oouOrgs.push(org);
            }
        });

        // Sort ward orgs to match BaseUnitOrgs order
        const orgIdOrder = baseOrgs.map(o => o.orgId);
        wardOrgs.sort((a, b) => {
            const ai = orgIdOrder.indexOf(a.id);
            const bi = orgIdOrder.indexOf(b.id);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });

        subOrgs.push(...wardOrgs);

        // Add OOU callings grouped into a single "Out of Unit Callings" org
        if (oouOrgs.length > 0) {
            const allOouCallings = [];
            oouOrgs.forEach(org => allOouCallings.push(...org.callings));
            subOrgs.push({
                id: 'out-of-unit',
                name: 'Out of Unit Callings',
                callings: allOouCallings,
                classMembers: null
            });
        }

        // ── 4. Build unified member list from both sections ──
        const memberMap = new Map(); // uuid → member
        const addMember = (entry) => {
            if (!entry.uuid || memberMap.has(entry.uuid)) return;
            memberMap.set(entry.uuid, {
                id: entry.uuid,
                name: entry.name || 'Unknown',
                age: entry.age,
                gender: entry.sex,
                phone: entry.phoneNumber || null,
                email: null
            });
        };

        // Add all members from both lists (already deduplicated by uuid)
        Object.values(mwoc).forEach(addMember);
        Object.values(mwc).forEach(addMember);

        const memberList = Array.from(memberMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));

        return {
            callingsData: { subOrgs },
            memberList
        };
    }

    /**
     * Convert combined data from Organizations page + MWC report into internal format.
     * Uses org tree for structure/hierarchy/vacancies, enriches with MWC class members + OOU callings.
     *
     * @param {Object|null} orgData - { unitOrgs, unitName, unitNumber } from orgs page (null if MWC-only)
     * @param {Object} mwcData - { listOfPersons, baseUnitOrgs, unitNumber } from MWC page
     * @returns {{ callingsData: Object, memberList: Array }}
     */
    convertCombinedData(orgData, mwcData) {
        const lop = mwcData.listOfPersons || {};
        const mwc = lop.membersWithCallings || {};
        const mwoc = lop.membersWithoutCallings || {};
        const baseOrgs = mwcData.baseUnitOrgs || [];

        // ── If no org data, fall back to MWC-only (flat) ──
        if (!orgData || !orgData.unitOrgs || orgData.unitOrgs.length === 0) {
            console.log('[CallingManager] No org tree available — falling back to MWC-only mode');
            return this.convertMWCData({
                listOfPersons: lop,
                baseUnitOrgs: baseOrgs,
                unitNumber: mwcData.unitNumber
            });
        }

        // ── 1. Build org tree from Organizations page data ──
        // This gives us sub-org hierarchy, vacant positions, and calling order
        const unitOrgs = orgData.unitOrgs;
        const wardOrgIds = new Set(baseOrgs.map(o => o.orgId));
        const classTabOrgNames = new Set(['Sunday School', 'Young Women', 'Aaronic Priesthood Quorums', 'Primary']);

        const subOrgs = [];

        const processOrg = (org, parentName = null, topLevelOrgName = null) => {
            const orgName = org.name || 'Unknown Organization';

            // Build display name with parent context
            let displayName = orgName;
            if (parentName) {
                const baseName = parentName.replace(/\s+(Presidency|Leadership|Organization|Quorums?)$/i, '').trim();
                if (!orgName.toLowerCase().includes(baseName.toLowerCase())) {
                    displayName = `${baseName} - ${orgName}`;
                }
            }

            // Process positions (callings) — includes vacancies
            if (org.positions && org.positions.length > 0) {
                const convertedOrg = {
                    id: org.uuid || orgName,
                    name: displayName,
                    callings: [],
                    classMembers: null,
                    _topLevelOrg: topLevelOrgName || orgName,
                    _rawName: orgName
                };

                org.positions.forEach(pos => {
                    const posType = pos.positionType || {};
                    const person = pos.person || null;

                    const calling = {
                        id: posType.id || pos.uuid || `${org.uuid}-${posType.name}`,
                        name: posType.name || 'Unknown Position',
                        member: null,
                        activeDate: null,
                        setApartDate: null
                    };

                    if (person && person.name) {
                        calling.member = {
                            id: person.uuid || person.name,
                            name: person.name
                        };
                        if (pos.activeDate) calling.activeDate = pos.activeDate;
                        if (pos.setApartDate) calling.setApartDate = pos.setApartDate;
                    }

                    convertedOrg.callings.push(calling);
                });

                subOrgs.push(convertedOrg);
            }

            // Recurse into children
            if (org.childUnitOrgs && org.childUnitOrgs.length > 0) {
                org.childUnitOrgs.forEach(child => {
                    processOrg(child, orgName, topLevelOrgName || orgName);
                });
            }
        };

        unitOrgs.forEach(org => processOrg(org));

        // ── 2. Build class member lists from MWC data ──
        const skipClasses = new Set(['Elders Quorum', 'Relief Society', 'Gospel Doctrine']);
        const classTabOrgIds = new Set();
        baseOrgs.forEach(o => {
            if (o.hasClasses && classTabOrgNames.has(o.name)) {
                classTabOrgIds.add(o.orgId);
            }
        });

        const classMap = {}; // orgName → { className → [member, ...] }

        Object.values(mwoc).forEach(entry => {
            if (!entry.classes) return;

            Object.entries(entry.classes).forEach(([className, classInfo]) => {
                if (!classInfo || !classInfo.orgId) return;
                if (!classTabOrgIds.has(classInfo.orgId)) return;
                if (skipClasses.has(className)) return;

                const parentOrg = baseOrgs.find(o => o.orgId === classInfo.orgId);
                const orgName = parentOrg ? parentOrg.name : (classInfo.ParentOrg !== 'null' ? classInfo.ParentOrg : className);

                if (!classMap[orgName]) classMap[orgName] = {};
                if (!classMap[orgName][className]) classMap[orgName][className] = [];

                classMap[orgName][className].push({
                    name: entry.name,
                    age: entry.age,
                    sex: entry.sex,
                    phone: entry.phoneNumber || null,
                    uuid: entry.uuid
                });
            });
        });

        // ── 2b. Add youth WITH callings to class lists ──
        const currentYear = new Date().getFullYear();

        const findSSClass = (turningAge, ssCls) => {
            for (const cn of ssCls) {
                const nums = cn.match(/\d+/g);
                if (!nums) continue;
                const ages = nums.map(Number);
                if (cn.includes('+') && turningAge >= Math.max(...ages)) return cn;
                if (ages.includes(turningAge)) return cn;
            }
            return null;
        };

        const findYWClass = (turningAge, ywCls) => {
            if (ywCls.length === 0) return null;
            if (ywCls.length === 1) return ywCls[0];
            for (const cn of ywCls) {
                const nums = cn.match(/\d+/g);
                if (!nums) continue;
                const ages = nums.map(Number);
                if (turningAge >= Math.min(...ages) && turningAge <= Math.max(...ages)) return cn;
            }
            return ywCls[0];
        };

        const getAPQuorum = (turningAge) => {
            if (turningAge >= 16) return 'Priests Quorum';
            if (turningAge >= 14) return 'Teachers Quorum';
            if (turningAge >= 12) return 'Deacons Quorum';
            return null;
        };

        const ssOrgName = 'Sunday School';
        const apOrgName = 'Aaronic Priesthood Quorums';
        const ywOrgName = 'Young Women';

        const ssClasses = classMap[ssOrgName] ? Object.keys(classMap[ssOrgName]) : [];
        const ywClasses = classMap[ywOrgName] ? Object.keys(classMap[ywOrgName]) : [];

        const classMemberUuids = {};
        Object.entries(classMap).forEach(([org, classes]) => {
            Object.entries(classes).forEach(([cn, members]) => {
                const key = `${org}::${cn}`;
                classMemberUuids[key] = new Set(members.map(m => m.uuid));
            });
        });

        const addToClass = (orgN, className, memberInfo) => {
            if (!classMap[orgN]) classMap[orgN] = {};
            if (!classMap[orgN][className]) classMap[orgN][className] = [];
            const key = `${orgN}::${className}`;
            if (!classMemberUuids[key]) classMemberUuids[key] = new Set();
            if (classMemberUuids[key].has(memberInfo.uuid)) return;
            classMap[orgN][className].push(memberInfo);
            classMemberUuids[key].add(memberInfo.uuid);
        };

        Object.values(mwc).forEach(entry => {
            if (!entry.birthDate || !entry.birthDate.date) return;
            const birthYear = new Date(entry.birthDate.date).getFullYear();
            const turningAge = currentYear - birthYear;
            if (turningAge < 12 || turningAge > 17) return;

            const memberInfo = {
                name: entry.name,
                age: entry.age,
                sex: entry.sex,
                phone: entry.phoneNumber || null,
                uuid: entry.uuid,
                hasCalling: true
            };

            const ssClass = findSSClass(turningAge, ssClasses);
            if (ssClass) addToClass(ssOrgName, ssClass, memberInfo);

            if (entry.sex === 'M') {
                const quorum = getAPQuorum(turningAge);
                if (quorum) addToClass(apOrgName, quorum, memberInfo);
            }

            if (entry.sex === 'F') {
                const ywClass = findYWClass(turningAge, ywClasses);
                if (ywClass) addToClass(ywOrgName, ywClass, memberInfo);
            }
        });

        // ── 3. Attach class members to sub-orgs by matching names ──
        // The org tree sub-orgs have names like "Course 16+", "Nursery",
        // "Deacons Quorum Presidency", "Young Women 12-18 Class Presidency".
        // MWC class names are "Course 16+", "Nursery", "Deacons Quorum", "Young Women 12-18".
        // Match strategy: exact match first, then prefix match (class name starts sub-org name).
        const attachedClassKeys = new Set();

        // Pass 1: Exact matches (sub-org rawName === className)
        subOrgs.forEach(subOrg => {
            const topLevel = subOrg._topLevelOrg;
            const rawName = subOrg._rawName;
            if (!classMap[topLevel]) return;

            if (classMap[topLevel][rawName]) {
                subOrg.classMembers = { [rawName]: classMap[topLevel][rawName] };
                attachedClassKeys.add(`${topLevel}::${rawName}`);
            }
        });

        // Pass 2: Prefix matches for unattached classes
        // e.g., "Deacons Quorum" matches "Deacons Quorum Presidency"
        Object.entries(classMap).forEach(([topLevelOrg, classes]) => {
            Object.entries(classes).forEach(([className, members]) => {
                const key = `${topLevelOrg}::${className}`;
                if (attachedClassKeys.has(key)) return;

                // Find a sub-org in the same top-level whose rawName starts with className
                const match = subOrgs.find(s =>
                    s._topLevelOrg === topLevelOrg &&
                    s._rawName.startsWith(className) &&
                    s._rawName !== className
                );
                if (match) {
                    if (!match.classMembers) match.classMembers = {};
                    match.classMembers[className] = members;
                    attachedClassKeys.add(key);
                }
            });
        });

        // Pass 3: Any still-unattached classes go to the first sub-org of their parent
        Object.entries(classMap).forEach(([topLevelOrg, classes]) => {
            const unattached = {};
            Object.entries(classes).forEach(([cn, members]) => {
                if (!attachedClassKeys.has(`${topLevelOrg}::${cn}`)) {
                    unattached[cn] = members;
                }
            });
            if (Object.keys(unattached).length === 0) return;

            const fallback = subOrgs.find(s => s._topLevelOrg === topLevelOrg);
            if (fallback) {
                if (!fallback.classMembers) fallback.classMembers = {};
                Object.assign(fallback.classMembers, unattached);
            }
        });

        // ── 4. Add out-of-unit callings from MWC data ──
        // These are callings whose orgId is NOT in the ward's BaseUnitOrgs
        const oouCallings = [];
        const seenPositions = new Set();

        Object.entries(mwc).forEach(([key, entry]) => {
            if (!entry.callings) return;

            Object.entries(entry.callings).forEach(([callingTitle, callingData]) => {
                const posKey = `${entry.uuid}-${callingData.positionUuid || callingTitle}`;
                if (seenPositions.has(posKey)) return;
                seenPositions.add(posKey);

                const orgId = callingData.orgId;
                if (wardOrgIds.has(orgId)) return; // ward calling — already in org tree

                oouCallings.push({
                    id: callingData.positionUuid || `oou-${callingTitle}-${entry.uuid}`,
                    name: callingData.name || callingTitle,
                    member: { id: entry.uuid, name: entry.name },
                    activeDate: callingData.dateSustained ? callingData.dateSustained.date : null,
                    setApartDate: callingData.setApartDate ? callingData.setApartDate.date : null
                });
            });
        });

        if (oouCallings.length > 0) {
            subOrgs.push({
                id: 'out-of-unit',
                name: 'Out of Unit Callings',
                callings: oouCallings,
                classMembers: null
            });
        }

        // ── 5. Build unified member list ──
        const memberMap = new Map();
        const addMember = (entry) => {
            if (!entry.uuid || memberMap.has(entry.uuid)) return;
            memberMap.set(entry.uuid, {
                id: entry.uuid,
                name: entry.name || 'Unknown',
                age: entry.age,
                gender: entry.sex,
                phone: entry.phoneNumber || null,
                email: null
            });
        };

        Object.values(mwoc).forEach(addMember);
        Object.values(mwc).forEach(addMember);

        const memberList = Array.from(memberMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));

        // Clean up internal-only properties (keep _topLevelOrg for org filter)
        subOrgs.forEach(s => { delete s._rawName; });

        return {
            callingsData: { subOrgs },
            memberList
        };
    }

    saveData() {
        try {
            localStorage.setItem('callingManagerData', JSON.stringify(this.callingsData));
            if (this.outOfUnitData) {
                localStorage.setItem('callingManagerOutOfUnitData', JSON.stringify(this.outOfUnitData));
            }
            if (this.memberList.length > 0) {
                localStorage.setItem('callingManagerMembers', JSON.stringify(this.memberList));
            }
            localStorage.setItem('callingManagerHidden', JSON.stringify(Array.from(this.hiddenCallings)));
            localStorage.setItem('callingManagerHiddenMembers', JSON.stringify(Array.from(this.hiddenMembers)));
            localStorage.setItem('callingManagerValidationRules', JSON.stringify(this.orgValidationRules));
            localStorage.setItem('callingManagerHiddenColumns', JSON.stringify(Array.from(this.hiddenColumns)));

            // Persist full session state for resume capability
            this.saveSessionState();
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    saveSessionState() {
        try {
            // Save current scenario state into scenarios array first
            if (this.currentScenarioId !== null) {
                const currentScenario = this.scenarios.find(s => s.id === this.currentScenarioId);
                if (currentScenario) {
                    currentScenario.data = JSON.parse(JSON.stringify(this.callingsData));
                    currentScenario.changeHistory = [...this.changeHistory];
                    currentScenario.changedCallings = new Set(this.changedCallings);
                }
            }

            if (this.originalData && this.scenarios.length > 0) {
                const sessionState = {
                    originalData: this.originalData,
                    scenarios: this.scenarios.map(s => ({
                        id: s.id,
                        name: s.name,
                        data: s.data,
                        changeHistory: s.changeHistory,
                        changedCallings: Array.from(s.changedCallings)
                    })),
                    currentScenarioId: this.currentScenarioId,
                    nextScenarioId: this.nextScenarioId
                };
                localStorage.setItem('callingManagerSession', JSON.stringify(sessionState));
            }
        } catch (e) {
            console.error('Error saving session state:', e);
        }
    }

    restoreSessionState() {
        const stored = localStorage.getItem('callingManagerSession');
        if (!stored) return false;

        try {
            const session = JSON.parse(stored);
            if (!session.originalData || !session.scenarios || session.scenarios.length === 0) return false;

            this.originalData = session.originalData;
            this.nextScenarioId = session.nextScenarioId || 1;
            this.scenarios = session.scenarios.map(s => ({
                id: s.id,
                name: s.name,
                data: s.data,
                changeHistory: s.changeHistory || [],
                changedCallings: new Set(s.changedCallings || [])
            }));

            // Restore active scenario
            const targetId = session.currentScenarioId || this.scenarios[0].id;
            const target = this.scenarios.find(s => s.id === targetId) || this.scenarios[0];
            this.currentScenarioId = target.id;
            this.callingsData = JSON.parse(JSON.stringify(target.data));
            this.changeHistory = [...target.changeHistory];
            this.changedCallings = new Set(target.changedCallings);

            return true;
        } catch (e) {
            console.error('Error restoring session state:', e);
            return false;
        }
    }

    clearSessionState() {
        localStorage.removeItem('callingManagerSession');
    }

    importMemberList(rawMembers) {
        // Handle different LCR member list formats
        let members = [];
        
        if (Array.isArray(rawMembers)) {
            members = rawMembers;
        } else if (rawMembers.members) {
            members = rawMembers.members;
        }

        this.memberList = members.map(member => {
            // Get name from various possible formats
            let name = '';
            if (member.nameFormats) {
                name = member.nameFormats.listPreferredLocal || 
                       member.nameFormats.listPreferred || 
                       member.nameFormats.spokenPreferredLocal ||
                       member.nameFormats.listOfficial;
            } else if (member.name) {
                name = member.name;
            } else if (member.preferredName) {
                name = member.preferredName;
            } else if (member.givenName1 && member.familyName) {
                name = `${member.familyName}, ${member.givenName1}`;
            }

            return {
                id: member.uuid || member.id || member.legacyCmisId,
                name: name || 'Unknown',
                age: member.age,
                gender: member.sex || member.gender,
                email: member.emails?.[0]?.email || member.email,
                phone: member.phoneNumber || member.phones?.[0]?.number || member.phone
            };
        }).filter(m => m.name !== 'Unknown')
          .sort((a, b) => a.name.localeCompare(b.name));
    }

    showHome() {
        // Confirm if there are unsaved changes
        if (this.changeHistory && this.changeHistory.length > 0) {
            const confirmed = confirm(
                `You have ${this.changeHistory.length} unsaved change${this.changeHistory.length === 1 ? '' : 's'}. ` +
                'Going back will keep your session saved so you can resume later.\n\n' +
                'Are you sure you want to go back?'
            );
            if (!confirmed) return;
        }

        document.getElementById('home-section').classList.add('active');
        document.getElementById('manager-section').classList.remove('active');
        document.getElementById('search-input').value = '';
        
        // Hide toolbar, visibility button, and scenario tabs when on home
        document.getElementById('main-toolbar').style.display = 'none';
        document.getElementById('toggle-visibility-btn').classList.remove('visible');
        document.getElementById('scenario-tabs').style.display = 'none';
    }

    showManager() {
        document.getElementById('home-section').classList.remove('active');
        document.getElementById('manager-section').classList.add('active');
        
        // Show toolbar and visibility button when on manager
        document.getElementById('main-toolbar').style.display = 'flex';
        document.getElementById('toggle-visibility-btn').classList.add('visible');
        document.getElementById('scenario-tabs').style.display = 'flex';
        
        // Initialize scenarios if this is the first time
        if (this.scenarios.length === 0) {
            // Only set originalData if it hasn't been set yet (preserve the first data load)
            if (!this.originalData) {
                this.originalData = JSON.parse(JSON.stringify(this.callingsData));
            }
            // Pass true to preserve current changeHistory and changedCallings (for imports)
            this.createScenario('Scenario 1', true);
        } else {
            // Resuming a session — render existing tabs and update button state
            this.renderScenarioTabs();
            this.updateUndoButton();
        }
        
        // Auto-hide members under 18 without callings on initial load
        this.autoHideYouthWithoutCallings();
        
        this.renderAllOrganizations();
    }

    autoHideYouthWithoutCallings() {
        if (this.memberList.length === 0 || !this.callingsData) return;
        
        const assignedMemberNames = new Set();
        
        // Collect all assigned member names
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Add members under 18 without callings to hiddenMembers
        this.memberList.forEach(member => {
            const isNotAssigned = !assignedMemberNames.has(member.name.trim().toLowerCase());
            const isYouth = member.age && member.age < 18;
            
            if (isNotAssigned && isYouth && !this.hiddenMembers.has(member.id)) {
                this.hiddenMembers.add(member.id);
            }
        });
        
        this.saveData();
    }

    // ── Organization Validation Rules ──

    getDefaultOrgRules(orgName, topLevelOrg) {
        const name = (orgName || '').toLowerCase();
        const group = (topLevelOrg || orgName || '').toLowerCase();

        // Bishopric
        if (group.includes('bishopric') || name === 'bishopric') {
            return { gender: 'M', minAge: 18, maxAge: null };
        }
        // Elders Quorum
        if (group.includes('elders quorum') || name.includes('elders quorum')) {
            return { gender: 'M', minAge: 18, maxAge: null };
        }
        // Relief Society
        if (group.includes('relief society') || name.includes('relief society')) {
            return { gender: 'F', minAge: 18, maxAge: null };
        }
        // Specific AP quorums (before generic AP)
        if (name.includes('priests quorum')) {
            return { gender: 'M', minAge: 16, maxAge: null };
        }
        if (name.includes('teachers quorum')) {
            return { gender: 'M', minAge: 14, maxAge: null };
        }
        if (name.includes('deacons quorum')) {
            return { gender: 'M', minAge: 11, maxAge: null };
        }
        // Aaronic Priesthood (general)
        if (group.includes('aaronic priesthood') || name.includes('aaronic priesthood')) {
            return { gender: 'M', minAge: 11, maxAge: null };
        }
        // Young Women
        if (group.includes('young women') || name.includes('young women')) {
            return { gender: 'F', minAge: 18, maxAge: null };
        }
        // Young Men
        if (group.includes('young men') || name.includes('young men')) {
            return { gender: 'M', minAge: 18, maxAge: null };
        }
        // Primary
        if (group.includes('primary') || name.includes('primary')) {
            return { gender: null, minAge: 18, maxAge: null };
        }
        // Sunday School
        if (group.includes('sunday school') || name.includes('sunday school')) {
            return { gender: null, minAge: 18, maxAge: null };
        }
        // Ward Missionaries
        if (name.includes('ward mission')) {
            return { gender: null, minAge: 18, maxAge: null };
        }
        // Temple and Family History
        if (name.includes('temple') || name.includes('family history')) {
            return { gender: null, minAge: 18, maxAge: null };
        }
        // Default: no restrictions
        return { gender: null, minAge: null, maxAge: null };
    }

    getOrgRules(org) {
        if (this.orgValidationRules[org.id]) {
            return this.orgValidationRules[org.id];
        }
        return this.getDefaultOrgRules(org.name, org._topLevelOrg);
    }

    /**
     * Orgs whose callings should be listed individually in the validation rules table.
     */
    orgHasCallingLevelRules(org) {
        const group = this.getOrgGroup(org).toLowerCase();
        const name = (org.name || '').toLowerCase();
        return group.includes('ward mission') || group.includes('temple') ||
               group.includes('family history') || group.includes('other callings') ||
               name.includes('ward mission') || name.includes('temple') ||
               name.includes('family history') || name.includes('other callings');
    }

    getCallingRules(org, callingName) {
        // Check for calling-specific rule first
        const callingKey = `calling:${org.id}:${callingName}`;
        if (this.orgValidationRules[callingKey]) {
            return this.orgValidationRules[callingKey];
        }
        // Fall back to org-level rule
        return this.getOrgRules(org);
    }

    showValidationRulesModal() {
        this.buildValidationRulesTable();
        document.getElementById('validation-rules-modal').classList.add('active');
    }

    closeValidationRulesModal() {
        document.getElementById('validation-rules-modal').classList.remove('active');
    }

    buildValidationRulesTable() {
        const container = document.getElementById('validation-rules-table-container');
        if (!container || !this.callingsData || !this.callingsData.subOrgs) {
            if (container) container.innerHTML = '<p class="empty-state">Load ward data first to configure validation rules.</p>';
            return;
        }

        // Group orgs by top-level
        const groups = new Map();
        this.callingsData.subOrgs.forEach(org => {
            const group = this.getOrgGroup(org);
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group).push(org);
        });

        let html = `<table class="validation-rules-table">
            <thead>
                <tr>
                    <th>Organization</th>
                    <th>Gender</th>
                    <th>Min Age</th>
                    <th>Max Age</th>
                </tr>
            </thead>
            <tbody>`;

        const makeRuleRow = (dataAttr, displayName, rules, cssClass) => {
            return `<tr ${dataAttr}>
                <td${cssClass ? ' class="' + cssClass + '"' : ''}>${displayName}</td>
                <td>
                    <select class="rule-gender">
                        <option value=""${rules.gender === null ? ' selected' : ''}>Any</option>
                        <option value="M"${rules.gender === 'M' ? ' selected' : ''}>Male Only</option>
                        <option value="F"${rules.gender === 'F' ? ' selected' : ''}>Female Only</option>
                    </select>
                </td>
                <td><input type="number" class="rule-min-age" min="0" max="120" placeholder="—" value="${rules.minAge || ''}"></td>
                <td><input type="number" class="rule-max-age" min="0" max="120" placeholder="—" value="${rules.maxAge || ''}"></td>
            </tr>`;
        };

        groups.forEach((orgs, groupName) => {
            // Group header row
            html += `<tr class="validation-group-row"><td colspan="4">${groupName}</td></tr>`;

            orgs.forEach(org => {
                const rules = this.getOrgRules(org);
                const isSubOrg = org.name !== groupName;
                const displayName = isSubOrg ? org.name.replace(groupName + ' - ', '') : org.name;

                html += makeRuleRow(`data-org-id="${org.id}"`, displayName, rules, isSubOrg ? 'indent' : null);

                // For specific orgs, list unique callings underneath
                if (this.orgHasCallingLevelRules(org) && org.callings && org.callings.length > 0) {
                    const uniqueCallings = [...new Set(org.callings.map(c => c.name))].sort();
                    uniqueCallings.forEach(callingName => {
                        const callingRules = this.getCallingRules(org, callingName);
                        const escapedName = callingName.replace(/"/g, '&quot;');
                        html += makeRuleRow(
                            `data-calling-key="calling:${org.id}:${escapedName}"`,
                            `↳ ${callingName}`,
                            callingRules,
                            'indent-calling'
                        );
                    });
                }
            });
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    saveValidationRules() {
        const orgRows = document.querySelectorAll('.validation-rules-table tr[data-org-id]');
        const callingRows = document.querySelectorAll('.validation-rules-table tr[data-calling-key]');
        this.orgValidationRules = {};

        orgRows.forEach(row => {
            const orgId = row.dataset.orgId;
            const gender = row.querySelector('.rule-gender').value || null;
            const minAge = parseInt(row.querySelector('.rule-min-age').value) || null;
            const maxAge = parseInt(row.querySelector('.rule-max-age').value) || null;
            this.orgValidationRules[orgId] = { gender, minAge, maxAge };
        });

        callingRows.forEach(row => {
            const key = row.dataset.callingKey;
            const gender = row.querySelector('.rule-gender').value || null;
            const minAge = parseInt(row.querySelector('.rule-min-age').value) || null;
            const maxAge = parseInt(row.querySelector('.rule-max-age').value) || null;
            this.orgValidationRules[key] = { gender, minAge, maxAge };
        });

        this.saveData();
        this.closeValidationRulesModal();
    }

    resetValidationRules() {
        this.orgValidationRules = {};
        this.saveData();
        this.buildValidationRulesTable();
    }

    validateMemberForCalling(member, org, callingName) {
        const rules = callingName ? this.getCallingRules(org, callingName) : this.getOrgRules(org);
        const context = callingName ? `${callingName} in ${org.name}` : org.name;
        const warnings = [];

        // Gender check
        if (rules.gender && member.gender) {
            if (member.gender !== rules.gender) {
                const expected = rules.gender === 'M' ? 'Male' : 'Female';
                const actual = member.gender === 'M' ? 'Male' : 'Female';
                warnings.push(`${context} expects ${expected} members, but ${member.name} is ${actual}.`);
            }
        }

        // Min age check
        if (rules.minAge && member.age) {
            if (member.age < rules.minAge) {
                warnings.push(`${context} requires age ${rules.minAge}+, but ${member.name} is ${member.age}.`);
            }
        }

        // Max age check
        if (rules.maxAge && member.age) {
            if (member.age > rules.maxAge) {
                warnings.push(`${context} has a max age of ${rules.maxAge}, but ${member.name} is ${member.age}.`);
            }
        }

        return warnings;
    }

    checkTeacherMarriedCouple(member, org, callingIndex) {
        const calling = org.callings[callingIndex];
        if (!calling) return null;

        // Only applies to teacher callings (word "Teacher" but not "Teachers Quorum")
        if (!/\bteacher\b/i.test(calling.name)) return null;

        const newGender = member.gender;
        if (!newGender) return null;

        for (let i = 0; i < org.callings.length; i++) {
            if (i === callingIndex) continue;
            const other = org.callings[i];
            if (!/\bteacher\b/i.test(other.name)) continue;
            if (!other.member) continue;

            // Look up existing teacher's gender from member list
            const existing = this.memberList.find(m =>
                m.id === other.member.id || m.name === other.member.name
            );
            if (!existing || !existing.gender) continue;

            if (existing.gender !== newGender) {
                return `${member.name} and ${existing.name} would both be teachers in "${org.name}".\n\nMale and female co-teachers must be a married couple. Are they married?`;
            }
        }

        return null;
    }

    /**
     * Get the top-level group name for an org (used for the Organizations filter).
     */
    getOrgGroup(org) {
        if (org._topLevelOrg) return org._topLevelOrg;
        // Fallback: derive from display name (e.g. "Elders Quorum - Teachers" → "Elders Quorum")
        const dashIdx = org.name.indexOf(' - ');
        return dashIdx > 0 ? org.name.substring(0, dashIdx) : org.name;
    }

    /**
     * Build the Organizations filter dropdown from current data.
     */
    buildOrgFilterList() {
        const list = document.getElementById('org-filter-list');
        if (!list || !this.callingsData || !this.callingsData.subOrgs) return;

        // Collect unique top-level group names, preserving first-seen order
        const seen = new Set();
        const groups = [];
        this.callingsData.subOrgs.forEach(org => {
            const group = this.getOrgGroup(org);
            if (!seen.has(group)) {
                seen.add(group);
                groups.push(group);
            }
        });

        list.innerHTML = '';
        groups.forEach(group => {
            const label = document.createElement('label');
            label.className = 'org-filter-item';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !this.hiddenOrgGroups.has(group);
            cb.addEventListener('change', () => this.toggleOrgFilter(group, cb.checked));
            const span = document.createElement('span');
            span.textContent = group;
            label.appendChild(cb);
            label.appendChild(span);
            list.appendChild(label);
        });

        // Sync "All" checkbox
        this.syncAllOrgCheckbox();
    }

    syncAllOrgCheckbox() {
        const allCb = document.getElementById('org-filter-all');
        if (!allCb) return;
        allCb.checked = this.hiddenOrgGroups.size === 0;
    }

    toggleOrgFilter(group, visible) {
        if (visible) {
            this.hiddenOrgGroups.delete(group);
        } else {
            this.hiddenOrgGroups.add(group);
        }
        this.syncAllOrgCheckbox();
        this.renderAllOrganizations();
    }

    toggleAllOrgFilters(allChecked) {
        if (allChecked) {
            this.hiddenOrgGroups.clear();
        } else {
            // Hide all groups
            if (this.callingsData && this.callingsData.subOrgs) {
                this.callingsData.subOrgs.forEach(org => {
                    this.hiddenOrgGroups.add(this.getOrgGroup(org));
                });
            }
        }
        this.renderAllOrganizations();
    }

    renderAllOrganizations() {
        const container = document.getElementById('callings-container');
        container.innerHTML = '';

        if (!this.callingsData || !this.callingsData.subOrgs) {
            container.innerHTML = '<div class="empty-state"><p>No organizations found</p></div>';
            return;
        }

        // Build the filter dropdown (updates checkboxes to match state)
        this.buildOrgFilterList();

        // Render organizations, respecting the filter
        this.callingsData.subOrgs.forEach(org => {
            const group = this.getOrgGroup(org);
            if (this.hiddenOrgGroups.has(group)) return;
            const orgSection = this.createOrganizationSection(org);
            container.appendChild(orgSection);
        });

        // Add Members Without Callings section (always shown if there are members)
        if (this.memberList.length > 0) {
            const membersWithoutCallings = this.getMembersWithoutCallings();
            if (membersWithoutCallings.length > 0) {
                const membersSection = this.createMembersWithoutCallingsSection(membersWithoutCallings);
                container.appendChild(membersSection);
            }
        }
    }

    createOrganizationSection(org) {
        const section = document.createElement('div');
        section.className = 'org-section';
        section.dataset.orgId = org.id;

        const header = document.createElement('h2');
        header.className = 'org-header';
        header.textContent = org.name;
        section.appendChild(header);

        const hasClassMembers = org.classMembers && Object.keys(org.classMembers).length > 0;

        // Tabs (Callings / Members) — only for orgs with class member data
        if (hasClassMembers) {
            const tabs = document.createElement('div');
            tabs.className = 'org-tabs';
            tabs.innerHTML = `
                <button class="org-tab active" data-tab="callings" data-org="${org.id}">Callings</button>
                <button class="org-tab" data-tab="members" data-org="${org.id}">Members</button>
            `;
            tabs.querySelectorAll('.org-tab').forEach(btn => {
                btn.addEventListener('click', () => this.switchOrgTab(section, btn.dataset.tab, org.id));
            });
            section.appendChild(tabs);
        }

        // ── Callings pane ──
        const callingsPane = document.createElement('div');
        callingsPane.className = 'org-tab-pane org-callings-pane active';
        callingsPane.dataset.pane = 'callings';

        if (!org.callings || org.callings.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'No callings in this organization';
            callingsPane.appendChild(empty);
        } else {
            // Build LCR-style table
            const table = document.createElement('table');
            table.className = 'callings-table';

            const thead = document.createElement('thead');
            const hideSustained = this.hiddenColumns.has('sustained');
            const hideSetApart = this.hiddenColumns.has('setApart');
            const hideTimeInCalling = this.hiddenColumns.has('timeInCalling');
            thead.innerHTML = `
                <tr>
                    <th>Calling</th>
                    <th>Name</th>
                    <th class="sustained-header"${hideSustained ? ' style="display:none"' : ''}>Sustained</th>
                    <th class="set-apart-header"${hideSetApart ? ' style="display:none"' : ''}>Set Apart</th>
                    <th class="time-in-calling-header"${hideTimeInCalling ? ' style="display:none"' : ''}>Time in Calling</th>
                    <th class="considering-header">Considering</th>
                    <th></th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            let visibleCount = 0;
            org.callings.forEach((calling, callingIndex) => {
                const row = this.createCallingRow(calling, org, callingIndex);
                if (this.hiddenCallings.has(calling.id)) {
                    row.classList.add('hidden');
                } else {
                    visibleCount++;
                }
                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            callingsPane.appendChild(table);

            // Count line
            const countDiv = document.createElement('div');
            countDiv.className = 'org-count';
            const totalCount = org.callings.length;
            if (visibleCount < totalCount) {
                countDiv.textContent = `Count: ${visibleCount} (filtered from ${totalCount} total)`;
            } else {
                countDiv.textContent = `Count: ${totalCount}`;
            }
            callingsPane.appendChild(countDiv);
        }

        // "+ Add Calling" link (not for out-of-unit or full-time missionaries)
        if (org.id !== 'out-of-unit' && org.id !== -5) {
            const addLink = document.createElement('a');
            addLink.className = 'add-calling-link';
            addLink.href = '#';
            addLink.textContent = '+ Add Calling';
            addLink.onclick = (e) => {
                e.preventDefault();
                this.showAddCallingForm(org, callingsPane, addLink);
            };
            callingsPane.appendChild(addLink);
        }

        section.appendChild(callingsPane);

        // ── Members pane (class members) ──
        if (hasClassMembers) {
            const membersPane = document.createElement('div');
            membersPane.className = 'org-tab-pane org-members-pane';
            membersPane.dataset.pane = 'members';

            // Group by class, sorted by class name
            const classNames = Object.keys(org.classMembers).sort();
            classNames.forEach(className => {
                const members = org.classMembers[className];
                if (!members || members.length === 0) return;

                // Sort members alphabetically
                const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));

                const classSection = document.createElement('div');
                classSection.className = 'class-section';

                const classHeader = document.createElement('h3');
                classHeader.className = 'class-header';
                classHeader.textContent = `${className} (${sorted.length})`;
                classSection.appendChild(classHeader);

                const table = document.createElement('table');
                table.className = 'class-members-table';

                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Age</th>
                    </tr>
                `;
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                sorted.forEach(m => {
                    const gender = m.sex === 'M' ? 'Male' : m.sex === 'F' ? 'Female' : (m.sex || '');
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${m.name}${m.hasCalling ? ' *' : ''}</td>
                        <td>${gender}</td>
                        <td>${m.age || ''}</td>
                    `;
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                classSection.appendChild(table);
                membersPane.appendChild(classSection);
            });

            section.appendChild(membersPane);
        }

        return section;
    }

    switchOrgTab(section, tab, orgId) {
        // Toggle active tab button
        section.querySelectorAll('.org-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        // Toggle active pane
        section.querySelectorAll('.org-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.dataset.pane === tab);
        });
    }

    createCallingRow(calling, org, callingIndex) {
        const row = document.createElement('tr');
        row.dataset.callingId = calling.id;
        row.dataset.orgId = org.id;
        row.dataset.callingIndex = callingIndex;

        // Changed row highlight
        const uniqueCallingId = `${org.id}-${calling.id}-${callingIndex}`;
        if (this.changedCallings.has(uniqueCallingId)) {
            row.classList.add('recently-changed');
        }

        // Calling name
        const callingCell = document.createElement('td');
        callingCell.className = 'calling-name-cell';
        if (calling.isCustom) {
            callingCell.classList.add('custom-calling');
        }
        callingCell.textContent = calling.name;
        row.appendChild(callingCell);

        // Member name
        const nameCell = document.createElement('td');
        if (calling.member && calling.member.name) {
            const link = document.createElement('span');
            link.className = 'member-link';
            link.textContent = calling.member.name;
            link.onclick = () => this.changeMember(org.id, calling.id, callingIndex);
            nameCell.appendChild(link);

            // Show calling count if member has more than one calling
            const memberCallings = this.findMemberCallings(calling.member.id);
            if (memberCallings.length > 1) {
                const countLink = document.createElement('span');
                countLink.className = 'calling-count-badge';
                countLink.textContent = `(${memberCallings.length})`;
                countLink.title = `${calling.member.name} has ${memberCallings.length} callings`;
                countLink.onclick = (e) => {
                    e.stopPropagation();
                    this.showMemberCallingsInfo(calling.member, memberCallings);
                };
                nameCell.appendChild(countLink);
            }
        } else {
            const vacant = document.createElement('span');
            vacant.className = 'vacant-link';
            vacant.textContent = 'Calling Vacant';
            vacant.onclick = () => this.changeMember(org.id, calling.id, callingIndex);
            nameCell.appendChild(vacant);
        }
        row.appendChild(nameCell);

        // Sustained date
        const sustainedCell = document.createElement('td');
        sustainedCell.className = 'sustained-cell';
        if (this.hiddenColumns.has('sustained')) sustainedCell.style.display = 'none';
        if (calling.activeDate) {
            const activeDate = new Date(calling.activeDate);
            sustainedCell.textContent = activeDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
        row.appendChild(sustainedCell);

        // Set Apart
        const setApartCell = document.createElement('td');
        setApartCell.className = 'set-apart-cell';
        if (this.hiddenColumns.has('setApart')) setApartCell.style.display = 'none';
        if (calling.setApartDate) {
            setApartCell.innerHTML = '<span class="set-apart-check">✓</span>';
        }
        row.appendChild(setApartCell);

        // Time in Calling
        const timeCell = document.createElement('td');
        timeCell.className = 'time-in-calling-cell';
        if (this.hiddenColumns.has('timeInCalling')) timeCell.style.display = 'none';
        if (calling.activeDate) {
            timeCell.textContent = this.formatTimeInCalling(calling.activeDate);
        }
        row.appendChild(timeCell);

        // Considering (candidates)
        const consideringCell = document.createElement('td');
        consideringCell.className = 'considering-cell';
        this.renderConsideringCell(consideringCell, calling, org, callingIndex);
        row.appendChild(consideringCell);

        // Actions (pencil edit icon)
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-row-btn';
        editBtn.title = 'Edit';
        editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        editBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleInlineEdit(row, calling, org, callingIndex);
        };
        actionsCell.appendChild(editBtn);
        row.appendChild(actionsCell);

        return row;
    }

    toggleInlineEdit(row, calling, org, callingIndex) {
        // If already editing, close
        const existingEditRow = row.parentNode.querySelector('.editing-row');
        if (existingEditRow) {
            existingEditRow.remove();
            return;
        }

        // Remove any other open edit rows
        document.querySelectorAll('.editing-row').forEach(r => r.remove());

        // Create inline edit row (like LCR's expanded edit)
        const editRow = document.createElement('tr');
        editRow.className = 'editing-row';

        const editCell = document.createElement('td');
        // Count visible columns: calling, name, sustained?, setApart?, timeInCalling?, considering, actions = 4 base + optional
        let colCount = 4; // calling + name + considering + actions
        if (!this.hiddenColumns.has('sustained')) colCount++;
        if (!this.hiddenColumns.has('setApart')) colCount++;
        if (!this.hiddenColumns.has('timeInCalling')) colCount++;
        editCell.colSpan = colCount;

        const controls = document.createElement('div');
        controls.className = 'inline-edit-controls';

        if (calling.member && calling.member.name) {
            // Release button
            const releaseBtn = document.createElement('button');
            releaseBtn.className = 'edit-action-btn release-btn';
            releaseBtn.textContent = 'Release';
            releaseBtn.onclick = () => {
                editRow.remove();
                this.releaseMember(calling.id, org.id, callingIndex);
            };
            controls.appendChild(releaseBtn);

            // Change button
            const changeBtn = document.createElement('button');
            changeBtn.className = 'edit-action-btn';
            changeBtn.textContent = 'Change';
            changeBtn.onclick = () => {
                editRow.remove();
                this.changeMember(org.id, calling.id, callingIndex);
            };
            controls.appendChild(changeBtn);
        } else {
            // Assign button
            const assignBtn = document.createElement('button');
            assignBtn.className = 'edit-action-btn save-btn';
            assignBtn.textContent = 'Assign Member';
            assignBtn.onclick = () => {
                editRow.remove();
                this.assignMember(org.id, calling.id, callingIndex);
            };
            controls.appendChild(assignBtn);
        }

        // Remove button (only for custom callings)
        if (calling.isCustom) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'edit-action-btn release-btn';
            removeBtn.textContent = 'Remove Calling';
            removeBtn.onclick = () => {
                editRow.remove();
                this.removeCustomCalling(org, callingIndex, calling);
            };
            controls.appendChild(removeBtn);
        }

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'edit-action-btn cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => editRow.remove();
        controls.appendChild(cancelBtn);

        editCell.appendChild(controls);
        editRow.appendChild(editCell);

        // Insert after the current row
        row.after(editRow);
    }

    createMembersWithoutCallingsSection(members) {
        const section = document.createElement('div');
        section.className = 'org-section';
        section.dataset.orgId = 'members-without-callings';

        const header = document.createElement('h2');
        header.className = 'org-header';
        header.textContent = 'Members Without Callings';
        section.appendChild(header);

        // Search input
        const searchRow = document.createElement('div');
        searchRow.className = 'mwoc-search-row';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'mwoc-search';
        searchInput.placeholder = 'Filter members...';
        searchRow.appendChild(searchInput);
        section.appendChild(searchRow);

        // State for sort
        let sortCol = 'name';
        let sortAsc = true;

        const renderTable = (filterQuery) => {
            // Remove old table + count if any
            section.querySelectorAll('.class-members-table, .org-count').forEach(el => el.remove());

            let filtered = members;
            if (filterQuery) {
                const q = filterQuery.toLowerCase();
                filtered = members.filter(m => m.name.toLowerCase().includes(q));
            }

            // Sort
            const sorted = [...filtered].sort((a, b) => {
                let va, vb;
                if (sortCol === 'name') {
                    va = a.name || '';
                    vb = b.name || '';
                    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
                } else if (sortCol === 'gender') {
                    va = a.gender || '';
                    vb = b.gender || '';
                    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
                } else {
                    va = a.age || 0;
                    vb = b.age || 0;
                    return sortAsc ? va - vb : vb - va;
                }
            });

            const table = document.createElement('table');
            table.className = 'class-members-table';

            const arrow = (col) => sortCol === col ? (sortAsc ? ' ▲' : ' ▼') : '';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th class="sortable-th" data-col="name">Name${arrow('name')}</th>
                    <th class="sortable-th" data-col="gender">Gender${arrow('gender')}</th>
                    <th class="sortable-th" data-col="age">Age${arrow('age')}</th>
                </tr>
            `;
            thead.querySelectorAll('.sortable-th').forEach(th => {
                th.addEventListener('click', () => {
                    const col = th.dataset.col;
                    if (sortCol === col) {
                        sortAsc = !sortAsc;
                    } else {
                        sortCol = col;
                        sortAsc = true;
                    }
                    renderTable(searchInput.value.trim());
                });
            });
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            sorted.forEach(m => {
                const genderText = m.gender === 'M' ? 'Male' : m.gender === 'F' ? 'Female' : (m.gender || '');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${m.name}</td>
                    <td>${genderText}</td>
                    <td>${m.age || ''}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            section.appendChild(table);

            // Count
            const countDiv = document.createElement('div');
            countDiv.className = 'org-count';
            if (filtered.length < members.length) {
                countDiv.textContent = `Showing ${filtered.length} of ${members.length} members`;
            } else {
                countDiv.textContent = `Count: ${members.length}`;
            }
            section.appendChild(countDiv);
        };

        searchInput.addEventListener('input', () => renderTable(searchInput.value.trim()));
        renderTable('');

        return section;
    }

    createCallingCard(calling, org, callingIndex) {
        const card = document.createElement('div');
        card.className = 'calling-card';
        card.dataset.callingId = calling.id;
        card.dataset.orgId = org.id;
        card.dataset.callingIndex = callingIndex;
        
        // Add visual indicator for changed callings using unique identifier with index
        const uniqueCallingId = `${org.id}-${calling.id}-${callingIndex}`;
        const isChanged = this.changedCallings.has(uniqueCallingId);
        if (isChanged) {
            card.classList.add('recently-changed');
        }
        
        const title = document.createElement('h4');
        title.textContent = calling.name;
        card.appendChild(title);

        const memberDiv = document.createElement('div');
        memberDiv.className = 'member-select';
        
        if (calling.member && calling.member.name) {
            memberDiv.innerHTML = `
                <span class="member-name">${calling.member.name}</span>
                <div>
                    <button class="change-btn" onclick="window.callingManager.changeMember('${org.id}', '${calling.id}', ${callingIndex})">Change</button>
                    <button class="change-btn release-btn" onclick="window.callingManager.releaseMember('${calling.id}', '${org.id}', ${callingIndex})">Release</button>
                </div>
            `;
        } else {
            memberDiv.innerHTML = `
                <span class="member-name vacant">VACANT</span>
                <button class="change-btn" onclick="window.callingManager.assignMember('${org.id}', '${calling.id}', ${callingIndex})">Assign</button>
            `;
        }
        card.appendChild(memberDiv);

        // Show date information if member is assigned
        if (calling.member) {
            const details = document.createElement('div');
            details.className = 'details';
            
            let sustainedText, daysText;
            
            if (!calling.activeDate) {
                // No sustained date set
                sustainedText = isChanged ? 'Pending' : 'Not set';
                daysText = '-';
            } else {
                // Has sustained date
                const activeDate = new Date(calling.activeDate);
                sustainedText = activeDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                daysText = Math.floor((new Date() - activeDate) / (1000 * 60 * 60 * 24));
            }
            
            const setApartStatus = calling.setApartDate ? '✓ Set Apart' : '⚠️ Not Set Apart';
            
            details.innerHTML = `
                <span>Sustained: ${sustainedText}</span>
                <span>Days: ${daysText}</span>
                <span class="${calling.setApartDate ? 'set-apart' : 'not-set-apart'}">${setApartStatus}</span>
            `;
            card.appendChild(details);
        }

        return card;
    }

    // ── Presidency Cascade Release Helpers ──

    getPresidencyCounselorNames(callingName) {
        return this.PRESIDENCY_CASCADE_MAP[callingName] || null;
    }

    findOccupiedCounselorsInOrg(counselorNames, org) {
        const results = [];
        org.callings.forEach((calling, idx) => {
            if (counselorNames.includes(calling.name) && calling.member) {
                results.push({ calling, callingIndex: idx });
            }
        });
        return results;
    }

    restoreReleasedMemberVisibility(memberName) {
        if (!memberName) return;
        const member = this.memberList.find(m =>
            m.name.trim().toLowerCase() === memberName.trim().toLowerCase()
        );
        if (member && this.hiddenMembers.has(member.id)) {
            if (!member.age || member.age >= 18) {
                this.hiddenMembers.delete(member.id);
            }
        }
    }

    releaseMember(callingId, orgId, callingIndex) {
        const org = this.callingsData.subOrgs.find(o => o.id == orgId);
        if (!org) return;

        const calling = org.callings[callingIndex];
        if (!calling || calling.id != callingId || !calling.member) return;

        const releasedMemberName = calling.member.name;

        // Check for presidency cascade
        const counselorNames = this.getPresidencyCounselorNames(calling.name);
        if (counselorNames) {
            const occupiedCounselors = this.findOccupiedCounselorsInOrg(counselorNames, org);
            if (occupiedCounselors.length > 0) {
                this.showCascadeReleaseModal(calling, org, callingIndex, occupiedCounselors);
                return;
            }
        }

        // No cascade needed — regular confirm
        if (!confirm(`Are you sure you want to release ${releasedMemberName} from ${calling.name}?`)) {
            return;
        }

        this.executeRelease(calling, org, callingIndex);
    }

    executeRelease(calling, org, callingIndex) {
        const releasedMemberName = calling.member.name;
        const uniqueCallingId = `${org.id}-${calling.id}`;
        const releaseDesc = `Release ${releasedMemberName} from ${calling.name} in ${org.name}`;

        this.saveStateForUndo(releaseDesc, uniqueCallingId);

        calling.member = null;
        calling.activeDate = null;
        calling.setApartDate = null;

        this.recordChange(releaseDesc, uniqueCallingId);
        this.markCallingAsChanged(`${org.id}-${calling.id}-${callingIndex}`);
        this.restoreReleasedMemberVisibility(releasedMemberName);

        this.saveData();
        this.renderAllOrganizations();

        const panel = document.getElementById('visibility-panel');
        if (panel && panel.classList.contains('active')) {
            this.updateVisibilityLists();
        }
    }

    showCascadeReleaseModal(calling, org, callingIndex, occupiedCounselors) {
        this.pendingCascadeRelease = { calling, org, callingIndex, occupiedCounselors };

        const modal = document.getElementById('cascade-release-modal');
        const message = document.getElementById('cascade-release-message');
        const list = document.getElementById('cascade-release-list');

        message.innerHTML = `Releasing <strong>${calling.member.name}</strong> as <strong>${calling.name}</strong> ` +
            `will also release the following counselors in <strong>${org.name}</strong>:`;

        list.innerHTML = '';
        occupiedCounselors.forEach(c => {
            const item = document.createElement('div');
            item.className = 'cascade-release-item';
            item.innerHTML = `<span class="calling-detail">${c.calling.name}</span><span class="cascade-member-name">${c.calling.member.name}</span>`;
            list.appendChild(item);
        });

        modal.classList.add('active');
    }

    confirmCascadeRelease() {
        if (!this.pendingCascadeRelease) return;
        const { calling, org, callingIndex, occupiedCounselors } = this.pendingCascadeRelease;

        this.closeCascadeReleaseModal();
        this.executeCascadeRelease(calling, org, callingIndex, occupiedCounselors);
    }

    closeCascadeReleaseModal() {
        document.getElementById('cascade-release-modal').classList.remove('active');
        this.pendingCascadeRelease = null;
    }

    executeCascadeRelease(calling, org, callingIndex, occupiedCounselors) {
        const releasedMemberName = calling.member.name;
        const uniqueCallingId = `${org.id}-${calling.id}`;
        const releaseDesc = `Release ${releasedMemberName} from ${calling.name} in ${org.name}`;

        // Collect counselor info before clearing
        const counselorInfo = occupiedCounselors.map(c => ({
            memberName: c.calling.member.name,
            callingName: c.calling.name,
            callingId: c.calling.id,
            callingIndex: c.callingIndex
        }));

        // Save a single snapshot before all mutations
        this.saveStateForUndo(releaseDesc, uniqueCallingId);

        // Release the president/bishop
        calling.member = null;
        calling.activeDate = null;
        calling.setApartDate = null;
        this.recordChange(releaseDesc, uniqueCallingId);
        this.markCallingAsChanged(`${org.id}-${calling.id}-${callingIndex}`);
        this.restoreReleasedMemberVisibility(releasedMemberName);

        // Release counselors
        counselorInfo.forEach(ci => {
            const counselorDesc = `Release ${ci.memberName} from ${ci.callingName} in ${org.name}`;
            const c = org.callings[ci.callingIndex];
            c.member = null;
            c.activeDate = null;
            c.setApartDate = null;
            this.recordChange(counselorDesc, `${org.id}-${ci.callingId}-${ci.callingIndex}`);
            this.markCallingAsChanged(`${org.id}-${ci.callingId}-${ci.callingIndex}`);
            this.restoreReleasedMemberVisibility(ci.memberName);
        });

        this.saveData();
        this.renderAllOrganizations();

        const panel = document.getElementById('visibility-panel');
        if (panel && panel.classList.contains('active')) {
            this.updateVisibilityLists();
        }
    }

    showAddCallingForm(org, callingsPane, addLink) {
        // If form already open, close it
        const existing = callingsPane.querySelector('.add-calling-form');
        if (existing) {
            existing.remove();
            return;
        }

        const form = document.createElement('div');
        form.className = 'add-calling-form';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'add-calling-input';
        input.placeholder = 'Enter calling name…';
        input.maxLength = 80;

        const addBtn = document.createElement('button');
        addBtn.className = 'add-calling-btn';
        addBtn.textContent = 'Add';
        addBtn.onclick = () => {
            const name = input.value.trim();
            if (name) {
                this.addCustomCalling(org, name);
                form.remove();
            }
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'add-calling-cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => form.remove();

        // Enter key submits
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        });

        form.appendChild(input);
        form.appendChild(addBtn);
        form.appendChild(cancelBtn);

        // Insert after the add link
        addLink.after(form);
        input.focus();
    }

    addCustomCalling(org, callingName) {
        const customId = `custom-${org.id}-${Date.now()}`;
        const newCalling = {
            id: customId,
            name: callingName,
            member: null,
            activeDate: null,
            setApartDate: null,
            isCustom: true
        };

        const desc = `Add custom calling "${callingName}" in ${org.name}`;

        // Save state BEFORE mutation
        this.saveStateForUndo(desc, customId);

        org.callings.push(newCalling);

        // Record for print report
        this.recordChange(desc, customId);

        this.saveData();
        this.renderAllOrganizations();
    }

    removeCustomCalling(org, callingIndex, calling) {
        const memberName = calling.member ? calling.member.name : null;
        const desc = memberName
            ? `Remove custom calling "${calling.name}" (${memberName}) from ${org.name}`
            : `Remove custom calling "${calling.name}" from ${org.name}`;

        this.saveStateForUndo(desc, calling.id);

        org.callings.splice(callingIndex, 1);

        // Record for print report
        this.recordChange(desc, calling.id);

        this.saveData();
        this.renderAllOrganizations();
    }

    assignMember(orgId, callingId, callingIndex) {
        this.pendingAssignment = { orgId, callingId, callingIndex, isNew: true };
        this.showMemberModal();
    }

    changeMember(orgId, callingId, callingIndex) {
        this.pendingAssignment = { orgId, callingId, callingIndex, isNew: false };
        this.showMemberModal();
    }

    showMemberModal() {
        const modal = document.getElementById('member-modal');
        const memberList = document.getElementById('member-list');
        
        memberList.innerHTML = '';
        
        // Look up the org and calling for validation rules
        let rules = null;
        let org = null;
        let callingName = null;
        if (this.pendingAssignment) {
            org = this.callingsData.subOrgs.find(o => o.id == this.pendingAssignment.orgId);
            if (org && org.callings[this.pendingAssignment.callingIndex]) {
                callingName = org.callings[this.pendingAssignment.callingIndex].name;
                rules = this.getCallingRules(org, callingName);
            }
        }

        // Build filter description badge
        const filterBadge = document.getElementById('member-modal-filter-badge');
        if (filterBadge) {
            const parts = [];
            if (rules) {
                if (rules.gender) parts.push(rules.gender === 'M' ? 'Male' : 'Female');
                if (rules.minAge && rules.maxAge) parts.push(`Ages ${rules.minAge}–${rules.maxAge}`);
                else if (rules.minAge) parts.push(`Age ${rules.minAge}+`);
                else if (rules.maxAge) parts.push(`Age ≤${rules.maxAge}`);
            }
            if (parts.length > 0) {
                filterBadge.textContent = `Filtered: ${parts.join(', ')}`;
                filterBadge.style.display = '';
            } else {
                filterBadge.textContent = '';
                filterBadge.style.display = 'none';
            }
        }

        // Show cascade warning banner if changing a president/bishop
        let cascadeWarning = document.getElementById('member-modal-cascade-warning');
        if (!cascadeWarning) {
            // Create if not in DOM yet
            cascadeWarning = document.createElement('div');
            cascadeWarning.id = 'member-modal-cascade-warning';
            cascadeWarning.className = 'cascade-warning-banner';
            const searchInput = document.getElementById('member-search');
            searchInput.parentNode.insertBefore(cascadeWarning, searchInput);
        }
        cascadeWarning.style.display = 'none';
        cascadeWarning.innerHTML = '';

        if (this.pendingAssignment && !this.pendingAssignment.isNew && org) {
            const calling = org.callings[this.pendingAssignment.callingIndex];
            if (calling && calling.member) {
                const counselorNames = this.getPresidencyCounselorNames(calling.name);
                if (counselorNames) {
                    const occupiedCounselors = this.findOccupiedCounselorsInOrg(counselorNames, org);
                    if (occupiedCounselors.length > 0) {
                        const counselorList = occupiedCounselors.map(c =>
                            `<strong>${c.calling.member.name}</strong> (${c.calling.name})`
                        ).join(', ');
                        cascadeWarning.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ` +
                            `Changing the <strong>${calling.name}</strong> will also release: ${counselorList}`;
                        cascadeWarning.style.display = '';
                    }
                }
            }
        }

        // Filter out hidden members and apply validation rules
        const visibleMembers = this.memberList.filter(member => {
            if (this.hiddenMembers.has(member.id)) return false;
            if (rules) {
                if (rules.gender && member.gender && member.gender !== rules.gender) return false;
                if (rules.minAge && member.age && member.age < rules.minAge) return false;
                if (rules.maxAge && member.age && member.age > rules.maxAge) return false;
            }
            return true;
        });
        
        if (visibleMembers.length === 0) {
            memberList.innerHTML = '<p class="empty-state">No members match the filter rules for this calling. Click "Add New Member" to add manually.</p>';
        } else {
            visibleMembers.forEach(member => {
                const item = document.createElement('div');
                item.className = 'member-item';
                item.textContent = member.name;
                if (member.age) item.textContent += ` (${member.age})`;
                item.onclick = () => this.selectMember(member);
                memberList.appendChild(item);
            });
        }
        
        document.getElementById('member-search').value = '';
        modal.classList.add('active');
    }

    closeMemberModal() {
        document.getElementById('member-modal').classList.remove('active');
        this.pendingAssignment = null;
    }

    closePrivacyModal() {
        document.getElementById('privacy-modal').classList.remove('active');
    }

    filterMembers(query) {
        const items = document.querySelectorAll('.member-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            if (item.textContent.toLowerCase().includes(lowerQuery)) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    selectMember(member) {
        if (!this.pendingAssignment) return;
        
        const { orgId, callingId, callingIndex, isNew } = this.pendingAssignment;
        const org = this.callingsData.subOrgs.find(o => o.id == orgId);
        if (!org) return;

        const calling = org.callings[callingIndex];
        if (!calling || calling.id != callingId) return;

        // Validate member against org + calling rules
        const warnings = this.validateMemberForCalling(member, org, calling.name);
        if (warnings.length > 0) {
            const proceed = confirm(`\u26A0\uFE0F Validation Warning:\n\n${warnings.join('\n')}\n\nProceed anyway?`);
            if (!proceed) return;
        }

        // Check teacher married couple requirement
        const marriedCheck = this.checkTeacherMarriedCouple(member, org, callingIndex);
        if (marriedCheck) {
            const confirmed = confirm(marriedCheck);
            if (!confirmed) return;
        }

        // Detect presidency cascade for changes (not new assignments)
        let cascadeCounselors = [];
        if (!isNew && calling.member) {
            const counselorNames = this.getPresidencyCounselorNames(calling.name);
            if (counselorNames) {
                cascadeCounselors = this.findOccupiedCounselorsInOrg(counselorNames, org);
            }
        }

        // Check if member already has callings
        const existingCallings = this.findMemberCallings(member.id);
        // Exclude the calling we're assigning to (in case of "Change")
        const otherCallings = existingCallings.filter(ec => 
            !(ec.orgId == orgId && ec.callingIndex === callingIndex)
        );

        if (otherCallings.length > 0) {
            // Store member for later use and show existing callings modal
            this.pendingMember = member;
            this.showExistingCallingsModal(member, otherCallings, calling, org, cascadeCounselors);
        } else if (cascadeCounselors.length > 0) {
            // No existing callings but there IS a cascade — confirm before proceeding
            const counselorList = cascadeCounselors.map(c =>
                `  • ${c.calling.member.name} (${c.calling.name})`
            ).join('\n');
            const proceed = confirm(
                `Changing the ${calling.name} will also release the following counselors:\n\n${counselorList}\n\nProceed?`
            );
            if (!proceed) return;
            this.performAssignment(member, [], cascadeCounselors);
        } else {
            // No existing callings, no cascade — proceed directly
            this.performAssignment(member, []);
        }
    }

    showMemberCallingsInfo(member, callings) {
        const modal = document.getElementById('member-callings-info-modal');
        const nameEl = document.getElementById('member-callings-info-name');
        const listEl = document.getElementById('member-callings-info-list');

        nameEl.textContent = `${member.name} holds ${callings.length} callings:`;

        listEl.innerHTML = '';
        callings.forEach(c => {
            const item = document.createElement('div');
            item.className = 'member-calling-info-item';
            item.innerHTML = `<span class="calling-detail">${c.callingName}</span><span class="org-detail">${c.orgName}</span>`;
            listEl.appendChild(item);
        });

        modal.classList.add('active');
    }

    closeMemberCallingsInfo() {
        document.getElementById('member-callings-info-modal').classList.remove('active');
    }

    findMemberCallings(memberId) {
        const results = [];
        if (!this.callingsData || !this.callingsData.subOrgs) return results;

        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach((calling, idx) => {
                if (calling.member && calling.member.id === memberId) {
                    results.push({
                        orgId: org.id,
                        orgName: org.name,
                        callingId: calling.id,
                        callingIndex: idx,
                        callingName: calling.name,
                        memberName: calling.member.name
                    });
                }
            });
        });

        return results;
    }

    showExistingCallingsModal(member, existingCallings, targetCalling, targetOrg, cascadeCounselors = []) {
        const modal = document.getElementById('existing-callings-modal');
        const message = document.getElementById('existing-callings-message');
        const list = document.getElementById('existing-callings-list');

        const callingWord = existingCallings.length === 1 ? 'calling' : 'callings';
        let messageHtml = `<strong>${member.name}</strong> currently has <strong>${existingCallings.length}</strong> existing ${callingWord}. ` +
            `Select any callings you would like to release them from as a result of being called to <strong>${targetCalling.name}</strong> in <strong>${targetOrg.name}</strong>.`;

        // Add cascade warning if changing a president/bishop
        if (cascadeCounselors.length > 0) {
            const counselorList = cascadeCounselors.map(c =>
                `<strong>${c.calling.member.name}</strong> (${c.calling.name})`
            ).join(', ');
            messageHtml += `<div class="cascade-warning-banner" style="margin-top: 12px;">` +
                `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ` +
                `This change will also release: ${counselorList}</div>`;
        }

        message.innerHTML = messageHtml;

        // Store cascade counselors for use in submitExistingCallingsDecision
        this.pendingCascadeCounselors = cascadeCounselors;

        list.innerHTML = '';
        existingCallings.forEach((ec, i) => {
            const item = document.createElement('div');
            item.className = 'existing-calling-item';
            item.innerHTML = `
                <input type="checkbox" id="release-calling-${i}" data-org-id="${ec.orgId}" data-calling-index="${ec.callingIndex}" data-calling-id="${ec.callingId}">
                <label for="release-calling-${i}">
                    <span class="calling-detail">${ec.callingName}</span><br>
                    <span class="org-detail">${ec.orgName}</span>
                </label>
            `;
            // Let clicking the row toggle the checkbox
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const cb = item.querySelector('input[type="checkbox"]');
                    cb.checked = !cb.checked;
                }
            });
            list.appendChild(item);
        });

        // Hide the member modal without clearing pendingAssignment
        document.getElementById('member-modal').classList.remove('active');
        modal.classList.add('active');
    }

    closeExistingCallingsModal() {
        document.getElementById('existing-callings-modal').classList.remove('active');
        this.pendingMember = null;
        this.pendingAssignment = null;
        this.pendingCascadeCounselors = [];
    }

    submitExistingCallingsDecision() {
        const member = this.pendingMember;
        if (!member) return;

        // Gather checked callings to release
        const checkboxes = document.querySelectorAll('#existing-callings-list input[type="checkbox"]:checked');
        const toRelease = [];
        checkboxes.forEach(cb => {
            toRelease.push({
                orgId: cb.dataset.orgId,
                callingIndex: parseInt(cb.dataset.callingIndex),
                callingId: cb.dataset.callingId
            });
        });

        const cascadeCounselors = this.pendingCascadeCounselors || [];

        document.getElementById('existing-callings-modal').classList.remove('active');
        this.pendingCascadeCounselors = [];
        this.performAssignment(member, toRelease, cascadeCounselors);
    }

    performAssignment(member, releasesFromExisting, cascadeCounselors = []) {
        if (!this.pendingAssignment) return;

        const { orgId, callingId, callingIndex, isNew } = this.pendingAssignment;
        const org = this.callingsData.subOrgs.find(o => o.id == orgId);
        if (!org) return;

        const calling = org.callings[callingIndex];
        if (!calling || calling.id != callingId) return;

        // Create unique identifier for this calling including index
        const uniqueCallingId = `${org.id}-${calling.id}-${callingIndex}`;

        // Save descriptions for change history
        const previousMember = calling.member ? calling.member.name : null;
        const releaseDescription = previousMember ? `Release ${previousMember} from ${calling.name} in ${org.name}` : null;
        const callDescription = `Call ${member.name} to ${calling.name} in ${org.name}`;

        // Collect cascade counselor info before any mutations
        const cascadeInfo = cascadeCounselors.map(c => ({
            memberName: c.calling.member.name,
            callingName: c.calling.name,
            callingId: c.calling.id,
            callingIndex: c.callingIndex
        }));

        // Check if member previously had a calling
        const memberHadCalling = this.callingsData.subOrgs.some(o => 
            o.callings.some(c => c.member && c.member.id === member.id)
        );

        // --- Save a single state snapshot BEFORE any mutations ---
        this.saveStateForUndo(callDescription, uniqueCallingId);

        // --- Perform releases from existing callings first ---
        releasesFromExisting.forEach(rel => {
            const relOrg = this.callingsData.subOrgs.find(o => o.id == rel.orgId);
            if (!relOrg) return;
            const relCalling = relOrg.callings[rel.callingIndex];
            if (!relCalling || !relCalling.member) return;

            const relMemberName = relCalling.member.name;
            const relDescription = `Release ${relMemberName} from ${relCalling.name} in ${relOrg.name}`;

            relCalling.member = null;
            relCalling.activeDate = null;
            relCalling.setApartDate = null;

            this.markCallingAsChanged(`${relOrg.id}-${relCalling.id}-${rel.callingIndex}`);
            this.recordChange(relDescription, `${relOrg.id}-${relCalling.id}-${rel.callingIndex}`);
        });

        // --- Release cascade counselors (presidency change) ---
        cascadeInfo.forEach(ci => {
            const c = org.callings[ci.callingIndex];
            if (!c || !c.member) return;
            const counselorDesc = `Release ${ci.memberName} from ${ci.callingName} in ${org.name}`;
            c.member = null;
            c.activeDate = null;
            c.setApartDate = null;
            this.recordChange(counselorDesc, `${org.id}-${ci.callingId}-${ci.callingIndex}`);
            this.markCallingAsChanged(`${org.id}-${ci.callingId}-${ci.callingIndex}`);
            this.restoreReleasedMemberVisibility(ci.memberName);
        });

        // --- Now assign the new calling ---
        // Update the calling
        calling.member = {
            id: member.id,
            name: member.name
        };
        calling.activeDate = null; // Leave sustained date blank (pending)
        calling.setApartDate = null;

        // Record the individual descriptions for the print report
        if (releaseDescription) {
            this.recordChange(releaseDescription, uniqueCallingId);
        }
        this.recordChange(callDescription, uniqueCallingId);

        // Mark this calling as changed for visual highlighting
        this.markCallingAsChanged(`${org.id}-${calling.id}-${callingIndex}`);

        // If member didn't have a calling before, ensure they cannot be hidden
        if (!memberHadCalling && this.hiddenMembers.has(member.id)) {
            this.hiddenMembers.delete(member.id);
        }

        this.pendingMember = null;
        this.saveData();
        this.renderAllOrganizations();
        this.updateVisibilityLists();
        this.closeMemberModal();

        // Clear considering candidates on the target calling if the assignment succeeded
        if (calling.considering && calling.considering.length > 0 && calling.member && calling.member.id === member.id) {
            calling.considering = [];
            this.saveData();
        }
    }

    showAddNewMember() {
        const memberName = prompt('Enter member name:');
        if (!memberName) return;

        const newMember = {
            id: Date.now(),
            name: memberName
        };

        this.memberList.push(newMember);
        this.memberList.sort((a, b) => a.name.localeCompare(b.name));
        
        this.selectMember(newMember);
    }

    showVisibilityModal() {
        const panel = document.getElementById('visibility-panel');
        const main = document.querySelector('main');
        
        this.updateVisibilityLists();
        
        panel.classList.add('active');
        main.classList.add('panel-open');
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab-content`).classList.add('active');

        // Hide Show All / Hide All buttons on the Columns tab
        const bulkActions = document.getElementById('visibility-bulk-actions');
        if (bulkActions) {
            bulkActions.style.display = tabName === 'columns' ? 'none' : '';
        }
    }

    updateVisibilityLists() {
        // Update callings list
        const visibilityList = document.getElementById('visibility-list');
        visibilityList.innerHTML = '';
        
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                const item = document.createElement('div');
                item.className = 'visibility-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `vis-${calling.id}`;
                checkbox.checked = !this.hiddenCallings.has(calling.id);
                checkbox.onchange = (e) => this.toggleCalling(calling.id, e.target.checked);
                
                const label = document.createElement('label');
                label.htmlFor = `vis-${calling.id}`;
                label.innerHTML = `
                    <span>${calling.name}</span>
                    <span class="org-label">${org.name}</span>
                `;
                
                item.appendChild(checkbox);
                item.appendChild(label);
                visibilityList.appendChild(item);
            });
        });

        // Update members list - show ALL members
        const membersVisibilityList = document.getElementById('members-visibility-list');
        membersVisibilityList.innerHTML = '';
        
        // Get set of assigned member names
        const assignedMemberNames = new Set();
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Show ALL members
        this.memberList.forEach(member => {
            const item = document.createElement('div');
            item.className = 'visibility-item';
            
            const hasCalling = assignedMemberNames.has(member.name.trim().toLowerCase());
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `vis-member-${member.id}`;
            checkbox.checked = hasCalling || !this.hiddenMembers.has(member.id);
            checkbox.disabled = hasCalling; // Disable checkbox if member has a calling
            checkbox.onchange = (e) => this.toggleMember(member.id, e.target.checked);
            
            const label = document.createElement('label');
            label.htmlFor = `vis-member-${member.id}`;
            const ageLabel = member.age ? ` (${member.age})` : '';
            const callingLabel = hasCalling ? ' [Has Calling]' : '';
            label.innerHTML = `<span>${member.name}${ageLabel}${callingLabel}</span>`;
            if (hasCalling) {
                label.style.opacity = '0.6';
            }
            
            item.appendChild(checkbox);
            item.appendChild(label);
            membersVisibilityList.appendChild(item);
        });

        // Update columns list
        const columnsVisibilityList = document.getElementById('columns-visibility-list');
        if (columnsVisibilityList) {
            columnsVisibilityList.innerHTML = '';
            const toggleableColumns = [
                { key: 'sustained', label: 'Sustained' },
                { key: 'setApart', label: 'Set Apart' },
                { key: 'timeInCalling', label: 'Time in Calling' },
            ];
            toggleableColumns.forEach(col => {
                const item = document.createElement('div');
                item.className = 'visibility-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `vis-col-${col.key}`;
                checkbox.checked = !this.hiddenColumns.has(col.key);
                checkbox.onchange = (e) => this.toggleColumn(col.key, e.target.checked);

                const label = document.createElement('label');
                label.htmlFor = `vis-col-${col.key}`;
                label.innerHTML = `<span>${col.label}</span>`;

                item.appendChild(checkbox);
                item.appendChild(label);
                columnsVisibilityList.appendChild(item);
            });
        }
    }

    getAllMembersWithoutCallings() {
        const assignedMemberNames = new Set();
        
        // Collect all assigned member names
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Return ALL members not assigned (all ages for visibility menu)
        return this.memberList.filter(member => 
            !assignedMemberNames.has(member.name.trim().toLowerCase())
        );
    }

    getMembersWithoutCallings() {
        const assignedMemberNames = new Set();
        
        // Collect all assigned member names
        this.callingsData.subOrgs.forEach(org => {
            org.callings.forEach(calling => {
                if (calling.member && calling.member.name) {
                    assignedMemberNames.add(calling.member.name.trim().toLowerCase());
                }
            });
        });
        
        // Return members not assigned (all ages) but only those that are visible (not hidden)
        return this.memberList.filter(member => {
            const isNotAssigned = !assignedMemberNames.has(member.name.trim().toLowerCase());
            const isVisible = !this.hiddenMembers.has(member.id);
            return isNotAssigned && isVisible;
        });
    }

    toggleMember(memberId, show) {
        if (show) {
            this.hiddenMembers.delete(memberId);
        } else {
            this.hiddenMembers.add(memberId);
        }
        
        this.saveData();
        this.renderAllOrganizations();
    }

    closeVisibilityModal() {
        document.getElementById('visibility-panel').classList.remove('active');
        document.querySelector('main').classList.remove('panel-open');
    }

    formatTimeInCalling(dateStr) {
        if (!dateStr) return '';
        const start = new Date(dateStr);
        const now = new Date();
        if (isNaN(start.getTime())) return '';

        let years = now.getFullYear() - start.getFullYear();
        let months = now.getMonth() - start.getMonth();
        let days = now.getDate() - start.getDate();

        if (days < 0) {
            months--;
            // Days in previous month
            const prev = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prev.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(`${years}y`);
        if (months > 0) parts.push(`${months}m`);
        if (years === 0 && months === 0) parts.push(`${Math.max(days, 0)}d`);
        else if (days > 0 && years === 0) parts.push(`${days}d`);
        return parts.join(' ');
    }

    toggleColumn(colKey, show) {
        if (show) {
            this.hiddenColumns.delete(colKey);
        } else {
            this.hiddenColumns.add(colKey);
        }
        this.saveData();
        this.renderAllOrganizations();
    }

    toggleCalling(callingId, show) {
        if (show) {
            this.hiddenCallings.delete(callingId);
        } else {
            this.hiddenCallings.add(callingId);
        }
        
        this.saveData();
        this.renderAllOrganizations();
    }

    toggleAllItems(show) {
        if (this.currentTab === 'callings') {
            if (show) {
                this.hiddenCallings.clear();
            } else {
                this.callingsData.subOrgs.forEach(org => {
                    org.callings.forEach(calling => {
                        this.hiddenCallings.add(calling.id);
                    });
                });
            }
        } else if (this.currentTab === 'members') {
            // Only toggle members without callings
            const membersWithoutCallings = this.getAllMembersWithoutCallings();
            if (show) {
                // Show all members without callings
                membersWithoutCallings.forEach(member => {
                    this.hiddenMembers.delete(member.id);
                });
            } else {
                // Hide all members without callings
                membersWithoutCallings.forEach(member => {
                    this.hiddenMembers.add(member.id);
                });
            }
        }
        
        this.saveData();
        this.renderAllOrganizations();
        this.updateVisibilityLists();
    }

    searchCallings(query) {
        if (!query) {
            this.renderAllOrganizations();
            return;
        }

        const lowerQuery = query.toLowerCase();
        const container = document.getElementById('callings-container');
        container.innerHTML = '';

        let found = false;

        this.callingsData.subOrgs.forEach(org => {
            // Respect org filter during search
            const group = this.getOrgGroup(org);
            if (this.hiddenOrgGroups.has(group)) return;

            const matchingCallings = [];
            
            org.callings.forEach((calling, callingIndex) => {
                const callingName = calling.name.toLowerCase();
                const memberName = calling.member ? calling.member.name.toLowerCase() : '';
                const consideringNames = (calling.considering || []).map(c => c.name.toLowerCase()).join(' ');
                
                if (callingName.includes(lowerQuery) || memberName.includes(lowerQuery) || consideringNames.includes(lowerQuery)) {
                    matchingCallings.push({ calling, callingIndex });
                }
            });

            if (matchingCallings.length > 0) {
                const section = document.createElement('div');
                section.className = 'org-section';
                
                const header = document.createElement('h2');
                header.className = 'org-header';
                header.textContent = org.name;
                section.appendChild(header);
                
                const table = document.createElement('table');
                table.className = 'callings-table';
                const thead = document.createElement('thead');
                const _hideSust = this.hiddenColumns.has('sustained');
                const _hideSA = this.hiddenColumns.has('setApart');
                const _hideTIC = this.hiddenColumns.has('timeInCalling');
                thead.innerHTML = `<tr><th>Calling</th><th>Name</th><th class="sustained-header"${_hideSust ? ' style="display:none"' : ''}>Sustained</th><th class="set-apart-header"${_hideSA ? ' style="display:none"' : ''}>Set Apart</th><th class="time-in-calling-header"${_hideTIC ? ' style="display:none"' : ''}>Time in Calling</th><th class="considering-header">Considering</th><th></th></tr>`;
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                
                matchingCallings.forEach(({ calling, callingIndex }) => {
                    const row = this.createCallingRow(calling, org, callingIndex);
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                section.appendChild(table);
                container.appendChild(section);
                found = true;
            }
        });

        if (!found) {
            container.innerHTML = `<div class="empty-state"><p>No results found for "${query}"</p></div>`;
        }
    }

    exportData() {
        if (!this.callingsData) {
            alert('No data to export');
            return;
        }

        console.time('Export Total');
        
        const currentScenario = this.scenarios.find(s => s.id === this.currentScenarioId);
        const scenarioName = currentScenario ? currentScenario.name : 'scenario';
        const safeName = scenarioName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        
        // Export complete data including member list and change history
        const exportData = {
            callingsData: this.callingsData,
            memberList: this.memberList,
            changeHistory: this.changeHistory,
            changedCallings: Array.from(this.changedCallings),
            orgValidationRules: this.orgValidationRules
        };
        
        console.time('JSON.stringify');
        const dataStr = JSON.stringify(exportData);
        console.timeEnd('JSON.stringify');
        console.log('Data size:', (dataStr.length / 1024).toFixed(2), 'KB');
        
        console.time('Create blob and download');
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calling-data-${safeName}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        console.timeEnd('Create blob and download');
        
        // Clean up after a brief delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
            console.timeEnd('Export Total');
        }, 100);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Check if this is the new format (with memberList) or old format (just callings)
                if (importedData.callingsData) {
                    // New format
                    if (!importedData.callingsData.subOrgs || !Array.isArray(importedData.callingsData.subOrgs)) {
                        alert('Invalid data format. Please import a valid calling data file.');
                        return;
                    }
                    
                    this.callingsData = importedData.callingsData;
                    this.memberList = importedData.memberList || [];
                    this.changeHistory = importedData.changeHistory || [];
                    this.changedCallings = new Set(importedData.changedCallings || []);
                    this.orgValidationRules = importedData.orgValidationRules || {};
                } else {
                    // Old format (just callings data)
                    if (!importedData.subOrgs || !Array.isArray(importedData.subOrgs)) {
                        alert('Invalid data format. Please import a valid calling data file.');
                        return;
                    }
                    
                    this.callingsData = importedData;
                    // Member list will remain empty, user will need to re-import from LCR or use demo
                    this.changeHistory = [];
                    this.changedCallings.clear();
                }
                
                // If scenarios already exist, update the current scenario instead of creating new ones
                if (this.scenarios.length > 0 && this.currentScenarioId !== null) {
                    const currentScenario = this.scenarios.find(s => s.id === this.currentScenarioId);
                    if (currentScenario) {
                        currentScenario.data = JSON.parse(JSON.stringify(this.callingsData));
                        currentScenario.changeHistory = [...this.changeHistory];
                        currentScenario.changedCallings = new Set(this.changedCallings);
                    }
                }
                
                this.updateUndoButton();
                this.saveData();
                this.showManager(); // Navigate to manager section
                this.renderAllOrganizations();
                this.updateVisibilityLists();
                
                // Show success message after navigation
                setTimeout(() => {
                    alert('Data imported successfully!');
                }, 100);
            } catch (error) {
                alert('Error reading file. Please ensure it\'s a valid JSON file.');
                console.error(error);
            }
        };
        reader.readAsText(file);
        
        // Reset file input so same file can be imported again
        event.target.value = '';
    }

    recordChange(description, callingId = null) {
        // Record a change without saving state (for multiple changes in one action)
        const change = {
            description: description,
            callingId: callingId,
            timestamp: new Date().toISOString()
        };
        
        this.changeHistory.push(change);
        this.updateUndoButton();
    }

    saveStateForUndo(description, callingId = null) {
        // Deep clone the current state
        const state = {
            data: JSON.stringify(this.callingsData),
            description: description,
            callingId: callingId,
            isSnapshot: true,
            timestamp: new Date().toISOString()
        };
        
        this.changeHistory.push(state);
        
        // Limit history to last 20 changes to avoid memory issues
        if (this.changeHistory.length > 20) {
            this.changeHistory.shift();
        }
        
        this.updateUndoButton();
    }

    undoChange() {
        if (this.changeHistory.length === 0) {
            alert('No changes to undo');
            return;
        }

        // Pop entries until we find one with a data snapshot.
        // Description-only entries (from recordChange) are grouped with
        // the preceding snapshot entry — they represent parts of one action.
        const descriptions = [];
        let snapshotEntry = null;

        while (this.changeHistory.length > 0) {
            const entry = this.changeHistory.pop();
            if (entry.callingId) {
                this.changedCallings.delete(entry.callingId);
            }
            if (entry.data) {
                snapshotEntry = entry;
                break;
            }
            descriptions.unshift(entry.description);
        }

        if (!snapshotEntry) {
            // No snapshot found — nothing to restore
            this.updateUndoButton();
            alert('Could not undo — no saved state found.');
            return;
        }

        this.callingsData = JSON.parse(snapshotEntry.data);
        
        this.updateUndoButton();
        this.saveData();
        this.renderAllOrganizations();
        this.updateVisibilityLists();
        
        // Show what was undone
        const displayDescs = descriptions.length > 0 ? descriptions : [snapshotEntry.description];
        const summary = displayDescs.length <= 2
            ? displayDescs.join(' & ')
            : `${displayDescs.length} changes`;
        alert(`Undone: ${summary}`);
    }

    updateUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = this.changeHistory.length === 0;
            if (this.changeHistory.length > 0) {
                // Show the last visible (non-snapshot) description, or fall back to any last entry
                let desc = '';
                for (let i = this.changeHistory.length - 1; i >= 0; i--) {
                    if (!this.changeHistory[i].isSnapshot) {
                        desc = this.changeHistory[i].description;
                        break;
                    }
                }
                if (!desc) desc = this.changeHistory[this.changeHistory.length - 1].description;
                undoBtn.title = `Undo: ${desc}`;
            } else {
                undoBtn.title = 'No changes to undo';
            }
        }

        // Update print changes button
        const printChangesBtn = document.getElementById('print-changes-btn');
        if (printChangesBtn) {
            const visibleCount = this.changeHistory.filter(c => !c.isSnapshot).length;
            printChangesBtn.disabled = visibleCount === 0;
            if (visibleCount > 0) {
                printChangesBtn.title = `Print ${visibleCount} change${visibleCount === 1 ? '' : 's'}`;
            } else {
                printChangesBtn.title = 'No changes to print';
            }
        }
    }

    showPrintChanges() {
        if (this.changeHistory.length === 0) {
            alert('No changes have been made yet.');
            return;
        }

        const modal = document.getElementById('print-changes-modal');
        const changesList = document.getElementById('changes-list');

        // Get current scenario name
        const currentScenario = this.scenarios.find(s => s.id === this.currentScenarioId);
        const scenarioName = currentScenario ? currentScenario.name : 'Scenario';

        // Positions that require stake authority for release (even though they are unit callings)
        const stakeReleasePositions = [
            'Bishop', 'Bishopric First Counselor', 'Bishopric Second Counselor',
            'Elders Quorum President', 'Elders Quorum First Counselor', 'Elders Quorum Second Counselor'
        ];

        // Separate releases from calls/assignments, and split out-of-unit / stake-authority releases
        // Skip snapshot entries (isSnapshot) — those are undo checkpoints, not visible changes
        const releases = [];
        const stakeReleases = [];
        const calls = [];
        this.changeHistory.forEach(change => {
            if (change.isSnapshot) return; // skip undo checkpoints
            if (change.description.startsWith('Release ')) {
                if (change.description.includes(' in Out of Unit Callings')) {
                    stakeReleases.push(change.description);
                } else if (stakeReleasePositions.some(pos =>
                    change.description.includes(` from ${pos} in `)
                )) {
                    stakeReleases.push(change.description);
                } else {
                    releases.push(change.description);
                }
            } else {
                calls.push(change.description);
            }
        });

        // Build the two-column report
        let html = '<div class="changes-report">';
        html += `<p class="report-scenario">Scenario: ${scenarioName}</p>`;
        html += `<p class="report-date">Generated: ${new Date().toLocaleString()}</p>`;
        const totalVisible = releases.length + stakeReleases.length + calls.length;
        html += `<p class="report-summary">Total Changes: ${totalVisible}</p>`;
        html += '<div class="report-columns">';

        // Releases column
        html += '<div class="report-column">';
        html += `<h3>Releases (${releases.length})</h3>`;
        if (releases.length > 0) {
            html += '<ol class="report-list">';
            releases.forEach(desc => {
                html += `<li>${desc}</li>`;
            });
            html += '</ol>';
        } else {
            html += '<p class="report-empty">No releases</p>';
        }

        // Stake-Authority Releases sub-section
        if (stakeReleases.length > 0) {
            html += `<h3 class="report-subheading">Stake-Authority Releases (${stakeReleases.length})</h3>`;
            html += '<p class="report-note">These releases require stake presidency action.</p>';
            html += '<ol class="report-list">';
            stakeReleases.forEach(desc => {
                html += `<li>${desc}</li>`;
            });
            html += '</ol>';
        }
        html += '</div>';

        // Calls/Assignments column
        html += '<div class="report-column">';
        html += `<h3>Calls / Assignments (${calls.length})</h3>`;
        if (calls.length > 0) {
            html += '<ol class="report-list">';
            calls.forEach(desc => {
                html += `<li>${desc}</li>`;
            });
            html += '</ol>';
        } else {
            html += '<p class="report-empty">No calls or assignments</p>';
        }
        html += '</div>';

        html += '</div></div>';

        changesList.innerHTML = html;
        modal.classList.add('active');
    }

    closePrintChanges() {
        const modal = document.getElementById('print-changes-modal');
        modal.classList.remove('active');
    }

    markCallingAsChanged(callingId) {
        this.changedCallings.add(callingId);
    }

    // ── Considering (Candidates) Management ──

    renderConsideringCell(cell, calling, org, callingIndex) {
        cell.innerHTML = '';
        if (!calling.considering) calling.considering = [];

        const pillsWrapper = document.createElement('div');
        pillsWrapper.className = 'considering-pills';

        calling.considering.forEach((candidate, candidateIdx) => {
            const pill = document.createElement('span');
            pill.className = 'candidate-pill';
            pill.textContent = candidate.name;

            // Apply button (✓)
            const applyBtn = document.createElement('button');
            applyBtn.className = 'pill-action pill-apply';
            applyBtn.title = 'Assign this member';
            applyBtn.textContent = '\u2713';
            applyBtn.onclick = (e) => {
                e.stopPropagation();
                this.applyCandidate(org, calling, callingIndex, candidateIdx);
            };
            pill.appendChild(applyBtn);

            // Remove button (✕)
            const removeBtn = document.createElement('button');
            removeBtn.className = 'pill-action pill-remove';
            removeBtn.title = 'Remove';
            removeBtn.textContent = '\u2715';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                this.removeCandidate(org, calling, callingIndex, candidateIdx);
            };
            pill.appendChild(removeBtn);

            pillsWrapper.appendChild(pill);
        });

        cell.appendChild(pillsWrapper);

        // Inline type-ahead input
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'considering-input-wrapper';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'considering-input';
        input.placeholder = '+ Add...';

        const dropdown = document.createElement('div');
        dropdown.className = 'considering-dropdown';

        let selectedIdx = -1;

        const showResults = (query) => {
            dropdown.innerHTML = '';
            selectedIdx = -1;
            if (!query || query.length < 1) {
                dropdown.classList.remove('open');
                return;
            }

            const lq = query.toLowerCase();
            const existingIds = new Set(calling.considering.map(c => c.id));

            // Get validation rules for filtering
            const rules = this.getCallingRules(org, calling.name);

            const matches = this.memberList.filter(m => {
                if (this.hiddenMembers.has(m.id)) return false;
                if (existingIds.has(m.id)) return false;
                if (calling.member && calling.member.id === m.id) return false;
                if (!m.name.toLowerCase().includes(lq)) return false;

                // Apply gender filter
                if (rules.gender && m.gender && m.gender !== rules.gender) return false;
                // Apply min age filter
                if (rules.minAge && m.age && m.age < rules.minAge) return false;
                // Apply max age filter
                if (rules.maxAge && m.age && m.age > rules.maxAge) return false;

                return true;
            }).slice(0, 8);

            if (matches.length === 0) {
                dropdown.classList.remove('open');
                return;
            }

            matches.forEach((m, idx) => {
                const item = document.createElement('div');
                item.className = 'considering-dropdown-item';
                item.textContent = m.name;
                if (m.age) item.textContent += ` (${m.age})`;
                item.onmousedown = (e) => {
                    e.preventDefault();
                    this.addCandidate(org, calling, callingIndex, m, cell);
                    input.value = '';
                    dropdown.classList.remove('open');
                };
                dropdown.appendChild(item);
            });

            dropdown.classList.add('open');
        };

        input.addEventListener('input', () => showResults(input.value.trim()));

        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.considering-dropdown-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
                items.forEach((it, i) => it.classList.toggle('highlighted', i === selectedIdx));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIdx = Math.max(selectedIdx - 1, 0);
                items.forEach((it, i) => it.classList.toggle('highlighted', i === selectedIdx));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIdx >= 0 && items[selectedIdx]) {
                    items[selectedIdx].onmousedown(e);
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('open');
                input.blur();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => dropdown.classList.remove('open'), 150);
        });

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(dropdown);
        cell.appendChild(inputWrapper);
    }

    addCandidate(org, calling, callingIndex, member, cell) {
        if (!calling.considering) calling.considering = [];
        if (calling.considering.some(c => c.id === member.id)) return;
        calling.considering.push({ id: member.id, name: member.name });
        this.saveData();
        this.renderConsideringCell(cell, calling, org, callingIndex);
    }

    removeCandidate(org, calling, callingIndex, candidateIdx) {
        calling.considering.splice(candidateIdx, 1);
        this.saveData();
        this.renderAllOrganizations();
    }

    applyCandidate(org, calling, callingIndex, candidateIdx) {
        const candidate = calling.considering[candidateIdx];
        if (!candidate) return;

        // Find the full member object
        const member = this.memberList.find(m => m.id === candidate.id) || { id: candidate.id, name: candidate.name };

        // Use the pendingAssignment + selectMember flow for full validation
        // The considering array will be cleared in performAssignment if the assignment succeeds
        this.pendingAssignment = { orgId: org.id, callingId: calling.id, callingIndex, isNew: !calling.member };
        this.selectMember(member);
    }

    // Scenario Management Methods
    createScenario(name, preserveState = false) {
        const scenario = {
            id: this.nextScenarioId++,
            name: name,
            // Always create from a fresh copy of originalData to avoid any reference issues
            data: JSON.parse(JSON.stringify(this.originalData)),
            changeHistory: preserveState ? [...this.changeHistory] : [],
            changedCallings: preserveState ? new Set(this.changedCallings) : new Set()
        };
        
        this.scenarios.push(scenario);
        this.switchToScenario(scenario.id);
        this.renderScenarioTabs();
        
        return scenario;
    }

    addScenario() {
        const scenarioNumber = this.scenarios.length + 1;
        const name = prompt('Enter name for new scenario:', `Scenario ${scenarioNumber}`);
        
        if (name && name.trim()) {
            this.createScenario(name.trim());
        }
    }

    switchToScenario(scenarioId) {
        const scenario = this.scenarios.find(s => s.id === scenarioId);
        if (!scenario) return;
        
        // Save current scenario state if there is one
        if (this.currentScenarioId !== null) {
            const currentScenario = this.scenarios.find(s => s.id === this.currentScenarioId);
            if (currentScenario) {
                currentScenario.data = JSON.parse(JSON.stringify(this.callingsData));
                currentScenario.changeHistory = [...this.changeHistory];
                currentScenario.changedCallings = new Set(this.changedCallings);
            }
        }
        
        // Load new scenario
        this.currentScenarioId = scenarioId;
        this.callingsData = JSON.parse(JSON.stringify(scenario.data));
        this.changeHistory = [...scenario.changeHistory];
        this.changedCallings = new Set(scenario.changedCallings);
        
        // Update UI
        this.renderScenarioTabs();
        this.renderAllOrganizations();
        this.updateUndoButton();
    }

    removeScenario(scenarioId) {
        if (this.scenarios.length === 1) {
            alert('Cannot remove the last scenario');
            return;
        }
        
        const index = this.scenarios.findIndex(s => s.id === scenarioId);
        if (index === -1) return;
        
        const confirmed = confirm(`Remove "${this.scenarios[index].name}"?`);
        if (!confirmed) return;
        
        this.scenarios.splice(index, 1);
        
        // Switch to another scenario if the current one was removed
        if (this.currentScenarioId === scenarioId) {
            this.switchToScenario(this.scenarios[0].id);
        } else {
            this.renderScenarioTabs();
        }
    }

    renameScenario(scenarioId) {
        const scenario = this.scenarios.find(s => s.id === scenarioId);
        if (!scenario) return;
        
        const newName = prompt('Enter new name:', scenario.name);
        if (newName && newName.trim()) {
            scenario.name = newName.trim();
            this.renderScenarioTabs();
        }
    }

    renderScenarioTabs() {
        const container = document.getElementById('tabs-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.scenarios.forEach(scenario => {
            const tab = document.createElement('button');
            tab.className = 'scenario-tab';
            if (scenario.id === this.currentScenarioId) {
                tab.classList.add('active');
            }
            
            const tabName = document.createElement('span');
            tabName.className = 'tab-name';
            tabName.textContent = scenario.name;
            tabName.title = 'Double-click to rename';
            tabName.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.renameScenario(scenario.id);
            });
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-tab';
            editBtn.title = 'Rename scenario';
            editBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameScenario(scenario.id);
            });
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-tab';
            closeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeScenario(scenario.id);
            });
            
            tab.appendChild(tabName);
            tab.appendChild(editBtn);
            tab.appendChild(closeBtn);
            
            tab.addEventListener('click', () => {
                if (scenario.id !== this.currentScenarioId) {
                    this.switchToScenario(scenario.id);
                }
            });
            
            container.appendChild(tab);
        });
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.callingManager = new CallingManager();
});
