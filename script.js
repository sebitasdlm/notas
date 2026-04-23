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
            buildSidebar();
        })
        .catch(error => {
            console.error('Error loading chapters.json:', error);
        });

    // Apply light theme by default
    document.body.classList.add("light-theme");

    const checkScreenWidth = () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove("hidden");
        } else {
            sidebar.classList.add("hidden");
        }
    };

    toggleTheme.addEventListener("click", () => {
        if (document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
        }
        // Redibujar canvases después de cambiar tema
        const event = new CustomEvent('themeChanged');
        document.dispatchEvent(event);
    });

    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("hidden");
    });

    const buildSidebar = (currentChapter = null, sections = []) => {
        sidebarContent.innerHTML = "";

        const chapterList = document.createElement("ul");
        chapterList.classList.add("chapter-list");

        chapters.forEach((chapter, index) => {
            const displayName = chapterNames[index];
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.textContent = `${index + 1}. ${displayName}`;
            link.href = "#";
            link.addEventListener("click", (e) => {
                e.preventDefault();
                loadContent(`CPII/chapters/${chapter}`, chapter);
                if(window.innerWidth <= 768){
                    sidebar.classList.add("hidden");
                }
            });
            listItem.appendChild(link);
            chapterList.appendChild(listItem);

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
                        sectionItem.style.fontSize = "smaller";
                        sectionItem.style.marginLeft = "15px";
                        sectionLink.textContent += subseccount;
                    }
                    sectionLink.textContent += ' ' + section.textContent;
                    sectionLink.href = '#' + section.id;
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

    const loadContent = (filePath, chapter = null) => {
        fetch(filePath)
            .then((response) => response.text())
            .then((html) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");

                // Extract main content
                const newMainContent = doc.querySelector("main");
                if (newMainContent) {
                    mainContent.innerHTML = newMainContent.innerHTML;
                } else {
                    mainContent.innerHTML = html;
                }

                // Extract and inject styles from the chapter
                const chapterStyles = doc.querySelector("style");
                let styleTag = document.getElementById("chapter-styles");
                if (!styleTag) {
                    styleTag = document.createElement("style");
                    styleTag.id = "chapter-styles";
                    document.head.appendChild(styleTag);
                }
                if (chapterStyles) {
                    styleTag.innerHTML = chapterStyles.innerHTML;
                }

                // Extract and execute scripts from the chapter
                const scripts = doc.querySelectorAll("script");
                scripts.forEach(oldScript => {
                    const newScript = document.createElement("script");
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    document.body.appendChild(newScript);
                });

                if (filePath === "cover.html") {
                    mainContent.classList.add("cover");
                } else {
                    mainContent.classList.remove("cover");
                }

                const sections = chapter ? Array.from(doc.querySelectorAll("h2, h3")) : [];
                buildSidebar(chapter, sections);

                // FORCE MathJax to render
                if (window.MathJax) {
                    MathJax.texReset();
                    MathJax.typesetPromise().catch(err => console.log('MathJax error:', err));
                }
            })
            .catch((error) => console.error("Error loading content:", error));
    };

    window.addEventListener("resize", checkScreenWidth);
    checkScreenWidth();
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
    }
});
