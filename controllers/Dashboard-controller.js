const { Op, Sequelize, fn, col, where } = require("sequelize");
const { sequelize } = require("../models");
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const Customer = require("../models").customer;

exports.getDashboardData = async (req, res) => {
  try {
    const { labId, fromDate, toDate, customerId, selectedDate } = req.body;

    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    let from, to;

    // Determine date range
    if (selectedDate && dateRegex.test(selectedDate)) {
      const [day, month, year] = selectedDate.split('-').map(Number);
      from = new Date(Date.UTC(year, month - 1, day));
      to = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    } else if (fromDate && toDate && dateRegex.test(fromDate) && dateRegex.test(toDate)) {
      const [fromDay, fromMonth, fromYear] = fromDate.split('-').map(Number);
      const [toDay, toMonth, toYear] = toDate.split('-').map(Number);
      from = new Date(Date.UTC(fromYear, fromMonth - 1, fromDay));
      to = new Date(Date.UTC(toYear, toMonth - 1, toDay, 23, 59, 59, 999));
    } else {
      return res.status(400).json({ error: "Please provide either a valid selectedDate or fromDate/toDate in dd-MM-yyyy format." });
    }

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ error: "Invalid date value." });
    }

    // Filter for customer if provided
    const whereCustomer = {};
    if (Number.isInteger(customerId)) {
      whereCustomer.customer_id = customerId;
    }



    let cardCounts = await Customer.findAll({
      where: { lab_id: labId, ...whereCustomer },
      attributes: [
        [Sequelize.fn("COUNT", Sequelize.literal(`CASE WHEN "srf_lists->srfitems"."rstatus" = 1 THEN 1 END`)), "totalCalibrations"],
        [Sequelize.fn("COUNT", Sequelize.literal(`CASE WHEN "srf_lists->srfitems"."status" = 'Not Calibrated' THEN 1 END`)), "pendingCalibrations"],
        [Sequelize.fn("COUNT", Sequelize.literal(`CASE WHEN "srf_lists->srfitems"."status" = 'Report Generated' AND calibration_done_date IS NOT NULL THEN 1 END`)), "certificatesGenerated"],
        [Sequelize.fn("COUNT", Sequelize.literal(`CASE WHEN "srf_lists->srfitems"."calibration_due_date"::date BETWEEN '${from.toISOString().split('T')[0]}' AND '${to.toISOString().split('T')[0]}' THEN 1 END`)), "upcomingDue"],
      ],
      include: [
        {
          model: SRF,
          as: "srf_lists",
          attributes: [],
          include: [
            {
              model: Item,
              as: "srfitems",
              attributes: [],
              where: {
                rstatus: 1,
              }
            },
          ],
        },
      ],
      raw: true,
    });


    let cardsData;
    if (Array.isArray(cardCounts) && cardCounts.length > 0) {
      cardsData = cardCounts[0];
    } else {
      cardsData = {
        totalCalibrations: 0,
        pendingCalibrations: 0,
        certificatesGenerated: 0,
        upcomingDue: 0,
      };
    }

    // Get SRF count per customer
    const srfCounts = await SRF.findAll({
      where: {
        lab_id: labId,
        created_timestamp: { [Op.between]: [from, to] }
      },
      include: [{
        model: Customer,
        as: 'customer',
        attributes: [],
        required: true,
        where: whereCustomer
      }],
      attributes: [
        [Sequelize.col('customer.customer_name'), 'customerName'],
        [Sequelize.fn('COUNT', Sequelize.col('srf_list')), 'value']
      ],
      group: ['customer.customer_name'],
      raw: true
    });

    // Total SRF count
    const srfTotal = srfCounts.reduce((acc, curr) => acc + Number(curr.value), 0);
    const srfDataWithTotal = [...srfCounts, { customerName: 'Total', value: srfTotal }];

    // Get item count per customer
    const calibratedCounts = await Customer.findAll({
      where: { lab_id: labId, ...whereCustomer },
      attributes: [
        [Sequelize.col('customer.customer_name'), 'customerName'],
        [Sequelize.fn('COUNT', Sequelize.col('srf_lists.srfitems.srf_item_id')), 'value'],
      ],
      include: [{
        model: SRF,
        as: 'srf_lists',
        attributes: [],
        where: {
          srf_date: { [Op.between]: [from, to] }
        },
        include: [{
          model: Item,
          as: 'srfitems',
          attributes: [],
          where: {
            rstatus: 1,
            status: "Report Generated",
            calibration_done_date: {
              [Op.ne]: null,
            }
          },
        }]
      }],
      group: ['customer.customer_id'],
      raw: true
    });

    const itemTotal = calibratedCounts.reduce((acc, curr) => acc + Number(curr.value), 0);
    const itemDataWithTotal = [...calibratedCounts, { customerName: 'Total', value: itemTotal }];


    const notcalibratedCounts = await Customer.findAll({
      where: { lab_id: labId, ...whereCustomer },
      attributes: [
        [Sequelize.col('customer.customer_name'), 'customerName'],
        [Sequelize.fn('COUNT', Sequelize.col('srf_lists.srfitems.srf_item_id')), 'value'],
      ],
      include: [{
        model: SRF,
        as: 'srf_lists',
        attributes: [],
        where: {
          srf_date: { [Op.between]: [from, to] }
        },
        include: [{
          model: Item,
          as: 'srfitems',
          attributes: [],
          where: {
            rstatus: 1,
            status: "Not Calibrated"
          },
        }]
      }],
      group: ['customer.customer_id'],
      raw: true
    });


    const notcalibratedTotal = notcalibratedCounts.reduce((acc, curr) => acc + Number(curr.value), 0);
    const notcalibratedTotalData = [...notcalibratedCounts, { customerName: 'Total', value: notcalibratedTotal }];

    // Send response 
    res.json({
      calibrated: itemDataWithTotal,
      srfCountByCustomer: srfDataWithTotal,
      notcalibrated: notcalibratedTotalData,
      cards: cardsData,
    });

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data." });
  }
};

