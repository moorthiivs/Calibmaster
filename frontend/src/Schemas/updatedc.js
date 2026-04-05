import * as yup from "yup";

export const updatedcSchema = yup.object().shape({
  dispatch_dc: yup.string().required().min(3),
  dispatch_date: yup.string().required(),
  dispatch_mode: yup.string().required(),
});
