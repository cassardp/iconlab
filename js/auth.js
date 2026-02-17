/* ============================================
   Auth — Magic Link authentication via Supabase
   ============================================ */

var App = window.App || {};

/* ---- Auth state ---- */

App._authState = {
    session: null,
    user: null,
    profile: null
};

/* ---- Helpers ---- */

App._getCurrentUserId = function() {
    return App._authState.user ? App._authState.user.id : null;
};

App._isAuthenticated = function() {
    return !!App._authState.session;
};

/* ---- Init auth ---- */

App.initAuth = function() {
    var sb = App._getSupabase();

    // Listen to auth state changes
    sb.auth.onAuthStateChange(function(event, session) {
        App._authState.session = session;
        App._authState.user = session ? session.user : null;

        if (session && session.user) {
            App._loadProfile().then(function(profile) {
                App._updateAuthUI();
                // Show profile modal if display_name is missing (first login)
                if (!profile || !profile.display_name) {
                    App._showProfileModal(true);
                }
            });
        } else {
            App._authState.profile = null;
            App._updateAuthUI();
        }
    });

    // Check existing session
    sb.auth.getSession().then(function(result) {
        var session = result.data.session;
        if (session) {
            App._authState.session = session;
            App._authState.user = session.user;
            App._loadProfile().then(function() {
                App._updateAuthUI();
            });
        }
    });
};

/* ---- Profile ---- */

App._loadProfile = function() {
    var userId = App._getCurrentUserId();
    if (!userId) return Promise.resolve(null);

    var sb = App._getSupabase();
    return sb.from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(function(result) {
            if (result.error) {
                App._authState.profile = null;
                return null;
            }
            App._authState.profile = result.data;
            return result.data;
        });
};

App._saveProfile = function(displayName, url) {
    var userId = App._getCurrentUserId();
    if (!userId) return Promise.reject(new Error('Not authenticated'));

    var sb = App._getSupabase();
    return sb.from('profiles')
        .upsert({
            id: userId,
            display_name: displayName,
            url: url || null,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()
        .then(function(result) {
            if (result.error) {
                App.showToast('Failed to save profile: ' + result.error.message, 'error');
                return Promise.reject(result.error);
            }
            App._authState.profile = result.data;
            App._updateAuthUI();
            return result.data;
        });
};

/* ---- Magic Link ---- */

App._sendMagicLink = function(email) {
    var sb = App._getSupabase();
    return sb.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: window.location.origin + window.location.pathname
        }
    }).then(function(result) {
        if (result.error) {
            App.showToast('Failed to send magic link: ' + result.error.message, 'error');
            return Promise.reject(result.error);
        }
        return result;
    });
};

/* ---- Logout ---- */

App._logout = function() {
    var sb = App._getSupabase();
    sb.auth.signOut().then(function() {
        App._authState.session = null;
        App._authState.user = null;
        App._authState.profile = null;
        App._updateAuthUI();
        App.showToast('Logged out', 'success');
    });
};

/* ---- Auth guard ---- */

App._requireAuth = function() {
    return new Promise(function(resolve) {
        if (App._isAuthenticated()) {
            resolve();
            return;
        }
        // Store resolve callback so login flow can call it
        App._authResolve = resolve;
        App._showLoginModal();
    });
};

/* ---- UI Updates ---- */

App._updateAuthUI = function() {
    var btn = document.getElementById('authButton');
    if (!btn) return;

    var profile = App._authState.profile;
    var isAuth = App._isAuthenticated();

    if (isAuth && profile && profile.display_name) {
        var initial = profile.display_name.charAt(0).toUpperCase();
        btn.innerHTML = '<span class="auth-avatar">' + App.escapeHtml(initial) + '</span>';
        btn.title = profile.display_name;
    } else if (isAuth) {
        btn.innerHTML = '<i data-lucide="key-round"></i>';
        btn.title = 'Complete profile';
        lucide.createIcons({ nodes: [btn] });
    } else {
        btn.innerHTML = '<i data-lucide="key-round"></i>';
        btn.title = 'Sign in';
        lucide.createIcons({ nodes: [btn] });
    }
};

/* ---- Login Modal ---- */

App._showLoginModal = function() {
    var modal = document.getElementById('loginModal');
    if (modal) {
        // Reset state
        var input = modal.querySelector('#loginEmail');
        var sendBtn = modal.querySelector('#loginSendBtn');
        var status = modal.querySelector('#loginStatus');
        if (input) input.value = '';
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Magic Link';
        }
        if (status) {
            status.textContent = '';
            status.className = 'auth-modal-status';
        }
        modal.classList.add('show');
    }
};

App._hideLoginModal = function() {
    var modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('show');
};

/* ---- Profile Modal ---- */

App._showProfileModal = function(isFirstLogin) {
    var modal = document.getElementById('profileModal');
    if (!modal) return;

    var nameInput = modal.querySelector('#profileName');
    var urlInput = modal.querySelector('#profileUrl');
    var profile = App._authState.profile;

    if (nameInput) nameInput.value = (profile && profile.display_name) || '';
    if (urlInput) urlInput.value = (profile && profile.url) || '';

    // If first login, hide close button
    var closeBtn = modal.querySelector('#profileClose');
    if (closeBtn) closeBtn.style.display = isFirstLogin ? 'none' : '';

    modal.classList.add('show');
};

App._hideProfileModal = function() {
    var modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('show');
};

/* ---- Auth Menu (dropdown) ---- */

App._showAuthMenu = function(anchorEl) {
    // Remove existing menu
    App._hideAuthMenu();

    var menu = document.createElement('div');
    menu.className = 'auth-dropdown';
    menu.id = 'authDropdown';

    var profile = App._authState.profile;
    var displayName = (profile && profile.display_name) || 'User';

    menu.innerHTML = ''
        + '<div class="auth-dropdown-header">' + App.escapeHtml(displayName) + '</div>'
        + '<button class="auth-dropdown-item" id="authMenuProfile">'
        +   '<i data-lucide="user-pen"></i> Edit Profile'
        + '</button>'
        + '<button class="auth-dropdown-item" id="authMenuLogout">'
        +   '<i data-lucide="log-out"></i> Log out'
        + '</button>';

    document.body.appendChild(menu);
    lucide.createIcons({ nodes: [menu] });

    // Position near anchor
    var rect = anchorEl.getBoundingClientRect();
    menu.style.left = (rect.right + 8) + 'px';
    menu.style.bottom = (window.innerHeight - rect.bottom) + 'px';

    // Event listeners
    menu.querySelector('#authMenuProfile').addEventListener('click', function() {
        App._hideAuthMenu();
        App._showProfileModal(false);
    });
    menu.querySelector('#authMenuLogout').addEventListener('click', function() {
        App._hideAuthMenu();
        App._logout();
    });

    // Close on outside click
    setTimeout(function() {
        document.addEventListener('click', App._authMenuOutsideClick);
    }, 0);
};

App._hideAuthMenu = function() {
    var existing = document.getElementById('authDropdown');
    if (existing) existing.remove();
    document.removeEventListener('click', App._authMenuOutsideClick);
};

App._authMenuOutsideClick = function(e) {
    var menu = document.getElementById('authDropdown');
    var btn = document.getElementById('authButton');
    if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        App._hideAuthMenu();
    }
};

/* ---- Event Listeners ---- */

App.initAuthEvents = function() {
    // Auth button (sidebar)
    var authBtn = document.getElementById('authButton');
    if (authBtn) {
        authBtn.addEventListener('click', function() {
            if (App._isAuthenticated()) {
                App._showAuthMenu(authBtn);
            } else {
                App._showLoginModal();
            }
        });
    }

    // Login modal
    var loginClose = document.getElementById('loginClose');
    if (loginClose) {
        loginClose.addEventListener('click', function() {
            App._hideLoginModal();
            App._authResolve = null;
        });
    }

    var loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                App._hideLoginModal();
                App._authResolve = null;
            }
        });
    }

    var loginSendBtn = document.getElementById('loginSendBtn');
    var loginEmail = document.getElementById('loginEmail');

    if (loginSendBtn && loginEmail) {
        loginSendBtn.addEventListener('click', function() {
            var email = loginEmail.value.trim();
            if (!email) return;

            loginSendBtn.disabled = true;
            loginSendBtn.textContent = 'Sending...';

            App._sendMagicLink(email).then(function() {
                var status = document.getElementById('loginStatus');
                if (status) {
                    status.textContent = 'Check your email for the magic link!';
                    status.className = 'auth-modal-status success';
                }
                loginSendBtn.textContent = 'Sent!';
            }).catch(function() {
                loginSendBtn.disabled = false;
                loginSendBtn.textContent = 'Send Magic Link';
            });
        });

        loginEmail.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginSendBtn.click();
            }
        });
    }

    // Profile modal
    var profileClose = document.getElementById('profileClose');
    if (profileClose) {
        profileClose.addEventListener('click', function() {
            App._hideProfileModal();
        });
    }

    var profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                // Only close if profile is complete
                var profile = App._authState.profile;
                if (profile && profile.display_name) {
                    App._hideProfileModal();
                }
            }
        });
    }

    var profileSaveBtn = document.getElementById('profileSaveBtn');
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', function() {
            var nameInput = document.getElementById('profileName');
            var urlInput = document.getElementById('profileUrl');
            var name = nameInput ? nameInput.value.trim() : '';
            var url = urlInput ? urlInput.value.trim() : '';

            if (!name) {
                App.showToast('Display name is required', 'error');
                return;
            }

            profileSaveBtn.disabled = true;
            profileSaveBtn.textContent = 'Saving...';

            App._saveProfile(name, url).then(function() {
                App._hideProfileModal();
                App.showToast('Profile saved', 'success');

                // If this was triggered by _requireAuth, resolve
                if (App._authResolve) {
                    App._authResolve();
                    App._authResolve = null;
                }
            }).catch(function() {
                // Error already shown via toast
            }).finally(function() {
                profileSaveBtn.disabled = false;
                profileSaveBtn.textContent = 'Save';
            });
        });
    }

    // Listen for auth state change to resolve _requireAuth
    var sb = App._getSupabase();
    sb.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session) {
            App._hideLoginModal();
            // _authResolve will be called after profile modal if needed
            // If profile is already complete, resolve immediately
            App._loadProfile().then(function(profile) {
                if (profile && profile.display_name && App._authResolve) {
                    App._authResolve();
                    App._authResolve = null;
                }
            });
        }
    });
};
