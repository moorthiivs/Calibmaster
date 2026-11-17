import * as yup from "yup";

export const labSchema = yup.object().shape({

  lab_name: yup.string().min(5).required(),

  address1: yup.string().required(),
  address2: yup.string(),
  address3: yup.string(),

  city: yup.string().required(),
  state: yup.string().required(),
  country: yup.string().required(),
  pincode: yup.number().required(),

  lab_website: yup.string().required(),
  contact_email: yup.string().email().required(),
  contact_number1: yup.number().required(),
  contact_number2: yup.number().required(),

  symbol: yup.string(),

  email_smtp_server_host: yup.string(),
  email_smtp_server_port: yup.string(),
  sender_email: yup.string(),
  sender_password: yup.string(),

  gst_number: yup.string().required(),
  lab_active_flag: yup.boolean().required(),

  brand_logo_filename: yup.string().required(),
  brand_logo_mime_type: yup.string().required(),

  other_logo1_image_filename: yup.string(),
  other_logo1_image_mime_type: yup.string(),

  other_logo2_image_filename: yup.string(),
  other_logo2_image_mime_type: yup.string(),
});
