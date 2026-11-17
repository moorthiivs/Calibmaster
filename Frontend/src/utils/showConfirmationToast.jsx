// import Swal from "sweetalert2";

// const showConfirmationDialog = async (message, targetSelector = null) => {
//   const swalOptions = {
//     title: "Are you sure?",
//     text: message,
//     icon: "warning",
//     showCancelButton: true,
//     confirmButtonColor: "#d33",
//     cancelButtonColor: "#3085d6",
//     confirmButtonText: "Yes, delete it!",
//     cancelButtonText: "Cancel",
//     target: document.body
//   };

//   // Apply target only if selector is provided
//   if (targetSelector) {
//     const targetElement = document.querySelector(targetSelector);
//     if (targetElement) {
//       swalOptions.target = targetElement;
//     }
//   }

//   const result = await Swal.fire({
//     ...swalOptions,
//     customClass: {
//       container: 'swal-high-zindex'
//     }
//   });
//   return result.isConfirmed;
// };

// export default showConfirmationDialog;



import React, { useState, useEffect } from 'react';
import { Modal, Switch } from "antd";
import { RestOutlined, DeleteOutlined } from '@ant-design/icons';

const showConfirmationDialog = (message, targetSelector = null) => {
  return new Promise((resolve) => {
    let container = undefined;

    if (targetSelector) {
      const targetElement = document.querySelector(targetSelector);
      if (targetElement) {
        container = targetElement;
      }
    }

    Modal.confirm({
      title: "Are you sure?",
      content: message,
      okText: "Yes, delete it!",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      centered: true,
      getContainer: container || document.body,
      onOk() {
        resolve(true);
      },
      onCancel() {
        resolve(false);
      }
    });
  });
};

const DeleteOptions = ({ onChange }) => {
  const [selected, setSelected] = useState('soft');
  
  const updateBtnColor = (isHard) => {
    setTimeout(() => {
      const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
      const btn = document.querySelector('.delete-confirm-modal .ant-modal-confirm-btns .ant-btn-primary');
      if (btn) {
        if (isHard) {
          btn.style.backgroundColor = '#ef4444'; 
          btn.style.borderColor = '#ef4444';
          btn.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
        } else {
          btn.style.backgroundColor = isDark ? '#374151' : '#0f172a'; 
          btn.style.borderColor = isDark ? '#374151' : '#0f172a';
          btn.style.boxShadow = 'none';
        }
      }

      const cancelBtn = document.querySelector('.delete-confirm-modal .ant-modal-confirm-btns .ant-btn-default');
      if (cancelBtn) {
        cancelBtn.style.color = isDark ? '#9ca3af' : '#4b5563';
        cancelBtn.style.backgroundColor = 'transparent';
      }
    }, 10);
  };

  useEffect(() => {
    updateBtnColor(selected === 'hard');
  }, [selected]);

  return (
    <div className="flex gap-4 mt-6">
      {/* Soft Delete Card */}
      <div 
        onClick={() => { setSelected('soft'); onChange(false); }}
        className={`flex-1 p-5 rounded-2xl border-[1.5px] cursor-pointer transition-all ${
          selected === 'soft' 
            ? 'border-gray-800 dark:border-gray-400 bg-white dark:bg-gray-800 shadow-sm' 
            : 'border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-[#1a1a1a]'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-4 transition-colors ${
          selected === 'soft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
        }`}>
           <RestOutlined className="text-lg" />
        </div>
        <h3 className={`font-bold m-0 mb-2 text-[15px] transition-colors ${
          selected === 'soft' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'
        }`}>Move to Trash</h3>
        <p className="text-gray-400 dark:text-gray-400 text-[13px] m-0 leading-relaxed">
          The item will be moved to the trash bin and can be <span className="font-medium text-gray-500 dark:text-gray-300">restored later</span>.
        </p>
      </div>

      {/* Hard Delete Card */}
      <div 
        onClick={() => { setSelected('hard'); onChange(true); }}
        className={`flex-1 p-5 rounded-2xl border-[1.5px] cursor-pointer transition-all ${
          selected === 'hard' 
            ? 'border-red-500 bg-red-50/20 dark:bg-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,1)]' 
            : 'border-gray-100 dark:border-gray-700/50 hover:border-red-200 dark:hover:border-red-900/50 bg-gray-50/50 dark:bg-[#1a1a1a] hover:bg-red-50/10 dark:hover:bg-red-900/20'
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-4 transition-colors ${
          selected === 'hard' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
        }`}>
           <DeleteOutlined className="text-lg" />
        </div>
        <h3 className={`font-bold m-0 mb-2 text-[15px] transition-colors ${
          selected === 'hard' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-500'
        }`}>Permanent Delete</h3>
        <p className="text-gray-400 dark:text-gray-400 text-[13px] m-0 leading-relaxed">
          The item will be <span className="text-red-500 dark:text-red-400 font-medium">completely removed</span> from the database.
        </p>
      </div>
    </div>
  );
};

export const showAdvancedDeleteDialog = (message, targetSelector = null) => {
  return new Promise((resolve) => {
    let container = undefined;

    if (targetSelector) {
      const targetElement = document.querySelector(targetSelector);
      if (targetElement) {
        container = targetElement;
      }
    }

    let isPermanent = false;

    Modal.confirm({
      className: 'delete-confirm-modal',
      title: null,
      icon: null,
      content: (
        <>
          <style>{`
            .dark .delete-confirm-modal .ant-modal-content {
              background-color: #1f1f1f !important;
              border: 1px solid #374151;
            }
            .dark .delete-confirm-modal .ant-modal-confirm-body .ant-modal-confirm-content {
              color: #e5e7eb !important;
            }
          `}</style>
          <div className="pt-2 w-full font-['Inter']">
            <h2 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 m-0 mb-1">Delete Confirmation</h2>
            <p className="text-gray-500 dark:text-gray-400 text-[14px] m-0 mb-2">{message}</p>
            <DeleteOptions onChange={(val) => { isPermanent = val; }} />
          </div>
        </>
      ),
      width: 520,
      okText: "Apply Selection",
      cancelText: "Cancel",
      okButtonProps: { 
        className: "bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-lg px-6 font-semibold shadow-none border-none h-10",
        style: { background: '#0f172a' } 
      },
      cancelButtonProps: { 
        className: "border-none text-gray-600 hover:bg-gray-100 rounded-lg px-6 font-semibold shadow-none h-10" 
      },
      centered: true,
      getContainer: container || document.body,
      onOk() {
        resolve({ isConfirmed: true, isPermanent });
      },
      onCancel() {
        resolve({ isConfirmed: false, isPermanent: false });
      }
    });
  });
};

export const showDuplicateDialog = (message, title = "Duplicate Item?") => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: title,
      content: message,
      okText: "Yes, Duplicate",
      cancelText: "Cancel",
      okButtonProps: { type: "primary", style: { backgroundColor: '#1890ff', borderColor: '#1890ff' } },
      centered: true,
      onOk() {
        resolve(true);
      },
      onCancel() {
        resolve(false);
      }
    });
  });
};

export default showConfirmationDialog;
