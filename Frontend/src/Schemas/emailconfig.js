import * as yup from "yup";

export const emailconfigSchema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
  host: yup.string().required(),
  port: yup.number().required(),
});
