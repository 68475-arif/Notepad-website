"use strict";

/* =========================================================
   NoteSpace
   Complete Vanilla JavaScript application
   ========================================================= */

/* =========================================================
   CONSTANTS
   ========================================================= */

const STORAGE_KEYS = {
    notes: "notespace_notes",
    categories: "notespace_categories",
    theme: "notespace_theme",
    view: "notespace_view",
    sort: "notespace_sort",
    selectedView: "notespace_selected_view"
};

const MAX_CONTENT_LENGTH = 5000;

const DEFAULT_CATEGORIES = [
    "Personal",
    "Work",
    "Study",
    "Ideas",
    "Important",
    "Other"
];

const COLOR_NAMES = [
    "default",
    "yellow",
    "blue",
    "green",
    "purple",
    "pink"
];

/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
    notes: [],
    categories: [...DEFAULT_CATEGORIES],
    currentView: "all",
    searchTerm: "",
    sortBy: "newest",
    viewMode: "grid",
    editingNoteId: null,
    selectedColor: "default",
    autoSaveTimer: null,
    confirmCallback: null,
    sidebarOpen: false
};

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const elements = {
    body: document.body,

    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebarOverlay"),
    mobileMenuBtn: document.getElementById("mobileMenuBtn"),
    sidebarCloseBtn: document.getElementById("sidebarCloseBtn"),

    themeToggle: document.getElementById("themeToggle"),

    headerSearchBtn: document.getElementById("headerSearchBtn"),
    headerNewNoteBtn: document.getElementById("headerNewNoteBtn"),
    mainNewNoteBtn: document.getElementById("mainNewNoteBtn"),

    pageEyebrow: document.getElementById("pageEyebrow"),
    pageTitle: document.getElementById("pageTitle"),
    pageSubtitle: document.getElementById("pageSubtitle"),

    searchInput: document.getElementById("searchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    sortSelect: document.getElementById("sortSelect"),

    gridViewBtn: document.getElementById("gridViewBtn"),
    listViewBtn: document.getElementById("listViewBtn"),
    notesContainer: document.getElementById("notesContainer"),

    allCount: document.getElementById("allCount"),
    pinnedCount: document.getElementById("pinnedCount"),
    favoriteCount: document.getElementById("favoriteCount"),
    recentCount: document.getElementById("recentCount"),
    trashCount: document.getElementById("trashCount"),

    categoryList: document.getElementById("categoryList"),
    addCategoryBtn: document.getElementById("addCategoryBtn"),
    emptyTrashBtn: document.getElementById("emptyTrashBtn"),

    editorBackdrop: document.getElementById("editorBackdrop"),
    editorEyebrow: document.getElementById("editorEyebrow"),
    editorTitle: document.getElementById("editorTitle"),
    closeEditorBtn: document.getElementById("closeEditorBtn"),

    noteTitleInput: document.getElementById("noteTitleInput"),
    noteCategoryInput: document.getElementById("noteCategoryInput"),
    noteContentInput: document.getElementById("noteContentInput"),

    titleError: document.getElementById("titleError"),
    categoryError: document.getElementById("categoryError"),
    contentError: document.getElementById("contentError"),

    colorPicker: document.getElementById("colorPicker"),
    characterCount: document.getElementById("characterCount"),

    saveStatus: document.getElementById("saveStatus"),
    editorDateInfo: document.getElementById("editorDateInfo"),

    editorDeleteBtn: document.getElementById("editorDeleteBtn"),
    editorCopyBtn: document.getElementById("editorCopyBtn"),
    editorExportBtn: document.getElementById("editorExportBtn"),
    editorFavoriteBtn: document.getElementById("editorFavoriteBtn"),
    editorPinBtn: document.getElementById("editorPinBtn"),
    editorCancelBtn: document.getElementById("editorCancelBtn"),
    editorSaveBtn: document.getElementById("editorSaveBtn"),

    confirmBackdrop: document.getElementById("confirmBackdrop"),
    confirmIcon: document.getElementById("confirmIcon"),
    confirmTitle: document.getElementById("confirmTitle"),
    confirmMessage: document.getElementById("confirmMessage"),
    confirmCancelBtn: document.getElementById("confirmCancelBtn"),
    confirmActionBtn: document.getElementById("confirmActionBtn"),

    toastContainer: document.getElementById("toastContainer")
};

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);

function init() {
    loadState();
    bindEvents();
    applyTheme();
    applyViewMode();
    populateCategorySelect();
    renderCategories();
    updateCounts();
    updatePageHeader();
    renderNotes();
}

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadState() {
    try {
        const storedNotes = localStorage.getItem(STORAGE_KEYS.notes);
        const storedCategories = localStorage.getItem(STORAGE_KEYS.categories);
        const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        const storedView = localStorage.getItem(STORAGE_KEYS.view);
        const storedSort = localStorage.getItem(STORAGE_KEYS.sort);
        const storedSelectedView = localStorage.getItem(
            STORAGE_KEYS.selectedView
        );

        if (storedNotes) {
            const parsedNotes = JSON.parse(storedNotes);

            if (Array.isArray(parsedNotes)) {
                state.notes = parsedNotes.map(normalizeNote);
            }
        }

        if (storedCategories) {
            const parsedCategories = JSON.parse(storedCategories);

            if (Array.isArray(parsedCategories) && parsedCategories.length) {
                state.categories = parsedCategories;
            }
        }

        if (storedTheme === "dark" || storedTheme === "light") {
            elements.body.dataset.theme = storedTheme;
        }

        if (storedView === "grid" || storedView === "list") {
            state.viewMode = storedView;
        }

        if (
            ["newest", "oldest", "az", "za", "updated"].includes(storedSort)
        ) {
            state.sortBy = storedSort;
        }

        if (storedSelectedView) {
            state.currentView = storedSelectedView;
        }
    } catch (error) {
        console.error("Could not load NoteSpace data:", error);
        state.notes = [];
        state.categories = [...DEFAULT_CATEGORIES];
    }

    ensureDefaultCategories();
}

function saveNotes() {
    localStorage.setItem(
        STORAGE_KEYS.notes,
        JSON.stringify(state.notes)
    );
}

function saveCategories() {
    localStorage.setItem(
        STORAGE_KEYS.categories,
        JSON.stringify(state.categories)
    );
}

function savePreference(key, value) {
    localStorage.setItem(key, value);
}

function ensureDefaultCategories() {
    DEFAULT_CATEGORIES.forEach((category) => {
        if (!state.categories.includes(category)) {
            state.categories.push(category);
        }
    });

    saveCategories();
}

/* =========================================================
   NOTE NORMALIZATION
   ========================================================= */

function normalizeNote(note) {
    return {
        id: note.id || generateId(),
        title: String(note.title || "Untitled Note"),
        content: String(note.content || ""),
        category: String(note.category || "Other"),
        color: COLOR_NAMES.includes(note.color)
            ? note.color
            : "default",
        pinned: Boolean(note.pinned),
        favorite: Boolean(note.favorite),
        deleted: Boolean(note.deleted),
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || note.createdAt || new Date().toISOString(),
        deletedAt: note.deletedAt || null
    };
}

/* =========================================================
   UNIQUE ID
   ========================================================= */

function generateId() {
    return (
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 10)
    );
}

/* =========================================================
   EVENT BINDINGS
   ========================================================= */

function bindEvents() {
    elements.headerNewNoteBtn.addEventListener("click", openNewNote);
    elements.mainNewNoteBtn.addEventListener("click", openNewNote);

    elements.headerSearchBtn.addEventListener("click", focusSearch);

    elements.themeToggle.addEventListener("click", toggleTheme);

    elements.mobileMenuBtn.addEventListener(
        "click",
        openSidebar
    );

    elements.sidebarCloseBtn.addEventListener(
        "click",
        closeSidebar
    );

    elements.sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

    document.querySelectorAll(".nav-item").forEach((button) => {
        button.addEventListener("click", () => {
            const view = button.dataset.view;

            state.currentView = view;
            savePreference(STORAGE_KEYS.selectedView, view);

            closeSidebar();
            updateActiveNavigation();
            updatePageHeader();
            renderNotes();
        });
    });

    elements.categoryList.addEventListener("click", handleCategoryClick);

    elements.addCategoryBtn.addEventListener(
        "click",
        addCategory
    );

    elements.searchInput.addEventListener(
        "input",
        handleSearch
    );

    elements.clearSearchBtn.addEventListener(
        "click",
        clearSearch
    );

    elements.sortSelect.addEventListener(
        "change",
        handleSortChange
    );

    elements.gridViewBtn.addEventListener(
        "click",
        () => setViewMode("grid")
    );

    elements.listViewBtn.addEventListener(
        "click",
        () => setViewMode("list")
    );

    elements.emptyTrashBtn.addEventListener(
        "click",
        confirmEmptyTrash
    );

    elements.notesContainer.addEventListener(
        "click",
        handleNoteContainerClick
    );

    elements.closeEditorBtn.addEventListener(
        "click",
        closeEditor
    );

    elements.editorCancelBtn.addEventListener(
        "click",
        closeEditor
    );

    elements.editorSaveBtn.addEventListener(
        "click",
        saveCurrentNote
    );

    elements.editorDeleteBtn.addEventListener(
        "click",
        deleteFromEditor
    );

    elements.editorCopyBtn.addEventListener(
        "click",
        copyCurrentNote
    );

    elements.editorExportBtn.addEventListener(
        "click",
        exportCurrentNote
    );

    elements.editorFavoriteBtn.addEventListener(
        "click",
        toggleFavoriteFromEditor
    );

    elements.editorPinBtn.addEventListener(
        "click",
        togglePinFromEditor
    );

    elements.noteTitleInput.addEventListener(
        "input",
        handleEditorInput
    );

    elements.noteContentInput.addEventListener(
        "input",
        handleContentInput
    );

    elements.noteCategoryInput.addEventListener(
        "change",
        handleEditorInput
    );

    elements.colorPicker.addEventListener(
        "click",
        handleColorSelection
    );

    elements.confirmCancelBtn.addEventListener(
        "click",
        closeConfirm
    );

    elements.confirmActionBtn.addEventListener(
        "click",
        executeConfirmation
    );

    elements.editorBackdrop.addEventListener(
        "click",
        (event) => {
            if (event.target === elements.editorBackdrop) {
                closeEditor();
            }
        }
    );

    elements.confirmBackdrop.addEventListener(
        "click",
        (event) => {
            if (event.target === elements.confirmBackdrop) {
                closeConfirm();
            }
        }
    );

    document.addEventListener(
        "keydown",
        handleKeyboardShortcuts
    );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function openSidebar() {
    state.sidebarOpen = true;

    elements.sidebar.classList.add("open");
    elements.sidebarOverlay.classList.remove("hidden");
}

function closeSidebar() {
    state.sidebarOpen = false;

    elements.sidebar.classList.remove("open");
    elements.sidebarOverlay.classList.add("hidden");
}

/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {
    const currentTheme =
        elements.body.dataset.theme === "dark"
            ? "dark"
            : "light";

    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";

    elements.body.dataset.theme = newTheme;
    savePreference(STORAGE_KEYS.theme, newTheme);

    updateThemeIcon();
}

function applyTheme() {
    if (!elements.body.dataset.theme) {
        elements.body.dataset.theme = "light";
    }

    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector("i");

    if (elements.body.dataset.theme === "dark") {
        icon.className = "fa-solid fa-sun";
        elements.themeToggle.title = "Switch to light mode";
    } else {
        icon.className = "fa-solid fa-moon";
        elements.themeToggle.title = "Switch to dark mode";
    }
}

/* =========================================================
   VIEW MODE
   ========================================================= */

function setViewMode(mode) {
    state.viewMode = mode;

    savePreference(STORAGE_KEYS.view, mode);

    applyViewMode();
}

function applyViewMode() {
    elements.notesContainer.classList.toggle(
        "grid-view",
        state.viewMode === "grid"
    );

    elements.notesContainer.classList.toggle(
        "list-view",
        state.viewMode === "list"
    );

    elements.gridViewBtn.classList.toggle(
        "active",
        state.viewMode === "grid"
    );

    elements.listViewBtn.classList.toggle(
        "active",
        state.viewMode === "list"
    );
}

/* =========================================================
   CATEGORIES
   ========================================================= */

function populateCategorySelect() {
    const currentValue = elements.noteCategoryInput.value;

    elements.noteCategoryInput.replaceChildren();

    state.categories.forEach((category) => {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        elements.noteCategoryInput.appendChild(option);
    });

    if (state.categories.includes(currentValue)) {
        elements.noteCategoryInput.value = currentValue;
    }
}

function renderCategories() {
    elements.categoryList.replaceChildren();

    state.categories.forEach((category) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "category-item";

        if (
            state.currentView ===
            `category:${category}`
        ) {
            button.classList.add("active");
        }

        button.dataset.category = category;

        const dot = document.createElement("span");
        dot.className = "category-dot";

        const name = document.createElement("span");
        name.className = "category-name";
        name.textContent = category;

        const count = document.createElement("span");
        count.className = "category-count";
        count.textContent = getCategoryCount(category);

        button.append(dot, name, count);

        elements.categoryList.appendChild(button);
    });
}

function getCategoryCount(category) {
    return state.notes.filter(
        (note) =>
            !note.deleted &&
            note.category === category
    ).length;
}

function handleCategoryClick(event) {
    const button = event.target.closest(".category-item");

    if (!button) {
        return;
    }

    const category = button.dataset.category;

    state.currentView = `category:${category}`;

    savePreference(
        STORAGE_KEYS.selectedView,
        state.currentView
    );

    closeSidebar();
    updateActiveNavigation();
    renderCategories();
    updatePageHeader();
    renderNotes();
}

function addCategory() {
    const name = window.prompt(
        "Enter a new category name:"
    );

    if (name === null) {
        return;
    }

    const category = name.trim();

    if (!category) {
        showToast(
            "Category name cannot be empty.",
            "warning"
        );
        return;
    }

    if (category.length > 30) {
        showToast(
            "Category name must be 30 characters or less.",
            "warning"
        );
        return;
    }

    const exists = state.categories.some(
        (item) =>
            item.toLowerCase() === category.toLowerCase()
    );

    if (exists) {
        showToast(
            "That category already exists.",
            "warning"
        );
        return;
    }

    state.categories.push(category);

    saveCategories();
    populateCategorySelect();
    renderCategories();

    showToast(
        `"${category}" category added.`,
        "success"
    );
}

/* =========================================================
   COUNTS
   ========================================================= */

function updateCounts() {
    const activeNotes = state.notes.filter(
        (note) => !note.deleted
    );

    elements.allCount.textContent =
        activeNotes.length;

    elements.pinnedCount.textContent =
        activeNotes.filter(
            (note) => note.pinned
        ).length;

    elements.favoriteCount.textContent =
        activeNotes.filter(
            (note) => note.favorite
        ).length;

    elements.recentCount.textContent =
        getRecentlyUpdatedNotes().length;

    elements.trashCount.textContent =
        state.notes.filter(
            (note) => note.deleted
        ).length;

    renderCategories();
}

/* =========================================================
   PAGE HEADER
   ========================================================= */

function updatePageHeader() {
    const view = state.currentView;

    let title = "All Notes";
    let subtitle =
        "Keep your thoughts organized and accessible.";

    let eyebrow = "YOUR WORKSPACE";

    if (view === "pinned") {
        title = "Pinned Notes";
        subtitle = "Your most important notes, always close by.";
        eyebrow = "PINNED";
    }

    if (view === "favorites") {
        title = "Favorites";
        subtitle = "Notes you've marked as favorites.";
        eyebrow = "FAVORITES";
    }

    if (view === "recent") {
        title = "Recently Updated";
        subtitle = "Notes you've worked on most recently.";
        eyebrow = "ACTIVITY";
    }

    if (view === "trash") {
        title = "Recently Deleted";
        subtitle = "Restore notes or permanently remove them.";
        eyebrow = "TRASH";
    }

    if (view.startsWith("category:")) {
        const category = view.substring(9);

        title = category;
        subtitle = `Notes organized under the ${category} category.`;
        eyebrow = "CATEGORY";
    }

    elements.pageEyebrow.textContent = eyebrow;
    elements.pageTitle.textContent = title;
    elements.pageSubtitle.textContent = subtitle;

    elements.emptyTrashBtn.classList.toggle(
        "hidden",
        view !== "trash" ||
        !state.notes.some((note) => note.deleted)
    );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function updateActiveNavigation() {
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.toggle(
            "active",
            item.dataset.view === state.currentView
        );
    });

    renderCategories();
}

/* =========================================================
   SEARCH
   ========================================================= */

function handleSearch(event) {
    state.searchTerm = event.target.value.trim();

    elements.clearSearchBtn.classList.toggle(
        "hidden",
        !state.searchTerm
    );

    renderNotes();
}

function clearSearch() {
    state.searchTerm = "";
    elements.searchInput.value = "";

    elements.clearSearchBtn.classList.add(
        "hidden"
    );

    renderNotes();
    elements.searchInput.focus();
}

function focusSearch() {
    elements.searchInput.focus();

    elements.searchInput.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

/* =========================================================
   SORTING
   ========================================================= */

function handleSortChange(event) {
    state.sortBy = event.target.value;

    savePreference(
        STORAGE_KEYS.sort,
        state.sortBy
    );

    renderNotes();
}

/* =========================================================
   GET NOTES FOR CURRENT VIEW
   ========================================================= */

function getVisibleNotes() {
    let notes = [...state.notes];

    if (state.currentView === "trash") {
        notes = notes.filter(
            (note) => note.deleted
        );
    } else {
        notes = notes.filter(
            (note) => !note.deleted
        );

        if (state.currentView === "pinned") {
            notes = notes.filter(
                (note) => note.pinned
            );
        }

        if (state.currentView === "favorites") {
            notes = notes.filter(
                (note) => note.favorite
            );
        }

        if (state.currentView === "recent") {
            notes = getRecentlyUpdatedNotes();
        }

        if (state.currentView.startsWith("category:")) {
            const category =
                state.currentView.substring(9);

            notes = notes.filter(
                (note) => note.category === category
            );
        }
    }

    if (state.searchTerm) {
        const query =
            state.searchTerm.toLowerCase();

        notes = notes.filter((note) => {
            return (
                note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query) ||
                note.category.toLowerCase().includes(query)
            );
        });
    }

    return sortNotes(notes);
}

/* =========================================================
   RECENTLY UPDATED
   ========================================================= */

function getRecentlyUpdatedNotes() {
    return state.notes
        .filter((note) => !note.deleted)
        .sort(
            (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
        )
        .slice(0, 10);
}

/* =========================================================
   SORT NOTES
   ========================================================= */

function sortNotes(notes) {
    return notes.sort((a, b) => {
        if (state.sortBy === "newest") {
            return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );
        }

        if (state.sortBy === "oldest") {
            return (
                new Date(a.createdAt) -
                new Date(b.createdAt)
            );
        }

        if (state.sortBy === "az") {
            return a.title.localeCompare(
                b.title,
                undefined,
                { sensitivity: "base" }
            );
        }

        if (state.sortBy === "za") {
            return b.title.localeCompare(
                a.title,
                undefined,
                { sensitivity: "base" }
            );
        }

        if (state.sortBy === "updated") {
            return (
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
            );
        }

        return 0;
    });
}

/* =========================================================
   RENDER NOTES
   ========================================================= */

function renderNotes() {
    const notes = getVisibleNotes();

    elements.notesContainer.replaceChildren();

    if (notes.length === 0) {
        renderEmptyState();
        return;
    }

    notes.forEach((note) => {
        elements.notesContainer.appendChild(
            createNoteCard(note)
        );
    });

    applyViewMode();
}

/* =========================================================
   CREATE NOTE CARD
   ========================================================= */

function createNoteCard(note) {
    const article = document.createElement("article");

    article.className = "note-card";

    if (note.color !== "default") {
        article.classList.add(
            `color-${note.color}`
        );
    }

    if (note.deleted) {
        article.classList.add("trash-card");
    }

    article.dataset.id = note.id;

    const content = document.createElement("div");
    content.className = "note-content";

    /* Top section */
    const top = document.createElement("div");
    top.className = "note-card-top";

    const badges = document.createElement("div");
    badges.className = "note-badges";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "note-badge";
    categoryBadge.textContent = note.category;

    badges.appendChild(categoryBadge);

    if (note.pinned && !note.deleted) {
        const pinnedBadge = document.createElement("span");
        pinnedBadge.className =
            "note-badge pinned-badge";

        pinnedBadge.textContent = "Pinned";
        badges.appendChild(pinnedBadge);
    }

    const actions = document.createElement("div");
    actions.className = "note-actions";

    if (!note.deleted) {
        const pinButton = createNoteActionButton(
            "pin",
            note.pinned
                ? "Unpin note"
                : "Pin note",
            note.pinned
                ? "fa-solid fa-thumbtack"
                : "fa-solid fa-thumbtack",
            note.pinned
        );

        const favoriteButton =
            createNoteActionButton(
                "favorite",
                note.favorite
                    ? "Remove favorite"
                    : "Add favorite",
                note.favorite
                    ? "fa-solid fa-star"
                    : "fa-regular fa-star",
                note.favorite
            );

        actions.append(
            pinButton,
            favoriteButton
        );
    }

    top.append(badges, actions);

    /* Title */
    const title = document.createElement("h3");
    title.className = "note-title";
    title.textContent = note.title;

    /* Preview */
    const preview = document.createElement("p");
    preview.className = "note-preview";
    preview.textContent =
        note.content || "No content";

    /* Footer */
    const footer = document.createElement("div");
    footer.className = "note-footer";

    const date = document.createElement("span");
    date.className = "note-date";

    const dateIcon = document.createElement("i");
    dateIcon.className =
        "fa-regular fa-clock";

    const dateText = document.createElement("span");
    dateText.textContent = formatDate(note.updatedAt);

    date.append(dateIcon, dateText);

    const footerActions =
        document.createElement("div");

    footerActions.className =
        "note-footer-actions";

    if (note.deleted) {
        const restoreButton =
            createFooterButton(
                "restore",
                "Restore note",
                "fa-solid fa-rotate-left"
            );

        const permanentButton =
            createFooterButton(
                "permanent-delete",
                "Permanently delete",
                "fa-solid fa-trash-can"
            );

        footerActions.append(
            restoreButton,
            permanentButton
        );
    } else {
        const editButton =
            createFooterButton(
                "edit",
                "Edit note",
                "fa-solid fa-pen"
            );

        const copyButton =
            createFooterButton(
                "copy",
                "Copy note",
                "fa-regular fa-copy"
            );

        const exportButton =
            createFooterButton(
                "export",
                "Export note",
                "fa-solid fa-download"
            );

        const deleteButton =
            createFooterButton(
                "delete",
                "Move to trash",
                "fa-solid fa-trash-can"
            );

        footerActions.append(
            editButton,
            copyButton,
            exportButton,
            deleteButton
        );
    }

    footer.append(date, footerActions);

    content.append(
        top,
        title,
        preview,
        footer
    );

    article.appendChild(content);

    return article;
}

/* =========================================================
   BUTTON HELPERS
   ========================================================= */

function createNoteActionButton(
    action,
    title,
    iconClass,
    active = false
) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "note-action";
    button.dataset.action = action;
    button.title = title;
    button.setAttribute("aria-label", title);

    if (active) {
        button.classList.add(
            `${action}-active`
        );
    }

    const icon = document.createElement("i");
    icon.className = iconClass;

    button.appendChild(icon);

    return button;
}

function createFooterButton(
    action,
    title,
    iconClass
) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "note-footer-btn";
    button.dataset.action = action;
    button.title = title;
    button.setAttribute("aria-label", title);

    const icon = document.createElement("i");
    icon.className = iconClass;

    button.appendChild(icon);

    return button;
}

/* =========================================================
   EMPTY STATES
   ========================================================= */

function renderEmptyState() {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    let iconClass = "fa-regular fa-note-sticky";
    let title = "No notes yet";
    let message =
        "Create your first note to get started.";
    let buttonText = "Create Note";
    let showButton = true;

    if (state.searchTerm) {
        iconClass =
            "fa-solid fa-magnifying-glass";
        title = "No notes found";
        message =
            "Try a different search term or clear your search.";
        buttonText = "Clear Search";
    } else if (state.currentView === "pinned") {
        iconClass =
            "fa-solid fa-thumbtack";
        title = "No pinned notes";
        message =
            "Pin important notes so you can find them quickly.";
    } else if (state.currentView === "favorites") {
        iconClass =
            "fa-regular fa-star";
        title = "No favorite notes";
        message =
            "Favorite notes you want to access regularly.";
    } else if (state.currentView === "recent") {
        iconClass =
            "fa-solid fa-clock-rotate-left";
        title = "No recent activity";
        message =
            "Recently updated notes will appear here.";
    } else if (state.currentView === "trash") {
        iconClass =
            "fa-solid fa-trash-can";
        title = "Trash is empty";
        message =
            "Deleted notes will appear here until permanently removed.";
        showButton = false;
    } else if (state.currentView.startsWith("category:")) {
        iconClass =
            "fa-regular fa-folder-open";
        title = "No notes in this category";
        message =
            "Create a note and assign it to this category.";
    }

    const icon = document.createElement("div");
    icon.className = "empty-icon";

    const iconElement = document.createElement("i");
    iconElement.className = iconClass;

    icon.appendChild(iconElement);

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = message;

    wrapper.append(
        icon,
        heading,
        paragraph
    );

    if (showButton) {
        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "primary-btn";

        if (state.searchTerm) {
            button.innerHTML = "";
            const searchIcon =
                document.createElement("i");

            searchIcon.className =
                "fa-solid fa-xmark";

            button.append(
                searchIcon,
                document.createTextNode(
                    buttonText
                )
            );

            button.addEventListener(
                "click",
                clearSearch
            );
        } else {
            button.innerHTML = "";

            const plusIcon =
                document.createElement("i");

            plusIcon.className =
                "fa-solid fa-plus";

            button.append(
                plusIcon,
                document.createTextNode(
                    buttonText
                )
            );

            button.addEventListener(
                "click",
                openNewNote
            );
        }

        wrapper.appendChild(button);
    }

    elements.notesContainer.appendChild(
        wrapper
    );
}

/* =========================================================
   NOTE CARD EVENTS
   ========================================================= */

function handleNoteContainerClick(event) {
    const actionButton =
        event.target.closest(
            "[data-action]"
        );

    const card =
        event.target.closest(".note-card");

    if (!card) {
        return;
    }

    const noteId = card.dataset.id;

    if (!actionButton) {
        openEditNote(noteId);
        return;
    }

    const action =
        actionButton.dataset.action;

    switch (action) {
        case "pin":
            togglePin(noteId);
            break;

        case "favorite":
            toggleFavorite(noteId);
            break;

        case "edit":
            openEditNote(noteId);
            break;

        case "copy":
            copyNote(noteId);
            break;

        case "export":
            exportNote(noteId);
            break;

        case "delete":
            confirmDelete(noteId);
            break;

        case "restore":
            restoreNote(noteId);
            break;

        case "permanent-delete":
            confirmPermanentDelete(noteId);
            break;

        default:
            break;
    }
}

/* =========================================================
   CREATE NEW NOTE
   ========================================================= */

function openNewNote() {
    state.editingNoteId = null;
    state.selectedColor = "default";

    resetEditor();

    elements.editorEyebrow.textContent =
        "NEW NOTE";

    elements.editorTitle.textContent =
        "Create a new note";

    elements.editorDeleteBtn.classList.add(
        "hidden"
    );

    elements.editorCopyBtn.classList.add(
        "hidden"
    );

    elements.editorExportBtn.classList.add(
        "hidden"
    );

    elements.editorFavoriteBtn.classList.add(
        "hidden"
    );

    elements.editorPinBtn.classList.add(
        "hidden"
    );

    elements.editorSaveBtn.innerHTML = "";

    const icon =
        document.createElement("i");

    icon.className = "fa-solid fa-check";

    elements.editorSaveBtn.append(
        icon,
        document.createTextNode(" Save Note")
    );

    elements.editorBackdrop.classList.remove(
        "hidden"
    );

    updateColorPicker();
    updateCharacterCount();

    requestAnimationFrame(() => {
        elements.noteTitleInput.focus();
    });
}

/* =========================================================
   EDIT NOTE
   ========================================================= */

function openEditNote(noteId) {
    const note = findNote(noteId);

    if (!note || note.deleted) {
        return;
    }

    state.editingNoteId = note.id;
    state.selectedColor = note.color;

    elements.editorEyebrow.textContent =
        "EDIT NOTE";

    elements.editorTitle.textContent =
        "Edit your note";

    elements.noteTitleInput.value =
        note.title;

    elements.noteContentInput.value =
        note.content;

    elements.noteCategoryInput.value =
        note.category;

    elements.editorDeleteBtn.classList.remove(
        "hidden"
    );

    elements.editorCopyBtn.classList.remove(
        "hidden"
    );

    elements.editorExportBtn.classList.remove(
        "hidden"
    );

    elements.editorFavoriteBtn.classList.remove(
        "hidden"
    );

    elements.editorPinBtn.classList.remove(
        "hidden"
    );

    updateEditorButtons(note);
    updateEditorDate(note);
    updateColorPicker();
    updateCharacterCount();
    clearValidationErrors();

    elements.editorBackdrop.classList.remove(
        "hidden"
    );

    requestAnimationFrame(() => {
        elements.noteTitleInput.focus();
    });
}

/* =========================================================
   RESET EDITOR
   ========================================================= */

function resetEditor() {
    elements.noteTitleInput.value = "";
    elements.noteContentInput.value = "";

    populateCategorySelect();

    elements.noteCategoryInput.value =
        state.categories[0] || "Other";

    elements.editorDateInfo.textContent =
        "Not saved yet";

    clearValidationErrors();

    setSaveStatus("Saved");
}

/* =========================================================
   CLOSE EDITOR
   ========================================================= */

function closeEditor() {
    if (
        state.editingNoteId &&
        state.autoSaveTimer
    ) {
        clearTimeout(state.autoSaveTimer);
        state.autoSaveTimer = null;
    }

    elements.editorBackdrop.classList.add(
        "hidden"
    );

    state.editingNoteId = null;
    state.selectedColor = "default";
}

/* =========================================================
   SAVE NOTE
   ========================================================= */

function saveCurrentNote() {
    if (!validateEditor()) {
        return;
    }

    const title =
        elements.noteTitleInput.value.trim();

    const content =
        elements.noteContentInput.value.trim();

    const category =
        elements.noteCategoryInput.value;

    const now = new Date().toISOString();

    if (state.editingNoteId) {
        const note =
            findNote(state.editingNoteId);

        if (!note) {
            return;
        }

        note.title = title;
        note.content = content;
        note.category = category;
        note.color = state.selectedColor;
        note.updatedAt = now;

        saveNotes();
        updateCounts();
        renderNotes();

        updateEditorDate(note);
        setSaveStatus("Saved");

        showToast(
            "Note updated successfully.",
            "success"
        );
    } else {
        const note = {
            id: generateId(),
            title,
            content,
            category,
            color: state.selectedColor,
            pinned: false,
            favorite: false,
            deleted: false,
            createdAt: now,
            updatedAt: now,
            deletedAt: null
        };

        state.notes.unshift(note);

        saveNotes();
        updateCounts();
        updatePageHeader();
        renderNotes();

        showToast(
            "Note created successfully.",
            "success"
        );
    }

    closeEditor();
}

/* =========================================================
   VALIDATION
   ========================================================= */

function validateEditor() {
    clearValidationErrors();

    let valid = true;

    const title =
        elements.noteTitleInput.value.trim();

    const content =
        elements.noteContentInput.value.trim();

    const category =
        elements.noteCategoryInput.value;

    if (!title) {
        showFieldError(
            elements.noteTitleInput,
            elements.titleError
        );

        valid = false;
    }

    if (!content) {
        showFieldError(
            elements.noteContentInput,
            elements.contentError
        );

        valid = false;
    }

    if (!category) {
        showFieldError(
            elements.noteCategoryInput,
            elements.categoryError
        );

        valid = false;
    }

    return valid;
}

function showFieldError(input, error) {
    input.classList.add("input-error");
    error.classList.remove("hidden");
}

function clearValidationErrors() {
    [
        elements.noteTitleInput,
        elements.noteCategoryInput,
        elements.noteContentInput
    ].forEach((input) => {
        input.classList.remove(
            "input-error"
        );
    });

    [
        elements.titleError,
        elements.categoryError,
        elements.contentError
    ].forEach((error) => {
        error.classList.add("hidden");
    });
}

/* =========================================================
   EDITOR INPUT / AUTO SAVE
   ========================================================= */

function handleEditorInput() {
    clearValidationErrors();

    if (!state.editingNoteId) {
        return;
    }

    scheduleAutoSave();
}

function handleContentInput() {
    updateCharacterCount();
    clearValidationErrors();

    if (!state.editingNoteId) {
        return;
    }

    scheduleAutoSave();
}

function updateCharacterCount() {
    const length =
        elements.noteContentInput.value.length;

    elements.characterCount.textContent =
        `${length} / ${MAX_CONTENT_LENGTH} characters`;

    if (length >= MAX_CONTENT_LENGTH) {
        elements.characterCount.style.color =
            "var(--danger)";
    } else {
        elements.characterCount.style.color =
            "";
    }
}

function scheduleAutoSave() {
    if (state.autoSaveTimer) {
        clearTimeout(
            state.autoSaveTimer
        );
    }

    setSaveStatus("Saving...");

    state.autoSaveTimer = setTimeout(
        autoSaveCurrentNote,
        900
    );
}

function autoSaveCurrentNote() {
    state.autoSaveTimer = null;

    const note =
        findNote(state.editingNoteId);

    if (!note) {
        return;
    }

    const title =
        elements.noteTitleInput.value.trim();

    const content =
        elements.noteContentInput.value.trim();

    const category =
        elements.noteCategoryInput.value;

    if (!title || !content || !category) {
        setSaveStatus("Unsaved");
        return;
    }

    note.title = title;
    note.content = content;
    note.category = category;
    note.color = state.selectedColor;
    note.updatedAt =
        new Date().toISOString();

    saveNotes();
    updateCounts();
    renderNotes();
    updateEditorDate(note);

    setSaveStatus("Saved");
}

function setSaveStatus(status) {
    elements.saveStatus.replaceChildren();

    const icon =
        document.createElement("i");

    if (status === "Saving...") {
        icon.className =
            "fa-solid fa-spinner fa-spin";
    } else if (status === "Saved") {
        icon.className =
            "fa-solid fa-cloud";
    } else {
        icon.className =
            "fa-solid fa-circle-exclamation";
    }

    elements.saveStatus.append(
        icon,
        document.createTextNode(` ${status}`)
    );
}

/* =========================================================
   COLOR
   ========================================================= */

function handleColorSelection(event) {
    const button =
        event.target.closest(
            ".color-option"
        );

    if (!button) {
        return;
    }

    state.selectedColor =
        button.dataset.color;

    updateColorPicker();

    if (state.editingNoteId) {
        scheduleAutoSave();
    }
}

function updateColorPicker() {
    document.querySelectorAll(
        ".color-option"
    ).forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.color ===
                state.selectedColor
        );
    });
}

/* =========================================================
   EDITOR DATE
   ========================================================= */

function updateEditorDate(note) {
    if (!note) {
        elements.editorDateInfo.textContent =
            "Not saved yet";
        return;
    }

    elements.editorDateInfo.textContent =
        `Last saved ${formatDate(note.updatedAt)}`;
}

/* =========================================================
   EDITOR BUTTON STATES
   ========================================================= */

function updateEditorButtons(note) {
    elements.editorFavoriteBtn.innerHTML = "";

    const favoriteIcon =
        document.createElement("i");

    favoriteIcon.className =
        note.favorite
            ? "fa-solid fa-star"
            : "fa-regular fa-star";

    elements.editorFavoriteBtn.append(
        favoriteIcon,
        document.createTextNode(
            note.favorite
                ? " Unfavorite"
                : " Favorite"
        )
    );

    elements.editorPinBtn.innerHTML = "";

    const pinIcon =
        document.createElement("i");

    pinIcon.className =
        "fa-solid fa-thumbtack";

    elements.editorPinBtn.append(
        pinIcon,
        document.createTextNode(
            note.pinned
                ? " Unpin"
                : " Pin"
        )
    );
}

/* =========================================================
   FIND NOTE
   ========================================================= */

function findNote(noteId) {
    return state.notes.find(
        (note) => note.id === noteId
    );
}

/* =========================================================
   PIN
   ========================================================= */

function togglePin(noteId) {
    const note = findNote(noteId);

    if (!note || note.deleted) {
        return;
    }

    note.pinned = !note.pinned;
    note.updatedAt =
        new Date().toISOString();

    saveNotes();
    updateCounts();
    renderNotes();

    showToast(
        note.pinned
            ? "Note pinned."
            : "Note unpinned.",
        "success"
    );
}

function togglePinFromEditor() {
    if (!state.editingNoteId) {
        return;
    }

    const note =
        findNote(state.editingNoteId);

    if (!note) {
        return;
    }

    note.pinned = !note.pinned;
    note.updatedAt =
        new Date().toISOString();

    saveNotes();
    updateCounts();
    renderNotes();
    updateEditorButtons(note);
    updateEditorDate(note);

    showToast(
        note.pinned
            ? "Note pinned."
            : "Note unpinned.",
        "success"
    );
}

/* =========================================================
   FAVORITES
   ========================================================= */

function toggleFavorite(noteId) {
    const note = findNote(noteId);

    if (!note || note.deleted) {
        return;
    }

    note.favorite = !note.favorite;
    note.updatedAt =
        new Date().toISOString();

    saveNotes();
    updateCounts();
    renderNotes();

    showToast(
        note.favorite
            ? "Added to favorites."
            : "Removed from favorites.",
        "success"
    );
}

function toggleFavoriteFromEditor() {
    if (!state.editingNoteId) {
        return;
    }

    const note =
        findNote(state.editingNoteId);

    if (!note) {
        return;
    }

    note.favorite = !note.favorite;
    note.updatedAt =
        new Date().toISOString();

    saveNotes();
    updateCounts();
    renderNotes();
    updateEditorButtons(note);
    updateEditorDate(note);

    showToast(
        note.favorite
            ? "Added to favorites."
            : "Removed from favorites.",
        "success"
    );
}

/* =========================================================
   DELETE
   ========================================================= */

function confirmDelete(noteId) {
    const note = findNote(noteId);

    if (!note) {
        return;
    }

    openConfirm({
        title: "Move note to trash?",
        message:
            `"${note.title}" will be moved to Recently Deleted. You can restore it later.`,
        actionText: "Move to Trash",
        callback: () => moveToTrash(noteId)
    });
}

function moveToTrash(noteId) {
    const note = findNote(noteId);

    if (!note) {
        return;
    }

    note.deleted = true;
    note.deletedAt =
        new Date().toISOString();
    note.updatedAt =
        new Date().toISOString();

    saveNotes();
    updateCounts();
    updatePageHeader();
    renderNotes();

    showToast(
        "Note moved to trash.",
        "success"
    );
}

function deleteFromEditor() {
    if (!state.editingNoteId) {
        return;
    }

    const note =
        findNote(state.editingNoteId);

    if (!note) {
        return;
    }

    closeEditor();

    confirmDelete(note.id);
}

/* =========================================================
   RESTORE
   ========================================================= */

function restoreNote(noteId) {
    const note = findNote(noteId);

    if (!note) {
        return;
    }

    note.deleted = false;
    note.deletedAt = null;
    note.updatedAt =
        new Date().toISOString();

    saveNotes();
    updateCounts();
    updatePageHeader();
    renderNotes();

    showToast(
        "Note restored successfully.",
        "success"
    );
}

/* =========================================================
   PERMANENT DELETE
   ========================================================= */

function confirmPermanentDelete(noteId) {
    const note = findNote(noteId);

    if (!note) {
        return;
    }

    openConfirm({
        title: "Delete permanently?",
        message:
            `"${note.title}" will be permanently deleted. This action cannot be undone.`,
        actionText: "Delete Permanently",
        callback: () =>
            permanentlyDelete(noteId)
    });
}

function permanentlyDelete(noteId) {
    const index =
        state.notes.findIndex(
            (note) => note.id === noteId
        );

    if (index === -1) {
        return;
    }

    state.notes.splice(index, 1);

    saveNotes();
    updateCounts();
    renderNotes();

    showToast(
        "Note permanently deleted.",
        "success"
    );
}

/* =========================================================
   EMPTY TRASH
   ========================================================= */

function confirmEmptyTrash() {
    const deletedCount =
        state.notes.filter(
            (note) => note.deleted
        ).length;

    if (!deletedCount) {
        showToast(
            "Trash is already empty.",
            "info"
        );
        return;
    }

    openConfirm({
        title: "Empty trash?",
        message:
            `${deletedCount} note${deletedCount === 1 ? "" : "s"} will be permanently deleted. This action cannot be undone.`,
        actionText: "Empty Trash",
        callback: emptyTrash
    });
}

function emptyTrash() {
    state.notes = state.notes.filter(
        (note) => !note.deleted
    );

    saveNotes();
    updateCounts();
    updatePageHeader();
    renderNotes();

    showToast(
        "Trash emptied successfully.",
        "success"
    );
}

/* =========================================================
   COPY
   ========================================================= */

async function copyNote(noteId) {
    const note = findNote(noteId);

    if (!note) {
        return;
    }

    const text =
        `${note.title}\n\n${note.content}`;

    try {
        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Note copied successfully.",
            "success"
        );
    } catch (error) {
        fallbackCopy(text);
    }
}

async function copyCurrentNote() {
    if (!state.editingNoteId) {
        const title =
            elements.noteTitleInput.value.trim();

        const content =
            elements.noteContentInput.value;

        if (!title && !content) {
            showToast(
                "There is nothing to copy.",
                "warning"
            );
            return;
        }

        try {
            await navigator.clipboard.writeText(
                `${title}\n\n${content}`
            );

            showToast(
                "Note copied successfully.",
                "success"
            );
        } catch {
            fallbackCopy(
                `${title}\n\n${content}`
            );
        }

        return;
    }

    copyNote(state.editingNoteId);
}

function fallbackCopy(text) {
    const textarea =
        document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();

    try {
        document.execCommand("copy");

        showToast(
            "Note copied successfully.",
            "success"
        );
    } catch {
        showToast(
            "Could not copy the note.",
            "error"
        );
    }

    textarea.remove();
}

/* =========================================================
   EXPORT
   ========================================================= */

function exportNote(noteId) {
    const note = findNote(noteId);

    if (!note) {
        return;
    }

    downloadNoteAsText(note);
}

function exportCurrentNote() {
    if (state.editingNoteId) {
        const note =
            findNote(state.editingNoteId);

        if (note) {
            downloadNoteAsText(note);
        }

        return;
    }

    const title =
        elements.noteTitleInput.value.trim();

    const content =
        elements.noteContentInput.value.trim();

    const category =
        elements.noteCategoryInput.value;

    if (!title || !content) {
        showToast(
            "Save the note before exporting.",
            "warning"
        );
        return;
    }

    downloadNoteAsText({
        title,
        content,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
}

function downloadNoteAsText(note) {
    const text = [
        `Title: ${note.title}`,
        `Category: ${note.category}`,
        `Date: ${formatFullDate(note.updatedAt)}`,
        "",
        "----------------------------------------",
        "",
        note.content
    ].join("\n");

    const blob =
        new Blob([text], {
            type: "text/plain;charset=utf-8"
        });

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        `${sanitizeFilename(note.title)}.txt`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast(
        "Note exported successfully.",
        "success"
    );
}

function sanitizeFilename(name) {
    return (
        name
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
            .trim()
            .slice(0, 80) ||
        "note"
    );
}

/* =========================================================
   CONFIRMATION MODAL
   ========================================================= */

function openConfirm({
    title,
    message,
    actionText,
    callback
}) {
    elements.confirmTitle.textContent =
        title;

    elements.confirmMessage.textContent =
        message;

    elements.confirmActionBtn.textContent =
        actionText;

    state.confirmCallback = callback;

    elements.confirmBackdrop.classList.remove(
        "hidden"
    );

    requestAnimationFrame(() => {
        elements.confirmActionBtn.focus();
    });
}

function closeConfirm() {
    elements.confirmBackdrop.classList.add(
        "hidden"
    );

    state.confirmCallback = null;
}

function executeConfirmation() {
    if (
        typeof state.confirmCallback ===
        "function"
    ) {
        const callback =
            state.confirmCallback;

        closeConfirm();
        callback();
    }
}

/* =========================================================
   TOAST NOTIFICATIONS
   ========================================================= */

function showToast(
    message,
    type = "success"
) {
    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    const iconWrapper =
        document.createElement("div");

    iconWrapper.className =
        "toast-icon";

    const icon =
        document.createElement("i");

    if (type === "success") {
        icon.className =
            "fa-solid fa-check";
    } else if (type === "warning") {
        icon.className =
            "fa-solid fa-triangle-exclamation";
    } else if (type === "error") {
        icon.className =
            "fa-solid fa-xmark";
    } else {
        icon.className =
            "fa-solid fa-circle-info";
    }

    iconWrapper.appendChild(icon);

    const text =
        document.createElement("span");

    text.className =
        "toast-message";

    text.textContent = message;

    const close =
        document.createElement("button");

    close.type = "button";
    close.className = "toast-close";
    close.setAttribute(
        "aria-label",
        "Close notification"
    );

    const closeIcon =
        document.createElement("i");

    closeIcon.className =
        "fa-solid fa-xmark";

    close.appendChild(closeIcon);

    close.addEventListener(
        "click",
        () => removeToast(toast)
    );

    toast.append(
        iconWrapper,
        text,
        close
    );

    elements.toastContainer.appendChild(
        toast
    );

    setTimeout(() => {
        removeToast(toast);
    }, 3500);
}

function removeToast(toast) {
    if (!toast.isConnected) {
        return;
    }

    toast.style.opacity = "0";
    toast.style.transform =
        "translateX(15px)";

    setTimeout(() => {
        toast.remove();
    }, 180);
}

/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    const now = new Date();
    const diff =
        now.getTime() - date.getTime();

    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;

    if (diff < minute) {
        return "Just now";
    }

    if (diff < hour) {
        const minutes =
            Math.floor(diff / minute);

        return `${minutes}m ago`;
    }

    if (diff < day) {
        const hours =
            Math.floor(diff / hour);

        return `${hours}h ago`;
    }

    if (diff < day * 7) {
        const days =
            Math.floor(diff / day);

        return `${days}d ago`;
    }

    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}

function formatFullDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function handleKeyboardShortcuts(event) {
    const isCtrlOrCommand =
        event.ctrlKey || event.metaKey;

    if (
        isCtrlOrCommand &&
        event.key.toLowerCase() === "n"
    ) {
        event.preventDefault();
        openNewNote();
        return;
    }

    if (
        isCtrlOrCommand &&
        event.key.toLowerCase() === "s"
    ) {
        event.preventDefault();

        if (
            !elements.editorBackdrop.classList.contains(
                "hidden"
            )
        ) {
            saveCurrentNote();
        }

        return;
    }

    if (
        isCtrlOrCommand &&
        (
            event.key.toLowerCase() === "f" ||
            event.key.toLowerCase() === "k"
        )
    ) {
        event.preventDefault();
        focusSearch();
        return;
    }

    if (event.key === "Escape") {
        if (
            !elements.confirmBackdrop.classList.contains(
                "hidden"
            )
        ) {
            closeConfirm();
            return;
        }

        if (
            !elements.editorBackdrop.classList.contains(
                "hidden"
            )
        ) {
            closeEditor();
            return;
        }

        if (state.sidebarOpen) {
            closeSidebar();
        }
    }
}

/* =========================================================
   INITIAL SELECT VALUES
   ========================================================= */

elements.sortSelect.value = state.sortBy;

/* =========================================================
   STORAGE EVENT
   Keep multiple NoteSpace tabs synchronized.
   ========================================================= */

window.addEventListener(
    "storage",
    (event) => {
        if (event.key === STORAGE_KEYS.notes) {
            try {
                const notes =
                    JSON.parse(
                        event.newValue || "[]"
                    );

                if (Array.isArray(notes)) {
                    state.notes =
                        notes.map(normalizeNote);

                    updateCounts();
                    renderNotes();
                }
            } catch {
                // Ignore malformed external storage updates.
            }
        }

        if (
            event.key ===
            STORAGE_KEYS.categories
        ) {
            try {
                const categories =
                    JSON.parse(
                        event.newValue || "[]"
                    );

                if (Array.isArray(categories)) {
                    state.categories =
                        categories;

                    populateCategorySelect();
                    renderCategories();
                    updateCounts();
                }
            } catch {
                // Ignore malformed external storage updates.
            }
        }

        if (
            event.key === STORAGE_KEYS.theme &&
            (
                event.newValue === "dark" ||
                event.newValue === "light"
            )
        ) {
            elements.body.dataset.theme =
                event.newValue;

            updateThemeIcon();
        }
    }
);