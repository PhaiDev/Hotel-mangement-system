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
`;
