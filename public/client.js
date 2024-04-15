// Function to fetch file list from the server
const fetchFileList = async () => {
  try {
      const response = await fetch('/fileList');
      const data = await response.json();
      return data;
  } catch (error) {
      console.error('Error fetching file list:', error);
      return [];
  }
};

/*// Function to handle file click
const handleFileClick = (fileKey) => {
    window.open(`/viewFile?key=${fileKey}`, '_blank');
};*/
// Function to handle file list selection
const handleSelectAll = () => {
    const checkboxes = document.querySelectorAll('input[name="selected-files"]');
    const selectAllCheckbox = document.getElementById('select-all');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAllCheckbox.checked;
    });
};
// Function to display file list in the UI
const displayFileList = (files) => {
  const fileListElement = document.getElementById('file-list');
  fileListElement.innerHTML = '';

  // Add select all checkbox
  const selectAllCheckbox = document.createElement('input');
  selectAllCheckbox.type = 'checkbox';
  selectAllCheckbox.id = 'select-all';
  selectAllCheckbox.addEventListener('change', handleSelectAll);
  fileListElement.appendChild(selectAllCheckbox);
  const selectAllLabel = document.createElement('label');
  selectAllLabel.htmlFor = 'select-all';
  selectAllLabel.textContent = 'Select All';
  fileListElement.appendChild(selectAllLabel);
  fileListElement.appendChild(document.createElement('br'));

  files.forEach(file => {
      const li = document.createElement('li');
      li.innerHTML = `<input type="checkbox" name="selected-files" value="${file.key}"> <a href="/viewFile?key=${file.key}" target="_blank">${file.key}</a>`;
      fileListElement.appendChild(li);
  });
};

// Function to handle delete button click
const handleDeleteClick = async () => {
  const selectedFiles = Array.from(document.querySelectorAll('input[name="selected-files"]:checked')).map(input => input.value);
  if (selectedFiles.length === 0) {
      alert('Please select files to delete.');
      return;
  }
  try {
      const response = await fetch('/deleteFiles', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fileKeys: selectedFiles }) // Change keys to fileKeys
      });
      if (!response.ok) {
          throw new Error('Failed to delete files');
      }
      const data = await response.json();
      alert(data.message);
      // Refresh the file list after deletion
      displayFileList(await fetchFileList());
  } catch (error) {
      console.error('Error deleting files:', error);
      alert('Error deleting files. Please try again.');
  }
};

// Add event listener to the delete button
const deleteButton = document.getElementById('delete-btn');
deleteButton.addEventListener('click', handleDeleteClick);

// Function to handle refresh button click
const handleRefreshClick = async () => {
  displayFileList(await fetchFileList());
};


// Function to handle upload button click
const handleUploadClick = async () => {
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      console.log("File uploaded successfully:", data.fileUrl);
      // Refresh the file list after upload
      handleRefreshClick();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
};

// Attach event listeners to buttons
document.getElementById('delete-btn').addEventListener('click', handleDeleteClick);
document.getElementById('refresh-btn').addEventListener('click', handleRefreshClick);
document.getElementById('upload-btn').addEventListener('click', handleUploadClick);

// Initial file list display on page load
async function loadFiles() {
    // Use await inside an async function
    displayFileList(await fetchFileList());
}
// Call function to execute the code
loadFiles();