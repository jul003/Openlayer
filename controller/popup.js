export function showPopup(title, message) {
    const popup = document.getElementById('custom-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupClose = document.getElementById('popup-close');
  
    // Isi konten popup
    popupTitle.textContent = title;
    popupMessage.innerHTML = message; // Gunakan innerHTML untuk mendukung HTML di dalam pesan
  
    // Tampilkan popup
    popup.style.display = 'flex';
  
    // Tutup popup ketika tombol "Close" diklik
    popupClose.addEventListener('click', () => {
      popup.style.display = 'none';
    });
  }
  

  