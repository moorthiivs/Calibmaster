import * as yup from "yup";

export const userwopassSchema = yup.object().shape({
  name: yup.string().required().min(3),
  email: yup.string().email().required(),
  department: yup.string().required(),
});
