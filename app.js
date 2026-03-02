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
        this.currentTab = 'callings';
        this.changeHistory = []; // Track changes for undo
        this.changedCallings = new Set(); // Track which callings have been modified
        this.hiddenOrgGroups = new Set(); // Top-level org groups that are hidden in the filter
        this.orgValidationRules = {}; // Custom age/gender rules per org, keyed by org id
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.checkStoredData();
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

        // Privacy link
        const privacyLink = document.getElementById('privacy-link');
        if (privacyLink) {
            privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('privacy-modal').classList.add('active');
            });
        }
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
    }

    loadDemoData() {
        // Embedded expanded demo data with scriptural and historical LDS names
        const demoCallings = [{"unitNumber":100001,"unitType":7,"subOrgId":1,"parentSubOrgId":null,"parentName":"Bishopric","name":"Bishopric","children":[],"callings":[{"positionId":101,"position":"Bishop","memberId":1001,"memberName":"Smith, Joseph","activeDate":"20240115","setApartDate":"20240115"},{"positionId":102,"position":"First Counselor","memberId":1002,"memberName":"Young, Brigham","activeDate":"20240115","setApartDate":"20240115"},{"positionId":103,"position":"Second Counselor","memberId":1003,"memberName":"Cowdery, Oliver","activeDate":"20240115","setApartDate":"20240115"},{"positionId":104,"position":"Executive Secretary","memberId":1004,"memberName":"Kimball, Heber C.","activeDate":"20240210","setApartDate":"20240210"},{"positionId":105,"position":"Ward Clerk","memberId":1005,"memberName":"Richards, Willard","activeDate":"20240210","setApartDate":"20240210"},{"positionId":106,"position":"Assistant Ward Clerk--Finance","memberId":1006,"memberName":"Grant, Heber J.","activeDate":"20240210","setApartDate":"20240210"},{"positionId":107,"position":"Assistant Ward Clerk--Membership","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]},{"unitNumber":100001,"subOrgId":2,"name":"Elders Quorum Presidency","children":[{"subOrgId":21,"name":"Teachers","callings":[{"positionId":211,"position":"Gospel Doctrine Teacher","memberId":2011,"memberName":"Holland, Jeffrey R.","activeDate":"20240320","setApartDate":"20240320"},{"positionId":212,"position":"Gospel Doctrine Teacher","memberId":2012,"memberName":"Bednar, David A.","activeDate":"20240320","setApartDate":"20240320"}]},{"subOrgId":22,"name":"Ministering","callings":[{"positionId":221,"position":"Ministering Secretary","memberId":2021,"memberName":"Cook, Quentin L.","activeDate":"20240320","setApartDate":"20240320"}]},{"subOrgId":23,"name":"Activities","callings":[{"positionId":231,"position":"Activities Committee Member","memberId":2031,"memberName":"Ballard, M. Russell","activeDate":"20240401","setApartDate":"20240401"},{"positionId":232,"position":"Activities Committee Member","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]},{"subOrgId":24,"name":"Service","callings":[{"positionId":241,"position":"Service Coordinator","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]}],"callings":[{"positionId":201,"position":"Elders Quorum President","memberId":2001,"memberName":"Taylor, John","activeDate":"20240315","setApartDate":"20240315"},{"positionId":202,"position":"First Counselor","memberId":2002,"memberName":"Woodruff, Wilford","activeDate":"20240315","setApartDate":"20240315"},{"positionId":203,"position":"Second Counselor","memberId":2003,"memberName":"Snow, Lorenzo","activeDate":"20240315","setApartDate":"20240315"},{"positionId":204,"position":"Secretary","memberId":2004,"memberName":"Packer, Boyd K.","activeDate":"20240315","setApartDate":"20240315"}]},{"unitNumber":100001,"subOrgId":3,"name":"Relief Society","children":[{"subOrgId":31,"name":"Activities","callings":[{"positionId":311,"position":"Activities Committee Member","memberId":3011,"memberName":"Cannon, Martha Hughes","activeDate":"20240401","setApartDate":"20240401"},{"positionId":312,"position":"Activities Committee Member","memberId":3012,"memberName":"Kapp, Ardeth G.","activeDate":"20240401","setApartDate":"20240401"}]},{"subOrgId":32,"name":"Ministering","callings":[{"positionId":321,"position":"Ministering Secretary","memberId":3021,"memberName":"Smoot, Mary Ellen","activeDate":"20240401","setApartDate":"20240401"}]},{"subOrgId":33,"name":"Teachers","callings":[{"positionId":331,"position":"Gospel Doctrine Teacher","memberId":3031,"memberName":"Jack, Elaine L.","activeDate":"20240410","setApartDate":"20240410"}]}],"callings":[{"positionId":301,"position":"Relief Society President","memberId":3001,"memberName":"Smith, Emma","activeDate":"20240320","setApartDate":"20240320"},{"positionId":302,"position":"First Counselor","memberId":3002,"memberName":"Snow, Eliza R.","activeDate":"20240320","setApartDate":"20240320"},{"positionId":303,"position":"Second Counselor","memberId":3003,"memberName":"Wells, Emmeline B.","activeDate":"20240320","setApartDate":"20240320"},{"positionId":304,"position":"Secretary","memberId":3004,"memberName":"Young, Zina D.","activeDate":"20240401","setApartDate":"20240401"}]},{"unitNumber":100001,"subOrgId":4,"name":"Sunday School","children":[{"subOrgId":41,"name":"Teachers","callings":[{"positionId":411,"position":"Gospel Doctrine Teacher","memberId":4011,"memberName":"Lee, Harold B.","activeDate":"20240310","setApartDate":"20240310"},{"positionId":412,"position":"Gospel Doctrine Teacher","memberId":4012,"memberName":"Kimball, Spencer W.","activeDate":"20240310","setApartDate":"20240310"}]}],"callings":[{"positionId":401,"position":"Sunday School President","memberId":4001,"memberName":"Richards, Franklin D.","activeDate":"20240215","setApartDate":"20240215"},{"positionId":402,"position":"First Counselor","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null},{"positionId":403,"position":"Second Counselor","memberId":4003,"memberName":"McKay, David O.","activeDate":"20240501","setApartDate":"20240501"},{"positionId":404,"position":"Secretary","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]},{"unitNumber":100001,"subOrgId":5,"name":"Primary","children":[{"subOrgId":51,"name":"Music","callings":[{"positionId":511,"position":"Primary Music Leader","memberId":5011,"memberName":"Okazaki, Chieko N.","activeDate":"20240201","setApartDate":"20240201"},{"positionId":512,"position":"Primary Pianist","memberId":5012,"memberName":"Winder, Barbara W.","activeDate":"20240201","setApartDate":"20240201"}]}],"callings":[{"positionId":501,"position":"Primary President","memberId":5001,"memberName":"Reeve, Aurelia Spencer","activeDate":"20240120","setApartDate":"20240120"},{"positionId":502,"position":"First Counselor","memberId":5002,"memberName":"Rogers, Louie B.","activeDate":"20240120","setApartDate":"20240120"},{"positionId":503,"position":"Second Counselor","memberId":5003,"memberName":"Dew, Sheri L.","activeDate":"20240120","setApartDate":"20240120"},{"positionId":504,"position":"Secretary","memberId":5004,"memberName":"Madsen, Carol F.","activeDate":"20240205","setApartDate":"20240205"}]},{"unitNumber":100001,"subOrgId":6,"name":"Young Women","children":[{"subOrgId":61,"name":"Additional Callings","callings":[{"positionId":611,"position":"Activity Committee Member","memberId":6011,"memberName":"Beck, Julie B.","activeDate":"20240501","setApartDate":"20240501"}]}],"callings":[{"positionId":601,"position":"Young Women President","memberId":6001,"memberName":"Reeve, Elmina Shepard","activeDate":"20240410","setApartDate":"20240410"},{"positionId":602,"position":"First Counselor","memberId":6002,"memberName":"Gates, Susa Young","activeDate":"20240410","setApartDate":"20240410"},{"positionId":603,"position":"Second Counselor","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null},{"positionId":604,"position":"Secretary","memberId":6004,"memberName":"Tanner, Susan W.","activeDate":"20240515","setApartDate":"20240515"}]},{"unitNumber":100001,"subOrgId":7,"name":"Young Men","children":[],"callings":[{"positionId":701,"position":"Young Men President","memberId":7001,"memberName":"Benson, Ezra Taft","activeDate":"20240410","setApartDate":"20240410"},{"positionId":702,"position":"First Counselor","memberId":7002,"memberName":"Hinckley, Gordon B.","activeDate":"20240410","setApartDate":"20240410"},{"positionId":703,"position":"Second Counselor","memberId":7003,"memberName":"Hunter, Howard W.","activeDate":"20240410","setApartDate":"20240410"},{"positionId":704,"position":"Secretary","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]},{"unitNumber":100001,"subOrgId":8,"name":"Aaronic Priesthood Quorums","children":[{"subOrgId":81,"name":"Presidency of the Aaronic Priesthood","children":[{"subOrgId":811,"name":"Priests Quorum Presidency","callings":[{"positionId":8111,"position":"Priests Quorum President","memberId":8111,"memberName":"Richards, Samuel","activeDate":"20240520","setApartDate":"20240520"},{"positionId":8112,"position":"First Counselor","memberId":8112,"memberName":"Romney, Joshua","activeDate":"20240520","setApartDate":"20240520"},{"positionId":8113,"position":"Second Counselor","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]}],"callings":[]},{"subOrgId":82,"name":"Deacons Quorum","callings":[{"positionId":821,"position":"Deacons Quorum Adviser","memberId":8201,"memberName":"Monson, Thomas S.","activeDate":"20240501","setApartDate":"20240501"}]}],"callings":[]},{"unitNumber":100001,"subOrgId":9,"name":"Temple and Family History","children":[],"callings":[{"positionId":901,"position":"Ward Temple and Family History Consultant","memberId":9001,"memberName":"Haight, David B.","activeDate":"20240520","setApartDate":"20240520"},{"positionId":902,"position":"Ward Temple and Family History Consultant","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]},{"unitNumber":100001,"subOrgId":10,"name":"Ward Missionaries","children":[],"callings":[{"positionId":1001,"position":"Ward Mission Leader","memberId":10001,"memberName":"Alma","activeDate":"20240518","setApartDate":"20240518"},{"positionId":1002,"position":"Ward Missionary","memberId":10002,"memberName":"Nephi","activeDate":"20240518","setApartDate":"20240518"},{"positionId":1003,"position":"Ward Missionary","memberId":10003,"memberName":"Ammon","activeDate":"20240518","setApartDate":"20240518"}]},{"unitNumber":100001,"subOrgId":11,"parentSubOrgId":110,"parentName":"Other Callings","name":"Music","children":[],"callings":[{"positionId":1101,"position":"Ward Choir Director","memberId":11001,"memberName":"Pingree, Anne C.","activeDate":"20240601","setApartDate":"20240601"},{"positionId":1102,"position":"Ward Organist","memberId":11002,"memberName":"Faust, Ruth Wright","activeDate":"20240601","setApartDate":"20240601"},{"positionId":1103,"position":"Ward Chorister","memberId":11003,"memberName":"McConkie, Amelia","activeDate":"20240601","setApartDate":"20240601"}]},{"unitNumber":100001,"subOrgId":12,"parentSubOrgId":110,"parentName":"Other Callings","name":"Technology","children":[],"callings":[{"positionId":1201,"position":"Ward Technology Specialist","memberId":12001,"memberName":"Moroni","activeDate":"20240610","setApartDate":"20240610"}]},{"unitNumber":100001,"subOrgId":13,"parentSubOrgId":110,"parentName":"Other Callings","name":"Welfare and Self-Reliance","children":[],"callings":[{"positionId":1301,"position":"Ward Employment Specialist","memberId":null,"memberName":null,"activeDate":null,"setApartDate":null}]}];

        const demoMembers = [{"nameFormats":{"listPreferredLocal":"Smith, Joseph","givenPreferredLocal":"Joseph","familyPreferredLocal":"Smith"},"uuid":"member-1001","age":38,"legacyCmisId":1001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Young, Brigham","givenPreferredLocal":"Brigham","familyPreferredLocal":"Young"},"uuid":"member-1002","age":46,"legacyCmisId":1002,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Cowdery, Oliver","givenPreferredLocal":"Oliver","familyPreferredLocal":"Cowdery"},"uuid":"member-1003","age":33,"legacyCmisId":1003,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Kimball, Heber C.","givenPreferredLocal":"Heber C.","familyPreferredLocal":"Kimball"},"uuid":"member-1004","age":41,"legacyCmisId":1004,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Richards, Willard","givenPreferredLocal":"Willard","familyPreferredLocal":"Richards"},"uuid":"member-1005","age":39,"legacyCmisId":1005,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Grant, Heber J.","givenPreferredLocal":"Heber J.","familyPreferredLocal":"Grant"},"uuid":"member-1006","age":52,"legacyCmisId":1006,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Taylor, John","givenPreferredLocal":"John","familyPreferredLocal":"Taylor"},"uuid":"member-2001","age":45,"legacyCmisId":2001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Woodruff, Wilford","givenPreferredLocal":"Wilford","familyPreferredLocal":"Woodruff"},"uuid":"member-2002","age":44,"legacyCmisId":2002,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Snow, Lorenzo","givenPreferredLocal":"Lorenzo","familyPreferredLocal":"Snow"},"uuid":"member-2003","age":50,"legacyCmisId":2003,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Packer, Boyd K.","givenPreferredLocal":"Boyd K.","familyPreferredLocal":"Packer"},"uuid":"member-2004","age":55,"legacyCmisId":2004,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Holland, Jeffrey R.","givenPreferredLocal":"Jeffrey R.","familyPreferredLocal":"Holland"},"uuid":"member-2011","age":54,"legacyCmisId":2011,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Bednar, David A.","givenPreferredLocal":"David A.","familyPreferredLocal":"Bednar"},"uuid":"member-2012","age":48,"legacyCmisId":2012,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Cook, Quentin L.","givenPreferredLocal":"Quentin L.","familyPreferredLocal":"Cook"},"uuid":"member-2021","age":46,"legacyCmisId":2021,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Ballard, M. Russell","givenPreferredLocal":"M. Russell","familyPreferredLocal":"Ballard"},"uuid":"member-2031","age":51,"legacyCmisId":2031,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Smith, Emma","givenPreferredLocal":"Emma","familyPreferredLocal":"Smith"},"uuid":"member-3001","age":39,"legacyCmisId":3001,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Snow, Eliza R.","givenPreferredLocal":"Eliza R.","familyPreferredLocal":"Snow"},"uuid":"member-3002","age":42,"legacyCmisId":3002,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Wells, Emmeline B.","givenPreferredLocal":"Emmeline B.","familyPreferredLocal":"Wells"},"uuid":"member-3003","age":38,"legacyCmisId":3003,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Young, Zina D.","givenPreferredLocal":"Zina D.","familyPreferredLocal":"Young"},"uuid":"member-3004","age":35,"legacyCmisId":3004,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Cannon, Martha Hughes","givenPreferredLocal":"Martha Hughes","familyPreferredLocal":"Cannon"},"uuid":"member-3011","age":40,"legacyCmisId":3011,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Kapp, Ardeth G.","givenPreferredLocal":"Ardeth G.","familyPreferredLocal":"Kapp"},"uuid":"member-3012","age":45,"legacyCmisId":3012,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Smoot, Mary Ellen","givenPreferredLocal":"Mary Ellen","familyPreferredLocal":"Smoot"},"uuid":"member-3021","age":41,"legacyCmisId":3021,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Jack, Elaine L.","givenPreferredLocal":"Elaine L.","familyPreferredLocal":"Jack"},"uuid":"member-3031","age":40,"legacyCmisId":3031,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Richards, Franklin D.","givenPreferredLocal":"Franklin D.","familyPreferredLocal":"Richards"},"uuid":"member-4001","age":50,"legacyCmisId":4001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"McKay, David O.","givenPreferredLocal":"David O.","familyPreferredLocal":"McKay"},"uuid":"member-4003","age":48,"legacyCmisId":4003,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Lee, Harold B.","givenPreferredLocal":"Harold B.","familyPreferredLocal":"Lee"},"uuid":"member-4011","age":50,"legacyCmisId":4011,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Kimball, Spencer W.","givenPreferredLocal":"Spencer W.","familyPreferredLocal":"Kimball"},"uuid":"member-4012","age":53,"legacyCmisId":4012,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Reeve, Aurelia Spencer","givenPreferredLocal":"Aurelia Spencer","familyPreferredLocal":"Reeve"},"uuid":"member-5001","age":44,"legacyCmisId":5001,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Rogers, Louie B.","givenPreferredLocal":"Louie B.","familyPreferredLocal":"Rogers"},"uuid":"member-5002","age":40,"legacyCmisId":5002,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Dew, Sheri L.","givenPreferredLocal":"Sheri L.","familyPreferredLocal":"Dew"},"uuid":"member-5003","age":43,"legacyCmisId":5003,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Madsen, Carol F.","givenPreferredLocal":"Carol F.","familyPreferredLocal":"Madsen"},"uuid":"member-5004","age":41,"legacyCmisId":5004,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Okazaki, Chieko N.","givenPreferredLocal":"Chieko N.","familyPreferredLocal":"Okazaki"},"uuid":"member-5011","age":44,"legacyCmisId":5011,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Winder, Barbara W.","givenPreferredLocal":"Barbara W.","familyPreferredLocal":"Winder"},"uuid":"member-5012","age":43,"legacyCmisId":5012,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Reeve, Elmina Shepard","givenPreferredLocal":"Elmina Shepard","familyPreferredLocal":"Reeve"},"uuid":"member-6001","age":39,"legacyCmisId":6001,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Gates, Susa Young","givenPreferredLocal":"Susa Young","familyPreferredLocal":"Gates"},"uuid":"member-6002","age":37,"legacyCmisId":6002,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Tanner, Susan W.","givenPreferredLocal":"Susan W.","familyPreferredLocal":"Tanner"},"uuid":"member-6004","age":42,"legacyCmisId":6004,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Beck, Julie B.","givenPreferredLocal":"Julie B.","familyPreferredLocal":"Beck"},"uuid":"member-6011","age":39,"legacyCmisId":6011,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Benson, Ezra Taft","givenPreferredLocal":"Ezra Taft","familyPreferredLocal":"Benson"},"uuid":"member-7001","age":48,"legacyCmisId":7001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Hinckley, Gordon B.","givenPreferredLocal":"Gordon B.","familyPreferredLocal":"Hinckley"},"uuid":"member-7002","age":51,"legacyCmisId":7002,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Hunter, Howard W.","givenPreferredLocal":"Howard W.","familyPreferredLocal":"Hunter"},"uuid":"member-7003","age":49,"legacyCmisId":7003,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Monson, Thomas S.","givenPreferredLocal":"Thomas S.","familyPreferredLocal":"Monson"},"uuid":"member-8201","age":54,"legacyCmisId":8201,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Richards, Samuel","givenPreferredLocal":"Samuel","familyPreferredLocal":"Richards"},"uuid":"member-8111","age":16,"legacyCmisId":8111,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Romney, Joshua","givenPreferredLocal":"Joshua","familyPreferredLocal":"Romney"},"uuid":"member-8112","age":17,"legacyCmisId":8112,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Haight, David B.","givenPreferredLocal":"David B.","familyPreferredLocal":"Haight"},"uuid":"member-9001","age":52,"legacyCmisId":9001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Alma","givenPreferredLocal":"Alma","familyPreferredLocal":""},"uuid":"member-10001","age":44,"legacyCmisId":10001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Nephi","givenPreferredLocal":"Nephi","familyPreferredLocal":""},"uuid":"member-10002","age":28,"legacyCmisId":10002,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Ammon","givenPreferredLocal":"Ammon","familyPreferredLocal":""},"uuid":"member-10003","age":30,"legacyCmisId":10003,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Pingree, Anne C.","givenPreferredLocal":"Anne C.","familyPreferredLocal":"Pingree"},"uuid":"member-11001","age":37,"legacyCmisId":11001,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Faust, Ruth Wright","givenPreferredLocal":"Ruth Wright","familyPreferredLocal":"Faust"},"uuid":"member-11002","age":42,"legacyCmisId":11002,"sex":"F"},{"nameFormats":{"listPreferredLocal":"McConkie, Amelia","givenPreferredLocal":"Amelia","familyPreferredLocal":"McConkie"},"uuid":"member-11003","age":36,"legacyCmisId":11003,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Moroni","givenPreferredLocal":"Moroni","familyPreferredLocal":""},"uuid":"member-12001","age":32,"legacyCmisId":12001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Pratt, Parley P.","givenPreferredLocal":"Parley P.","familyPreferredLocal":"Pratt"},"uuid":"member-90001","age":42,"legacyCmisId":90001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Eyring, Henry B.","givenPreferredLocal":"Henry B.","familyPreferredLocal":"Eyring"},"uuid":"member-90002","age":45,"legacyCmisId":90002,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Uchtdorf, Dieter F.","givenPreferredLocal":"Dieter F.","familyPreferredLocal":"Uchtdorf"},"uuid":"member-90003","age":43,"legacyCmisId":90003,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Christofferson, D. Todd","givenPreferredLocal":"D. Todd","familyPreferredLocal":"Christofferson"},"uuid":"member-90004","age":44,"legacyCmisId":90004,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Mormon","givenPreferredLocal":"Mormon","familyPreferredLocal":""},"uuid":"member-90005","age":50,"legacyCmisId":90005,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Helaman","givenPreferredLocal":"Helaman","familyPreferredLocal":""},"uuid":"member-90006","age":35,"legacyCmisId":90006,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Lehi","givenPreferredLocal":"Lehi","familyPreferredLocal":""},"uuid":"member-90007","age":55,"legacyCmisId":90007,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Abish","givenPreferredLocal":"Abish","familyPreferredLocal":""},"uuid":"member-90008","age":29,"legacyCmisId":90008,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Sariah","givenPreferredLocal":"Sariah","familyPreferredLocal":""},"uuid":"member-90009","age":50,"legacyCmisId":90009,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Young, Elizabeth","givenPreferredLocal":"Elizabeth","familyPreferredLocal":"Young"},"uuid":"member-90010","age":33,"legacyCmisId":90010,"sex":"F"},{"nameFormats":{"listPreferredLocal":"Ether","givenPreferredLocal":"Ether","familyPreferredLocal":""},"uuid":"member-91001","age":16,"legacyCmisId":91001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Samuel (the Lamanite)","givenPreferredLocal":"Samuel","familyPreferredLocal":""},"uuid":"member-91002","age":17,"legacyCmisId":91002,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Smith, George Albert","givenPreferredLocal":"George Albert","familyPreferredLocal":"Smith"},"uuid":"member-80001","age":46,"legacyCmisId":80001,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Smith, Joseph F.","givenPreferredLocal":"Joseph F.","familyPreferredLocal":"Smith"},"uuid":"member-80002","age":52,"legacyCmisId":80002,"sex":"M"},{"nameFormats":{"listPreferredLocal":"Smith, Hyrum","givenPreferredLocal":"Hyrum","familyPreferredLocal":"Smith"},"uuid":"member-80003","age":50,"legacyCmisId":80003,"sex":"M"}];

        const demoOutOfUnit = {"LIVING_INSIDE":[{"id":80001,"mrn":"0000003946967","unitNumber":509205,"unitName":"Meridian Idaho East Stake","position":"Stake Presidency Second Counselor","organization":"Stake Presidency","name":"Smith, George Albert","activeDate":"2025-09-14T06:00:00.000+00:00","setApartDate":"2025-09-14T06:00:00.000+00:00","age":46},{"id":80002,"mrn":"0000032965028","unitNumber":509205,"unitName":"Meridian Idaho East Stake","position":"Stake Building Specialist","organization":"Facilities","name":"Smith, Joseph F.","activeDate":"2020-01-05T07:00:00.000+00:00","setApartDate":null,"age":52},{"id":80003,"mrn":"000002202137A","unitNumber":509205,"unitName":"Meridian Idaho East Stake","position":"Stake High Councilor","organization":"High Council","name":"Smith, Hyrum","activeDate":"2024-03-10T06:00:00.000+00:00","setApartDate":"2024-03-10T06:00:00.000+00:00","age":50}]};

        // Convert LCR format to internal format
        this.callingsData = this.convertLCRData(demoCallings);
        
        // Process out-of-unit callings
        if (demoOutOfUnit && demoOutOfUnit.LIVING_INSIDE) {
            const outOfUnitOrg = {
                id: 'out-of-unit',
                name: 'Out of Unit Callings',
                callings: []
            };
            
            demoOutOfUnit.LIVING_INSIDE.forEach((calling, index) => {
                const convertedCalling = {
                    id: calling.id || `out-of-unit-${index}`,
                    name: calling.position || 'Unknown Position',
                    member: {
                        id: calling.id,
                        name: calling.name
                    },
                    activeDate: calling.activeDate ? calling.activeDate.split('T')[0] : null,
                    setApartDate: calling.setApartDate ? calling.setApartDate.split('T')[0] : null
                };
                outOfUnitOrg.callings.push(convertedCalling);
            });
            
            if (outOfUnitOrg.callings.length > 0) {
                this.callingsData.subOrgs.push(outOfUnitOrg);
            }
        }
        
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
(function(){
  var s=document.createElement('div');
  s.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;padding:12px 20px;font:14px/1.4 sans-serif;text-align:center;';
  s.style.background='#3a3d40';s.style.color='#fff';
  s.textContent='Extracting LCR data...';
  document.body.appendChild(s);
  function fail(msg){s.style.background='#b00504';s.textContent='Error: '+msg;setTimeout(function(){s.remove()},12000);}
  function ok(msg){s.style.background='#318d43';s.innerHTML=msg;setTimeout(function(){s.remove()},10000);}
  function info(msg){s.style.background='#1a6985';s.textContent=msg;}
  try{
    var chunks=self.__next_f;
    if(!chunks||!chunks.length){fail('No Next.js data found. Make sure you are on an LCR page.');return;}
    function findKey(o,key){
      if(!o||typeof o!=='object') return null;
      if(!Array.isArray(o)&&o[key]) return o[key];
      if(Array.isArray(o)){for(var i=0;i<o.length;i++){var r=findKey(o[i],key);if(r)return r;}}
      else{for(var k in o){var r=findKey(o[k],key);if(r)return r;}}
      return null;
    }
    function parseRSC(keyword){
      for(var i=0;i<chunks.length;i++){
        var c=chunks[i];
        if(typeof c[1]==='string'&&c[1].indexOf(keyword)!==-1){
          var raw=c[1];var ci=raw.indexOf(':');
          if(ci!==-1&&ci<10){try{return JSON.parse(raw.substring(ci+1));}catch(e){}}
        }
      }
      return null;
    }
    var isOrgPage=location.pathname.indexOf('/orgs')!==-1;
    var isMWCPage=location.pathname.indexOf('/report/member-callings')!==-1;
    if(!isOrgPage&&!isMWCPage){
      var hasOrgs=false,hasMWC=false;
      for(var i=0;i<chunks.length;i++){
        if(typeof chunks[i][1]==='string'){
          if(chunks[i][1].indexOf('unitOrgsMap')!==-1) hasOrgs=true;
          if(chunks[i][1].indexOf('membersWithCallings')!==-1) hasMWC=true;
        }
      }
      if(hasOrgs) isOrgPage=true;
      else if(hasMWC) isMWCPage=true;
      else{fail('Not recognized as an LCR Organizations or Members With Callings page.');return;}
    }
    if(isOrgPage){
      info('Step 1/2: Reading organization structure...');
      var rsc=parseRSC('unitOrgsMap');
      var uom=findKey(rsc,'unitOrgsMap');
      if(!uom){fail('Could not find unitOrgsMap in page data.');return;}
      var unitNums=Object.keys(uom);
      if(!unitNums.length){fail('No unit data found.');return;}
      var ud=uom[unitNums[0]];
      var orgPayload={unitOrgs:ud.unitOrgs,unitName:ud.unitName,unitNumber:ud.unitNumber};
      localStorage.setItem('__cm_orgData',JSON.stringify(orgPayload));
      var orgCount=ud.unitOrgs?ud.unitOrgs.length:0;
      ok('Step 1/2 done! '+orgCount+' organizations saved. Now open the <a href=\"https://lcr.churchofjesuschrist.org/mlt/report/member-callings?lang=eng\" style=\"color:#fff;font-weight:700;text-decoration:underline\">Members With Callings report</a> and click this bookmarklet again.');
    } else {
      info('Step 2/2: Reading member & callings data...');
      function findMWC(o){
        if(!o||typeof o!=='object') return null;
        if(o.listOfPersons) return o;
        if(Array.isArray(o)){for(var i=0;i<o.length;i++){var r=findMWC(o[i]);if(r)return r;}}
        else{for(var k in o){var r=findMWC(o[k]);if(r)return r;}}
        return null;
      }
      function tryParseMWC(){
        var rsc2=parseRSC('membersWithCallings');
        return findMWC(rsc2);
      }
      var mwcData=tryParseMWC();
      if(!mwcData||!mwcData.listOfPersons){
        info('Step 2/2: Waiting for page data to load...');
        var attempts=0;var maxAttempts=10;
        var poll=setInterval(function(){
          attempts++;
          mwcData=tryParseMWC();
          if(mwcData&&mwcData.listOfPersons){
            clearInterval(poll);
            finishStep2(mwcData);
          } else if(attempts>=maxAttempts){
            clearInterval(poll);
            fail('Could not find callings data after waiting. Try refreshing the page (F5) and clicking the bookmarklet again.');
          }
        },500);
        return;
      }
      finishStep2(mwcData);
    }
    function finishStep2(mwcData){
      var lop=mwcData.listOfPersons;
      var wc=lop.membersWithCallings||{};
      var woc=lop.membersWithoutCallings||{};
      var baseOrgs=(mwcData.BaseUnitOrgs&&mwcData.BaseUnitOrgs.UnitOrgs)||[];
      var unitNum=(mwcData.BaseUnitOrgs&&mwcData.BaseUnitOrgs.unitNumber)||mwcData.unitNumber||null;
      var storedOrg=localStorage.getItem('__cm_orgData');
      var orgData=null;
      if(storedOrg){try{orgData=JSON.parse(storedOrg);}catch(e){}}
      var bundle={mwcData:{listOfPersons:lop,baseUnitOrgs:baseOrgs,unitNumber:unitNum}};
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
    }
  }catch(e){fail(e.message||'Unknown error');}
})();`.replace(/\n/g, '').replace(/  +/g, ' ');

        bookmarkletLink.href = 'javascript:' + encodeURIComponent(code);
        
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
        // Match self.__next_f.push([...]) calls in <script> tags
        const re = /self\.__next_f\.push\(\s*(\[.+?\])\s*\)/gs;
        let m;
        while ((m = re.exec(html)) !== null) {
            try {
                const arr = JSON.parse(m[1]);
                chunks.push(arr);
            } catch (e) {
                // Some chunks may not be simple JSON — skip
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
        } catch (e) {
            console.error('Error saving data:', e);
        }
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
            thead.innerHTML = `
                <tr>
                    <th>Calling</th>
                    <th>Name</th>
                    <th>Sustained</th>
                    <th>Set Apart</th>
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
        } else {
            const vacant = document.createElement('span');
            vacant.className = 'vacant-text';
            vacant.textContent = 'Calling Vacant';
            nameCell.appendChild(vacant);
        }
        row.appendChild(nameCell);

        // Sustained date
        const sustainedCell = document.createElement('td');
        sustainedCell.className = 'sustained-cell';
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
        if (calling.setApartDate) {
            setApartCell.innerHTML = '<span class="set-apart-check">✓</span>';
        }
        row.appendChild(setApartCell);

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
        editCell.colSpan = 5;

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

    releaseMember(callingId, orgId, callingIndex) {
        const org = this.callingsData.subOrgs.find(o => o.id == orgId);
        if (!org) return;

        const calling = org.callings[callingIndex];
        if (!calling || calling.id != callingId || !calling.member) return;

        // Get member info before clearing
        const releasedMemberName = calling.member.name;

        if (!confirm(`Are you sure you want to release ${releasedMemberName} from ${calling.name}?`)) {
            return;
        }

        // Create unique identifier for this calling
        const uniqueCallingId = `${org.id}-${calling.id}`;

        // Save state before making change
        this.saveStateForUndo(`Release ${releasedMemberName} from ${calling.name} in ${org.name}`, uniqueCallingId);

        calling.member = null;
        calling.activeDate = null;
        calling.setApartDate = null;

        // Mark this calling as changed for visual highlighting using unique identifier with index
        this.markCallingAsChanged(`${org.id}-${calling.id}-${callingIndex}`);

        // If this member was in our member list, make sure they're not hidden
        if (releasedMemberName) {
            const member = this.memberList.find(m => 
                m.name.trim().toLowerCase() === releasedMemberName.trim().toLowerCase()
            );
            if (member && this.hiddenMembers.has(member.id)) {
                // Only remove from hidden if they're an adult (keep youth hidden by default)
                if (!member.age || member.age >= 18) {
                    this.hiddenMembers.delete(member.id);
                }
            }
        }

        this.saveData();
        this.renderAllOrganizations();
        
        // Update visibility lists if panel is open
        const panel = document.getElementById('visibility-panel');
        if (panel && panel.classList.contains('active')) {
            this.updateVisibilityLists();
        }
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
        
        // Filter out hidden members
        const visibleMembers = this.memberList.filter(member => !this.hiddenMembers.has(member.id));
        
        if (visibleMembers.length === 0) {
            memberList.innerHTML = '<p class="empty-state">No members available. Click "Add New Member" to add manually.</p>';
        } else {
            visibleMembers.forEach(member => {
                const item = document.createElement('div');
                item.className = 'member-item';
                item.textContent = member.name;
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

        // Create unique identifier for this calling including index
        const uniqueCallingId = `${org.id}-${calling.id}-${callingIndex}`;

        // Save descriptions for change history
        const previousMember = calling.member ? calling.member.name : null;
        const releaseDescription = previousMember ? `Release ${previousMember} from ${calling.name} in ${org.name}` : null;
        const callDescription = `Call ${member.name} to ${calling.name} in ${org.name}`;

        // Check if member previously had a calling
        const memberHadCalling = this.callingsData.subOrgs.some(org => 
            org.callings.some(c => c.member && c.member.id === member.id)
        );

        // Update the calling
        calling.member = {
            id: member.id,
            name: member.name
        };
        calling.activeDate = null; // Leave sustained date blank (pending)
        calling.setApartDate = null;

        // Record the changes (release first if applicable, then call)
        if (releaseDescription) {
            this.recordChange(releaseDescription, uniqueCallingId);
        }
        this.recordChange(callDescription, uniqueCallingId);

        // Mark this calling as changed for visual highlighting using unique identifier with index
        this.markCallingAsChanged(`${org.id}-${calling.id}-${callingIndex}`);

        // If member didn't have a calling before, ensure they cannot be hidden
        if (!memberHadCalling && this.hiddenMembers.has(member.id)) {
            this.hiddenMembers.delete(member.id);
        }

        this.saveData();
        this.renderAllOrganizations();
        this.updateVisibilityLists(); // Update visibility controls to reflect new state
        this.closeMemberModal();
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
                
                if (callingName.includes(lowerQuery) || memberName.includes(lowerQuery)) {
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
                thead.innerHTML = `<tr><th>Calling</th><th>Name</th><th>Sustained</th><th>Set Apart</th><th></th></tr>`;
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
            callingId: callingId, // Store the calling ID that was changed
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

        const previousState = this.changeHistory.pop();
        this.callingsData = JSON.parse(previousState.data);
        
        // Remove only the specific calling that was changed from the styled set
        if (previousState.callingId) {
            this.changedCallings.delete(previousState.callingId);
        }
        
        this.updateUndoButton();
        this.saveData();
        this.renderAllOrganizations();
        this.updateVisibilityLists();
        
        // Show what was undone
        alert(`Undone: ${previousState.description}`);
    }

    updateUndoButton() {
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = this.changeHistory.length === 0;
            if (this.changeHistory.length > 0) {
                const lastChange = this.changeHistory[this.changeHistory.length - 1];
                undoBtn.title = `Undo: ${lastChange.description}`;
            } else {
                undoBtn.title = 'No changes to undo';
            }
        }

        // Update print changes button
        const printChangesBtn = document.getElementById('print-changes-btn');
        if (printChangesBtn) {
            printChangesBtn.disabled = this.changeHistory.length === 0;
            if (this.changeHistory.length > 0) {
                printChangesBtn.title = `Print ${this.changeHistory.length} change${this.changeHistory.length === 1 ? '' : 's'}`;
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

        // Separate releases from calls/assignments
        const releases = [];
        const calls = [];
        this.changeHistory.forEach(change => {
            if (change.description.startsWith('Release ')) {
                releases.push(change.description);
            } else {
                calls.push(change.description);
            }
        });

        // Build the two-column report
        let html = '<div class="changes-report">';
        html += `<p class="report-scenario">Scenario: ${scenarioName}</p>`;
        html += `<p class="report-date">Generated: ${new Date().toLocaleString()}</p>`;
        html += `<p class="report-summary">Total Changes: ${this.changeHistory.length}</p>`;
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
