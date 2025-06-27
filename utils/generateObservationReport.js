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
  EParameterData
) {
  let cal_date = item?.calibration_done_date ? new Date(item?.calibration_done_date).toLocaleDateString("en-GB") : '-'
  let due_date = item?.calibration_due_date ? new Date(item?.calibration_due_date).toLocaleDateString("en-GB") : '-'
  let issue_date = EParameterData?.issue_date ? new Date(EParameterData?.issue_date).toLocaleDateString("en-GB") : '-'

  const baseTableBody = [
    [
      {
        text: `Formats : ${masterResult?.document_format?.formatName}`,
        colSpan: 2,
        bold: true,
      },
      {},
      { text: "Issue No. :", bold: true },
      { text: EParameterData?.issue_no || '-' },
      { text: "Issue Date. :", bold: true },
      { text: issue_date },
    ],
    [
      { text: "Section No. :", bold: true },
      { text: masterResult?.document_format?.sectionNo || "PAF-FT-28" },
      { text: "Revision No. :", bold: true },
      { text: masterResult?.document_format?.revNo || "0" },
      { text: "Revision Date :", bold: true },
      {
        text: masterResult?.document_format?.revStartDate
          ? new Date(
              masterResult?.document_format?.revStartDate
            ).toLocaleDateString("en-GB")
          : "---",
      },
    ],
    [
      { text: "Material Inward No (SRF):", bold: true },
      { text: item?.srf?.srf_number || "-", colSpan: 2 },
      {},
      { text: "Calibrated at:", bold: true },
      { text: "Onsite", colSpan: 2 },
      {},
    ],
    [
      { text: "Date of Calibration:", bold: true },
      { text: cal_date, colSpan: 2 },
      {},
      { text: "Due Date:", bold: true },
      { text: due_date, colSpan: 2 },
      {},
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
      { text: "Serial No. :", bold: true },
      { text: item?.serial_no || "-", colSpan: 2 },
      {},
    ],
    [
      { text: "Make :", bold: true },
      { text: item?.make || "-", colSpan: 2 },
      {},
      { text: "Accuracy :", bold: true },
      { text: item?.accuracy || "As per User Manual", colSpan: 2 },
      {},
    ],
  ];

  function formatInstrumentRowsSmartSplitColspan(rows, maxCols = 6) {
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
      { text: eq.m_description || "-", alignment: "center" },
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

  const EnvironmentalCondition = [
    [
      {
        text: "Environmental Condition",
        colSpan: 5,
        bold: true,
        fillColor: "#eeeeee",
        alignment: "center",
      },
      {},
      {},
      {},
      {},
    ],
    [
      { text: "Temperature °C", bold: true },
      { text: "Start", bold: true },
      { text: masterResult?.temperature?.start || "20.4" },
      { text: "End", bold: true },
      { text: masterResult?.temperature?.end || "20.4" },
    ],
    [
      { text: "Humidity % RH", bold: true },
      { text: "Start", bold: true },
      { text: masterResult?.humidity?.start || "48%" },
      { text: "End", bold: true },
      { text: masterResult?.humidity?.end || "48%" },
    ],
  ];

  try {
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [20, 60, 20, 60],
      header: {
        stack: [
          { text: `${lab.lab_name.toUpperCase()}`, style: "header" },
          { text: "(Observation Report)", style: "subheader" },
        ],
        margin: [0, 10, 0, 10],
      },
      footer: function (currentPage, pageCount) {
        if (currentPage === pageCount) {
          return {
            columns: [
              {
                text: [
                  { text: "Calibrated By:\n", bold: true },
                  { text: calibrated_employee_name },
                ],
                margin: [40, 10],
              },
              {
                text: [
                  { text: "Approved By:\n", bold: true },
                  { text: approved_employee_name },
                ],
                alignment: "right",
                margin: [0, 10, 40, -50],
              },
            ],
          };
        } else {
          return {
            columns: [
              {
                text: `Page ${currentPage} of ${pageCount}`,
                alignment: "center",
              },
            ],
            margin: [0, 10],
          };
        }
      },
      content: [
        {
          //layout: Layout,
          style: "Tables",
          table: {
            widths: ["*", "*", "*", "*", "*", "*"],
            body: baseTableBody,
          },
          margin: [0, 10, 0, 5],
        },
        {
          text: `Calibration Procedure : ${
            masterResult?.calibration_procedure || "-"
          }`,
          style: "tableHeadings",
          bold: true,
          margin: [0, 0, 0, 0],
        },
        {
          style: "Tables",
          table: {
            widths: [30, "*", "*", "*", "*"],
            body: EquipmentMasterUsed,
          },
          margin: [0, 10, 0, 10],
        },

        {
          style: "Tables",
          table: {
            widths: ["*", "*", "*", "*", "*"],
            body: EnvironmentalCondition,
          },
          margin: [0, 10, 0, 10],
        },

        ...(Array.isArray(ExcelProcedureTable) ? ExcelProcedureTable : []),
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
        console.log(`Observation report saved: ${outputPath}`);
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
