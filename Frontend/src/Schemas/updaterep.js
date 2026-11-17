import * as yup from "yup";

export const updaterepSchema = yup.object().shape({
  report_dispatch_date: yup.string().required(),
  report_dispatch_mode: yup.string().required(),
});
