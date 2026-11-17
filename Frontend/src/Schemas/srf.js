import * as yup from "yup";

export const srfSchema = yup.object().shape({
  srfno: yup.number().required(),
  type: yup.string().required(),
  srfdate: yup.date().required(),
  company_id: yup.number().required(),
  contactperson: yup.string().required(),
  contactnumber: yup.number().min(10).required(),
  contactemail: yup.string().required(),
  department: yup.string(),
  reportcompany_id: yup.number().required(),
  customerdc: yup.string(),
  customerdcdate: yup.date().required(),
  agreeddate: yup.date(),
  statementofconflag: yup.boolean().required(),
  statmentofconfirmity: yup.string().nullable(),
  uncertainityflag: yup.boolean().required(),
  sendsrf: yup.boolean(),
  issueno: yup.string(),
  issuedate: yup.date(),
  amendno: yup.string(),
  amenddate: yup.date(),
});
