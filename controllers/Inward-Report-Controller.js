const { Op } = require("sequelize");
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const instrumentTypeModel = require("../models").instrument_type;
const instrument = require("../models").instrument;
const { format, parseISO, addDays, differenceInDays } = require('date-fns');


exports.getInwardReport = async (req, res) => {
    try {
        const { fromDate, toDate, date, customer, lab_id } = req.query;
        const whereSRF = {};
        // ✅ Date filter using date-fns
        if (fromDate && toDate) {
            const from = parseISO(fromDate);
            const to = parseISO(toDate);
            whereSRF.srf_date = { [Op.between]: [from, to] };
        }
        else if (date) {
            const parsedDate = parseISO(date);
            whereSRF.srf_date = {
                [Op.gte]: parsedDate,
                [Op.lt]: addDays(parsedDate, 1),
            };
        }

        if (lab_id) {
            whereSRF.lab_id = lab_id;
        }

        if (customer) {
            whereSRF.customer_id = customer;
        }

        const items = await Item.findAll({
            include: [
                {
                    model: instrumentTypeModel,
                    as: "intrument_type",
                    include: [
                        {
                            model: instrument,
                            as: "instrument",
                            attributes: ["instrument_name", "instrument_discipline_id", "instrument_group_id"]
                        }
                    ]
                },
                {
                    model: SRF,
                    as: "srf",
                    where: whereSRF,
                    include: [
                        "customer"
                    ]
                }
            ],
            order: [["srf_item_id", "ASC"]]
        });


        items.forEach((item, index) => {
            console.log(`Item #${index + 1}:`);
            // console.log(item.intrument_type.instrument, "item.intrument_type");
            // console.log(item.srf.customer, "item.srf.customer");
            // console.log(item.intrument_type?.instrument?.instrument_name, "item?.instrument_type?.instrument?.instrument_name");

            // console.log(item.url_number, "item.url_number");


        });
        const result = [];

        items.forEach((item) => {
            const srf = item.srf;


            //const dispatchDate = item.dispatch_date ? parseISO(item.dispatch_date) : null;
            //const agreedDate = item.agreed_completion_date ? parseISO(item.agreed_completion_date) : null;

            const dispatchDate = item.dispatch_date || null;
            const agreedDate = item.agreed_completion_date || null;


            let delayedDays = 0;
            if (dispatchDate && agreedDate && dispatchDate.toDateString() !== agreedDate.toDateString()) {
                delayedDays = differenceInDays(dispatchDate, agreedDate);
            }


            const formatSizeRange = (ranges) => {
                if (!Array.isArray(ranges)) return "";

                return ranges
                    .map(range => {
                        const uom = range.InstrumentparameterUOM || "";
                        return Object.entries(range)
                            .filter(([key]) => key !== "InstrumentUOMID" && key !== "InstrumentparameterUOM")
                            .map(([key, value]) => `${key}: ${value} ${uom}`)
                            .join(", ");
                    })
                    .join(", ");
            };

            console.log(item.url_number, "item.url_number");

            result.push({
                inwardNo: item.inward_no,
                date: srf.srf_date ? format(new Date(srf.srf_date), 'dd-MM-yyyy') : '-',
                time: srf.srf_date ? format(new Date(srf.srf_date), 'hh:mm a') : "-",
                customer: srf.customer.customer_name,
                contractAgreement: srf.contract_agreement,
                descriptionOfItem: item?.intrument_type?.instrument?.instrument_name,
                assignTo: item.calibration_done_by_empname || "-",
                expectedDeliveryDate: format(new Date(srf.agreed_completion_date), 'dd-MM-yyyy'),
                idNo: item.id_no,
                sizeRange: formatSizeRange(item.intrument_type?.ranges),
                make: item.make,
                completionDate: item.dispatch_date ? format(new Date(item.dispatch_date), 'dd-MM-yyyy') : "-",
                completionTime: item.dispatch_date ? format(new Date(item.dispatch_date), 'hh:mm a') : "-",
                reportNo: item.certificate_no || '-',
                ulrNo: item.url_number || '-',
                name: srf.created_by_login_name,
                dispatchedDate: item.dispatch_date ? format(new Date(item.dispatch_date), 'dd-MM-yyyy') : "-",
                condition: item.remarks || '-',
                customerReference: item.dispatch_dc || "-",
                delayedDays: delayedDays,
                remarks: srf.remarks || '-',
            });
        });

        return res.status(200).json({ success: true, data: result });


    } catch (err) {
        console.error("Error fetching inward report:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
