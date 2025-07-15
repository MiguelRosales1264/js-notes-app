// Select DOM Elements
const addNewNote = document.getElementById('addNewNote');
const notesContainer = document.getElementById('notesContainer');
const popupContent = document.getElementById('popupContent');
const searchInput = document.getElementById('searchInput');
const noteCount = document.getElementById('noteCount');

const renderer = new marked.Renderer();
renderer.listitem = function (text, task, checked) {
    // Fix for [object Object] issue
    // If text is an object, extract task and checked from it
    if (typeof text === 'object' && text !== null) {
        task = text.task;
        checked = text.checked;
        text = text.text || String(text);
    }
    if (task) {
        return `
            <label class="checklist-item">
                <input type="checkbox" ${checked ? 'checked' : ''} />
                <span>${text}</span>
            </label>
        `;
    }
    return `<li>${text}</li>`;
};
marked.setOptions({ renderer, gfm: true });

// Create empty array to store the notes in memory
let notes = JSON.parse(localStorage.getItem('notes')) || [];
if (notes.length !== 0) { renderNotes(); }

// Function to convert markdown to plain text for editing (preserves checklists)
function markdownToPlainText(markdown) {
    return markdown
        .replace(/^#{1,6}\s+/gm, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove inline code
        .replace(/^\>\s+/gm, '') // Remove blockquotes
        .replace(/^\s*[-\*\+]\s+(?!\[[ xX]\])/gm, '• ') // Convert lists to bullets BUT preserve checklists
        .replace(/^\s*\d+\.\s+/gm, '• ') // Convert numbered lists to bullets
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
        .trim();
}

// Function to show markdown guide
function showMarkdownGuide() {
    showPopup(`
        <div class='markdown-guide'>
            <div class='popup-header'>
                <h3>📝 Markdown Guide</h3>
                <button onclick='closePopup()'>❌</button>
            </div>
            <div style="text-align: left; padding: 1rem;">
                <h4>Headers</h4>
                <div class="example">
                    <code># Header 1</code><br>
                    <code>## Header 2</code><br>
                    <code>### Header 3</code>
                </div>

                <h4>Text Formatting</h4>
                <div class="example">
                    <code>**Bold text**</code><br>
                    <code>*Italic text*</code><br>
                    <code>\`Inline code\`</code>
                </div>

                <h4>Lists</h4>
                <div class="example">
                    <code>- Bullet point</code><br>
                    <code>1. Numbered list</code><br>
                    <code>- [ ] Unchecked task</code><br>
                    <code>- [x] Checked task</code>
                </div>

                <h4>Quotes</h4>
                <div class="example">
                    <code>> This is a quote</code>
                </div>

                <h4>Links</h4>
                <div class="example">
                    <code>[Link text](https://example.com)</code>
                </div>
            </div>
        </div>
    `);
}

function updateNoteCount() {
    noteCount.textContent = `${notes.length} Notes`;
}

function showPopup(innerHTML) {
    if (popupContent.hasChildNodes()) { return; } // Avoids adding multiple layers of popup
    const popup = document.createElement('div');

    popup.className = 'popup';
    popup.innerHTML = innerHTML;
    popupContent.appendChild(popup);
}

function bindEnterToInput(input, callback) {
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default newline behavior
            callback();
        }
    });
}

function handleKeyBinds(id = null, titleInput, contentInput, button) {
    // Handle the button click
    button.addEventListener('click', () => {
        saveNote({
            id: id,
            title: titleInput.value,
            content: contentInput.value
        })
    });

    // Allow 'Enter' key to submit note as well
    // bindEnterToInput(titleInput, () => saveNote({
    //     id: id,
    //     title: titleInput.value,
    //     content: contentInput.value
    // }));
    // bindEnterToInput(contentInput, () => saveNote({
    //     id: id,
    //     title: titleInput.value,
    //     content: contentInput.value
    // }));
}

// Adds new notes and saves edited notes to notes array
function saveNote({ id = null, title, content }) {
    if (!title.trim()) { return; }

    if (id) {
        notes = notes.map(note =>
            note.id === id ? { ...note, title, content } : note
        );
    } else {
        notes.push({
            id: Date.now(),
            title,
            content,
            isDone: false,
            pinned: false,
        });
    }

    saveNotes();
    renderNotes();
    closePopup();
}

function createNoteObject(title, content) {
    saveNote({
        title: title,
        content: content,
    })
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes))
    updateNoteCount();
}

function addNotesPopup() {
    showPopup(`
        <div class='add-popup'>
            <div class='popup-header'>
                <h3>✏️ Add New Note</h3>
                <button onclick='closePopup()'>❌</button>
            </div>
            <div class="note-form">
                <input type="text" id="noteTitle" placeholder="Note title..." />
                
                <div class="view-toggle">
                    <button class="toggle-option active" data-view="edit">📝 Write</button>
                    <button class="toggle-option" data-view="preview">👁️ Preview</button>
                </div>
                
                <div class="edit-view">
                    <div class="view-header">
                        <div class="view-title">
                            <span id="viewTitle">📝 Write your note</span>
                        </div>
                        <button type="button" class="help-button" onclick="showMarkdownGuide()" title="Markdown Help">?</button>
                    </div>
                    
                    <textarea id="noteContent" placeholder="Write your note... (supports markdown)" style="display: block;"></textarea>
                    <div id="markdownPreview" class="markdown-preview" style="display: none;"></div>
                </div>
                
                <button id="addNoteBtn" type="button">Add Note</button>
            </div>
        </div>
    `);

    const noteTitleInput = document.getElementById('noteTitle');
    const noteContentInput = document.getElementById('noteContent');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const previewDiv = document.getElementById('markdownPreview');
    const viewTitle = document.getElementById('viewTitle');
    const toggleOptions = document.querySelectorAll('.toggle-option');

    let currentView = 'edit';

    // Function to update preview
    function updatePreview() {
        const content = noteContentInput.value;
        if (!previewDiv.hasAttribute('contenteditable')) {
            previewDiv.innerHTML = content ? marked.parse(content) : '';
        }
    }

    // Function to sync preview back to textarea
    function syncPreviewToTextarea() {
        if (previewDiv.hasAttribute('contenteditable')) {
            noteContentInput.value = previewDiv.textContent || '';
        }
    }

    // Toggle between edit and preview
    function switchView(view) {
        currentView = view;
        
        // Update toggle buttons
        toggleOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.view === view);
        });

        if (view === 'edit') {
            // Switch to text editing mode
            previewDiv.removeAttribute('contenteditable');
            noteContentInput.style.display = 'block';
            previewDiv.style.display = 'none';
            viewTitle.textContent = '📝 Write your note';
        } else {
            // Switch to live preview editing mode
            syncPreviewToTextarea(); // Sync any changes first
            updatePreview(); // Update the preview
            previewDiv.setAttribute('contenteditable', 'true');
            noteContentInput.style.display = 'none';
            previewDiv.style.display = 'block';
            viewTitle.textContent = '👁️ Live Preview (Editable)';
        }
    }

    // Add toggle event listeners
    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            switchView(option.dataset.view);
        });
    });

    // Update preview on input (for when switching to preview)
    noteContentInput.addEventListener('input', updatePreview);

    // Handle preview editing - sync back to textarea on input
    previewDiv.addEventListener('input', () => {
        if (previewDiv.hasAttribute('contenteditable')) {
            noteContentInput.value = previewDiv.textContent || '';
        }
    });

    // Handle paste in preview - convert to plain text
    previewDiv.addEventListener('paste', (e) => {
        if (previewDiv.hasAttribute('contenteditable')) {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            document.execCommand('insertText', false, text);
            syncPreviewToTextarea();
        }
    });

    // Initial preview update
    updatePreview();

    handleKeyBinds(null, noteTitleInput, noteContentInput, addNoteBtn);
}

function editNotePopup(id) {
    const note = notes.find((note) => note.id === id);
    if (!note) { return; }
    const { title, content } = note;
    const plainTextContent = markdownToPlainText(content);

    showPopup(`
        <div class='edit-popup'>
            <div class='popup-header'>
                <h3>✏️ Edit Note</h3>
                <button onclick='closePopup()'>❌</button>
            </div>

            <div class="note-form">
                <input type="text" id="editTitle" value='${title.replace(/'/g, "&#39;")}' />
                
                <div class="view-toggle">
                    <button class="toggle-option active" data-view="edit">📝 Edit</button>
                    <button class="toggle-option" data-view="preview">👁️ Preview</button>
                </div>
                
                <div class="edit-view">
                    <div class="view-header">
                        <div class="view-title">
                            <span id="viewTitle">📝 Edit your note</span>
                        </div>
                        <button type="button" class="help-button" onclick="showMarkdownGuide()" title="Markdown Help">?</button>
                    </div>
                    
                    <textarea id="editContent" style="display: block;">${plainTextContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                    <div id="markdownPreview" class="markdown-preview" style="display: none;"></div>
                </div>

                <button id='saveEditBtn' type='button'>Save Note</button>
            </div>
        </div>
    `);

    const editTitleInput = document.getElementById('editTitle');
    const editContentInput = document.getElementById('editContent');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const previewDiv = document.getElementById('markdownPreview');
    const viewTitle = document.getElementById('viewTitle');
    const toggleOptions = document.querySelectorAll('.toggle-option');

    let currentView = 'edit';

    // Function to update preview
    function updatePreview() {
        const content = editContentInput.value;
        if (!previewDiv.hasAttribute('contenteditable')) {
            previewDiv.innerHTML = content ? marked.parse(content) : '';
        }
    }

    // Function to sync preview back to textarea
    function syncPreviewToTextarea() {
        if (previewDiv.hasAttribute('contenteditable')) {
            editContentInput.value = previewDiv.textContent || '';
        }
    }

    // Toggle between edit and preview
    function switchView(view) {
        currentView = view;
        
        // Update toggle buttons
        toggleOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.view === view);
        });

        if (view === 'edit') {
            // Switch to text editing mode
            previewDiv.removeAttribute('contenteditable');
            editContentInput.style.display = 'block';
            previewDiv.style.display = 'none';
            viewTitle.textContent = '📝 Edit your note';
        } else {
            // Switch to live preview editing mode
            syncPreviewToTextarea(); // Sync any changes first
            updatePreview(); // Update the preview
            previewDiv.setAttribute('contenteditable', 'true');
            editContentInput.style.display = 'none';
            previewDiv.style.display = 'block';
            viewTitle.textContent = '👁️ Live Preview (Editable)';
        }
    }

    // Add toggle event listeners
    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            switchView(option.dataset.view);
        });
    });

    // Update preview on input (for when switching to preview)
    editContentInput.addEventListener('input', updatePreview);

    // Handle preview editing - sync back to textarea on input
    previewDiv.addEventListener('input', () => {
        if (previewDiv.hasAttribute('contenteditable')) {
            editContentInput.value = previewDiv.textContent || '';
        }
    });

    // Handle paste in preview - convert to plain text
    previewDiv.addEventListener('paste', (e) => {
        if (previewDiv.hasAttribute('contenteditable')) {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            document.execCommand('insertText', false, text);
            syncPreviewToTextarea();
        }
    });

    // Initial preview update
    updatePreview();

    handleKeyBinds(id, editTitleInput, editContentInput, saveEditBtn);
}

// To confirm deletion of selected note
function deleteNotePopup(id) {
    showPopup(`
        <div class='delete-popup'>
            <h3>Are you sure you want to delete this note?</h3>
            <div class='popup-actions'>
                <button onclick='deleteNote(${id})'>Yes</button>
                <button onclick='closePopup()'>No</button>
            </div>
        </div>
    `);
}

// Create deleteNote(). This DELETES note. Immediately
function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    popupContent.innerHTML = '';
    saveNotes();
    renderNotes();
}

function highlightMatch(text, query) {
    if (!query) { return text; }
    const pattern = new RegExp(`(${query})`, 'gi');
    return text.replace(pattern, '<mark>$1</mark>');
}

function createNoteElement(note, query = '') {
    const { id, title, content, isDone } = note;
    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.setAttribute('data-id', id);
    if (isDone) { noteElement.classList.add('done'); }

    const highlightedTitle = highlightMatch(title, query);
    const highlightedContent = highlightMatch(content, query);
    const contentHTML = marked.parse(highlightedContent);

    noteElement.innerHTML = `
        <div class='note-header'>
            <div class='note-title'>${highlightedTitle}</div>
            <button onclick='editNotePopup(${id})'>📝</button>
        </div>
        <div class='note-content' data-id='${id}'>${contentHTML}</div>
        <div class='note-actions'>
            <button onclick='toggleDone(${id})'>✅</button>
            <button onclick='deleteNotePopup(${id})'>🗑️</button>
        </div>
    `;

    // Add data-line attributes to checkboxes
    const noteContentDiv = noteElement.querySelector('.note-content');
    if (noteContentDiv) {
        const lines = content.split('\n');
        let checkboxIdx = 0;
        noteContentDiv.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            // Find the next checklist line
            for (let i = checkboxIdx; i < lines.length; i++) {
                if (/^- \[[ xX]\]/.test(lines[i])) {
                    checkbox.setAttribute('data-line', i);
                    checkboxIdx = i + 1;
                    break;
                }
            }
        });
    }
    return noteElement;
}

// Renders all notes or notes containing query value
function renderNotes(query = '') {
    notesContainer.innerHTML = ''; // Clears prev notes

    const filteredNotes = notes.filter((note) => {
        const titleMatch = typeof note.title === 'string' && note.title.toLowerCase().includes(query);
        const contentMatch = typeof note.content === 'string' && note.content.toLowerCase().includes(query);

        return titleMatch || contentMatch;
    });

    filteredNotes.forEach((note) => {
        const noteElement = createNoteElement(note, query);
        notesContainer.appendChild(noteElement);
    });
    saveNotes();
}

// Toggles if note done using note
function toggleDone(id) {
    notes = notes.map((note) =>
        note.id === id ? { ...note, isDone: !note.isDone } : note
    );
    saveNotes();
    renderNotes();
}

function closePopup() {
    popupContent.innerHTML = '';
}

document.addEventListener('keydown', (event) => {
    if (popupContent.hasChildNodes() && event.key === 'Escape') {
        closePopup();
    }
});

searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    renderNotes(query);
})

// Event delegation for checklist checkboxes
notesContainer.addEventListener('change', (event) => {
    if (event.target.matches('.note-content input[type="checkbox"]')) {
        const noteId = Number(event.target.closest('.note').getAttribute('data-id'));
        const lineIndex = Number(event.target.getAttribute('data-line'));
        if (isNaN(lineIndex)) { return; }
        const note = notes.find(n => n.id === noteId);
        if (!note) { return; }

        const lines = note.content.split('\n');
        lines[lineIndex] = /^- \[[xX]\]/.test(lines[lineIndex])
            ? lines[lineIndex].replace(/^- \[[xX]\]/, '- [ ]')
            : lines[lineIndex].replace(/^- \[[ ]\]/, '- [x]');
        note.content = lines.join('\n');

        saveNotes();
        renderNotes(searchInput.value.trim().toLowerCase());
    }
});



// Sortable.min.js Library
function updateNoteOrderFromDOM() {
    const reorderedNotes = [];
    const noteElements = notesContainer.querySelectorAll('div.note');

    noteElements.forEach((noteElement) => {
        const id = Number(noteElement.getAttribute('data-id'));
        const originalNote = notes.find((n) => n.id === id);
        if (originalNote) {
            reorderedNotes.push(originalNote);
        }
    });

    notes = reorderedNotes;
    saveNotes();
}

new Sortable(notesContainer, {
    animation: 150,
    ghostClass: 'dragging',
    onEnd: updateNoteOrderFromDOM
});