// ==========================================
// LIMAUSONG - MUSIC PLAYER
// ==========================================

// ==========================================
// ELEMENT
// ==========================================

const audioPlayer = document.getElementById("audioPlayer");

const songList = document.getElementById("songList");
const noResults = document.getElementById("noResults");

const playerTitle = document.getElementById("songTitle");
const playerArtist = document.getElementById("songArtist");
const playerCover = document.getElementById("playerCover");

const playBtn = document.getElementById("playButton");
const prevBtn = document.getElementById("previousButton");
const nextBtn = document.getElementById("nextButton");

const progressBar = document.getElementById("progressBar");
const currentTimeElement = document.getElementById("currentTime");
const durationElement = document.getElementById("duration");

const searchOverlay = document.getElementById("searchOverlay");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const mobileMenuToggle = document.getElementById("menuButton")
    || document.getElementById("mobileMenuToggle");
const mobileMenu = document.getElementById("mobileMenu");


// ==========================================
// DATA LAGU
// ==========================================

const songs = [
    // Tambahkan lagu baru di sini.
    // Format:
    // {
    //     id: 2,
    //     title: "Judul Lagu",
    //     artist: "Nama Artis",
    //     genre: "Pop",
    //     src: "assets/music/nama-file.mp3", // atau link YouTube
    //     cover: "song-cover-1"
    // },

    {
        id: 1,
        title: "Style",
        artist: "Taylor Swift",
        genre: "Pop",
        src: "assets/music/lagu_baru.mp3",
        cover: "song-cover-1"
    },
    {
        id: 2,
        title: "Loading YouTube Track...",
        artist: "YouTube",
        genre: "Pop",
        src: "https://youtu.be/WBo83JulcUA?si=KZW12ftqy--dJeOv",
        cover: "song-cover-2"
    }
];


// ==========================================
// YOUTUBE PLAYER INTEGRATION
// ==========================================

let ytPlayer = null;
let ytReady = false;
let pendingYouTubeLoad = null;
let activeMode = "audio"; // "audio" | "youtube"

function extractYouTubeId(url) {
    if (!url || typeof url !== "string") return null;
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
}

function fetchYouTubeMetadata() {
    songs.forEach((song, idx) => {
        const ytId = extractYouTubeId(song.src);
        if (!ytId) return;

        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`;
        fetch(oembedUrl)
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (!data) return;
                if (data.title) {
                    song.title = data.title;
                }
                if (data.author_name) {
                    song.artist = data.author_name.replace(/\s*-\s*Topic$/i, "");
                }
                renderSongs(songs);
                if (currentSongIndex === idx) {
                    if (playerTitle) playerTitle.textContent = song.title;
                    if (playerArtist) playerArtist.textContent = song.artist;
                }
            })
            .catch(() => {});
    });
}

function initYouTubeAPI() {
    if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
        return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
    if (!document.getElementById("ytPlayer")) return;

    ytPlayer = new YT.Player("ytPlayer", {
        height: "112",
        width: "200",
        playerVars: {
            playsinline: 1,
            controls: 1,
            disablekb: 1
        },
        events: {
            onReady: () => {
                ytReady = true;
                if (pendingYouTubeLoad) {
                    const { ytId, autoPlay } = pendingYouTubeLoad;
                    pendingYouTubeLoad = null;
                    if (autoPlay) {
                        ytPlayer.loadVideoById(ytId);
                    } else {
                        ytPlayer.cueVideoById(ytId);
                    }
                }
            },
            onStateChange: event => {
                if (activeMode !== "youtube") return;

                if (event.data === YT.PlayerState.PLAYING) {
                    isPlaying = true;
                    updatePlayButton();
                    updateActiveSong();

                    const dur = ytPlayer.getDuration();
                    if (dur && durationElement) {
                        durationElement.textContent = formatTime(dur);
                    }

                    const videoData = ytPlayer.getVideoData && ytPlayer.getVideoData();
                    const currentSong = songs[currentSongIndex];
                    if (
                        videoData &&
                        videoData.title &&
                        currentSong &&
                        currentSong.title === "Loading YouTube Track..."
                    ) {
                        currentSong.title = videoData.title;
                        if (videoData.author) {
                            currentSong.artist = videoData.author.replace(/\s*-\s*Topic$/i, "");
                        }
                        if (playerTitle) playerTitle.textContent = currentSong.title;
                        if (playerArtist) playerArtist.textContent = currentSong.artist;
                        renderSongs(songs);
                    }
                } else if (event.data === YT.PlayerState.PAUSED) {
                    isPlaying = false;
                    updatePlayButton();
                } else if (event.data === YT.PlayerState.ENDED) {
                    if (isRepeat) {
                        ytPlayer.seekTo(0, true);
                        ytPlayer.playVideo();
                    } else {
                        nextSong();
                    }
                }
            }
        }
    });
};

setInterval(() => {
    if (
        activeMode === "youtube" &&
        ytReady &&
        ytPlayer &&
        isPlaying &&
        typeof ytPlayer.getCurrentTime === "function"
    ) {
        const cur = ytPlayer.getCurrentTime() || 0;
        const dur = ytPlayer.getDuration() || 0;
        if (dur > 0) {
            const progress = (cur / dur) * 100;
            const progressFill = document.getElementById("progress");
            if (progressFill) {
                progressFill.style.width = progress + "%";
            }
            if (currentTimeElement) {
                currentTimeElement.textContent = formatTime(cur);
            }
            if (durationElement) {
                durationElement.textContent = formatTime(dur);
            }
        }
    }
}, 250);


// ==========================================
// PLAYER STATE
// ==========================================

let currentSongIndex = 0;
let isPlaying = false;
let isRepeat = false;


// ==========================================
// REPEAT BUTTON
// ==========================================

// Kalau tombol repeat belum ada di HTML,
// JavaScript akan membuatnya otomatis.

let repeatBtn = document.getElementById("repeatBtn");

if (!repeatBtn && document.querySelector(".player-controls")) {

    repeatBtn = document.createElement("button");

    repeatBtn.id = "repeatBtn";
    repeatBtn.className = "player-btn repeat-btn";
    repeatBtn.type = "button";

    repeatBtn.innerHTML = "🔁";
    repeatBtn.title = "Repeat";

    const controls = document.querySelector(".player-controls");

    controls.appendChild(repeatBtn);
}


// ==========================================
// RENDER SONG LIST
// ==========================================

function renderSongs(songArray = songs) {

    if (!songList) return;

    songList.innerHTML = "";

    if (songArray.length === 0) {

        if (noResults) {
            noResults.style.display = "block";
        }

        return;
    }

    if (noResults) {
        noResults.style.display = "none";
    }

    songArray.forEach((song, index) => {

        const originalIndex = songs.findIndex(
            item => item.id === song.id
        );

        const songItem = document.createElement("div");

        songItem.className = "song-item";

        songItem.dataset.index = originalIndex;

        songItem.innerHTML = `
            <div class="song-number">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <div class="playing-bars">
                    <span></span><span></span><span></span>
                </div>
                <div class="song-play-hover">▶</div>
            </div>

            <div class="song-cover ${song.cover}">
                <span>♪</span>
            </div>

            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>

            <div class="song-artist-col">${song.artist}</div>

            <span class="song-genre">${song.genre}</span>

            <div class="song-actions-cell">
                ${
                    song.isCustom
                        ? `<button
                            class="song-delete-btn"
                            type="button"
                            data-delete-id="${song.id}"
                            title="Hapus lagu"
                            aria-label="Hapus ${song.title}"
                        >×</button>`
                        : ""
                }
                <button
                    class="song-play"
                    type="button"
                    aria-label="Play ${song.title}"
                >
                    ▶
                </button>
            </div>
        `;

        const deleteBtn = songItem.querySelector(".song-delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", e => {
                e.stopPropagation();
                removeCustomSong(song.id);
            });
        }

        songItem.addEventListener("click", () => {

            loadSong(originalIndex, true);

        });

        songList.appendChild(songItem);
    });

    updateActiveSong();
}


// ==========================================
// LOAD SONG
// ==========================================

function loadSong(index, autoPlay = false) {

    if (!songs[index]) return;

    currentSongIndex = index;

    const song = songs[currentSongIndex];
    const ytId = extractYouTubeId(song.src);

    if (audioPlayer) {
        audioPlayer.pause();
    }
    if (ytReady && ytPlayer && typeof ytPlayer.stopVideo === "function") {
        ytPlayer.stopVideo();
    }

    const ytContainer = document.getElementById("ytPlayerContainer");

    if (ytId) {
        activeMode = "youtube";
        if (ytContainer) ytContainer.classList.add("active");
        if (audioPlayer) {
            audioPlayer.removeAttribute("src");
        }
        if (ytReady && ytPlayer && typeof ytPlayer.loadVideoById === "function") {
            if (autoPlay) {
                ytPlayer.loadVideoById(ytId);
            } else {
                ytPlayer.cueVideoById(ytId);
            }
        } else {
            pendingYouTubeLoad = { ytId, autoPlay };
        }
    } else {
        activeMode = "audio";
        if (ytContainer) ytContainer.classList.remove("active");
        audioPlayer.src = song.src;
        audioPlayer.load();
    }

    if (playerTitle) {
        playerTitle.textContent = song.title;
    }

    if (playerArtist) {
        playerArtist.textContent = song.artist;
    }

    if (playerCover) {

        playerCover.className = `player-cover ${song.cover}`;

        playerCover.innerHTML = "♪";
    }

    if (currentTimeElement) {
        currentTimeElement.textContent = "0:00";
    }

    if (durationElement) {
        durationElement.textContent = "0:00";
    }

    if (progressBar) {
        const progressFill = document.getElementById("progress");
        if (progressFill) {
            progressFill.style.width = "0%";
        }
    }

    updateActiveSong();

    if (autoPlay) {

        playSong();

    } else {

        isPlaying = false;
        updatePlayButton();

    }
}


// ==========================================
// PLAY SONG
// ==========================================

function playSong() {

    if (activeMode === "youtube") {
        if (ytReady && ytPlayer && typeof ytPlayer.playVideo === "function") {
            ytPlayer.playVideo();
            isPlaying = true;
            updatePlayButton();
            updateActiveSong();
        }
        return;
    }

    if (!audioPlayer) return;

    audioPlayer
        .play()
        .then(() => {

            isPlaying = true;

            updatePlayButton();

            updateActiveSong();

        })
        .catch(error => {

            console.log("Audio tidak dapat diputar:", error);

            isPlaying = false;

            updatePlayButton();

            alert(
                "Lagu tidak dapat diputar.\n\n" +
                "Pastikan file MP3 berada di folder:\n" +
                "assets/music/"
            );

        });
}


// ==========================================
// PAUSE SONG
// ==========================================

function pauseSong() {

    if (activeMode === "youtube") {
        if (ytReady && ytPlayer && typeof ytPlayer.pauseVideo === "function") {
            ytPlayer.pauseVideo();
        }
        isPlaying = false;
        updatePlayButton();
        return;
    }

    if (!audioPlayer) return;

    audioPlayer.pause();

    isPlaying = false;

    updatePlayButton();
}


// ==========================================
// PLAY / PAUSE
// ==========================================

if (playBtn) {

    playBtn.addEventListener("click", () => {

        if (activeMode === "audio" && !audioPlayer.src) {

            loadSong(0, true);

            return;
        }

        if (isPlaying) {

            pauseSong();

        } else {

            playSong();

        }

    });
}


// ==========================================
// UPDATE PLAY BUTTON
// ==========================================

function updatePlayButton() {

    if (!playBtn) return;

    if (isPlaying) {

        playBtn.innerHTML = "⏸";

        playBtn.setAttribute("aria-label", "Pause");

    } else {

        playBtn.innerHTML = "▶";

        playBtn.setAttribute("aria-label", "Play");

    }
}


// ==========================================
// NEXT SONG
// ==========================================

function nextSong() {

    currentSongIndex++;

    if (currentSongIndex >= songs.length) {

        currentSongIndex = 0;

    }

    loadSong(currentSongIndex, true);
}


if (nextBtn) {

    nextBtn.addEventListener("click", nextSong);

}


// ==========================================
// PREVIOUS SONG
// ==========================================

function previousSong() {

    currentSongIndex--;

    if (currentSongIndex < 0) {

        currentSongIndex = songs.length - 1;

    }

    loadSong(currentSongIndex, true);
}


if (prevBtn) {

    prevBtn.addEventListener("click", previousSong);

}


// ==========================================
// REPEAT
// ==========================================

if (repeatBtn) {

    repeatBtn.addEventListener("click", () => {

        isRepeat = !isRepeat;

        updateRepeatButton();

    });

}


// ==========================================
// UPDATE REPEAT BUTTON
// ==========================================

function updateRepeatButton() {

    if (!repeatBtn) return;

    if (isRepeat) {

        repeatBtn.classList.add("active");

        repeatBtn.innerHTML = "🔁";

        repeatBtn.title = "Repeat ON";

        repeatBtn.setAttribute(
            "aria-label",
            "Repeat ON"
        );

    } else {

        repeatBtn.classList.remove("active");

        repeatBtn.innerHTML = "🔁";

        repeatBtn.title = "Repeat OFF";

        repeatBtn.setAttribute(
            "aria-label",
            "Repeat OFF"
        );
    }
}


// ==========================================
// SONG ENDED
// ==========================================

if (audioPlayer) {

    audioPlayer.addEventListener("ended", () => {

        if (isRepeat) {

            // Ulangi lagu yang sama
            audioPlayer.currentTime = 0;

            playSong();

        } else {

            // Lanjut ke lagu berikutnya
            nextSong();

        }

    });

}


// ==========================================
// UPDATE PROGRESS
// ==========================================

if (audioPlayer) {

    audioPlayer.addEventListener("timeupdate", () => {

        if (!audioPlayer.duration) return;

        const progress =
            (audioPlayer.currentTime / audioPlayer.duration) * 100;

        if (progressBar) {

            const progressFill = document.getElementById("progress");
            if (progressFill) {
                progressFill.style.width = progress + "%";
            }

        }

        if (currentTimeElement) {

            currentTimeElement.textContent =
                formatTime(audioPlayer.currentTime);

        }

    });

}


// ==========================================
// AUDIO METADATA
// ==========================================

if (audioPlayer) {

    audioPlayer.addEventListener(
        "loadedmetadata",
        () => {

            if (durationElement) {

                durationElement.textContent =
                    formatTime(audioPlayer.duration);

            }

        }
    );

}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(seconds) {

    if (!seconds || isNaN(seconds)) {

        return "0:00";

    }

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        Math.floor(seconds % 60);

    return `${minutes}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}


// ==========================================
// SEEK / PROGRESS BAR
// ==========================================

if (progressBar) {

    progressBar.addEventListener("click", (e) => {

        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;

        if (activeMode === "youtube") {
            if (!ytReady || !ytPlayer || typeof ytPlayer.getDuration !== "function") return;
            const dur = ytPlayer.getDuration();
            if (!dur) return;
            ytPlayer.seekTo(percentage * dur, true);
            return;
        }

        if (!audioPlayer.duration) return;

        audioPlayer.currentTime = percentage * audioPlayer.duration;

    });

}


// ==========================================
// SEARCH
// ==========================================

function searchSongs(keyword) {

    const query =
        keyword
            .trim()
            .toLowerCase();

    if (!query) {

        return songs;

    }

    return songs.filter(song => {

        return (
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            song.genre.toLowerCase().includes(query)
        );

    });

}


// ==========================================
// RENDER SEARCH RESULTS
// ==========================================

function renderSearchResults(results) {

    const searchResultsList = document.getElementById("searchResults");
    const searchEmpty = document.getElementById("searchEmpty");
    const searchCount = document.getElementById("searchCount");

    if (!searchResultsList) return;

    searchResultsList.innerHTML = "";

    if (results.length === 0) {

        if (searchEmpty) searchEmpty.style.display = "block";
        searchResultsList.style.display = "none";

        if (searchCount) {
            searchCount.textContent = "Tidak ada hasil";
        }

        return;
    }

    if (searchEmpty) searchEmpty.style.display = "none";
    searchResultsList.style.display = "";

    if (searchCount) {
        searchCount.textContent =
            results.length === songs.length
                ? `Menampilkan semua ${results.length} lagu`
                : `${results.length} lagu ditemukan`;
    }

    results.forEach((song, index) => {

        const originalIndex =
            songs.findIndex(
                item => item.id === song.id
            );

        const resultItem =
            document.createElement("div");

        resultItem.className =
            "search-result-item";

        resultItem.style.animationDelay = `${index * 0.04}s`;

        resultItem.innerHTML = `
            <div class="result-number">
                <span>${String(index + 1).padStart(2, "0")}</span>
                <div class="result-play-hover">▶</div>
            </div>

            <div class="search-result-cover ${song.cover}">
                ♪
            </div>

            <div class="search-result-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
            </div>

            <span class="result-genre-badge">${song.genre}</span>

            <button
                type="button"
                class="search-result-play"
                aria-label="Play ${song.title}"
            >
                ▶
            </button>
        `;

        resultItem.addEventListener(
            "click",
            () => {

                loadSong(originalIndex, true);

                closeSearch();

                setTimeout(() => {

                    const songsSection =
                        document.getElementById("songs");

                    if (songsSection) {

                        songsSection.scrollIntoView({
                            behavior: "smooth"
                        });

                    }

                }, 200);

            }
        );

        searchResultsList.appendChild(resultItem);

    });

}


// ==========================================
// SEARCH INPUT (overlay)
// ==========================================

let activeFilter = "all";

function applySearchAndFilter() {

    const query = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    let results = songs;

    // Apply genre filter
    if (activeFilter !== "all") {
        results = results.filter(song =>
            song.genre.toLowerCase() === activeFilter.toLowerCase()
        );
    }

    // Apply text search
    if (query) {
        results = results.filter(song =>
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            song.genre.toLowerCase().includes(query)
        );
    }

    renderSearchResults(results);
}


// ==========================================
// OPEN SEARCH
// ==========================================

function openSearch() {

    if (!searchOverlay) return;

    searchOverlay.classList.add("active");
    document.body.classList.add("search-open");

    // Reset state
    activeFilter = "all";
    document.querySelectorAll(".filter-pill").forEach(p => {
        p.classList.remove("active");
        if (p.dataset.filter === "all") p.classList.add("active");
    });

    if (searchInput) {
        searchInput.value = "";
    }

    const searchClearBtn = document.getElementById("searchClearBtn");
    if (searchClearBtn) searchClearBtn.style.display = "none";

    // Render all songs on open
    applySearchAndFilter();

    if (searchInput) {
        setTimeout(() => {
            searchInput.focus();
        }, 150);
    }

}


// ==========================================
// CLOSE SEARCH
// ==========================================

function closeSearch() {

    if (!searchOverlay) return;

    searchOverlay.classList.remove("active");
    document.body.classList.remove("search-open");

}


// ==========================================
// SEARCH BUTTON (navbar)
// ==========================================

const searchButtonEl = document.getElementById("searchButton");
if (searchButtonEl) {
    searchButtonEl.addEventListener("click", openSearch);
}

// Legacy selector fallback
const searchButtons =
    document.querySelectorAll(
        '[data-search], .search-btn, .nav-search'
    );

searchButtons.forEach(button => {
    button.addEventListener("click", openSearch);
});


// ==========================================
// SEARCH INPUT EVENT (overlay)
// ==========================================

if (searchInput) {
    searchInput.addEventListener("input", () => {
        applySearchAndFilter();
        const searchClearBtn = document.getElementById("searchClearBtn");
        if (searchClearBtn) {
            searchClearBtn.style.display =
                searchInput.value ? "flex" : "none";
        }
    });
}


// ==========================================
// CLEAR SEARCH BUTTON
// ==========================================

const searchClearBtn = document.getElementById("searchClearBtn");
if (searchClearBtn) {
    searchClearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        searchClearBtn.style.display = "none";
        applySearchAndFilter();
        if (searchInput) searchInput.focus();
    });
}


// ==========================================
// GENRE FILTER PILLS
// ==========================================

document.querySelectorAll(".filter-pill").forEach(pill => {

    pill.addEventListener("click", () => {

        document.querySelectorAll(".filter-pill").forEach(p =>
            p.classList.remove("active")
        );

        pill.classList.add("active");

        activeFilter = pill.dataset.filter || "all";

        applySearchAndFilter();

    });

});


// ==========================================
// PLAYLIST INLINE SEARCH
// ==========================================

const playlistSearchInput = document.getElementById("playlistSearchInput");

if (playlistSearchInput) {

    playlistSearchInput.addEventListener("input", () => {

        const query = playlistSearchInput.value.trim().toLowerCase();

        if (!query) {
            renderSongs(songs);
            return;
        }

        const filtered = songs.filter(song =>
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query) ||
            song.genre.toLowerCase().includes(query)
        );

        renderSongs(filtered);

    });

}


// ==========================================
// SHOW ALL SONGS BUTTON
// ==========================================

const showAllSongsBtn = document.getElementById("showAllSongs");
if (showAllSongsBtn) {
    showAllSongsBtn.addEventListener("click", () => {
        renderSongs(songs);
        if (playlistSearchInput) playlistSearchInput.value = "";
    });
}


// ==========================================
// CLOSE SEARCH BUTTON
// ==========================================

const closeSearchBtn =
    document.getElementById("closeSearch");

if (closeSearchBtn) {

    closeSearchBtn.addEventListener(
        "click",
        closeSearch
    );

}


// ==========================================
// ESCAPE CLOSE SEARCH
// ==========================================

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeSearch();
            closeAddSongModalFn();

        }

        const activeTag = document.activeElement
            ? document.activeElement.tagName
            : "";
        const isTyping =
            activeTag === "INPUT" ||
            activeTag === "TEXTAREA" ||
            activeTag === "SELECT";

        // Space untuk Play/Pause
        if (event.code === "Space" && !isTyping) {

            event.preventDefault();

            if (isPlaying) {

                pauseSong();

            } else {

                playSong();

            }

        }

        // Arrow Right = Next
        if (event.code === "ArrowRight" && !isTyping) {

            nextSong();

        }

        // Arrow Left = Previous
        if (event.code === "ArrowLeft" && !isTyping) {

            previousSong();

        }

    }
);


// ==========================================
// MOBILE MENU
// ==========================================

if (mobileMenuToggle && mobileMenu) {

    mobileMenuToggle.addEventListener(
        "click",
        () => {

            mobileMenu.classList.toggle("active");

        }
    );

}


// ==========================================
// CLOSE MOBILE MENU
// ==========================================

const mobileLinks =
    document.querySelectorAll(
        "#mobileMenu a"
    );

mobileLinks.forEach(link => {

    link.addEventListener(
        "click",
        () => {

            if (mobileMenu) {

                mobileMenu.classList.remove(
                    "active"
                );

            }

        }
    );

});


// ==========================================
// MOOD FILTER
// ==========================================

const moodCards =
    document.querySelectorAll(
        "[data-genre]"
    );

moodCards.forEach(card => {

    card.addEventListener(
        "click",
        () => {

            const genre =
                card.dataset.genre;

            if (!genre) return;

            const filteredSongs =
                songs.filter(song =>
                    song.genre.toLowerCase() ===
                    genre.toLowerCase()
                );

            renderSongs(filteredSongs);

            const songsSection =
                document.getElementById("songs");

            if (songsSection) {

                songsSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

});


// ==========================================
// SEE ALL
// ==========================================

const seeAllButtons =
    document.querySelectorAll(
        ".see-all"
    );

seeAllButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            renderSongs(songs);

        }
    );

});


// ==========================================
// UPDATE ACTIVE SONG
// ==========================================

function updateActiveSong() {

    if (!songList) return;

    const songItems =
        songList.querySelectorAll(
            ".song-item"
        );

    songItems.forEach(item => {

        const index =
            Number(item.dataset.index);

        if (index === currentSongIndex) {

            item.classList.add("playing");

        } else {

            item.classList.remove("playing");

        }

    });

}


// ==========================================
// START LISTENING BUTTON
// ==========================================

const startListening =
    document.getElementById(
        "startListening"
    );

if (startListening) {

    startListening.addEventListener(
        "click",
        () => {

            loadSong(0, true);

            const songsSection =
                document.getElementById("songs");

            if (songsSection) {

                songsSection.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


// ==========================================
// HERO PLAY BUTTON
// ==========================================

const heroPlayBtn =
    document.getElementById(
        "heroPlayBtn"
    );

if (heroPlayBtn) {

    heroPlayBtn.addEventListener(
        "click",
        () => {

            loadSong(0, true);

        }
    );

}


// ==========================================
// SEARCH OVERLAY CLICK OUTSIDE
// ==========================================

if (searchOverlay) {

    searchOverlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                searchOverlay
            ) {

                closeSearch();

            }

        }
    );

}


// ==========================================
// ADD SONG MODAL & INDEXEDDB STORAGE
// ==========================================

const DB_NAME = "limausong_db";
const DB_VERSION = 1;
const STORE_NAME = "custom_songs";

function openSongDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error("IndexedDB tidak didukung"));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e.target.error);
    });
}

async function saveCustomSongToDB(songRecord) {
    const db = await openSongDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(songRecord);
        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e.target.error);
    });
}

async function loadCustomSongsFromDB() {
    try {
        const db = await openSongDB();
        const records = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = e => reject(e.target.error);
        });

        records.forEach(record => {
            if (songs.some(s => s.id === record.id)) return;
            let srcUrl = record.src;
            if (record.audioBlob instanceof Blob) {
                srcUrl = URL.createObjectURL(record.audioBlob);
            }
            songs.push({
                id: record.id,
                title: record.title,
                artist: record.artist,
                genre: record.genre,
                src: srcUrl,
                cover: record.cover || "song-cover-3",
                isCustom: true
            });
        });

        renderSongs(songs);
        fetchYouTubeMetadata();
    } catch (err) {
        console.warn("Gagal memuat lagu dari IndexedDB:", err);
    }
}

async function removeCustomSong(songId) {
    try {
        const db = await openSongDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).delete(songId);
            tx.oncomplete = () => resolve();
            tx.onerror = e => reject(e.target.error);
        });
    } catch (err) {
        console.warn("Gagal menghapus lagu dari IndexedDB:", err);
    }

    const idx = songs.findIndex(s => s.id === songId);
    if (idx !== -1) {
        songs.splice(idx, 1);
        if (currentSongIndex >= songs.length) {
            currentSongIndex = Math.max(0, songs.length - 1);
        }
        renderSongs(songs);
    }
}

const addSongOverlay = document.getElementById("addSongOverlay");
const openAddSongModalBtn = document.getElementById("openAddSongModal");
const closeAddSongModalBtn = document.getElementById("closeAddSongModal");
const addSongForm = document.getElementById("addSongForm");
const songFileInput = document.getElementById("songFileInput");
const songYtInput = document.getElementById("songYtInput");
const songTitleInput = document.getElementById("songTitleInput");
const songArtistInput = document.getElementById("songArtistInput");
const songGenreInput = document.getElementById("songGenreInput");
const songCoverInput = document.getElementById("songCoverInput");
const fileSourceGroup = document.getElementById("fileSourceGroup");
const ytSourceGroup = document.getElementById("ytSourceGroup");
const ytFetchHint = document.getElementById("ytFetchHint");

let selectedSourceType = "file";

function openAddSongModalFn() {
    if (!addSongOverlay) return;
    addSongOverlay.classList.add("active");
    document.body.classList.add("search-open");
}

function closeAddSongModalFn() {
    if (!addSongOverlay) return;
    addSongOverlay.classList.remove("active");
    document.body.classList.remove("search-open");
}

if (openAddSongModalBtn) {
    openAddSongModalBtn.addEventListener("click", openAddSongModalFn);
}

if (closeAddSongModalBtn) {
    closeAddSongModalBtn.addEventListener("click", closeAddSongModalFn);
}

if (addSongOverlay) {
    addSongOverlay.addEventListener("click", e => {
        if (e.target === addSongOverlay) {
            closeAddSongModalFn();
        }
    });
}

document.querySelectorAll(".add-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".add-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        selectedSourceType = tab.dataset.source || "file";

        if (selectedSourceType === "file") {
            if (fileSourceGroup) fileSourceGroup.style.display = "flex";
            if (ytSourceGroup) ytSourceGroup.style.display = "none";
        } else {
            if (fileSourceGroup) fileSourceGroup.style.display = "none";
            if (ytSourceGroup) ytSourceGroup.style.display = "flex";
        }
    });
});

if (songFileInput) {
    songFileInput.addEventListener("change", () => {
        const file = songFileInput.files && songFileInput.files[0];
        if (!file) return;
        const rawName = file.name.replace(/\.[^/.]+$/, "");
        if (rawName.includes(" - ")) {
            const [artistPart, ...titleParts] = rawName.split(" - ");
            if (songArtistInput && !songArtistInput.value) {
                songArtistInput.value = artistPart.trim();
            }
            if (songTitleInput && !songTitleInput.value) {
                songTitleInput.value = titleParts.join(" - ").trim();
            }
        } else if (songTitleInput && !songTitleInput.value) {
            songTitleInput.value = rawName;
        }
    });
}

if (songYtInput) {
    songYtInput.addEventListener("input", () => {
        const ytId = extractYouTubeId(songYtInput.value.trim());
        if (!ytId) return;
        if (ytFetchHint) {
            ytFetchHint.textContent = "Mengambil info lagu dari YouTube...";
        }
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`)
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (!data) return;
                if (data.title && songTitleInput && !songTitleInput.value) {
                    songTitleInput.value = data.title;
                }
                if (data.author_name && songArtistInput && !songArtistInput.value) {
                    songArtistInput.value = data.author_name.replace(/\s*-\s*Topic$/i, "");
                }
                if (ytFetchHint) {
                    ytFetchHint.textContent = "Judul & artis berhasil diambil otomatis!";
                }
            })
            .catch(() => {
                if (ytFetchHint) {
                    ytFetchHint.textContent = "Isi judul & artis secara manual.";
                }
            });
    });
}

if (addSongForm) {
    addSongForm.addEventListener("submit", async e => {
        e.preventDefault();

        const title = songTitleInput ? songTitleInput.value.trim() : "";
        const artist = songArtistInput ? songArtistInput.value.trim() : "";
        const genre = songGenreInput ? songGenreInput.value : "Pop";
        const cover = songCoverInput ? songCoverInput.value : "song-cover-3";

        if (!title || !artist) {
            alert("Judul lagu dan nama artis wajib diisi.");
            return;
        }

        const newId = Date.now();

        if (selectedSourceType === "file") {
            const file = songFileInput && songFileInput.files && songFileInput.files[0];
            if (!file) {
                alert("Pilih file audio (MP3/WAV) terlebih dahulu.");
                return;
            }

            const blobUrl = URL.createObjectURL(file);
            const record = {
                id: newId,
                title,
                artist,
                genre,
                cover,
                audioBlob: file,
                src: ""
            };

            await saveCustomSongToDB(record);

            songs.push({
                id: newId,
                title,
                artist,
                genre,
                src: blobUrl,
                cover,
                isCustom: true
            });
        } else {
            const ytUrl = songYtInput ? songYtInput.value.trim() : "";
            const ytId = extractYouTubeId(ytUrl);
            if (!ytId) {
                alert("Masukkan link YouTube yang valid (contoh: https://youtu.be/WBo83JulcUA).");
                return;
            }

            const record = {
                id: newId,
                title,
                artist,
                genre,
                cover,
                src: ytUrl
            };

            await saveCustomSongToDB(record);

            songs.push({
                id: newId,
                title,
                artist,
                genre,
                src: ytUrl,
                cover,
                isCustom: true
            });
        }

        renderSongs(songs);
        loadSong(songs.length - 1, true);
        addSongForm.reset();
        closeAddSongModalFn();
    });
}


// ==========================================
// INITIALIZATION
// ==========================================

// Inisialisasi YouTube API & metadata
initYouTubeAPI();
fetchYouTubeMetadata();

// Tampilkan semua lagu & muat lagu tersimpan di browser
renderSongs(songs);
loadCustomSongsFromDB();

// Lagu pertama menjadi lagu awal
loadSong(0, false);

// Status repeat
updateRepeatButton();

// Status play
updatePlayButton();


// ==========================================
// CONSOLE INFO
// ==========================================

console.log(
    "Limausong berhasil dijalankan."
);

console.log(
    `Total lagu: ${songs.length}`
);