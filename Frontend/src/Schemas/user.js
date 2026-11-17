import * as yup from "yup";

export const userSchema = yup.object().shape({
  name: yup.string().required().min(3),
  email: yup.string().email().required(),
  password: yup.string().min(8).max(15).required(),
  department: yup.string().required(),
  labId: yup.number().required(),
  companyId: yup.string()
});
