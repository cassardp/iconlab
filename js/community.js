/* ============================================
   Community — Galerie communautaire Supabase
   ============================================ */

var App = window.App || {};

/* ---- Supabase client singleton ---- */

App._supabaseClient = null;

App._getSupabase = function() {
    if (!App._supabaseClient) {
        App._supabaseClient = window.supabase.createClient(App.SUPABASE_URL, App.SUPABASE_ANON_KEY);
    }
    return App._supabaseClient;
};

/* ---- Device ID (anonymous) ---- */

App._getDeviceId = function() {
    var id = localStorage.getItem(App.STORAGE_KEYS.deviceId);
    if (!id) {
        id = 'dev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(App.STORAGE_KEYS.deviceId, id);
    }
    return id;
};

/* ---- Community state ---- */

App._communityState = {
    icons: [],
    likedIds: [],
    page: 0,
    hasMore: true,
    sort: 'recent',
    loaded: false
};

/* ---- Init ---- */

App.initCommunity = function() {
    // Charger les liked IDs depuis localStorage
    try {
        var saved = localStorage.getItem('icon-community-likes');
        if (saved) App._communityState.likedIds = JSON.parse(saved);
    } catch (e) { /* ignore */ }

    App._activeTab = 'local';
};

/* ---- Chargement des icones communautaires ---- */

App.loadCommunityIcons = function(reset) {
    if (reset) {
        App._communityState.icons = [];
        App._communityState.page = 0;
        App._communityState.hasMore = true;
    }

    var state = App._communityState;
    var sb = App._getSupabase();
    var from = state.page * App.COMMUNITY_PAGE_SIZE;
    var to = from + App.COMMUNITY_PAGE_SIZE - 1;

    var orderCol = state.sort === 'popular' ? 'likes_count' : 'created_at';

    var query = sb
        .from('shared_icons')
        .select('*, profiles:user_id(display_name, url)')
        .order(orderCol, { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

    return query.then(function(result) {
        if (result.error) {
            App.showToast('Failed to load community icons', 'error');
            return;
        }

        var data = result.data || [];
        state.hasMore = data.length === App.COMMUNITY_PAGE_SIZE;
        state.page++;

        for (var i = 0; i < data.length; i++) {
            state.icons.push(data[i]);
        }

        App._renderCommunityGallery();
        App._updateCommunityCount();
    });
};

/* ---- Rendu galerie communautaire ---- */

App._renderCommunityGallery = function() {
    var grid = document.getElementById('communityGallery');
    var empty = document.getElementById('communityEmpty');
    var loadMoreBtn = document.getElementById('communityLoadMore');
    if (!grid) return;

    grid.innerHTML = '';

    if (App._communityState.icons.length === 0) {
        if (empty) empty.style.display = '';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    if (empty) empty.style.display = 'none';

    for (var i = 0; i < App._communityState.icons.length; i++) {
        var card = App._renderCommunityCard(App._communityState.icons[i]);
        grid.appendChild(card);
    }

    lucide.createIcons({ nodes: [grid] });

    if (loadMoreBtn) {
        loadMoreBtn.style.display = App._communityState.hasMore ? '' : 'none';
    }
};

/* ---- Render une card communautaire ---- */

App._renderCommunityCard = function(icon) {
    var card = document.createElement('div');
    card.className = 'community-card';
    card.setAttribute('data-id', icon.id);

    var isLiked = App._communityState.likedIds.indexOf(icon.id) !== -1;
    var likeClass = isLiked ? ' liked' : '';
    var likeIcon = isLiked ? 'heart' : 'heart';

    var timeAgo = App._timeAgo(icon.created_at);

    // Creator info from joined profile
    var creatorHtml = '';
    var profile = icon.profiles;
    if (profile && profile.display_name) {
        var name = App.escapeHtml(profile.display_name);
        if (profile.url) {
            creatorHtml = '<span class="community-card-creator">By <a href="' + App.escapeHtml(profile.url) + '" target="_blank" rel="noopener">' + name + '</a></span>';
        } else {
            creatorHtml = '<span class="community-card-creator">By <strong>' + name + '</strong></span>';
        }
    }

    card.innerHTML = ''
        + '<div class="community-card-image">'
        +   '<img src="' + App.escapeHtml(icon.image_url) + '" alt="Community icon" loading="lazy">'
        +   '<div class="gallery-card-overlay">'
        +     '<button class="gallery-card-overlay-btn btn-copy-prompt" title="Copy enriched prompt">'
        +       '<i data-lucide="copy"></i> Prompt'
        +     '</button>'
        +     '<button class="gallery-card-overlay-btn btn-community-download" title="Download">'
        +       '<i data-lucide="download"></i>'
        +     '</button>'
        +   '</div>'
        + '</div>'
        + '<div class="gallery-card-actions">'
        +   creatorHtml
        +   '<span class="gallery-card-time">' + (creatorHtml ? ' · ' : '') + timeAgo + '</span>'
        +   '<div class="card-actions-right">'
        +     '<button class="btn-like' + likeClass + '" title="Like">'
        +       '<span class="like-count">' + (icon.likes_count || 0) + '</span>'
        +       '<i data-lucide="' + likeIcon + '"></i>'
        +     '</button>'
        +   '</div>'
        + '</div>';

    // Events
    var likeBtn = card.querySelector('.btn-like');
    likeBtn.addEventListener('click', function() {
        App._toggleLike(icon, card);
    });

    var dlBtn = card.querySelector('.btn-community-download');
    dlBtn.addEventListener('click', function() {
        App._downloadCommunityIcon(icon);
    });

    var copyPromptBtn = card.querySelector('.btn-copy-prompt');
    if (copyPromptBtn) {
        copyPromptBtn.addEventListener('click', function() {
            App.copyToClipboard(icon.enriched_prompt || icon.user_prompt || '');
        });
    }

    return card;
};

/* ---- Time ago helper ---- */

App._timeAgo = function(dateStr) {
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
    return new Date(dateStr).toLocaleDateString();
};

/* ---- Like / Unlike ---- */

App._toggleLike = function(icon, card) {
    var sb = App._getSupabase();
    var deviceId = App._getDeviceId();
    var likedIds = App._communityState.likedIds;
    var idx = likedIds.indexOf(icon.id);
    var isLiked = idx !== -1;

    var likeBtn = card.querySelector('.btn-like');
    var countSpan = card.querySelector('.like-count');

    if (isLiked) {
        // Optimistic UI : unlike
        likedIds.splice(idx, 1);
        icon.likes_count = Math.max(0, (icon.likes_count || 0) - 1);
        likeBtn.classList.remove('liked');
        countSpan.textContent = icon.likes_count;

        sb.from('likes')
            .delete()
            .eq('icon_id', icon.id)
            .eq('device_id', deviceId)
            .then(function() {
                return sb.from('shared_icons')
                    .update({ likes_count: icon.likes_count })
                    .eq('id', icon.id);
            });
    } else {
        // Optimistic UI : like
        likedIds.push(icon.id);
        icon.likes_count = (icon.likes_count || 0) + 1;
        likeBtn.classList.add('liked');
        countSpan.textContent = icon.likes_count;

        sb.from('likes')
            .insert({ icon_id: icon.id, device_id: deviceId })
            .then(function() {
                return sb.from('shared_icons')
                    .update({ likes_count: icon.likes_count })
                    .eq('id', icon.id);
            });
    }

    // Persist liked IDs
    localStorage.setItem('icon-community-likes', JSON.stringify(likedIds));
};

/* ---- Partage vers la communaute ---- */

App.shareToCommunity = function(generation) {
    return App._requireAuth().then(function() {
        // Verify profile is complete
        var profile = App._authState.profile;
        if (!profile || !profile.display_name) {
            App._showProfileModal(true);
            return Promise.reject(new Error('Profile incomplete'));
        }

        var sb = App._getSupabase();
        var es = generation.editorSettings;
        var size = (es && es.exportSize) ? es.exportSize : 1024;
        var userId = App._getCurrentUserId();

        // Determiner la couleur de fond de fallback
        var bgColor = null;
        if (es && es.bgType === 'solid') {
            bgColor = es.bgColor;
        } else if (es && es.bgType === 'gradient') {
            bgColor = null; // gere par _renderComposition
        } else if (!es || !es.layers || !es.layers.length) {
            bgColor = (generation.previewBg && generation.previewBg !== 'checkerboard')
                ? generation.previewBg
                : '#1a1a1a';
        }

        // Render la composition complete (fond + layers + transforms)
        return new Promise(function(resolve, reject) {
            App._renderComposition(generation, size, true, bgColor, function(canvas) {
                canvas.toBlob(function(blob) {
                    if (!blob) {
                        App.showToast('Failed to render image', 'error');
                        reject(new Error('toBlob failed'));
                        return;
                    }

                    // Nom de fichier unique
                    var fileName = Date.now() + '-' + Math.random().toString(36).substr(2, 6) + '.webp';

                    sb.storage
                        .from('icons')
                        .upload(fileName, blob, { contentType: 'image/webp' })
                        .then(function(result) {
                            if (result.error) {
                                App.showToast('Upload failed: ' + result.error.message, 'error');
                                reject(result.error);
                                return;
                            }

                            // Obtenir l'URL publique
                            var publicUrl = sb.storage.from('icons').getPublicUrl(fileName);
                            var imageUrl = publicUrl.data.publicUrl;

                            // Inserer dans shared_icons
                            return sb.from('shared_icons').insert({
                                image_url: imageUrl,
                                user_prompt: generation.userPrompt || null,
                                enriched_prompt: generation.enrichedPrompt || null,
                                model: generation.model || null,
                                user_id: userId
                            }).select().single();
                    })
                    .then(function(result) {
                        if (result && result.error) {
                            App.showToast('Share failed: ' + result.error.message, 'error');
                            reject(result.error);
                            return;
                        }

                        // Marquer comme partage avec references pour unshare
                        generation._sharedToCommunity = true;
                        generation._sharedId = result.data.id;
                        generation._sharedFileName = fileName;
                        App.saveGallery();

                        // Mettre a jour le bouton visuellement
                        App._updateShareButton(generation);

                        App.showToast('Shared to community!', 'success');

                        // Rafraichir la galerie communautaire si elle est chargee
                        if (App._communityState.loaded) {
                            App.loadCommunityIcons(true);
                        }

                        resolve();
                    })
                    .catch(reject);
            }, 'image/webp', 0.85);
        });
    }); // end new Promise
    }); // end _requireAuth
};

/* ---- Download community icon ---- */

/* ---- Retirer de la communaute ---- */

App.unshareToCommunity = function(generation) {
    if (!App._isAuthenticated()) {
        App.showToast('Please sign in to unshare', 'error');
        return Promise.reject(new Error('Not authenticated'));
    }

    var sb = App._getSupabase();
    var sharedId = generation._sharedId;
    var fileName = generation._sharedFileName;

    if (!sharedId) {
        return Promise.reject(new Error('No shared ID'));
    }

    // Supprimer la row dans shared_icons (cascade supprime les likes)
    return sb.from('shared_icons')
        .delete()
        .eq('id', sharedId)
        .then(function(result) {
            if (result.error) {
                App.showToast('Unshare failed: ' + result.error.message, 'error');
                return Promise.reject(result.error);
            }

            // Supprimer le fichier du storage
            if (fileName) {
                sb.storage.from('icons').remove([fileName]);
            }

            // Reset les flags
            generation._sharedToCommunity = false;
            generation._sharedId = null;
            generation._sharedFileName = null;
            App.saveGallery();

            App._updateShareButton(generation);

            App.showToast('Removed from community', 'success');

            // Rafraichir la galerie communautaire si elle est chargee
            if (App._communityState.loaded) {
                App.loadCommunityIcons(true);
            }
        });
};

/* ---- Helper : mettre a jour le bouton share visuellement ---- */

App._updateShareButton = function(generation) {
    var card = document.querySelector('.gallery-card[data-ts="' + generation.timestamp + '"]');
    if (!card) return;

    var shareBtn = card.querySelector('.btn-share');
    if (!shareBtn) return;

    var isShared = generation._sharedToCommunity;
    var icon = shareBtn.querySelector('[data-lucide]');
    if (icon) {
        icon.setAttribute('data-lucide', isShared ? 'cloud-off' : 'cloud');
        lucide.createIcons({ nodes: [shareBtn] });
    }
};

/* ---- Download community icon ---- */

App._downloadCommunityIcon = function(icon) {
    fetch(icon.image_url)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = 'community-icon-' + Date.now() + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        })
        .catch(function() {
            App.showToast('Download failed', 'error');
        });
};

/* ---- Tab switching ---- */

App.switchTab = function(tab) {
    // Si l'editeur est ouvert, le fermer d'abord
    if (App.state.editor.active) {
        App.closeEditor();
    }

    App._activeTab = tab;

    var galleryWrapper = document.getElementById('galleryWrapper');
    var communityWrapper = document.getElementById('communityWrapper');

    // Mettre a jour les boutons sidebar
    var tabLocal = document.getElementById('tabLocal');
    var tabCommunity = document.getElementById('tabCommunity');
    if (tabLocal) tabLocal.classList.toggle('active', tab === 'local');
    if (tabCommunity) tabCommunity.classList.toggle('active', tab === 'community');

    if (tab === 'local') {
        if (galleryWrapper) galleryWrapper.classList.remove('hidden');
        if (communityWrapper) communityWrapper.classList.add('hidden');
        // Restore settings panel
        document.body.classList.remove('panels-hidden');
    } else {
        if (galleryWrapper) galleryWrapper.classList.add('hidden');
        if (communityWrapper) communityWrapper.classList.remove('hidden');
        // Hide settings panel — useless in community view
        document.body.classList.add('panels-hidden');

        // Lazy load au premier acces
        if (!App._communityState.loaded) {
            App._communityState.loaded = true;
            App.loadCommunityIcons(true);
        }
    }
};

/* ---- Update community count ---- */

App._updateCommunityCount = function() {
    var countEl = document.getElementById('communityCount');
    if (countEl) {
        var count = App._communityState.icons.length;
        countEl.textContent = count + ' icon' + (count !== 1 ? 's' : '');
        if (App._communityState.hasMore) {
            countEl.textContent += '+';
        }
    }
};

/* ---- Event listeners ---- */

App.initCommunityEvents = function() {
    // Sidebar tab clicks
    var tabLocal = document.getElementById('tabLocal');
    var tabCommunity = document.getElementById('tabCommunity');
    if (tabLocal) {
        tabLocal.addEventListener('click', function() {
            App.switchTab('local');
        });
    }
    if (tabCommunity) {
        tabCommunity.addEventListener('click', function() {
            App.switchTab('community');
        });
    }

    // Sort select
    var sortSelect = document.getElementById('communitySort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            App._communityState.sort = this.value;
            App.loadCommunityIcons(true);
        });
    }

    // Load more button
    var loadMoreBtn = document.getElementById('communityLoadMore');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            App.loadCommunityIcons(false);
        });
    }
};
