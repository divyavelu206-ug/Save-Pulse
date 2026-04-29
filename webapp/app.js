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

// Who can this blood type donate TO
const CAN_DONATE_TO = {
    'A+':  ['A+','AB+'],
    'A-':  ['A+','A-','AB+','AB-'],
    'B+':  ['B+','AB+'],
    'B-':  ['B+','B-','AB+','AB-'],
    'AB+': ['AB+'],
    'AB-': ['AB+','AB-'],
    'O+':  ['A+','B+','AB+','O+'],
    'O-':  ['A+','A-','B+','B-','AB+','AB-','O+','O-']
};

const ALL_BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const BADGES = [
    { id: 'first_response', icon: '🥇', label: 'First Responder', threshold: 1 },
    { id: 'five_lives',     icon: '⭐', label: '5 Lives Saved',   threshold: 5 },
    { id: 'ten_lives',      icon: '🌟', label: '10 Lives Saved',  threshold: 10 },
    { id: 'hero',           icon: '🦸', label: 'Blood Hero',      threshold: 25 },
    { id: 'legend',         icon: '👑', label: 'SavePulse Legend', threshold: 50 }
];

const app = {
    currentUser: null,
    currentDocId: null,
    sosUnsubscribe: null,
    sosCountIntervals: [],
    leafletMaps: [],
    previousSOSCount: 0,
    notifPermission: false,

    init: () => {
        document.getElementById('login-form').addEventListener('submit', app.handleLogin);
        document.getElementById('register-form').addEventListener('submit', app.handleRegister);
        // Load saved theme
        if (localStorage.getItem('savepulse-theme') === 'blood') {
            document.body.classList.add('theme-blood');
        }
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
                responsesCount: 0,
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
            app.listenForSOS();
            app.renderCompatViz();
            app.loadImpactData();
        } else {
            document.getElementById('donor-dashboard').style.display = 'none';
            document.getElementById('receiver-dashboard').style.display = 'block';
            const compat = COMPATIBLE_DONORS[app.currentUser.bloodGroup] || [];
            document.getElementById('search-bg').value = app.currentUser.bloodGroup;
            app.showCompatInfo(compat);
            app.searchDonors();
            app.captureLocation();
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

    // ========== REAL-TIME SOS LISTENER WITH ALERTS ==========
    listenForSOS: () => {
        if (app.sosUnsubscribe) app.sosUnsubscribe();
        app.clearCountdownTimers();
        app.clearLeafletMaps();
        const sosListEl = document.getElementById('sos-request-list');

        app.sosUnsubscribe = db.collection('sos_requests')
            .where('resolved', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                if (!sosListEl) return;

                // Detect new SOS
                const newCount = snapshot.size;
                if (newCount > app.previousSOSCount && app.previousSOSCount > 0) {
                    app.triggerSOSAlert(snapshot.docs[0]?.data());
                }
                app.previousSOSCount = newCount;

                // Update notification badge
                const badge = document.getElementById('notif-badge');
                if (badge) {
                    badge.textContent = newCount > 0 ? newCount : '';
                    badge.setAttribute('data-count', newCount);
                }

                if (snapshot.empty) {
                    sosListEl.innerHTML = '<p class="no-sos">No active emergency requests right now.</p>';
                    return;
                }

                app.clearCountdownTimers();
                app.clearLeafletMaps();
                sosListEl.innerHTML = '';

                snapshot.forEach((doc, idx) => {
                    const d = doc.data();
                    const cardId = `sos-card-${doc.id}`;
                    const mapId = `sos-map-${doc.id}`;
                    const timerId = `sos-timer-${doc.id}`;

                    const card = document.createElement('div');
                    card.className = 'sos-request-card fade-in';
                    card.id = cardId;

                    let mapHtml = '';
                    let navHtml = '';
                    if (d.latitude && d.longitude) {
                        mapHtml = `<div class="sos-map-container" id="${mapId}"></div>`;
                        navHtml = `<button class="navigate-btn" onclick="app.navigateTo(${d.latitude},${d.longitude})">🗺️ Navigate</button>`;
                    }

                    card.innerHTML = `
                        <div class="sos-req-info">
                            <span class="sos-req-bg">${d.bloodGroup}</span>
                            <div>
                                <strong>${d.receiverName}</strong>
                                <p>📍 ${d.location}</p>
                                <div class="sos-timer" id="${timerId}">
                                    <span class="timer-dot"></span>
                                    <span class="timer-text">calculating...</span>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                            <button class="contact-btn" onclick="app.respondToSOS('${doc.id}','${d.receiverName}','${d.receiverContact}')">
                                📞 Respond
                            </button>
                            ${navHtml}
                        </div>
                        ${mapHtml}
                    `;
                    sosListEl.appendChild(card);

                    // Start countdown timer
                    if (d.createdAt) {
                        app.startCountdown(timerId, d.createdAt.toDate());
                    }

                    // Render map
                    if (d.latitude && d.longitude) {
                        setTimeout(() => app.renderMap(mapId, d.latitude, d.longitude, d.receiverName), 100);
                    }
                });
                app.loadDonorStats();
            }, err => {
                console.log('SOS listener error (index building):', err.message);
            });
    },

    // ========== SOS ALERT (Notification + Sound + Flash) ==========
    triggerSOSAlert: (data) => {
        // Flash the SOS panel
        const panel = document.getElementById('sos-panel');
        if (panel) {
            panel.classList.remove('sos-flash');
            void panel.offsetWidth;
            panel.classList.add('sos-flash');
        }

        // Play audio
        try {
            const audio = document.getElementById('sos-audio');
            if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
        } catch (e) {}

        // Browser notification
        if (Notification.permission === 'granted' && data) {
            new Notification('🆘 Emergency Blood Request!', {
                body: `${data.receiverName} needs ${data.bloodGroup} blood at ${data.location}`,
                icon: '🩸',
                tag: 'sos-alert'
            });
        }

        app.toast('🆘 New emergency blood request received!', 'warning');
    },

    // ========== NOTIFICATION PERMISSION ==========
    requestNotificationPermission: async () => {
        if (!('Notification' in window)) {
            app.toast('Browser doesn\'t support notifications', 'warning');
            return;
        }
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
            app.notifPermission = true;
            app.toast('Notifications enabled! You\'ll be alerted for SOS.', 'success');
        } else {
            app.toast('Notification permission denied.', 'error');
        }
    },

    // ========== MAP RENDERING ==========
    renderMap: (containerId, lat, lng, name) => {
        try {
            const mapEl = document.getElementById(containerId);
            if (!mapEl || typeof L === 'undefined') return;

            const map = L.map(containerId, {
                zoomControl: false,
                attributionControl: false
            }).setView([lat, lng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);

            const marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(`<b>🆘 ${name}</b><br>Emergency location`).openPopup();

            app.leafletMaps.push(map);
        } catch (e) {
            console.log('Map render error:', e);
        }
    },

    navigateTo: (lat, lng) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    },

    clearLeafletMaps: () => {
        app.leafletMaps.forEach(m => { try { m.remove(); } catch(e){} });
        app.leafletMaps = [];
    },

    // ========== COUNTDOWN TIMERS ==========
    startCountdown: (timerId, createdDate) => {
        const update = () => {
            const el = document.querySelector(`#${timerId} .timer-text`);
            if (!el) return;
            const diff = Math.floor((Date.now() - createdDate.getTime()) / 1000);
            if (diff < 60) el.textContent = `${diff}s ago`;
            else if (diff < 3600) el.textContent = `${Math.floor(diff/60)}m ago`;
            else el.textContent = `${Math.floor(diff/3600)}h ago`;
        };
        update();
        const interval = setInterval(update, 10000);
        app.sosCountIntervals.push(interval);
    },

    clearCountdownTimers: () => {
        app.sosCountIntervals.forEach(i => clearInterval(i));
        app.sosCountIntervals = [];
    },

    // ========== BLOOD COMPATIBILITY VISUALIZER ==========
    renderCompatViz: () => {
        const grid = document.getElementById('compat-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const userBG = app.currentUser.bloodGroup;
        const canDonateTo = CAN_DONATE_TO[userBG] || [];

        ALL_BLOOD_GROUPS.forEach((bg, i) => {
            const node = document.createElement('div');
            node.className = 'compat-node';
            node.textContent = bg;
            if (bg === userBG) {
                node.classList.add('self');
            } else if (canDonateTo.includes(bg)) {
                node.classList.add('compatible');
                node.style.animationDelay = `${i * 0.08}s`;
            }
            node.title = bg === userBG ? 'Your blood type' :
                         canDonateTo.includes(bg) ? `You can donate to ${bg}` : `Not compatible`;
            grid.appendChild(node);
        });
    },

    // ========== IMPACT DATA & BADGES ==========
    loadImpactData: async () => {
        const count = app.currentUser.responsesCount || 0;
        app.animateNumber('responses-count', count);
        app.animateNumber('lives-saved-count', count);

        // Days active
        if (app.currentUser.createdAt) {
            const created = app.currentUser.createdAt.toDate ? app.currentUser.createdAt.toDate() : new Date(app.currentUser.createdAt);
            const days = Math.max(1, Math.floor((Date.now() - created.getTime()) / 86400000));
            app.animateNumber('days-active-count', days);
        } else {
            document.getElementById('days-active-count').textContent = '1';
        }

        // Render badges
        const row = document.getElementById('badges-row');
        if (!row) return;
        row.innerHTML = '';
        BADGES.forEach(b => {
            const earned = count >= b.threshold;
            const item = document.createElement('div');
            item.className = `badge-item ${earned ? 'earned' : 'locked'}`;
            item.innerHTML = `<span class="badge-icon">${b.icon}</span><span>${b.label}</span>`;
            item.title = earned ? `Earned! (${b.threshold} responses)` : `Need ${b.threshold} responses`;
            row.appendChild(item);
        });
    },

    animateNumber: (id, target) => {
        const el = document.getElementById(id);
        if (!el) return;
        let current = 0;
        const step = Math.max(1, Math.floor(target / 20));
        const interval = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(interval); }
            el.textContent = current;
        }, 40);
    },

    // ========== RESPOND TO SOS (track impact) ==========
    respondToSOS: async (sosId, name, contact) => {
        app.contactDonor(name, contact);
        // Increment response count
        try {
            if (app.currentDocId) {
                await db.collection('users').doc(app.currentDocId).update({
                    responsesCount: firebase.firestore.FieldValue.increment(1)
                });
                app.currentUser.responsesCount = (app.currentUser.responsesCount || 0) + 1;
                app.loadImpactData();
            }
        } catch (e) {
            console.log('Response tracking error:', e);
        }
    },

    // ========== GPS LOCATION CAPTURE (for receivers) ==========
    captureLocation: () => {
        if (!navigator.geolocation) return;
        const statusEl = document.getElementById('location-status');
        const textEl = document.getElementById('location-status-text');
        if (statusEl) statusEl.style.display = 'flex';
        if (textEl) textEl.textContent = 'Fetching your location...';

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                app.currentUser._lat = pos.coords.latitude;
                app.currentUser._lng = pos.coords.longitude;
                if (textEl) textEl.textContent = `Location captured (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
            },
            (err) => {
                if (textEl) textEl.textContent = 'Location unavailable — SOS will use your city';
                console.log('Geolocation error:', err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    },

    // ========== THEME TOGGLE ==========
    toggleTheme: () => {
        document.body.classList.toggle('theme-blood');
        const isBlood = document.body.classList.contains('theme-blood');
        localStorage.setItem('savepulse-theme', isBlood ? 'blood' : 'dark');
        app.toast(isBlood ? 'Blood Red theme activated 🔴' : 'Default dark theme restored 🌙', 'info');
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
            const sosData = {
                receiverName: app.currentUser.name,
                receiverContact: app.currentUser.contact,
                bloodGroup: app.currentUser.bloodGroup,
                location: app.currentUser.location,
                receiverDocId: app.currentDocId,
                resolved: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Attach GPS if available
            if (app.currentUser._lat && app.currentUser._lng) {
                sosData.latitude = app.currentUser._lat;
                sosData.longitude = app.currentUser._lng;
            }

            await db.collection('sos_requests').add(sosData);
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
        app.clearCountdownTimers();
        app.clearLeafletMaps();
        app.previousSOSCount = 0;
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
