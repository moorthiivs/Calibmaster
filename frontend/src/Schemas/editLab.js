import * as yup from "yup";

export const labSchema = yup.object().shape({

    labId: yup.number(),
    lab_name: yup.string().min(5),

    address1: yup.string(),

    city: yup.string(),
    state: yup.string(),
    country: yup.string(),
    pincode: yup.number(),

    lab_website: yup.string(),
    contact_email: yup.string().email(),
    contact_number1: yup.number(),
    contact_number2: yup.number(),

    // email_smtp_server_host: yup.string(),
    // email_smtp_server_port: yup.string(),
    // sender_email: yup.string(),
    // sender_password: yup.string(),

    gst_number: yup.string(),
    lab_active_flag: yup.boolean(),

    brand_logo_filename: yup.string(),
    brand_logo_mime_type: yup.string(),

    // other_logo1_image_filename: yup.string(),
    // other_logo1_image_mime_type: yup.string(),

    // other_logo2_image_filename: yup.string(),
    // other_logo2_image_mime_type: yup.string(),
});
