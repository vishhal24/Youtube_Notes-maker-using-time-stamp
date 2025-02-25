document.addEventListener("DOMContentLoaded", () => {
    const noteInput = document.getElementById("noteInput");
    const addNoteBtn = document.getElementById("addNoteBtn");
    const clearNotesBtn = document.getElementById("clearNotesBtn");
    const saveNotesBtn = document.getElementById("saveNotesBtn");
    const notesContainer = document.getElementById("notes");
    
    let notes = [];
    
    // Load saved notes from storage on startup
    chrome.storage.local.get("notes", (result) => {
      if (result.notes) {
        notes = result.notes;
        renderNotes();
      }
    });
    
    // Add note with current video timestamp
    addNoteBtn.addEventListener("click", () => {
      const noteText = noteInput.value.trim();
      if (!noteText) {
        alert("Please enter a note.");
        return;
      }
      
      // Query active tab to get YouTube timestamp
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: getCurrentTimestamp
        }, (results) => {
          let timestamp = "00:00";
          if (results && results[0] && results[0].result) {
            timestamp = results[0].result;
          }
          const note = { timestamp, text: noteText };
          notes.push(note);
          renderNotes();
          noteInput.value = "";
          // Save notes to Chrome storage
          chrome.storage.local.set({ notes });
        });
      });
    });
    
    // Clear all notes
    clearNotesBtn.addEventListener("click", () => {
      if (confirm("Clear all notes?")) {
        notes = [];
        renderNotes();
        chrome.storage.local.set({ notes });
      }
    });
    
    // Download notes as JSON file
    saveNotesBtn.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "youtube_notes.json");
      downloadAnchor.click();
    });
    
    // Render the list of notes in the popup
    function renderNotes() {
      notesContainer.innerHTML = "";
      notes.forEach((note) => {
        const noteDiv = document.createElement("div");
        noteDiv.className = "note";
        noteDiv.innerHTML = `<span class="timestamp">${note.timestamp}</span> ${note.text}`;
        notesContainer.appendChild(noteDiv);
      });
    }
  });
  
  // This function is injected into the YouTube page to get the current video timestamp.
  // It looks for the element that displays the current time.
  function getCurrentTimestamp() {
    const timeElement = document.querySelector('.ytp-time-current');
    if (timeElement) {
      return timeElement.innerText;
    }
    return "00:00";
  }
  