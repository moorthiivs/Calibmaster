export default function accreditationDetailValidation(input) {
    let validationError = {};

    if (input.accreditationNumber == "") {
        validationError.accreditationNumber = "Enter the input";
    }
    else if (input.accreditationNumber.includes("TC-") || input.accreditationNumber.includes("CC-") || input.accreditationNumber.includes("RC-")) {
        validationError.accreditationNumber = ""
    }
    else {
        validationError.accreditationNumber = "Invalid, Character must be Captalize!"
    }
    if (input.currentYear > 1 && input.currentYear < 100) {
        validationError.currentYear = "";
    }
    else {
        validationError.currentYear = "Invalid Year"
    }
    if (input.location >= 0 && input.location <= 9 && input.location !== "") {
        validationError.location = "";
    }
    else {
        validationError.location = "Location must be with 0-9";
    }
    if (input.accreditedScope !== "") {
        validationError.accreditedScope = "";
    }
    else {
        validationError.accreditedScope = "Invalid";
    }
    if (input.ulrcount > 0) {
        validationError.ulrcount = ""
    }
    else {
        validationError.ulrcount = "Invalid";
    }
    return validationError;
}