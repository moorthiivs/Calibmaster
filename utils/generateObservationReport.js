
async function generateObservationReport(
  fs,
  path,
  printer,
  ExcelProcedureTable,
  Layout,
  item,
  masterResult,
  lab,
  certificate_number,
  calibrated_employee_name,
  approved_employee_name,
  instrumentDynamicRows,
  standard_details_Table,
  EParameterData,
  format_no_obser,
  imageToBuffer
) {
  let cal_date = item?.calibration_done_date ? new Date(item?.calibration_done_date).toLocaleDateString("en-GB") : 'NA'
  let due_date = item?.calibration_due_date ? new Date(item?.calibration_due_date).toLocaleDateString("en-GB") : 'NA'
  let issue_date = EParameterData?.issue_date ? new Date(EParameterData?.issue_date).toLocaleDateString("en-GB") : 'NA'
  const Dc_Number = item.srf.dataValues.customer_dc || "NA";

  const remark = masterResult?.remarks;
  const remarks = Array.isArray(remark) ? remark.map(r => r.replace(/\s+/g, ' ').trim()) : [];

  const lengthofRemarks = remarks.length
  const labLogo_1_Path = path.resolve(__dirname, `../public/images/${lab.brand_logo_filename}`);
  const labLogo_1_Buffer = await imageToBuffer(labLogo_1_Path);
  const baseTableBody = [
    [
      { text: "Customer :", bold: true },
      { text: item?.srf?.customer?.customer_name || "-", colSpan: 2 },
      {},
      { text: "ULR NO. :", bold: true },
      { text: item?.url_number || "-", colSpan: 2 },
      {},
    ],
    [
      { text: "Inward No :", bold: true },
      { text: item?.inward_no || "-" },
      { text: "Customer DC :", bold: true },
      { text: Dc_Number },
      { text: "R.NO. :", bold: true },
      { text: certificate_number || "-" },
    ],
    [
      { text: "Date of Calibration:", bold: true },
      { text: cal_date, },
      { text: "Due Date:", bold: true },
      { text: due_date, },
      { text: "Calibrated At:", bold: true },
      { text: item?.calibrationAt || "LAB" },
    ],
    [
      {
        text: "Unit Under Calibration",
        colSpan: 6,
        bold: true,
        fillColor: "#eeeeee",
        alignment: "center",
      },
      {},
      {},
      {},
      {},
      {},
    ],
    [
      { text: "Name:", bold: true },
      {
        text: item?.intrument_type?.instrument?.instrument_name || "-",
        colSpan: 2,
      },
      {},
      { text: "Model:", bold: true },
      { text: item?.model || "-", colSpan: 2 },
      {},
    ],


    [
      { text: "I.D. No.:", bold: true },
      { text: item?.identification_details || "-", colSpan: 2 },
      {},
      { text: "Make :", bold: true },
      { text: item?.make || "-", colSpan: 2 },
      {},
    ],
  ];

  const isValid = (value) => {
    if (value === null || value === undefined) return false;

    if (typeof value === 'string' && value.trim() === '') return false;

    if (Array.isArray(value) && value.length === 0) return false;

    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;

    return true;
  };

  function formatInstrumentRowsSmartSplitColspan(rows, maxCols = 6) {

    if (!Array.isArray(rows)) {
      console.error("Error: formatInstrumentRowsSmartSplitColspan expected 'rows' to be an array but received:", rows);
      return [];
    }
    const formatted = [];

    for (const row of rows) {
      // CASE 1: exactly 6 items, no colSpan needed
      if (row.length === maxCols) {
        formatted.push(row);
        continue;
      }

      // CASE 2: more than 6 items, process as key-value pairs in chunks
      const pairs = [];
      for (let i = 0; i < row.length; i += 2) {
        const key = row[i];
        const value = row[i + 1] || { text: "" }; // Safe fallback if odd
        pairs.push([key, value]);
      }

      let currentRow = [];
      let colCount = 0;

      for (const [key, value] of pairs) {
        if (colCount + 3 > maxCols) {
          // Push current row and start new
          while (colCount < maxCols) {
            currentRow.push({ text: "", border: [false, false, false, false] });
            colCount++;
          }
          formatted.push(currentRow);
          currentRow = [];
          colCount = 0;
        }
        const safeKey = {
          text: key?.text || "",
          ...key,
          colSpan: 1,
          bold: true,
        };
        const safeValue = {
          text: value?.text || "",
          ...value,
          colSpan: 2,
          alignment: "left",
        };
        currentRow.push(safeKey);
        currentRow.push(safeValue);
        currentRow.push({ text: "", border: [false, false, false, false] });

        colCount += 3;
      }

      // Push last row if not empty
      if (currentRow.length > 0) {
        while (colCount < maxCols) {
          currentRow.push({ text: "", border: [false, false, false, false] });
          colCount++;
        }
        formatted.push(currentRow);
      }
    }

    return formatted;
  }

  const processedInstrumentRows = formatInstrumentRowsSmartSplitColspan(
    instrumentDynamicRows
  );
  baseTableBody.push(...processedInstrumentRows);

  const EquipmentMasterUsed = [
    [
      {
        text: "Equipment & Master Used",
        bold: true,
        colSpan: 5,
        alignment: "center",
        fillColor: "#eeeeee",
      },
      {},
      {},
      {},
      {},
    ],
    [
      { text: "Sl. No", bold: true, width: 30, alignment: "center" },
      { text: "Name", bold: true, alignment: "center" },
      { text: "Sr. No / ID No.", bold: true, alignment: "center" },
      { text: "Traceability No.", bold: true, alignment: "center" },
      { text: "Valid Till", bold: true, alignment: "center" },
    ],
    ...(standard_details_Table?.map((eq, index) => [
      { text: `${index + 1}`, alignment: "center", width: 30 },
      // { text: eq.m_description || "-", alignment: "center" },
      { text: `${eq.m_description || '-'} - ${eq.m_identification_details || '-'}`, alignment: 'center' },
      {
        text: eq.m_identification_details
          ? `${eq.m_serial_no}/${eq.m_identification_details}`
          : eq.m_serial_no,
        alignment: "center",
      },
      { text: eq.m_traceability || "-", alignment: "center" },
      { text: eq.m_validity || "-", alignment: "center" },
    ]) || []),
  ];

  function formatToTwoDecimals(value) {
    if (value === null || value === undefined || value === "") return "-";

    const num = parseFloat(value);
    if (isNaN(num)) return value; // if not a number, return as-is

    const strValue = value.toString();
    // ✅ if already has 2 decimals (e.g., "20.10"), don’t modify
    if (/^\d+(\.\d{2})$/.test(strValue)) return strValue;

    // ✅ else, format to 2 decimals
    return num.toFixed(2);
  }

  const EnvironmentalCondition = [
    [
      {
        text: "Environmental Condition",
        colSpan: 7,
        bold: true,
        fillColor: "#eeeeee",
        alignment: "center",
      },
      {}, {}, {}, {}, {}, {},
    ],
    [
      { text: "Temperature °C", bold: true },
      { text: "Start", bold: true, alignment: "center" },
      { text: formatToTwoDecimals(masterResult?.temperature?.start) || "-", alignment: "center" },
      { text: "Middle", bold: true, alignment: "center" },
      { text: formatToTwoDecimals(masterResult?.temperature?.middle) || "-", alignment: "center" },
      { text: "End", bold: true, alignment: "center" },
      { text: formatToTwoDecimals(masterResult?.temperature?.end) || "-", alignment: "center" },
    ],
    [
      { text: "Humidity % RH", bold: true },
      { text: "Start", bold: true, alignment: "center" },
      { text: formatToTwoDecimals(masterResult?.humidity?.start) || "-", alignment: "center" },
      { text: "Middle", bold: true, alignment: "center" },
      { text: formatToTwoDecimals(masterResult?.humidity?.middle) || "-", alignment: "center" },
      { text: "End", bold: true, alignment: "center" },
      { text: formatToTwoDecimals(masterResult?.humidity?.end) || "-", alignment: "center" },
    ],
  ];



  // ... (rest of the code before buildContentArray remains the same)

  //-------------------------------------------------------------------
  // FUNCTION: Estimate the approximate height of a table
  //-------------------------------------------------------------------
  function estimateTableHeight(tbl) {
    // A more robust estimate: rows * row_height + margins/padding
    const rows = tbl?.table?.body?.length || 1;
    // Assuming font size 8, a row is roughly 12 units high. Add 4 for margin/spacing.
    return rows * 16 + 10;
  }

  //-------------------------------------------------------------------
  // FUNCTION: Build CONTENT ARRAY with manual page-break injection
  //-------------------------------------------------------------------
  function buildContentArray() {
    const contentArr = [];

    // Add static items first (This must be done before height estimation)
    contentArr.push(
      {
        style: "Tables",
        table: { widths: ["*", "*", "*", "*", "*", "*"], body: baseTableBody },
        margin: [0, 10, 0, 5],
        id: "BaseTable" // Added ID for easier debugging/tracking
      },
      {
        text: `Calibration Procedure : ${masterResult?.calibration_procedure || "-"}`,
        style: "tableHeadings",
        bold: true,
        margin: [3, 0, 0, 0],
        id: "ProcedureHeading"
      },
      {
        style: "Tables",
        table: { widths: [30, "*", "*", "*", "*"], body: EquipmentMasterUsed },
        margin: [0, 5, 0, 5],
        id: "EquipmentTable"
      },
      {
        style: "Tables",
        table: { widths: ["*", "*", "*", "*", "*", "*", "*"], body: EnvironmentalCondition },
        margin: [0, 5, 0, 5],
        id: "EnvironmentalTable"
      },
    );


    const pageHeight = 842;       // A4 height in points
    const topMargin = 62;         // Top margin (for header)
    const bottomMargin = 105;     // Bottom margin (for footer)
    const usableHeightPerPage = pageHeight - topMargin - bottomMargin; // Usable body height (~675 points)


    let usedHeight =
      estimateTableHeight(contentArr[0]) + // BaseTable (~11 rows)
      15 + // Procedure Heading
      estimateTableHeight(contentArr[2]) + // EquipmentTable (2 header rows + variable master rows, let's assume 3 master rows total)
      estimateTableHeight(contentArr[3]) + // EnvironmentalTable (3 rows)
      30; // Extra padding/margins/safety

    // A conservative, high-side estimate: 400
    if (usedHeight < 350) usedHeight = 350; // Ensure a minimum estimate
    if (usedHeight > usableHeightPerPage - 100) usedHeight = usableHeightPerPage - 100; // Cap it


    usedHeight = 380; // Keeping the original estimate as a starting point.


    //-------------------------------------------------------------------
    // PROCESS EACH EXCEL TABLE
    //-------------------------------------------------------------------
    if (Array.isArray(ExcelProcedureTable)) {

      ExcelProcedureTable.forEach((tbl) => {

        const tableHeight = estimateTableHeight(tbl);

        if (usedHeight + tableHeight > usableHeightPerPage - 80) {
          contentArr.push({ text: "", pageBreak: "before" });
          usedHeight = tableHeight + 20;
        } else {
          usedHeight += tableHeight + 20;
        }

        let realTable = null;

        // CASE 1: direct table
        if (tbl && tbl.table && tbl.table.body) {
          realTable = tbl.table;
        }

        // CASE 2: wrapped inside columns → extract table
        else if (
          tbl &&
          Array.isArray(tbl.columns) &&
          tbl.columns[0] &&
          tbl.columns[0].table &&
          tbl.columns[0].table.body
        ) {
          realTable = tbl.columns[0].table;
        }

        if (realTable) {
          contentArr.push({
            unbreakable: true,          // best for tables
            table: realTable,           // correct pdfmake structure
            layout: tbl.columns?.[0]?.layout || tbl.layout || "noBorders",
            margin: tbl.columns?.[0]?.margin || tbl.margin || [0, 2, 0, 2],
            fontSize: tbl.columns?.[0]?.fontSize || 7,
            alignment: tbl.columns?.[0]?.alignment || "center",
          });

        } else {
          console.error("❌ Invalid Excel table skipped:", tbl);
        }

      });

    }

    return contentArr;
  }
  try {
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [10, 62, 10, 120],
      background: (currentPage, pageSize) => {
        return [
          {
            canvas: [
              { type: 'line', x1: 10, y1: 10, x2: 585, y2: 10, lineWidth: 1, lineColor: 'black' },   // Top line (10 from top)
              { type: 'line', x1: 10, y1: 10, x2: 10, y2: 807, lineWidth: 1, lineColor: 'black' },   // Left line (10 from left)
              { type: 'line', x1: 10, y1: 807, x2: 585, y2: 807, lineWidth: 1, lineColor: 'black' }, // Bottom line (10 from bottom)
              { type: 'line', x1: 585, y1: 10, x2: 585, y2: 807, lineWidth: 1, lineColor: 'black' }  // Right line (10 from right)
            ]

          }
        ]
      },
      header: {
        margin: [10, 20, 10, 0],
        stack: [
          {
            columns: [

              { width: '10%', text: '' },
              {

                width: '*',
                stack: [
                  {
                    text: lab.lab_name?.toUpperCase() || "LABORATORY NAME",
                    style: "header",
                    alignment: "center",
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 2],
                  },
                  {
                    text: "(Observation Sheet)",
                    style: "subheader",
                    alignment: "center",
                    fontSize: 11,
                    margin: [0, 0, 0, 5],
                  },
                ],
              },
              // Logo on the right side
              {
                width: 'auto',
                stack: [
                  labLogo_1_Buffer
                    ? {
                      image: labLogo_1_Buffer,
                      fit: [120, 120],
                      alignment: 'right',
                      margin: [0, 0, 0, 0],
                    }
                    : { text: '' },
                ],
              },
            ],
          }
        ],
      },
      footer: function (currentPage, pageCount) {

        const formattedCurrent = String(currentPage).padStart(2, '0');
        const formattedTotal = String(pageCount).padStart(2, '0');

        const topMargin = currentPage === pageCount ?  5 : 90
        const baseFooter = {
          fontSize: 9,
          margin: [10, topMargin, 10, 0],
          columns: [
            { text: '', alignment: 'left' },
            { text: `Page ${formattedCurrent} of ${formattedTotal}`, alignment: "center" },
            {
              text: format_no_obser || "",
              alignment: "right",
            },
          ],
        };

        if (currentPage === pageCount) {
          return {
            //pageBreak: 'before',
            //unbreakable: true,
            margin: [10, 0, 10, 30],
            stack: [
              {
                canvas: [{ type: "line", x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }],
              },
              {
                style: "Tables",
                table: {
                  widths: ["15%", "85%"],
                  body: [
                    [
                      {
                        text: `Note  :`,
                        alignment: "left",
                        fontSize: 9,
                        border: [true, false, true, false],
                        margin: [3, 2, 0, 2],
                        bold: true
                      },
                      {
                        text: `${lengthofRemarks === 3 ? "All values are in mm" : 'All values are in µm'}`,
                        alignment: "left",
                        fontSize: 9,
                        border: [false, false, false, false],
                        margin: [0, 2, 0, 2],
                      }
                    ],

                  ],
                },
                layout: {
                  defaultBorder: false,
                  hLineWidth: function () { return 0.8; },
                  vLineWidth: function () { return 0.8; },
                },
              },
              {
                canvas: [{ type: "line", x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }],
              },
              {
                style: "Tables",
                table: {
                  widths: ["15%", "35%", "15%", "35%"],
                  body: [
                    [
                      { text: "Calibrated By :", alignment: "center", fontSize: 9, border: [false, false, true, true], bold: true },
                      { text: "", alignment: "center", fontSize: 9, border: [false, false, true, true] },

                      { text: "Approved By :", alignment: "center", fontSize: 9, border: [false, false, true, true], bold: true },
                      { text: "", alignment: "center", fontSize: 9, border: [true, false, true, false] },
                    ],
                    [
                      { text: "Name", alignment: "center", fontSize: 9, border: [false, false, true, false] },
                      { text: `${calibrated_employee_name || "-"}`, alignment: "center", fontSize: 9, border: [false, false, false, false] },

                      { text: "Name", alignment: "center", fontSize: 9, border: [true, false, true, false] },
                      { text: `${approved_employee_name || "-"}`, alignment: "center", fontSize: 9, border: [false, true, false, false] },

                    ]
                  ]
                },
                layout: {
                  defaultBorder: false,
                  hLineWidth: function () { return 0.8; },
                  vLineWidth: function () { return 0.8; },
                },
              },

              {
                canvas: [{ type: "line", x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }],
              },
              {
                style: "Tables",
                table: {
                  widths: ["15%", "*"],
                  body: [
                    [
                      {
                        text: `Remarks  :`,
                        alignment: "left",
                        fontSize: 9,
                        border: [false, false, false, false],
                        margin: [3, 2, 0, 0],
                        bold: true
                      },
                      {
                        text: ``,
                        alignment: "left",
                        fontSize: 9,
                        border: [false, false, false, false],
                        margin: [0, 2, 0, 0],
                      }
                    ],

                  ],
                },
                layout: {
                  defaultBorder: false,
                  hLineWidth: function () { return 0.8; },
                  vLineWidth: function () { return 0.8; },
                },
              },
              {
                canvas: [{ type: "line", x1: 0, y1: 0, x2: 575, y2: 0, lineWidth: 1 }],
              },

              {
                text: "***End of Observation Sheet***",
                alignment: "center",
                fontSize: 9,
                bold: true,
                margin: [0, 3, 0, 1]
              },
              baseFooter,
            ],
          };
        }

        return baseFooter;
      },
      content: [

        ...buildContentArray()
        // {
        //   //layout: Layout,
        //   style: "Tables",
        //   table: {
        //     widths: ["*", "*", "*", "*", "*", "*"],
        //     body: baseTableBody,
        //   },
        //   margin: [0, 10, 0, 5],
        // },
        // {
        //   text: `Calibration Procedure : ${masterResult?.calibration_procedure || "-"
        //     }`,
        //   style: "tableHeadings",
        //   bold: true,
        //   margin: [3, 0, 0, 0],
        // },
        // {
        //   style: "Tables",
        //   table: {
        //     widths: [30, "*", "*", "*", "*"],
        //     body: EquipmentMasterUsed,
        //   },
        //   margin: [0, 5, 0, 5],
        // },
        // {
        //   style: "Tables",
        //   table: {
        //     widths: ["*", "*", "*", "*", "*", "*", "*"],
        //     body: EnvironmentalCondition,
        //   },
        //   margin: [0, 5, 0, 5],
        // },

        // ...(Array.isArray(ExcelProcedureTable) ? ExcelProcedureTable : []),


      ],
      defaultStyle: {
        columnGap: 0,
        font: "Roboto",
      },
      styles: {
        header: {
          fontSize: 16,
          bold: true,
          alignment: "center",
          margin: [0, 5, 0, 2],
        },
        subheader: {
          fontSize: 12,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        Tables: {
          fontSize: 8,
        },
        tableHeadings: {
          fontSize: 8,
        },
        ninethTable: {
          fontSize: 6,
          font: "DejaVu",
        },
      },

    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    return new Promise((resolve, reject) => {
      const todayDate = new Date().getTime();
      const fileName = `obs-certificate-${todayDate}.pdf`;
      const dirPath = path.join("./certificates/Observation");

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const outputPath = path.join(dirPath, fileName);

      pdfDoc.on("data", (chunk) => chunks.push(chunk));
      pdfDoc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, buffer);
        resolve(fileName);
      });
      pdfDoc.on("error", reject);
      pdfDoc.end();
    });
  } catch (error) {
    console.error("Error generating observation report:", error);
  }
}
module.exports = { generateObservationReport };
