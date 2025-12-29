document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const welcomeSection = document.getElementById("welcomeSection");
  const movieListSection = document.getElementById("movieListSection");
  const movieDetailSection = document.getElementById("movieDetailSection");
  const videoPlayerSection = document.getElementById("videoPlayerSection");
  const welcomeSearchInput = document.getElementById("welcomeSearchInput");
  const welcomeSearchButton = document.getElementById("welcomeSearchButton");
  const newSearchButton = document.getElementById("newSearchButton");
  const movieList = document.getElementById("movieList");
  const backButton = document.getElementById("backButton");
  const closePlayerButton = document.getElementById("closePlayerButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const videoPlayer = document.getElementById("videoPlayer");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const pagination = document.getElementById("pagination");
  const currentPageSpan = document.getElementById("currentPage");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  // State variables
  let currentSearchQuery = "";
  let currentPage = 1;
  let totalPages = 1;
  let isFullscreen = false;
  let controlsTimeout;
  let isControlsVisible = true;

  // Search functionality
  welcomeSearchButton.addEventListener("click", function () {
    currentSearchQuery = welcomeSearchInput.value.trim();
    currentPage = 1;
    searchMovies();
  });

  welcomeSearchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      currentSearchQuery = welcomeSearchInput.value.trim();
      currentPage = 1;
      searchMovies();
    }
  });

  // New search button
  newSearchButton.addEventListener("click", function () {
    welcomeSection.style.display = "block";
    movieListSection.style.display = "none";
    welcomeSearchInput.focus();
  });

  // Pagination buttons with disabled state check
  prevPageBtn.addEventListener("click", function () {
    if (prevPageBtn.getAttribute("data-disabled") !== "true") {
      if (currentPage > 1) {
        currentPage--;
        searchMovies();
        scrollToTop();
      }
    }
  });

  nextPageBtn.addEventListener("click", function () {
    if (nextPageBtn.getAttribute("data-disabled") !== "true") {
      if (currentPage < totalPages) {
        currentPage++;
        searchMovies();
        scrollToTop();
      }
    }
  });

  // Scroll to top function
  function scrollToTop() {
    movieListSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Back button
  backButton.addEventListener("click", function () {
    movieDetailSection.style.display = "none";
    movieListSection.style.display = "block";
  });

  // Close player button
  closePlayerButton.addEventListener("click", function () {
    if (isFullscreen) {
      exitFullscreen();
    }
    videoPlayerSection.style.display = "none";
    videoPlayer.pause();
    movieDetailSection.style.display = "block";
  });

  // Fullscreen button
  fullscreenButton.addEventListener("click", function () {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  });

  // Enter fullscreen function
  function enterFullscreen() {
    const videoContainer = document.querySelector(".video-container");
    if (videoContainer.requestFullscreen) {
      videoContainer.requestFullscreen();
    } else if (videoContainer.webkitRequestFullscreen) {
      /* Safari */
      videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.msRequestFullscreen) {
      /* IE11 */
      videoContainer.msRequestFullscreen();
    }

    isFullscreen = true;
    fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>';

    // Hide controls after 3 seconds in fullscreen
    hideControlsAfterDelay();
  }

  // Exit fullscreen function
  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }

    isFullscreen = false;
    fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';

    // Show controls when exiting fullscreen
    showControls();
  }

  // Show controls
  function showControls() {
    const controlsContainer = document.querySelector(
      ".video-controls-container"
    );
    controlsContainer.style.opacity = "1";
    isControlsVisible = true;

    // Clear any existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }

    // If in fullscreen, hide controls after 3 seconds
    if (isFullscreen) {
      hideControlsAfterDelay();
    }
  }

  // Hide controls after delay
  function hideControlsAfterDelay() {
    controlsTimeout = setTimeout(() => {
      const controlsContainer = document.querySelector(
        ".video-controls-container"
      );
      controlsContainer.style.opacity = "0";
      isControlsVisible = false;
    }, 3000);
  }

  // Listen for fullscreen change events
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("msfullscreenchange", handleFullscreenChange);

  function handleFullscreenChange() {
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      isFullscreen = false;
      fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
      showControls();
    }
  }

  // Search movies function
  function searchMovies() {
    if (!currentSearchQuery) return;

    showLoading();

    // Using proxy to avoid CORS issues
    const proxyUrl = "https://api.codetabs.com/v1/proxy/?quest=";
    const searchUrl = `https://www.dubbindo.site/search?keyword=${encodeURIComponent(
      currentSearchQuery
    )}&page_id=${currentPage}`;

    fetch(proxyUrl + encodeURIComponent(searchUrl))
      .then((response) => response.text())
      .then((html) => {
        parseMovieList(html);
        hideLoading();
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        hideLoading();
        showError("Terjadi kesalahan saat mencari film. Silakan coba lagi.");
      });
  }

  // Advanced movie sorting function
  function sortMovies(moviesData) {
    return moviesData.sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      // Extract series information
      const extractSeriesInfo = (title) => {
        // Patterns for different formats
        const patterns = [
          // "SpongeBob Season 1 Episode 1"
          /(.+?)\s+season\s+(\d+)\s+episode\s+(\d+)/i,
          // "SpongeBob S1 E1" or "SpongeBob S1E1"
          /(.+?)\s+s(\d+)\s*e\s*(\d+)/i,
          // "SpongeBob 2x03" or "SpongeBob 2x3"
          /(.+?)\s+(\d+)x(\d+)/i,
          // "SpongeBob Episode 1"
          /(.+?)\s+episode\s+(\d+)/i,
          // "SpongeBob Eps 1"
          /(.+?)\s+eps?\s*(\d+)/i,
          // "SpongeBob Part 1"
          /(.+?)\s+part\s+(\d+)/i,
          // "SpongeBob 1"
          /(.+?)\s+(\d+)$/,
        ];

        let seriesName = title;
        let season = 0;
        let episode = 0;

        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match) {
            seriesName = match[1].trim();
            if (match[3]) {
              season = parseInt(match[2]) || 0;
              episode = parseInt(match[3]) || 0;
            } else if (match[2]) {
              episode = parseInt(match[2]) || 0;
            }
            break;
          }
        }

        return { seriesName, season, episode };
      };

      const infoA = extractSeriesInfo(titleA);
      const infoB = extractSeriesInfo(titleB);

      // First, compare series names
      if (infoA.seriesName !== infoB.seriesName) {
        return infoA.seriesName.localeCompare(infoB.seriesName);
      }

      // If same series, compare seasons
      if (infoA.season !== infoB.season) {
        return infoA.season - infoB.season;
      }

      // If same season, compare episodes
      if (infoA.episode !== infoB.episode) {
        return infoA.episode - infoB.episode;
      }

      // If all else fails, sort alphabetically
      return titleA.localeCompare(titleB);
    });
  }

  // Parse movie list from HTML
  function parseMovieList(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const movieItems = doc.querySelectorAll(".video-latest-list");

    if (movieItems.length === 0) {
      showError("Tidak ada film yang ditemukan dengan kata kunci tersebut.");
      return;
    }

    // Check if there are more pages by looking for pagination elements
    const paginationElements = doc.querySelectorAll(
      ".pagination a, .load-more"
    );
    const hasMorePages = paginationElements.length > 0;

    // Estimate total pages (this is a rough estimate)
    totalPages = hasMorePages ? currentPage + 1 : currentPage;

    // Collect all movie data first
    const moviesData = [];

    movieItems.forEach((item) => {
      const titleElement = item.querySelector("h4");
      const linkElement = item.querySelector("a");
      const imgElement = item.querySelector("img");

      if (titleElement && linkElement && imgElement) {
        const title = titleElement.textContent.trim();
        let link = linkElement.getAttribute("href");
        const poster = imgElement.getAttribute("src");

        // Fix the link to ensure it's a proper HTTPS URL
        if (link.startsWith("http://www.dubbindo.site")) {
          link = link.replace(
            "http://www.dubbindo.site",
            "https://www.dubbindo.site"
          );
        } else if (link.startsWith("/")) {
          link = "https://www.dubbindo.site" + link;
        }

        moviesData.push({
          title: title,
          link: link,
          poster: poster,
        });
      }
    });

    // Sort movies using the advanced sorting function
    const sortedMovies = sortMovies(moviesData);

    // Clear previous results
    movieList.innerHTML = "";

    // Add sorted movies to the list
    sortedMovies.forEach((movie) => {
      const movieItem = createMovieItem(movie);
      movieList.appendChild(movieItem);
    });

    // Update pagination
    updatePagination();

    // Show movie list section
    welcomeSection.style.display = "none";
    movieListSection.style.display = "block";
  }

  // Create movie item element
  function createMovieItem(movie) {
    const movieItem = document.createElement("div");
    movieItem.className = "movie-item focusable";
    movieItem.tabIndex = "0";
    movieItem.innerHTML = `
            <div class="movie-poster">
                <img src="${movie.poster}" alt="${movie.title}">
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
            </div>
        `;

    // Add hover effect for mouse users
    movieItem.addEventListener("mouseenter", function () {
      if (!document.activeElement || document.activeElement !== movieItem) {
        movieItem.style.transform = "translateY(-5px)";
        movieItem.style.boxShadow = "0 8px 25px rgba(229, 9, 20, 0.3)";
      }
    });

    movieItem.addEventListener("mouseleave", function () {
      if (!document.activeElement || document.activeElement !== movieItem) {
        movieItem.style.transform = "";
        movieItem.style.boxShadow = "";
      }
    });

    // Add click event
    movieItem.addEventListener("click", function () {
      getMovieDetails(movie.link, movie.title, movie.poster);
    });

    return movieItem;
  }

  // Update pagination UI
  function updatePagination() {
    currentPageSpan.textContent = currentPage;

    // Update disabled state using data attribute
    if (currentPage <= 1) {
      prevPageBtn.setAttribute("data-disabled", "true");
    } else {
      prevPageBtn.removeAttribute("data-disabled");
    }

    if (currentPage >= totalPages) {
      nextPageBtn.setAttribute("data-disabled", "true");
    } else {
      nextPageBtn.removeAttribute("data-disabled");
    }

    // Show pagination if there might be more pages
    if (
      totalPages > 1 ||
      (currentPage === 1 && movieList.children.length > 0)
    ) {
      pagination.style.display = "flex";
    } else {
      pagination.style.display = "none";
    }
  }

  // Get movie details
  function getMovieDetails(link, title, poster) {
    showLoading();

    // Using proxy to avoid CORS issues
    const proxyUrl = "https://api.codetabs.com/v1/proxy/?quest=";

    // Ensure we're using the correct HTTPS URL
    let movieUrl = link;
    if (movieUrl.startsWith("http://www.dubbindo.site")) {
      movieUrl = movieUrl.replace(
        "http://www.dubbindo.site",
        "https://www.dubbindo.site"
      );
    } else if (!movieUrl.startsWith("https://www.dubbindo.site")) {
      movieUrl = "https://www.dubbindo.site" + movieUrl;
    }

    console.log("Fetching movie details from:", movieUrl);

    fetch(proxyUrl + encodeURIComponent(movieUrl))
      .then((response) => response.text())
      .then((html) => {
        parseMovieDetails(html, title, poster);
        hideLoading();
      })
      .catch((error) => {
        console.error("Error fetching movie details:", error);
        hideLoading();
        showError(
          "Terjadi kesalahan saat mengambil detail film. Silakan coba lagi."
        );
      });
  }

  // Parse movie details from HTML
  function parseMovieDetails(html, title, poster) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Find all video sources with mp4 extension
    const videoSources = [];
    const qualitySet = new Set(); // To track unique qualities

    // Check in script tags
    const scripts = doc.querySelectorAll("script");
    scripts.forEach((script) => {
      const scriptContent = script.textContent;
      const mp4Matches = scriptContent.match(/https:\/\/[^"'\s]+\.mp4/g);

      if (mp4Matches) {
        mp4Matches.forEach((match) => {
          // Extract quality from the URL if possible
          let quality = "Unknown";
          if (match.includes("1080p")) quality = "1080p";
          else if (match.includes("720p")) quality = "720p";
          else if (match.includes("480p")) quality = "480p";
          else if (match.includes("360p")) quality = "360p";

          // Only add if this quality hasn't been added yet
          if (!qualitySet.has(quality)) {
            qualitySet.add(quality);
            videoSources.push({
              url: match,
              quality: quality,
            });
          }
        });
      }
    });

    // If no sources found in scripts, try to find in video elements
    if (videoSources.length === 0) {
      const videoElements = doc.querySelectorAll("video source");
      videoElements.forEach((element) => {
        const src = element.getAttribute("src");
        if (src && src.includes(".mp4")) {
          let quality = "Unknown";
          if (src.includes("1080p")) quality = "1080p";
          else if (src.includes("720p")) quality = "720p";
          else if (src.includes("480p")) quality = "480p";
          else if (src.includes("360p")) quality = "360p";

          // Only add if this quality hasn't been added yet
          if (!qualitySet.has(quality)) {
            qualitySet.add(quality);
            videoSources.push({
              url: src,
              quality: quality,
            });
          }
        }
      });
    }

    // If still no sources, try to find in any element with src attribute
    if (videoSources.length === 0) {
      const allElements = doc.querySelectorAll("[src]");
      allElements.forEach((element) => {
        const src = element.getAttribute("src");
        if (src && src.includes(".mp4")) {
          let quality = "Unknown";
          if (src.includes("1080p")) quality = "1080p";
          else if (src.includes("720p")) quality = "720p";
          else if (src.includes("480p")) quality = "480p";
          else if (src.includes("360p")) quality = "360p";

          // Only add if this quality hasn't been added yet
          if (!qualitySet.has(quality)) {
            qualitySet.add(quality);
            videoSources.push({
              url: src,
              quality: quality,
            });
          }
        }
      });
    }

    // Update movie detail section
    document.getElementById("moviePoster").src = poster;
    document.getElementById("moviePoster").alt = title;
    document.getElementById("movieTitle").textContent = title;

    // Clear previous quality buttons
    const videoQualities = document.getElementById("videoQualities");
    videoQualities.innerHTML = "";

    if (videoSources.length === 0) {
      videoQualities.innerHTML =
        "<p>Tidak ada sumber video yang tersedia untuk film ini.</p>";
    } else {
      // Create quality buttons
      videoSources.forEach((source) => {
        const button = document.createElement("button");
        button.className = "quality-btn focusable";
        button.tabIndex = "0";
        button.textContent = source.quality;
        button.addEventListener("click", function () {
          playVideo(source.url, title);
        });
        videoQualities.appendChild(button);
      });
    }

    // Show movie detail section
    movieListSection.style.display = "none";
    movieDetailSection.style.display = "block";
  }

  // Play video
  function playVideo(url, title) {
    // Set video source and play
    videoPlayer.src = url;
    videoPlayer.load();

    // Show video player section
    movieDetailSection.style.display = "none";
    videoPlayerSection.style.display = "flex";

    // Focus on fullscreen button for easier navigation
    setTimeout(() => {
      fullscreenButton.focus();
    }, 500);

    // Play the video
    videoPlayer.play().catch((error) => {
      console.error("Error playing video:", error);
      showError("Tidak dapat memutar video. Silakan coba lagi.");
    });
  }

  // Show loading indicator
  function showLoading() {
    loadingIndicator.style.display = "flex";
  }

  // Hide loading indicator
  function hideLoading() {
    loadingIndicator.style.display = "none";
  }

  // Show error message
  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.style.position = "fixed";
    errorDiv.style.top = "20px";
    errorDiv.style.left = "50%";
    errorDiv.style.transform = "translateX(-50%)";
    errorDiv.style.backgroundColor = "#e74c3c";
    errorDiv.style.color = "white";
    errorDiv.style.padding = "15px 25px";
    errorDiv.style.borderRadius = "8px";
    errorDiv.style.zIndex = "1000";
    errorDiv.style.fontWeight = "600";
    errorDiv.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Enhanced Spatial Navigation System for TV Remote - Movie Grid Focus
  class SpatialNavigation {
    constructor() {
      this.currentElement = null;
      this.focusableElements = [];
      this.movieGrid = [];
      this.gridRows = {};
      this.gridCols = {};
      this.isEnabled = true;
      this.init();
    }

    init() {
      // Update focusable elements
      this.updateFocusableElements();

      // Build movie grid
      this.buildMovieGrid();

      // Set initial focus
      this.setInitialFocus();

      // Add event listeners
      this.addEventListeners();
    }

    updateFocusableElements() {
      // Get all focusable elements
      this.focusableElements = Array.from(
        document.querySelectorAll(
          "button.focusable, input.focusable, a.focusable, [tabindex].focusable, " +
            ".movie-item.focusable, .quality-btn.focusable, .page-btn.focusable, .fullscreen-btn.focusable"
        )
      ).filter((el) => {
        // Only include visible elements
        return (
          el.offsetParent !== null &&
          !el.disabled &&
          el.style.display !== "none" &&
          el.style.visibility !== "hidden"
        );
      });

      // Build movie grid for better navigation
      this.buildMovieGrid();
    }

    buildMovieGrid() {
      this.movieGrid = [];
      this.gridRows = {};
      this.gridCols = {};

      // Get all movie items
      const movieItems = Array.from(
        document.querySelectorAll(".movie-item.focusable")
      );

      // Calculate grid layout based on actual positions
      movieItems.forEach((element, index) => {
        const rect = element.getBoundingClientRect();

        // Determine grid position
        const row = Math.floor(rect.top / 250); // Adjust based on movie height
        const col = Math.floor(rect.left / 400); // Adjust based on movie width

        if (!this.gridRows[row]) this.gridRows[row] = [];
        if (!this.gridCols[col]) this.gridCols[col] = [];

        this.gridRows[row].push(element);
        this.gridCols[col].push(element);

        // Store position info on element
        element._spatialNavRow = row;
        element._spatialNavCol = col;
        element._spatialNavIndex = index;

        // Add to movie grid
        this.movieGrid.push({
          element: element,
          row: row,
          col: col,
          index: index,
          rect: rect,
        });
      });

      // Sort movie grid by position
      this.movieGrid.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });
    }

    setInitialFocus() {
      // Try to find the first visible movie item
      const visibleMovies = this.movieGrid.filter((item) => {
        const rect = item.element.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight && rect.left >= 0;
      });

      if (visibleMovies.length > 0) {
        this.setFocus(visibleMovies[0].element);
      } else if (this.focusableElements.length > 0) {
        this.setFocus(this.focusableElements[0]);
      }
    }

    addEventListeners() {
      // Keyboard navigation
      document.addEventListener("keydown", (e) => this.handleKeyDown(e));

      // Update focusable elements when DOM changes
      const observer = new MutationObserver(() => {
        this.updateFocusableElements();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "disabled"],
      });

      // Handle window resize
      window.addEventListener("resize", () => {
        this.updateFocusableElements();
      });
    }

    handleKeyDown(e) {
      if (!this.isEnabled) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          this.navigate("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          this.navigate("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          this.navigate("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          this.navigate("right");
          break;
        case "Enter":
          e.preventDefault();
          this.activateCurrentElement();
          break;
      }
    }

    navigate(direction) {
      if (!this.currentElement) {
        this.setInitialFocus();
        return;
      }

      const nextElement = this.findNextMovieElement(direction);
      if (nextElement) {
        this.setFocus(nextElement);
      }
    }

    findNextMovieElement(direction) {
      if (!this.currentElement.classList.contains("movie-item")) {
        // If not on a movie, use regular navigation
        return this.findNextElement(direction);
      }

      const currentRect = this.currentElement.getBoundingClientRect();
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentRow = this.currentElement._spatialNavRow;
      const currentCol = this.currentElement._spatialNavCol;

      let candidates = [];

      switch (direction) {
        case "up":
          // Find movies in rows above
          candidates = this.movieGrid.filter((item) => {
            const itemRect = item.element.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            return (
              item.row < currentRow &&
              Math.abs(itemCenterX - currentCenterX) < 200
            );
          });

          // Sort by closest vertically and then horizontally
          candidates.sort((a, b) => {
            const aRect = a.element.getBoundingClientRect();
            const bRect = b.element.getBoundingClientRect();
            const aDistance = currentRect.top - aRect.bottom;
            const bDistance = currentRect.top - bRect.bottom;

            if (Math.abs(aDistance - bDistance) < 50) {
              // If vertically close, prioritize horizontal alignment
              const aCenterX = aRect.left + aRect.width / 2;
              const bCenterX = bRect.left + bRect.width / 2;
              return (
                Math.abs(aCenterX - currentCenterX) -
                Math.abs(bCenterX - currentCenterX)
              );
            }
            return aDistance - bDistance;
          });
          break;

        case "down":
          // Find movies in rows below
          candidates = this.movieGrid.filter((item) => {
            const itemRect = item.element.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            return (
              item.row > currentRow &&
              Math.abs(itemCenterX - currentCenterX) < 200
            );
          });

          // Sort by closest vertically and then horizontally
          candidates.sort((a, b) => {
            const aRect = a.element.getBoundingClientRect();
            const bRect = b.element.getBoundingClientRect();
            const aDistance = aRect.top - currentRect.bottom;
            const bDistance = bRect.top - currentRect.bottom;

            if (Math.abs(aDistance - bDistance) < 50) {
              // If vertically close, prioritize horizontal alignment
              const aCenterX = aRect.left + aRect.width / 2;
              const bCenterX = bRect.left + bRect.width / 2;
              return (
                Math.abs(aCenterX - currentCenterX) -
                Math.abs(bCenterX - currentCenterX)
              );
            }
            return aDistance - bDistance;
          });
          break;

        case "left":
          // Find movies in the same row to the left
          candidates = this.movieGrid
            .filter((item) => item.row === currentRow && item.col < currentCol)
            .sort((a, b) => b.col - a.col); // Sort by closest
          break;

        case "right":
          // Find movies in the same row to the right
          candidates = this.movieGrid
            .filter((item) => item.row === currentRow && item.col > currentCol)
            .sort((a, b) => a.col - b.col); // Sort by closest
          break;
      }

      if (candidates.length === 0) return null;

      // Return the closest candidate
      return candidates[0].element;
    }

    findNextElement(direction) {
      const focusableElements = Array.from(
        document.querySelectorAll(
          "button.focusable, input.focusable, a.focusable, [tabindex].focusable, " +
            ".movie-item.focusable, .quality-btn.focusable, .page-btn.focusable, .fullscreen-btn.focusable"
        )
      ).filter((el) => {
        // Only include visible elements
        return (
          el.offsetParent !== null &&
          !el.disabled &&
          el.style.display !== "none" &&
          el.style.visibility !== "hidden"
        );
      });

      const currentIndex = focusableElements.indexOf(this.currentElement);
      let nextIndex;

      // Improved navigation without wrapping
      if (direction === "right") {
        if (currentIndex < focusableElements.length - 1) {
          nextIndex = currentIndex + 1;
        } else {
          return null; // Stay at the last element
        }
      } else if (direction === "left") {
        if (currentIndex > 0) {
          nextIndex = currentIndex - 1;
        } else {
          return null; // Stay at the first element
        }
      } else if (direction === "down") {
        // Try to find element below current one
        const currentRect = this.currentElement.getBoundingClientRect();
        let candidates = focusableElements.filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top > currentRect.bottom;
        });

        if (candidates.length === 0) {
          return null; // No element below
        } else {
          // Find element that's most centered below
          const currentCenterX = currentRect.left + currentRect.width / 2;
          nextIndex = focusableElements.indexOf(
            candidates.reduce((closest, candidate) => {
              const closestRect = closest.getBoundingClientRect();
              const candidateRect = candidate.getBoundingClientRect();

              const closestCenterX = closestRect.left + closestRect.width / 2;
              const candidateCenterX =
                candidateRect.left + candidateRect.width / 2;

              const closestDistance = Math.abs(closestCenterX - currentCenterX);
              const candidateDistance = Math.abs(
                candidateCenterX - currentCenterX
              );

              return candidateDistance < closestDistance ? candidate : closest;
            })
          );
        }
      } else if (direction === "up") {
        // Try to find element above current one
        const currentRect = this.currentElement.getBoundingClientRect();
        let candidates = focusableElements.filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.bottom < currentRect.top;
        });

        if (candidates.length === 0) {
          return null; // No element above
        } else {
          // Find element that's most centered above
          const currentCenterX = currentRect.left + currentRect.width / 2;
          nextIndex = focusableElements.indexOf(
            candidates.reduce((closest, candidate) => {
              const closestRect = closest.getBoundingClientRect();
              const candidateRect = candidate.getBoundingClientRect();

              const closestCenterX = closestRect.left + closestRect.width / 2;
              const candidateCenterX =
                candidateRect.left + candidateRect.width / 2;

              const closestDistance = Math.abs(closestCenterX - currentCenterX);
              const candidateDistance = Math.abs(
                candidateCenterX - currentCenterX
              );

              return candidateDistance < closestDistance ? candidate : closest;
            })
          );
        }
      }

      return focusableElements[nextIndex];
    }

    setFocus(element) {
      // Remove focus from current element
      if (this.currentElement) {
        this.currentElement.blur();
      }

      // Set focus to new element
      this.currentElement = element;
      element.focus();

      // Scroll into view if needed
      this.scrollIntoViewIfNeeded(element);
    }

    scrollIntoViewIfNeeded(element) {
      const rect = element.getBoundingClientRect();
      const isInViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth;

      if (!isInViewport) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }

    activateCurrentElement() {
      if (this.currentElement) {
        // Check if element is disabled before clicking
        if (this.currentElement.getAttribute("data-disabled") === "true") {
          // Don't click disabled elements
          return;
        }

        // Add selection effect
        this.currentElement.click();
      }
    }

    enable() {
      this.isEnabled = true;
    }

    disable() {
      this.isEnabled = false;
    }
  }

  // Initialize enhanced spatial navigation when DOM is loaded
  document.addEventListener("DOMContentLoaded", function () {
    // Add focusable class to interactive elements
    const interactiveElements = document.querySelectorAll(
      "button, input, a, [tabindex], .movie-item, .quality-btn, .page-btn, .fullscreen-btn"
    );

    interactiveElements.forEach((el) => {
      if (!el.classList.contains("focusable")) {
        el.classList.add("focusable");
      }
    });

    // Initialize enhanced spatial navigation
    window.spatialNav = new SpatialNavigation();

    // Enhanced keyboard navigation
    document.addEventListener("keydown", function (e) {
      // Let spatial navigation handle arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        return; // Don't prevent default, let spatial navigation handle it
      }

      // Handle other keys as before
      if (
        e.key === "Enter" &&
        document.activeElement &&
        document.activeElement.classList.contains("focusable")
      ) {
        e.preventDefault();
        document.activeElement.click();
      }

      // Number keys for quick navigation (1-9)
      if (e.key >= "1" && e.key <= "9") {
        const pageNum = parseInt(e.key);
        if (
          movieListSection.style.display === "block" &&
          pageNum <= totalPages
        ) {
          currentPage = pageNum;
          searchMovies();
          scrollToTop();
        }
      }

      // Back button on remote
      if (e.key === "Back" || e.key === "Escape") {
        if (videoPlayerSection.style.display === "flex") {
          if (isFullscreen) {
            exitFullscreen();
          }
          closePlayerButton.click();
        } else if (movieDetailSection.style.display === "block") {
          backButton.click();
        } else if (movieListSection.style.display === "block") {
          newSearchButton.click();
        }
      }

      // Channel up/down for pagination
      if (e.key === "ChannelUp" && movieListSection.style.display === "block") {
        if (currentPage < totalPages) {
          currentPage++;
          searchMovies();
          scrollToTop();
        }
      }

      if (
        e.key === "ChannelDown" &&
        movieListSection.style.display === "block"
      ) {
        if (currentPage > 1) {
          currentPage--;
          searchMovies();
          scrollToTop();
        }
      }

      // F key for fullscreen
      if (e.key === "f" && videoPlayerSection.style.display === "flex") {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }

      // Show controls when any key is pressed in fullscreen mode
      if (isFullscreen && videoPlayerSection.style.display === "flex") {
        showControls();
      }
    });
  });
});
