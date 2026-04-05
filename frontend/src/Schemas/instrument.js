import * as yup from "yup";

export const instrumentSchema = yup.object().shape({

    instrument_name: yup.string().min(3).required(),

    instrument_uom_id: yup.number().required(),
    instrument_discipline_id: yup.number(),
    instrument_group_id: yup.number(),
});
