import * as yup from "yup";

export const companySchema = yup.object().shape({
  companyname: yup.string().min(5).required(),
  email: yup.string().email().required(),
  address1: yup.string().min(3).required(),
  address2: yup.string().min(3).required(),
  address3: yup.string().min(3).required(),
});
