// Select DOM Elements
const addNewNote = document.getElementById('addNewNote');
const notesContainer = document.getElementById('notesContainter');
const popupContent = document.getElementById('popupContent');

// Create empty array to store the notes in memory
let notes = JSON.parse(localStorage.getItem('notes')) || [];
if (notes.length !== 0 ) { renderNotes(); };

function showPopup(innerHTML) {
    if (popupContent.hasChildNodes()) { return; } // Avoids adding multiple layers of popup
    const popup = document.createElement('div');

    popup.className = 'popup';
    popup.innerHTML = innerHTML;
    popupContent.appendChild(popup);
}

function closePopup() {
    popupContent.innerHTML = '';
}

// Adds new notes and saves edited notes to notes array
function saveNote({ id = null, title, content }) {
    // Do not save if title is empty
    if (!title.trim()) { return; }

    if (id) {
        notes = notes.map(note =>
            note.id === id ? { ...note, title, content } : note
        );
    } else {
        notes.push({
            id: Date.now(),
            title,
            content
        });
    }

    saveNotes();
    renderNotes();
    closePopup();
}

function handleKeyBinds( id = null, titleInput, contentInput, button ) {
    // Handle the button click
    button.addEventListener('click', () => {
        saveNote();
    });

    // Allow 'Enter' key to submit note
    bindEnterToInput()
    bindEnterToInput()
}

function addNotesPopup() {
    showPopup(`
        <div class='add-popup'>
            <div class='popup-header'>
                <h3>Add New Note</h3>
                <button onclick='closePopup()'>❌</button>
            </div>
            <div class='note-form'>
                <input type='text' id='noteTitle' placeholder='Note title...'/>
                <textarea id='noteContent' placeholder='Write your note...'></textarea>
                <button id='addNoteBtn' type='button'>Add Note</button>
            </div>
        </div>
    `);

    const noteTitleInput = document.getElementById('noteTitle');
    const noteContentInput = document.getElementById('noteContent');
    const addNoteBtn = document.getElementById('addNoteBtn');

    handleKeyBinds();
}