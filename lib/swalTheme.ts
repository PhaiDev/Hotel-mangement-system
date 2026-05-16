import Swal from 'sweetalert2';

// Shared SweetAlert2 theme for SUMOTEL admin
export const swalTheme = {
  background: '#1a1916',
  color: '#f0ece8',
  confirmButtonColor: '#c9440f',
  cancelButtonColor: '#3a3832',
  iconColor: '#c9440f',
  customClass: {
    popup: 'sumotel-popup',
    title: 'sumotel-title',
    htmlContainer: 'sumotel-html',
    input: 'sumotel-input',
    confirmButton: 'sumotel-confirm',
    cancelButton: 'sumotel-cancel',
    actions: 'sumotel-actions',
  },
};

export const SwalStyled = Swal.mixin({
  ...swalTheme,
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster',
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster',
  },
});

// Global CSS for SweetAlert2 SUMOTEL theme
export const swalCSS = `
  .sumotel-popup {
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 16px !important;
    font-family: 'Inter', sans-serif !important;
    padding: 2rem !important;
  }
  .sumotel-title {
    font-size: 18px !important;
    font-weight: 600 !important;
    letter-spacing: 0.3px !important;
    color: #f0ece8 !important;
  }
  .sumotel-html {
    color: rgba(240,236,232,0.6) !important;
    font-size: 13px !important;
  }
  .sumotel-input, .swal2-input, .swal2-select, .swal2-textarea {
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 10px !important;
    color: #f0ece8 !important;
    font-size: 13px !important;
    padding: 10px 14px !important;
    transition: border-color 0.2s !important;
  }
  .sumotel-input:focus, .swal2-input:focus, .swal2-select:focus, .swal2-textarea:focus {
    border-color: rgba(201,68,15,0.5) !important;
    box-shadow: 0 0 0 3px rgba(201,68,15,0.1) !important;
    outline: none !important;
  }
  .swal2-select option {
    background: #1a1916 !important;
    color: #f0ece8 !important;
  }
  .sumotel-confirm {
    border-radius: 10px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    padding: 10px 24px !important;
    letter-spacing: 0.3px !important;
    transition: all 0.2s !important;
  }
  .sumotel-confirm:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(201,68,15,0.3) !important;
  }
  .sumotel-cancel {
    border-radius: 10px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    padding: 10px 24px !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
  }
  .sumotel-actions {
    gap: 8px !important;
  }
  .swal2-validation-message {
    background: rgba(201,68,15,0.1) !important;
    color: #f87060 !important;
    border-radius: 8px !important;
    font-size: 12px !important;
  }
  .swal2-icon {
    border-color: rgba(201,68,15,0.3) !important;
  }
  .swal2-icon.swal2-success .swal2-success-ring {
    border-color: rgba(26,122,74,0.3) !important;
  }
  .swal2-icon.swal2-success [class^="swal2-success-line"] {
    background-color: #1a7a4a !important;
  }
  /* Custom form labels */
  .swal-form-label {
    display: block;
    text-align: left;
    font-size: 11px;
    color: rgba(240,236,232,0.4);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
    margin-top: 14px;
  }
  .swal-form-label:first-child {
    margin-top: 0;
  }
  .swal-form-input {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #f0ece8;
    font-size: 13px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .swal-form-input:focus {
    border-color: rgba(201,68,15,0.5);
    box-shadow: 0 0 0 3px rgba(201,68,15,0.1);
  }
  .swal-form-select {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #f0ece8;
    font-size: 13px;
    padding: 10px 14px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .swal-form-select:focus {
    border-color: rgba(201,68,15,0.5);
  }
  .swal-form-select option {
    background: #1a1916;
    color: #f0ece8;
  }
  .swal-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .swal-form-divider {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.06);
    margin: 18px 0 4px;
  }

  /* Light room form popup */
  .sumotel-room-popup {
    background: #f5f2ef !important;
    color: #221f1b !important;
    border: 1px solid #d8d0c8 !important;
    border-radius: 18px !important;
    width: min(640px, 94vw) !important;
    padding: 0 !important;
    overflow: hidden !important;
    font-family: 'Prompt', 'Noto Sans Thai', sans-serif !important;
  }
  .sumotel-room-title {
    margin: 0 !important;
    padding: 16px 18px !important;
    border-bottom: 1px solid #ddd4cb !important;
    font-size: 26px !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
    color: #1f1d1a !important;
    text-align: left !important;
  }
  .sumotel-room-html {
    color: #72695f !important;
    font-size: 13px !important;
    margin: 0 !important;
    padding: 14px 18px 12px !important;
    text-align: left !important;
  }
  .sumotel-room-html .swal-form-label {
    color: #837a70 !important;
    text-transform: none !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
    margin-bottom: 6px !important;
    margin-top: 10px !important;
  }
  .sumotel-room-html .swal-form-input {
    background: #f8f5f2 !important;
    border: 2px solid #d7d0c8 !important;
    color: #1f1d1a !important;
    border-radius: 12px !important;
    font-size: 16px !important;
    padding: 10px 12px !important;
  }
  .sumotel-room-html .swal-form-input::placeholder {
    color: #aaa298 !important;
  }
  .sumotel-room-html .swal-form-input:focus {
    border-color: #cc4a12 !important;
    box-shadow: 0 0 0 3px rgba(204, 74, 18, 0.14) !important;
  }
  .sumotel-room-html .swal-form-row {
    margin-top: 8px !important;
  }
  .room-form-layout {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 12px;
    align-items: start;
  }
  .room-preview-panel {
    align-self: stretch;
  }
  .room-preview-card {
    position: sticky;
    top: 8px;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #d8d0c8;
    background: #ece4dc;
    min-height: 170px;
  }
  .room-preview-image {
    width: 100%;
    height: 100%;
    min-height: 170px;
    max-height: 240px;
    object-fit: cover;
    display: block;
  }
  .room-preview-overlay {
    position: absolute;
    inset: auto 0 0 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0));
    padding: 16px 12px 10px;
  }
  .room-preview-title {
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
  }
  .sumotel-room-actions {
    border-top: 1px solid #ddd4cb !important;
    margin: 0 !important;
    padding: 12px 18px 16px !important;
    display: grid !important;
    grid-template-columns: 1fr 2fr !important;
    gap: 10px !important;
  }
  .sumotel-room-cancel {
    background: #f0ebe6 !important;
    color: #8a8178 !important;
    border: 2px solid #d9d1c9 !important;
    border-radius: 12px !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    padding: 10px !important;
    margin: 0 !important;
  }
  .sumotel-room-confirm {
    background: #cf4a11 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 12px !important;
    font-size: 16px !important;
    font-weight: 700 !important;
    padding: 10px !important;
    margin: 0 !important;
    box-shadow: 0 6px 14px rgba(207, 74, 17, 0.2) !important;
  }
  .sumotel-room-confirm:hover {
    transform: none !important;
  }
  @media (max-width: 760px) {
    .room-form-layout {
      grid-template-columns: 1fr;
    }
    .room-preview-card {
      min-height: 150px;
    }
    .room-preview-image {
      min-height: 150px;
      max-height: 200px;
    }
    .sumotel-room-title {
      font-size: 22px !important;
      padding: 14px 14px !important;
    }
    .sumotel-room-html {
      padding: 12px 14px !important;
    }
    .sumotel-room-html .swal-form-label {
      font-size: 13px !important;
    }
    .sumotel-room-html .swal-form-input {
      font-size: 15px !important;
      border-radius: 10px !important;
      padding: 9px 11px !important;
    }
    .sumotel-room-actions {
      grid-template-columns: 1fr !important;
      padding: 10px 14px 14px !important;
    }
    .sumotel-room-cancel, .sumotel-room-confirm {
      font-size: 15px !important;
      padding: 10px !important;
      border-radius: 10px !important;
    }
  }
`;
