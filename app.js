// Select DOM Elements
const addNewNote = document.getElementById('addNewElement');

function showPopup(innerHTML) {
    if (popupContent.hasChildNodes()) { return; } // Avoids adding multiple layers of popup
    const popup = document.createElement('div');

    // popup.className = 'popup';
    popup.innerHTML = innerHTML;
    popupContent.appendChild(popup);
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

    handleKeyBinds();
}