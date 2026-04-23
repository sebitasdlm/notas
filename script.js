document.addEventListener("DOMContentLoaded", () => {
    const toggleTheme = document.getElementById("theme-toggle");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("sidebar");
    const sidebarContent = document.getElementById("sidebar-content");
    const mainContent = document.querySelector("main");

    // Load chapters and names from external file (chapters.json)
    let chapters = [];
    let chapterNames = [];

    fetch('CPII/chapters.json')
        .then(response => response.json())
        .then(data => {
            chapters = Object.keys(data.chapters);
            chapterNames = Object.values(data.chapters);
            // After loading chapters, build the sidebar for the first time
            buildSidebar();
        })
        .catch(error => {
            console.error('Error loading chapters.json:', error);
        });

    // Apply dark theme by default
    document.body.classList.add("light-theme");

    // Ensure the sidebar is visible by default on desktop
    const checkScreenWidth = () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove("hidden");
        } else {
            sidebar.classList.add("hidden");
        }
    };

    // Toggle theme
    toggleTheme.addEventListener("click", () => {
        if (document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
        }
    });

    // Toggle sidebar visibility
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("hidden");
    });

    // Build chapter list in the sidebar
    const buildSidebar = (currentChapter = null, sections = []) => {
        sidebarContent.innerHTML = "";

        // Add chapter list
        const chapterList = document.createElement("ul");
        chapterList.classList.add("chapter-list");

        chapters.forEach((chapter, index) => {
            const chap = index +1;
            const chapterName = chapter.split(".")[0];
            const displayName = chapterNames[index];
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.textContent = `${index + 1}. ${displayName}`;
            link.href = "#";
            link.addEventListener("click", (e) => {
                e.preventDefault();
                loadContent(`chapters/${chapter}`, chapter);
                if(window.innerWidth <= 768){
                    sidebar.classList.add("hidden"); // Hide sidebar after selecting a chapter on mobile
                }
            });
            listItem.appendChild(link);
            chapterList.appendChild(listItem);

            // If this is the current chapter, add its sections
            var seccount = 0;
            var subseccount = 0;
            if (currentChapter === chapter) {
                const hr1 = document.createElement("hr");
                listItem.appendChild(hr1);
                const sectionList = document.createElement("ul");
                sectionList.classList.add("section-list");
                sections.forEach((section) => {
                    if (section.tagName.toLowerCase() === "h2") {
                        seccount++;
                        subseccount = 0;
                    }
                    const sectionItem = document.createElement("li");
                    const sectionLink = document.createElement("a");
                    sectionLink.textContent = seccount + '.';
                    if (section.tagName.toLowerCase() === "h3") {
                        subseccount++;
                        sectionItem.style.fontSize = "smaller"; // Example of setting the style
                        sectionItem.style.marginLeft = "15px"; // Example of setting the style
                        sectionLink.textContent += subseccount ;
                    }
                    sectionLink.textContent += ' '+section.textContent;
                    sectionLink.href = '#'+section.id;
                    sectionItem.appendChild(sectionLink);
                    sectionList.appendChild(sectionItem);
                });
                listItem.appendChild(sectionList);
                const hr2 = document.createElement("hr");
                listItem.appendChild(hr2);
            }
        });

        sidebarContent.appendChild(chapterList);
    };

    // Function to load a file into the main content area
    const loadContent = (filePath, chapter = null) => {
        fetch(filePath)
            .then((response) => response.text())
            .then((html) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");

                // Replace main content
                mainContent.innerHTML = doc.querySelector("main").innerHTML;

                // Add the 'cover' class only for the cover page
                if (filePath === "cover.html") {
                    mainContent.classList.add("cover");
                } else {
                    mainContent.classList.remove("cover");
                }

                // Identify sections for the current chapter
                const sections = chapter
                    ? Array.from(doc.querySelectorAll("h2, h3"))
                    : [];

                // Build sidebar with current chapter highlighted
                buildSidebar(chapter, sections);

                // Render MathJax equations
                if (window.MathJax) {
                    MathJax.typeset();
                }
            })
            .then(() => {
                // Inject Geogebra applets
                const geogebraElements = document.querySelectorAll(".ggb-element");
                geogebraElements.forEach((elem) => {
                    const materialID = elem.dataset.materialId;
                    injectGeogebra(elem.id, materialID);
                });
            })
            .catch((error) => console.error("Error loading content:", error));


    };

    // Add resize event listener to handle screen size changes
    window.addEventListener("resize", checkScreenWidth);

    // Initial check for screen width
    checkScreenWidth();

    // Load the cover page initially
    loadContent("cover.html");

    function injectGeogebra(elemID, materialID) {
        const params = {
            "material_id": materialID,
            "width": "100%",
            "height": "100%",
            "showToolBar": false,
            "showAlgebraInput": false,
            "showMenuBar": false
        };
        const applet = new GGBApplet(params, true);
        applet.inject(elemID);
    };


    
});
