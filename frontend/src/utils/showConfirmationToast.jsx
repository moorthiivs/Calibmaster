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



import { Modal } from "antd";

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

export default showConfirmationDialog;
