import * as yup from "yup";

export const itemSchema = yup.object().shape({
  description: yup.string().min(3).required(),
  make: yup.string().min(3).required(),
  model: yup.string().min(3).required(),
  serialno: yup.string().min(3).required(),
  idno: yup.string().min(3).required(),
  remarks: yup.string(),
  ulrno: yup.string().required(),
  masterlistId: yup.string().required(),
});
