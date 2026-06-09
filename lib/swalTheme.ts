import Swal from 'sweetalert2';

// Shared SweetAlert2 theme for SUMOTEL admin
export const swalTheme = {
  background: '#fcfbf9',
  color: '#1a1916',
  confirmButtonColor: '#c9440f',
  cancelButtonColor: '#e2e0d8',
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
    background: #fcfbf9 !important;
    color: #1a1916 !important;
    border: 1px solid #e2e0d8 !important;
    border-radius: 20px !important;
    font-family: 'Prompt', 'Noto Sans Thai', sans-serif !important;
    padding: 2rem !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  }
  .sumotel-title {
    font-size: 20px !important;
    font-weight: 700 !important;
    letter-spacing: -0.2px !important;
    color: #1a1916 !important;
  }
  .sumotel-html {
    color: #8a8780 !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
  }
  .sumotel-input, .swal2-input, .swal2-select, .swal2-textarea {
    background: #ffffff !important;
    border: 2px solid #e2e0d8 !important;
    border-radius: 12px !important;
    color: #1a1916 !important;
    font-size: 14px !important;
    padding: 12px 16px !important;
    transition: all 0.2s !important;
    box-shadow: none !important;
  }
  .sumotel-input:focus, .swal2-input:focus, .swal2-select:focus, .swal2-textarea:focus {
    border-color: #c9440f !important;
    background: #ffffff !important;
  }
  .swal2-select option {
    background: #ffffff !important;
    color: #1a1916 !important;
  }
  .sumotel-confirm {
    border-radius: 12px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    padding: 12px 28px !important;
    letter-spacing: 0 !important;
    transition: all 0.2s !important;
    background-color: #c9440f !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(201, 68, 15, 0.2) !important;
  }
  .sumotel-confirm:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(201, 68, 15, 0.3) !important;
    background-color: #b03b0d !important;
  }
  .sumotel-cancel {
    background: #fafaf8 !important;
    color: #8a8780 !important;
    border-radius: 12px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    padding: 12px 28px !important;
    border: 1px solid #e2e0d8 !important;
  }
  .sumotel-cancel:hover {
    background: #f0f0ed !important;
    color: #1a1916 !important;
  }
  .sumotel-actions {
    gap: 10px !important;
    margin-top: 25px !important;
  }
  .swal2-validation-message {
    background: #fdf2f2 !important;
    color: #dc2626 !important;
    border-radius: 10px !important;
    font-size: 13px !important;
    padding: 12px !important;
    margin-top: 15px !important;
    border: 1px solid #fecaca !important;
  }
  .swal2-icon {
    margin-top: 10px !important;
  }
  .swal2-icon.swal2-warning {
    border-color: #f59e0b !important;
    color: #f59e0b !important;
  }
  .swal2-icon.swal2-error {
    border-color: #dc2626 !important;
    color: #dc2626 !important;
  }
  .swal2-icon.swal2-success {
    border-color: #1a7a4a !important;
    color: #1a7a4a !important;
  }
  .swal2-icon.swal2-success .swal2-success-ring {
    border-color: rgba(26, 122, 74, 0.2) !important;
  }
  .swal2-icon.swal2-success [class^="swal2-success-line"] {
    background-color: #1a7a4a !important;
  }

  /* Custom form components */
  .swal-form-label {
    display: block;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: #8a8780;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    margin-top: 15px;
  }
  .swal-form-input, .swal-form-select {
    width: 100%;
    background: #ffffff;
    border: 2px solid #e2e0d8;
    border-radius: 12px;
    color: #1a1916;
    font-size: 14px;
    padding: 12px 14px;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }
  .swal-form-input:focus, .swal-form-select:focus {
    border-color: #c9440f;
    box-shadow: 0 0 0 4px rgba(201, 68, 15, 0.1);
  }
  .swal-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  /* Room Form Specifics (Unified to Standard) */
  .sumotel-room-popup {
    background: #ffffff !important;
    color: #1a1916 !important;
    border: 1px solid #e2e0d8 !important;
    border-radius: 24px !important;
    width: min(680px, 94vw) !important;
    padding: 0 !important;
    overflow: hidden !important;
    font-family: 'Prompt', 'Noto Sans Thai', sans-serif !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  }
  .sumotel-room-title {
    margin: 0 !important;
    padding: 24px 24px !important;
    border-bottom: 1px solid #f0f0ed !important;
    font-size: 24px !important;
    font-weight: 800 !important;
    color: #1a1916 !important;
    text-align: left !important;
  }
  .sumotel-room-html {
    margin: 0 !important;
    padding: 20px 24px !important;
    text-align: left !important;
  }
  .sumotel-room-html .swal-form-label {
    margin-top: 12px !important;
  }
  .room-form-layout {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 20px;
    align-items: start;
  }
  .room-preview-panel {
    align-self: stretch;
  }
  .room-preview-card {
    position: sticky;
    top: 0;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e2e0d8;
    background: #fafaf8;
    min-height: 180px;
  }
  .room-preview-image {
    width: 100%;
    height: 100%;
    min-height: 180px;
    max-height: 280px;
    object-fit: cover;
    display: block;
  }
  .room-preview-overlay {
    position: absolute;
    inset: auto 0 0 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    padding: 20px 15px 12px;
  }
  .room-preview-title {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
  }
  .sumotel-room-actions {
    border-top: 1px solid #f0f0ed !important;
    margin: 0 !important;
    padding: 20px 24px 24px !important;
    display: flex !important;
    justify-content: flex-end !important;
    gap: 12px !important;
  }
  .sumotel-room-cancel {
    order: 1 !important;
    background: #fafaf8 !important;
    color: #8a8780 !important;
    border: 1px solid #e2e0d8 !important;
    border-radius: 14px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    padding: 12px 24px !important;
    margin: 0 !important;
    min-width: 100px !important;
  }
  .sumotel-room-confirm {
    order: 2 !important;
    background: #c9440f !important;
    color: #fff !important;
    border: none !important;
    border-radius: 14px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    padding: 12px 32px !important;
    margin: 0 !important;
    box-shadow: 0 4px 12px rgba(201, 68, 15, 0.2) !important;
  }
  .sumotel-room-confirm:hover {
    background: #b03b0d !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(201, 68, 15, 0.3) !important;
  }

  @media (max-width: 768px) {
    .room-form-layout {
      grid-template-columns: 1fr;
    }
    .sumotel-room-actions {
      flex-direction: column !important;
    }
    .sumotel-room-actions > button {
      width: 100% !important;
    }
  }
`;
