// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCFUhbhUCS-961afEVhnH9GCg8V9SnS5sA",
    authDomain: "save-pulse-fa3bc.firebaseapp.com",
    projectId: "save-pulse-fa3bc",
    storageBucket: "save-pulse-fa3bc.firebasestorage.app",
    messagingSenderId: "201257821695",
    appId: "1:201257821695:web:0cab7555e55c27516433ca",
    measurementId: "G-0JVB26WRJD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Blood compatibility map
const COMPATIBLE_DONORS = {
    'A+':  ['A+','A-','O+','O-'],
    'A-':  ['A-','O-'],
    'B+':  ['B+','B-','O+','O-'],
    'B-':  ['B-','O-'],
    'AB+': ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
    'AB-': ['A-','B-','AB-','O-'],
    'O+':  ['O+','O-'],
    'O-':  ['O-']
};

const app = {
    currentUser: null,
    currentDocId: null,
    sosUnsubscribe: null,

    init: () => {
        document.getElementById('login-form').addEventListener('submit', app.handleLogin);
        document.getElementById('register-form').addEventListener('submit', app.handleRegister);
    },

    // ========== Toast Notification ==========
    toast: (msg, type = 'info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    },

    showLoader: () => document.getElementById('global-loader').classList.add('active'),
    hideLoader: () => document.getElementById('global-loader').classList.remove('active'),

    showLogin: () => {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.querySelectorAll('.tab')[1].classList.remove('active');
    },

    showRegister: () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.querySelectorAll('.tab')[0].classList.remove('active');
        document.querySelectorAll('.tab')[1].classList.add('active');
    },

    toggleRoleSpecifics: () => {
        document.getElementById('reg-blood-group-group').style.display = 'block';
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const contact = document.getElementById('login-contact').value.trim();
        const pass = document.getElementById('login-password').value;
        app.showLoader();
        try {
            const snapshot = await db.collection('users')
                .where('contact', '==', contact)
                .where('password', '==', pass)
                .get();
            if (snapshot.empty) {
                app.toast('Invalid credentials. Please check and try again.', 'error');
                return;
            }
            const docSnap = snapshot.docs[0];
            app.currentUser = docSnap.data();
            app.currentDocId = docSnap.id;
            app.renderDashboard();
            app.toast(`Welcome back, ${app.currentUser.name}!`, 'success');
        } catch (err) {
            app.toast('Login failed: ' + err.message, 'error');
        } finally {
            app.hideLoader();
        }
    },

    handleRegister: async (e) => {
        e.preventDefault();
        const name     = document.getElementById('reg-name').value.trim();
        const contact  = document.getElementById('reg-contact').value.trim();
        const location = document.getElementById('reg-location').value.trim();
        const pass     = document.getElementById('reg-password').value;
        const role     = document.getElementById('reg-role').value;
        const bg       = document.getElementById('reg-blood-group').value;

        app.showLoader();
        try {
            const existing = await db.collection('users').where('contact', '==', contact).get();
            if (!existing.empty) {
                app.toast('Contact number already registered!', 'warning');
                return;
            }
            const newUser = {
                name, contact, location, password: pass, role,
                bloodGroup: bg,
                available: role === 'DONOR',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').add(newUser);
            app.toast('Account created! Please login.', 'success');
            document.getElementById('register-form').reset();
            app.showLogin();
        } catch (err) {
            app.toast('Registration failed: ' + err.message, 'error');
        } finally {
            app.hideLoader();
        }
    },

    renderDashboard: () => {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('user-name-display').textContent = app.currentUser.name;
        document.getElementById('user-role-display').textContent =
            app.currentUser.role === 'DONOR' ? '❤️ Donor' : '🤲 Receiver';

        app.loadLiveStats();

        if (app.currentUser.role === 'DONOR') {
            document.getElementById('donor-dashboard').style.display = 'block';
            document.getElementById('receiver-dashboard').style.display = 'none';
            document.getElementById('donor-bg').textContent = app.currentUser.bloodGroup;
            document.getElementById('availability-toggle').checked = app.currentUser.available;
            app.updateAvailabilityUI();
            app.loadDonorStats();
            app.listenForSOS();  // Real-time SOS listener for donors
        } else {
            document.getElementById('donor-dashboard').style.display = 'none';
            document.getElementById('receiver-dashboard').style.display = 'block';
            const compat = COMPATIBLE_DONORS[app.currentUser.bloodGroup] || [];
            document.getElementById('search-bg').value = app.currentUser.bloodGroup;
            app.showCompatInfo(compat);
            app.searchDonors();
        }
    },

    showCompatInfo: (compat) => {
        const el = document.getElementById('compat-info');
        if (el) el.textContent = `Compatible donors: ${compat.join(', ')}`;
    },

    loadLiveStats: async () => {
        try {
            const snap = await db.collection('users').where('role', '==', 'DONOR').where('available', '==', true).get();
            document.getElementById('stats-text').textContent = `${snap.size} donors online`;
        } catch (e) {
            document.getElementById('stats-text').textContent = 'Live';
        }
    },

    loadDonorStats: async () => {
        try {
            const [totalSnap, availSnap, reqSnap] = await Promise.all([
                db.collection('users').where('role', '==', 'DONOR').get(),
                db.collection('users').where('role', '==', 'DONOR').where('available', '==', true).get(),
                db.collection('sos_requests').where('resolved', '==', false).get()
            ]);
            document.getElementById('total-donors-count').textContent = totalSnap.size;
            document.getElementById('available-donors-count').textContent = availSnap.size;
            document.getElementById('requests-count').textContent = reqSnap.size;
        } catch (e) {
            console.log('Stats load error (index may be building):', e.message);
        }
    },

    // Real-time SOS listener for donors
    listenForSOS: () => {
        if (app.sosUnsubscribe) app.sosUnsubscribe();
        const sosListEl = document.getElementById('sos-request-list');
        app.sosUnsubscribe = db.collection('sos_requests')
            .where('resolved', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                if (!sosListEl) return;
                if (snapshot.empty) {
                    sosListEl.innerHTML = '<p class="no-sos">No active emergency requests right now.</p>';
                    return;
                }
                sosListEl.innerHTML = '';
                snapshot.forEach(doc => {
                    const d = doc.data();
                    const card = document.createElement('div');
                    card.className = 'sos-request-card fade-in';
                    card.innerHTML = `
                        <div class="sos-req-info">
                            <span class="sos-req-bg">${d.bloodGroup}</span>
                            <div>
                                <strong>${d.receiverName}</strong>
                                <p>📍 ${d.location}</p>
                            </div>
                        </div>
                        <button class="contact-btn" onclick="app.contactDonor('${d.receiverName}','${d.receiverContact}')">
                            📞 Respond
                        </button>
                    `;
                    sosListEl.appendChild(card);
                });
                app.loadDonorStats();
            }, err => {
                console.log('SOS listener error (index building):', err.message);
            });
    },

    updateAvailability: async () => {
        const newStatus = document.getElementById('availability-toggle').checked;
        app.currentUser.available = newStatus;
        app.updateAvailabilityUI();
        try {
            await db.collection('users').doc(app.currentDocId).update({ available: newStatus });
            app.toast(newStatus ? 'You are now available to donate!' : 'Availability turned off.', newStatus ? 'success' : 'info');
            app.loadLiveStats();
        } catch (err) {
            app.toast('Failed to update: ' + err.message, 'error');
        }
    },

    updateAvailabilityUI: () => {
        const status = document.getElementById('availability-status');
        if (!status) return;
        if (app.currentUser.available) {
            status.textContent = 'Available';
            status.style.color = '#00e5a0';
        } else {
            status.textContent = 'Not Available';
            status.style.color = '#ff2d55';
        }
    },

    sendSOS: async () => {
        const btn = document.getElementById('sos-btn');
        const confirmed = confirm(`🆘 Send emergency blood request?\nBlood Group: ${app.currentUser.bloodGroup}\nLocation: ${app.currentUser.location}`);
        if (!confirmed) return;

        btn.disabled = true;
        btn.innerHTML = '<span>Sending...</span>';
        app.showLoader();
        try {
            await db.collection('sos_requests').add({
                receiverName: app.currentUser.name,
                receiverContact: app.currentUser.contact,
                bloodGroup: app.currentUser.bloodGroup,
                location: app.currentUser.location,
                receiverDocId: app.currentDocId,
                resolved: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            btn.innerHTML = '<span>✅ SOS Sent!</span>';
            btn.style.background = 'linear-gradient(135deg, #00e5a0, #00b880)';
            app.toast('Emergency SOS sent! Donors have been notified.', 'success');
        } catch (err) {
            app.toast('SOS failed: ' + err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<span>Send SOS</span>';
        } finally {
            app.hideLoader();
        }
    },

    searchDonors: async () => {
        const bg = document.getElementById('search-bg').value;
        const location = document.getElementById('search-location').value.toLowerCase().trim();
        const tbody = document.getElementById('donors-list');
        tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">🔍 Searching...</td></tr>';

        // Use compatible blood groups
        const compatGroups = COMPATIBLE_DONORS[bg] || [bg];

        try {
            // Query for the selected blood group (Firestore limitation: no 'in' + available in one query easily)
            const snapshot = await db.collection('users')
                .where('role', '==', 'DONOR')
                .where('available', '==', true)
                .where('bloodGroup', '==', bg)
                .get();

            let results = snapshot.docs.map(d => d.data());
            if (location !== '') {
                results = results.filter(u => u.location.toLowerCase().includes(location));
            }

            const countEl = document.getElementById('result-count');
            tbody.innerHTML = '';

            if (results.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="empty-msg">No donors found for <strong>${bg}</strong>. Try a compatible group: ${compatGroups.join(', ')}</td></tr>`;
                countEl.textContent = '';
                return;
            }

            countEl.textContent = `${results.length} found`;
            results.forEach(d => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${d.name}</strong></td>
                    <td><span class="bg-badge">${d.bloodGroup}</span></td>
                    <td>📍 ${d.location}</td>
                    <td><button class="contact-btn" onclick="app.contactDonor('${d.name}','${d.contact}')">📞 Contact</button></td>
                `;
                tbody.appendChild(row);
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-msg" style="color:#ff2d55;">Error loading donors. Check console.</td></tr>`;
            console.error('Search error:', err);
            if (err.message && err.message.toLowerCase().includes('index')) {
                app.toast('Firestore needs an index. Check browser console for link.', 'warning');
            }
        }
    },

    contactDonor: (name, contact) => {
        app.toast(`Contacting ${name} at ${contact}`, 'info');
        setTimeout(() => {
            window.open(`tel:${contact}`);
        }, 500);
    },

    logout: () => {
        if (app.sosUnsubscribe) { app.sosUnsubscribe(); app.sosUnsubscribe = null; }
        app.currentUser = null;
        app.currentDocId = null;
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
        app.showLogin();
        document.getElementById('login-form').reset();
        app.toast('Logged out successfully.', 'info');
    }
};

window.onload = app.init;
