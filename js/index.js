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

const mobileMenuToggle = document.getElementById("mobileMenuToggle");
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
    //     src: "assets/music/nama-file.mp3",
    //     cover: "song-cover-1"
    // },

    {
        id: 1,
        title: "Style",
        artist: "Taylor Swift",
        genre: "Pop",
        src: "assets/music/lagu_baru.mp3",
        cover: "song-cover-1"
    }
];


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
                ${String(index + 1).padStart(2, "0")}
            </div>

            <div class="song-cover ${song.cover}">
                <span>♪</span>
            </div>

            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
                <span class="song-genre">${song.genre}</span>
            </div>

            <button
                class="song-play"
                type="button"
                aria-label="Play ${song.title}"
            >
                ▶
            </button>
        `;

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

    audioPlayer.src = song.src;

    audioPlayer.load();

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

        if (!audioPlayer.src) {

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

        if (!audioPlayer.duration) return;

        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;

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

    if (!searchResults) return;

    searchResults.innerHTML = "";

    if (results.length === 0) {

        searchResults.innerHTML = `
            <div class="search-empty">
                <span>🔍</span>
                <p>Lagu tidak ditemukan</p>
            </div>
        `;

        return;
    }

    results.forEach(song => {

        const originalIndex =
            songs.findIndex(
                item => item.id === song.id
            );

        const resultItem =
            document.createElement("div");

        resultItem.className =
            "search-result-item";

        resultItem.innerHTML = `
            <div class="search-result-cover ${song.cover}">
                ♪
            </div>

            <div class="search-result-info">
                <h4>${song.title}</h4>
                <p>${song.artist}</p>
                <span>${song.genre}</span>
            </div>

            <button
                type="button"
                class="search-result-play"
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

        searchResults.appendChild(resultItem);

    });

}


// ==========================================
// SEARCH INPUT
// ==========================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const results =
                searchSongs(searchInput.value);

            renderSearchResults(results);

        }
    );

}


// ==========================================
// OPEN SEARCH
// ==========================================

function openSearch() {

    if (!searchOverlay) return;

    searchOverlay.classList.add("active");

    if (searchInput) {

        setTimeout(() => {

            searchInput.focus();

        }, 100);

    }

}


// ==========================================
// CLOSE SEARCH
// ==========================================

function closeSearch() {

    if (!searchOverlay) return;

    searchOverlay.classList.remove("active");

}


// ==========================================
// SEARCH BUTTON
// ==========================================

const searchButtons =
    document.querySelectorAll(
        '[data-search], .search-btn, .nav-search'
    );

searchButtons.forEach(button => {

    button.addEventListener(
        "click",
        openSearch
    );

});


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

        }

        // Space untuk Play/Pause
        if (
            event.code === "Space" &&
            document.activeElement !== searchInput
        ) {

            event.preventDefault();

            if (isPlaying) {

                pauseSong();

            } else {

                playSong();

            }

        }

        // Arrow Right = Next
        if (event.code === "ArrowRight") {

            nextSong();

        }

        // Arrow Left = Previous
        if (event.code === "ArrowLeft") {

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
// INITIALIZATION
// ==========================================

// Tampilkan semua lagu
renderSongs(songs);

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