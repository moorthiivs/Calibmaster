import Swal from "sweetalert2";

// const showErrorDialog = async (title, message, icon, targetSelector = null,) => {
//     const swalOptions = {
//         title: title,
//         text: message,
//         icon: icon,
//         // showCancelButton: true,
//         // confirmButtonColor: "#d33",
//         // cancelButtonColor: "#3085d6",
//         // confirmButtonText: "Yes, delete it!",
//         // cancelButtonText: "Cancel",
//     };

//     // Apply target only if selector is provided
//     if (targetSelector) {
//         const targetElement = document.querySelector(targetSelector);
//         if (targetElement) {
//             swalOptions.target = targetElement;
//         }
//     }

//     const result = await Swal.fire(swalOptions);
//     return result.isConfirmed;
// };

// export default showErrorDialog;

const showErrorDialog = async (title, message, icon, targetSelector = null, useHtml = false) => {
    const swalOptions = {
        title,
        icon,
        ...(useHtml ? { html: message } : { text: message }),
    };

    if (targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            swalOptions.target = targetElement;
        }
    }

    const result = await Swal.fire(swalOptions);
    return result.isConfirmed;
};

export default showErrorDialog;
