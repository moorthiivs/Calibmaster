const { Op, Sequelize, fn, col, where } = require("sequelize");
const { sequelize } = require("../models");
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const Customer = require("../models").customer;
const InstrumentType = require("../models").instrument_type;
const Instrument = require("../models").instrument;
const { format } = require("date-fns");

exports.getDashboardDatav0 = async (req, res) => {
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


const calculateTrend = (current = 0, previous = 0, reverse = false) => {
  current = Number(current || 0);
  previous = Number(previous || 0);

  if (previous === 0 && current === 0) {
    return { value: "0%", trendUp: false };
  }

  if (previous === 0) {
    return {
      value: "+100%",
      trendUp: reverse ? false : true
    };
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(change).toFixed(1);

  let trendUp = change >= 0;

  // Reverse meaning for negative metrics
  if (reverse) {
    trendUp = !trendUp;
  }

  return {
    value: `${change >= 0 ? "+" : "-"}${rounded}%`,
    trendUp
  };
};

const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
  "var(--color-chart-9)",
  "var(--color-chart-10)",
  "var(--color-chart-11)",
  "var(--color-chart-12)",
];

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


    const diffDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    const prevTo = new Date(from);
    prevTo.setUTCDate(prevTo.getUTCDate() - 1);

    const prevFrom = new Date(prevTo);
    prevFrom.setUTCDate(prevFrom.getUTCDate() - diffDays + 1);

    // Filter for customer if provided
    const whereCustomer = {};
    if (Number.isInteger(customerId)) {
      whereCustomer.customer_id = customerId;
    }


    const currentFrom = from.toISOString().split("T")[0];
    const currentTo = to.toISOString().split("T")[0];
    const previousFrom = prevFrom.toISOString().split("T")[0];
    const previousTo = prevTo.toISOString().split("T")[0];



    const cardData = await Customer.findAll({
      where: { lab_id: labId, ...whereCustomer },
      attributes: [
        // CURRENT TOTAL
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."rstatus" = 1
              AND "srf_lists"."srf_date" BETWEEN '${currentFrom}' AND '${currentTo}'
            THEN 1 END)
          `),
          "current_total"
        ],

        // PREVIOUS TOTAL
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."rstatus" = 1
              AND "srf_lists"."srf_date" BETWEEN '${previousFrom}' AND '${previousTo}'
            THEN 1 END)
          `),
          "previous_total"
        ],

        // CURRENT PENDING
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."status" = 'Not Calibrated'
              AND "srf_lists"."srf_date" BETWEEN '${currentFrom}' AND '${currentTo}'
            THEN 1 END)
          `),
          "current_pending"
        ],

        // PREVIOUS PENDING
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."status" = 'Not Calibrated'
              AND "srf_lists"."srf_date" BETWEEN '${previousFrom}' AND '${previousTo}'
            THEN 1 END)
          `),
          "previous_pending"
        ],

        // CURRENT CERTIFICATES
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."status" = 'Report Generated'
              AND "srf_lists->srfitems"."calibration_done_date" IS NOT NULL
              AND "srf_lists"."srf_date" BETWEEN '${currentFrom}' AND '${currentTo}'
            THEN 1 END)
          `),
          "current_cert"
        ],

        // PREVIOUS CERTIFICATES
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."status" = 'Report Generated'
              AND "srf_lists->srfitems"."calibration_done_date" IS NOT NULL
              AND "srf_lists"."srf_date" BETWEEN '${previousFrom}' AND '${previousTo}'
            THEN 1 END)
          `),
          "previous_cert"
        ],

        // CURRENT UPCOMING DUE
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."calibration_due_date" IS NOT NULL
              AND "srf_lists->srfitems"."calibration_due_date"::date 
              BETWEEN '${currentFrom}' AND '${currentTo}'
            THEN 1 END)
          `),
          "current_upcoming_due"
        ],

        // PREVIOUS UPCOMING DUE
        [
          Sequelize.literal(`
            COUNT(CASE 
              WHEN "srf_lists->srfitems"."calibration_due_date" IS NOT NULL
              AND "srf_lists->srfitems"."calibration_due_date"::date 
              BETWEEN '${previousFrom}' AND '${previousTo}'
            THEN 1 END)
          `),
          "previous_upcoming_due"
        ],


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
              where: { rstatus: 1 }
            }
          ]
        }
      ],
      raw: true
    });


    const customerData = await Customer.findAll({
      where: { lab_id: labId, ...whereCustomer },
      attributes: [
        "customer_name",
        // TOTAL
        [
          Sequelize.literal(`
        COUNT(CASE 
          WHEN "srf_lists->srfitems"."rstatus" = 1
          AND "srf_lists"."srf_date" BETWEEN '${currentFrom}' AND '${currentTo}'
        THEN 1 END)
      `),
          "total_count"
        ],
        // PENDING
        [
          Sequelize.literal(`
        COUNT(CASE 
          WHEN "srf_lists->srfitems"."status" = 'Not Calibrated'
          AND "srf_lists"."srf_date" BETWEEN '${currentFrom}' AND '${currentTo}'
        THEN 1 END)
      `),
          "pending_count"
        ],
        // CERTIFICATES
        [
          Sequelize.literal(`
        COUNT(CASE 
          WHEN "srf_lists->srfitems"."status" = 'Report Generated'
          AND "srf_lists->srfitems"."calibration_done_date" IS NOT NULL
          AND "srf_lists"."srf_date" BETWEEN '${currentFrom}' AND '${currentTo}'
        THEN 1 END)
      `),
          "cert_count"
        ],
        // UPCOMING DUE
        [
          Sequelize.literal(`
        COUNT(CASE 
          WHEN "srf_lists->srfitems"."calibration_due_date" IS NOT NULL
          AND "srf_lists->srfitems"."calibration_due_date"::date 
          BETWEEN '${currentFrom}' AND '${currentTo}'
        THEN 1 END)
      `),
          "due_count"
        ],
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
              where: { rstatus: 1 }
            }
          ]
        }
      ],
      group: ["customer.customer_id", "customer.customer_name"],
      raw: true
    });

    const data = cardData[0] || {};

    const totalTrend = calculateTrend(data.current_total, data.previous_total);
    const pendingTrend = calculateTrend(data.current_pending, data.previous_pending, true);
    const certTrend = calculateTrend(data.current_cert, data.previous_cert);
    const upcomingTrend = calculateTrend(
      data.current_upcoming_due,
      data.previous_upcoming_due
    );






    const totalBreakdown = customerData.map((item, i) => ({
      name: item.customer_name || "Unknown",
      value: Number(item.total_count || 0),
      fill: chartColors[i % chartColors.length]
    }));

    const pendingBreakdown = customerData.map((item, i) => ({
      name: item.customer_name || "Unknown",
      value: Number(item.pending_count || 0),
      fill: chartColors[i % chartColors.length]
    }));

    const certBreakdown = customerData.map((item, i) => ({
      name: item.customer_name || "Unknown",
      value: Number(item.cert_count || 0),
      fill: chartColors[i % chartColors.length]
    }));

    const dueBreakdown = customerData.map((item, i) => ({
      name: item.customer_name || "Unknown",
      value: Number(item.due_count || 0),
      fill: chartColors[i % chartColors.length]
    }));

    const countCards = [
      {
        title: "Total Calibrations",
        value: Number(data.current_total || 0),
        trend: totalTrend.value,
        trendUp: totalTrend.trendUp,
        icon: "ClipboardList",
        alldata: totalBreakdown
      },
      {
        title: "Pending Calibrations",
        value: Number(data.current_pending || 0),
        trend: pendingTrend.value,
        trendUp: pendingTrend.trendUp,
        icon: "Clock",
        alldata: pendingBreakdown
      },
      {
        title: "Certificates Generated",
        value: Number(data.current_cert || 0),
        trend: certTrend.value,
        trendUp: certTrend.trendUp,
        icon: "CheckCircle",
        alldata: certBreakdown
      },
      {
        title: "Upcoming Due",
        value: Number(data.current_upcoming_due || 0),
        trend: upcomingTrend.value,
        trendUp: upcomingTrend.trendUp,
        icon: "Calendar",
        alldata: dueBreakdown
      }
    ];


    // Send response 
    res.json({
      cards: countCards,
    });

  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data." });
  }
};


const ChartData = async (req, res) => {
  try {
    const { labId, customerId, range = 6 } = req.body;

    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (range - 1), 1)
    );
    const to = new Date();
    const whereCustomer = {};
    if (Number.isInteger(customerId)) {
      whereCustomer.customer_id = customerId;
    }
    const calibratedCounts = await SRF.findAll({
      where: {
        lab_id: labId,
        '$srfitems.created_timestamp$': {
          [Op.between]: [from, to]
        }
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: [],
          required: true,
          where: whereCustomer
        },
        {
          model: Item,
          as: 'srfitems',
          attributes: [],
          required: true,
          where: {
            rstatus: 1,
            status: ["Report Generated", "Not Calibrated"],
          }
        }
      ],
      attributes: [
        [
          Sequelize.fn(
            "DATE_TRUNC",
            "month",
            Sequelize.col("srfitems.created_timestamp")
          ),
          "monthDate"
        ],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.col("srfitems.srf_item_id")
          ),
          "calibrations"
        ]
      ],
      group: [
        Sequelize.fn(
          "DATE_TRUNC",
          "month",
          Sequelize.col("srfitems.created_timestamp")
        )
      ],
      order: [
        [
          Sequelize.fn(
            "DATE_TRUNC",
            "month",
            Sequelize.col("srfitems.created_timestamp")
          ),
          "ASC"
        ]
      ],
      raw: true
    });

    // 🔹 Convert DB result to map
    const dbMap = {};
    calibratedCounts.forEach(row => {
      const monthNumber = new Date(row.monthDate).getUTCMonth() + 1;
      const year = new Date(row.monthDate).getUTCFullYear();
      dbMap[`${monthNumber}-${year}`] = Number(row.calibrations);
    });

    // 🔹 Generate dynamic months
    const result = [];

    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
      );

      const monthNumber = d.getUTCMonth() + 1;
      const year = d.getUTCFullYear();
      const monthName = d.toLocaleString('en-US', { month: 'short' });

      result.push({
        name: monthName,
        calibrations: dbMap[`${monthNumber}-${year}`] || 0
      });
    }

    const plantData = await plantwiseData(req);
    const gaugeDatas = await gaugeWiseData(req);
    const recentActivities = await recentActivity(req);
    res.json({ linechartdata: result, plantwiseData: plantData, gaugeWiseData: gaugeDatas, recentActivities });
  } catch (error) {
    console.error("ChartData error:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }

};

const plantwiseData = async (req) => {
  try {
    const { labId, customerId, range = 6 } = req.body;

    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (range - 1), 1)
    );
    const to = new Date();

    const whereCustomer = {};
    if (Number.isInteger(customerId)) {
      whereCustomer.customer_id = customerId;
    }

    const plantData = await Customer.findAll({
      where: {
        lab_id: labId,
        ...whereCustomer
      },
      attributes: [
        ["customer_name", "name"],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(`
            CASE 
              WHEN "srf_lists->srfitems"."status" = 'Report Generated'
              THEN 1 ELSE 0 
            END
          `)
          ),
          "completed"
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(`
            CASE 
              WHEN "srf_lists->srfitems"."status" = 'Not Calibrated'
              THEN 1 ELSE 0 
            END
          `)
          ),
          "pending"
        ]
      ],
      include: [
        {
          model: SRF,
          as: "srf_lists",
          attributes: [],
          required: true,
          where: { lab_id: labId },
          include: [
            {
              model: Item,
              as: "srfitems",
              attributes: [],
              required: true,
              where: {
                rstatus: 1,
                created_timestamp: {
                  [Op.between]: [from, to]
                }
              }
            }
          ]
        }
      ],
      group: ["customer.customer_id"],
      order: [["customer_name", "ASC"]],
      raw: true
    });

    return plantData;
  } catch (error) {
    console.error("plantwiseData error:", error);
    return [];
  }

};

const gaugeWiseData = async (req) => {
  try {
    const { labId, customerId, range = 6 } = req.body;

    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (range - 1), 1)
    );
    const to = new Date();

    const whereCustomer = {};
    if (Number.isInteger(customerId)) {
      whereCustomer.customer_id = customerId;
    }

    const data = await Customer.findAll({
      where: {
        lab_id: labId,
        ...whereCustomer
      },
      attributes: [
        ["customer_name", "name"],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(`
            CASE 
              WHEN "srf_lists->srfitems"."status" = 'Report Generated'
              THEN 1 ELSE 0 
            END
          `)
          ),
          "completed"
        ],

        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(`
            CASE 
              WHEN "srf_lists->srfitems"."status" = 'Not Calibrated'
              THEN 1 ELSE 0 
            END
          `)
          ),
          "pending"
        ]
      ],
      include: [
        {
          model: SRF,
          as: "srf_lists",
          attributes: [],
          required: true,
          where: { lab_id: labId },
          include: [
            {
              model: Item,
              as: "srfitems",
              attributes: [],
              required: true,
              where: {
                rstatus: 1,
                created_timestamp: {
                  [Op.between]: [from, to]
                }
              }
            }
          ]
        }
      ],
      group: ["customer.customer_id"],
      raw: true
    });



    // 🔥 Convert to donut format
    const donutChartData = data.map((row, index) => {
      const fullName = row.name;

      // Extract Plant-XX if exists
      const plantMatch = fullName.match(/Plant-\d+/i);
      const shortName = plantMatch
        ? plantMatch[0]
        : fullName.split(" ")[0];

      const total =
        Number(row.completed || 0) +
        Number(row.pending || 0);

      return {
        name: shortName,
        value: total,
        fill: chartColors[index % chartColors.length]
      };
    });

    return donutChartData;
  } catch (error) {
    console.error("gaugeWiseData error:", error);
    return [];
  }

};

const recentActivity = async (req) => {
  try {
    const { labId, customerId } = req.body;

    const whereCustomer = {};
    if (customerId) {
      whereCustomer.customer_id = customerId;
    }

    const activities = await SRF.findAll({
      where: {
        lab_id: labId,
        rstatus: 1
      },
      attributes: ["srf_number"],
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["customer_id", "customer_name"],
          required: true,
          where: whereCustomer
        },
        {
          model: Item,
          as: "srfitems",
          attributes: ["status", "created_timestamp"],
          required: true,
          where: { rstatus: 1 },
          include: [
            {
              model: InstrumentType,
              as: "intrument_type",
              attributes: ["instrument_full_name"],
              include: [
                {
                  model: Instrument,
                  as: "instrument",
                  attributes: ["instrument_name"]
                }
              ]
            }
          ]
        }
      ],
      order: [
        [{ model: Item, as: "srfitems" }, "created_timestamp", "DESC"]
      ],
      subQuery: false
    });

    // 🔥 If no customerId → take latest one per customer
    const customerMap = new Map();

    const formatted = [];

    for (const row of activities) {
      const customerId = row.customer.customer_id;

      if (!req.body.customerId && customerMap.has(customerId)) {
        continue; // already added this customer
      }

      const item = row.srfitems?.[0];

      if (!item) continue;

      customerMap.set(customerId, true);

      formatted.push({
        id: row.srf_number,
        customer: row.customer.customer_name,
        instrument:
          item.intrument_type?.instrument?.instrument_name?.toString().trim().toUpperCase() ||
          item.intrument_type?.instrument_full_name?.toString().trim().toUpperCase() ||
          "Instrument",
        status:
          item.status === "Report Generated"
            ? "Completed"
            : item.status === "Not Calibrated"
              ? "Pending"
              : "In Progress",
        date: item.created_timestamp
          ? format(new Date(item.created_timestamp), "dd/MM/yyyy")
          : "-"
      });

      // limit to 5 customers max
      if (!req.body.customerId && formatted.length === 5) break;
    }

    return formatted;

  } catch (error) {
    console.error("recentActivity error:", error);
    return [];
  }
};

exports.ChartData = ChartData