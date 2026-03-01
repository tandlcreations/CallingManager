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

        // Callings data textarea - enable member list link when populated
        const callingsDataTextarea = document.getElementById('callings-data');
        if (callingsDataTextarea) {
            callingsDataTextarea.addEventListener('input', () => this.updateMemberListLink());
        }

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

    updateMemberListLink() {
        const callingsInput = document.getElementById('callings-data').value.trim();
        const memberListLink = document.getElementById('member-list-link');
        
        if (!memberListLink) return;
        
        if (!callingsInput) {
            memberListLink.classList.add('disabled-link');
            memberListLink.href = '#';
            return;
        }
        
        try {
            const rawData = JSON.parse(callingsInput);
            
            // Extract unitNumber from the data
            let unitNumber = null;
            
            // Handle both array and object format
            const orgs = Array.isArray(rawData) ? rawData : [rawData];
            
            // Look for unitNumber in the first org
            if (orgs.length > 0 && orgs[0].unitNumber) {
                unitNumber = orgs[0].unitNumber;
            }
            
            if (unitNumber) {
                memberListLink.classList.remove('disabled-link');
                memberListLink.href = `https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=${unitNumber}`;
            } else {
                memberListLink.classList.add('disabled-link');
                memberListLink.href = '#';
            }
        } catch (e) {
            // Invalid JSON, keep link disabled
            memberListLink.classList.add('disabled-link');
            memberListLink.href = '#';
        }
    }

    submitData() {
        const callingsInput = document.getElementById('callings-data').value.trim();
        const outOfUnitInput = document.getElementById('out-of-unit-data').value.trim();
        const memberListInput = document.getElementById('member-list-data').value.trim();

        if (!callingsInput) {
            alert('Please paste the calling data from LCR.');
            return;
        }

        if (!memberListInput) {
            alert('Please paste the member list data from LCR. This is required for member management.');
            return;
        }

        try {
            const rawData = JSON.parse(callingsInput);
            
            // Convert LCR format to internal format
            this.callingsData = this.convertLCRData(rawData);
            
            // Handle out of unit callings as a separate organization
            if (outOfUnitInput) {
                try {
                    const rawOutOfUnit = JSON.parse(outOfUnitInput);
                    
                    // Create "Out of Unit Callings" organization
                    const outOfUnitOrg = {
                        id: 'out-of-unit',
                        name: 'Out of Unit Callings',
                        callings: []
                    };
                    
                    // Handle the LIVING_INSIDE array structure
                    let outOfUnitCallings = [];
                    
                    if (rawOutOfUnit.LIVING_INSIDE && Array.isArray(rawOutOfUnit.LIVING_INSIDE)) {
                        outOfUnitCallings = rawOutOfUnit.LIVING_INSIDE;
                    } else if (Array.isArray(rawOutOfUnit)) {
                        outOfUnitCallings = rawOutOfUnit;
                    }
                    
                    // Process each out-of-unit calling
                    outOfUnitCallings.forEach((calling, index) => {
                        const convertedCalling = {
                            id: calling.positionId || `out-of-unit-${index}`,
                            name: calling.position || 'Unknown Position',
                            member: null,
                            activeDate: null,
                            setApartDate: null
                        };

                        // Add member info (already embedded in the calling)
                        if (calling.id && calling.name) {
                            convertedCalling.member = {
                                id: calling.id,
                                name: calling.name
                            };
                            
                            // Parse activeDate - format is ISO string like "2025-09-14T06:00:00.000+00:00"
                            if (calling.activeDate) {
                                const dateStr = calling.activeDate.split('T')[0];
                                convertedCalling.activeDate = dateStr;
                            }
                            
                            // Parse setApartDate
                            if (calling.setApartDate) {
                                const dateStr = calling.setApartDate.split('T')[0];
                                convertedCalling.setApartDate = dateStr;
                            }
                        }

                        outOfUnitOrg.callings.push(convertedCalling);
                    });
                    
                    // Add the org if it has callings
                    if (outOfUnitOrg.callings.length > 0) {
                        this.callingsData.subOrgs.push(outOfUnitOrg);
                    }
                } catch (e) {
                    console.error('Error parsing out of unit data:', e);
                    alert('Warning: Out of unit data could not be parsed. Continuing with main calling data only.');
                }
            }

            // Import member list (now required)
            try {
                const rawMembers = JSON.parse(memberListInput);
                this.importMemberList(rawMembers);
            } catch (e) {
                console.error('Error parsing member list:', e);
                alert('Error: Member list could not be parsed. Please check the data and try again.');
                return;
            }

            this.saveData();
            this.showManager();
        } catch (e) {
            console.error('Error parsing calling data:', e);
            alert('Error: The data you pasted does not appear to be valid JSON. Please make sure you copied all the text from the LCR page.');
        }
    }

    convertLCRData(rawData) {
        // Check if data is already in our format
        if (rawData.subOrgs) {
            return rawData;
        }

        // Convert from LCR API format to internal format
        const subOrgs = [];
        
        // Handle both array and single object
        const orgs = Array.isArray(rawData) ? rawData : [rawData];
        
        // Recursive function to process org and its children
        const processOrg = (org, parentName = null) => {
            const results = [];
            
            // Process direct callings if they exist
            if (org.callings && org.callings.length > 0) {
                const orgName = org.name || org.defaultOrgName || 'Unknown Organization';
                
                // If this org has a parent and doesn't already include parent name, prepend it
                let displayName = orgName;
                if (parentName) {
                    // Extract the base parent name (e.g., "Elders Quorum" from "Elders Quorum Presidency")
                    const baseParentName = parentName.replace(/\s+(Presidency|Leadership|Organization)$/i, '').trim();
                    
                    // Check if child name doesn't already contain the parent name
                    if (!orgName.toLowerCase().includes(baseParentName.toLowerCase())) {
                        displayName = `${baseParentName} - ${orgName}`;
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

                    // Add member if calling is filled
                    if (calling.memberId && calling.memberName) {
                        convertedCalling.member = {
                            id: calling.memberId,
                            name: calling.memberName
                        };
                        
                        // Store both activeDate and setApartDate
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
            
            // Process children recursively, passing current org name as parent
            if (org.children && org.children.length > 0) {
                const currentOrgName = org.name || org.defaultOrgName || null;
                org.children.forEach(child => {
                    results.push(...processOrg(child, currentOrgName));
                });
            }
            
            return results;
        };
        
        orgs.forEach(org => {
            subOrgs.push(...processOrg(org));
        });

        return { subOrgs };
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

    renderAllOrganizations() {
        const container = document.getElementById('callings-container');
        container.innerHTML = '';

        if (!this.callingsData || !this.callingsData.subOrgs) {
            container.innerHTML = '<div class="empty-state"><p>No organizations found</p></div>';
            return;
        }

        // Render all organizations on one page
        this.callingsData.subOrgs.forEach(org => {
            const orgSection = this.createOrganizationSection(org);
            container.appendChild(orgSection);
        });

        // Add Members Without Callings section
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

        if (!org.callings || org.callings.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'No callings in this organization';
            section.appendChild(empty);
            return section;
        }

        const callingsGrid = document.createElement('div');
        callingsGrid.className = 'callings-grid';

        org.callings.forEach((calling, callingIndex) => {
            const card = this.createCallingCard(calling, org, callingIndex);
            // Add hidden class if calling is in hiddenCallings set
            if (this.hiddenCallings.has(calling.id)) {
                card.classList.add('hidden');
            }
            callingsGrid.appendChild(card);
        });

        section.appendChild(callingsGrid);
        return section;
    }

    createMembersWithoutCallingsSection(members) {
        const section = document.createElement('div');
        section.className = 'org-section';
        section.dataset.orgId = 'members-without-callings';

        const header = document.createElement('h2');
        header.className = 'org-header';
        header.textContent = 'Members Without Callings';
        section.appendChild(header);

        const membersGrid = document.createElement('div');
        membersGrid.className = 'callings-grid';

        members.forEach(member => {
            const card = document.createElement('div');
            card.className = 'calling-card member-card';
            card.dataset.memberId = member.id;
            
            const memberName = document.createElement('h4');
            memberName.textContent = member.name;
            card.appendChild(memberName);

            membersGrid.appendChild(card);
        });

        section.appendChild(membersGrid);
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
                
                const grid = document.createElement('div');
                grid.className = 'callings-grid';
                
                matchingCallings.forEach(({ calling, callingIndex }) => {
                    const card = this.createCallingCard(calling, org, callingIndex);
                    grid.appendChild(card);
                });
                
                section.appendChild(grid);
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
            changedCallings: Array.from(this.changedCallings)
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
        
        // Build the changes report
        let html = '<div class="changes-report">';
        html += `<p class="report-date">Generated: ${new Date().toLocaleString()}</p>`;
        html += `<p class="report-summary">Total Changes: ${this.changeHistory.length}</p>`;
        html += '<table class="changes-table">';
        html += '<thead><tr><th>#</th><th>Date/Time</th><th>Change Description</th></tr></thead>';
        html += '<tbody>';
        
        this.changeHistory.forEach((change, index) => {
            const changeDate = new Date(change.timestamp);
            const formattedDate = changeDate.toLocaleString();
            html += `<tr>
                <td>${index + 1}</td>
                <td>${formattedDate}</td>
                <td>${change.description}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
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
