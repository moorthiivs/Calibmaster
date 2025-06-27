const calibmasterexcel = require('../models').CalibmasterExcel
const MasterTable = require('../models').master_design_procedure
const ProcedureResult = require('../models').ProcedureResult
const { errorHandler } = require('../helpers/error-handler')
const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')
// Temporary association for joins
calibmasterexcel.belongsTo(MasterTable, {
  foreignKey: 'master_design_procedure_id',
  targetKey: 'master_design_procedure_id'
})

function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {}
  if (matches.length !== 3) {
    return new Error('Invalid input string')
  }
  response.type = matches[1]
  response.data = Buffer.from(matches[2], 'base64')

  return response
}

function StoreProcedureImages(images, fromId) {
  let imgFileNames = images.map(imageData => {
    try {
      const isExists = fs.existsSync(`public/procedure_images/${imageData}`)
      if (isExists) return imageData
      let imgFileName = ''
      const DecodeImg = decodeBase64Image(imageData)
      const imageBuffer = DecodeImg.data
      const fileExtension = DecodeImg.type.slice(6)
      imgFileName =
        Math.floor(Math.random() * 9999999) + '-' + fromId + '.' + fileExtension
      fs.writeFileSync(
        'public/procedure_images/' + imgFileName,
        imageBuffer,
        'utf8'
      )
      return imgFileName
    } catch (err) {
      console.error(err)
    }
  })
  return imgFileNames
}

const CreateCalibmasterExcel = async (req, res, next) => {
  try {
    const { userId, labId, master_design_procedure_id, diagram_image } = req.body;

    console.log("Received diagram_image:", diagram_image);

    const file = req.file;

    if (!userId || !labId || !file) {
      return res
        .status(400)
        .json({ message: "User ID, Lab ID, and Excel file are required." });
    }


    const fileName = file.originalname;
    const uploadPath = file.path;

    const existingProcedureFile = await calibmasterexcel.findOne({
      where: { labid: labId, master_design_procedure_id },
    });

    if (existingProcedureFile) {
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
        console.log(`Successfully deleted existing file: ${uploadPath}`);
      } else {
        console.warn(`File not found at path: ${uploadPath} - nothing to delete`);
      }
      return res.status(400).json({
        message:
          "A file has already been uploaded for this procedure. Only one sheet is allowed per master design procedure.",
      });
    }

    const existingFileName = await calibmasterexcel.findOne({
      where: { FileName: fileName, labid: labId },
    });

    if (existingFileName) {
      fs.unlinkSync(uploadPath);
      return res.status(400).json({
        message:
          "A file with this name already exists in the lab. Please use a different file name.",
      });
    }


    let savedImages = null;
    if (diagram_image && diagram_image.length > 0) {
      //savedImages = StoreProcedureImages(diagram_image, userId);
      const imageArray = Array.isArray(diagram_image) ? diagram_image : [diagram_image];
      savedImages = StoreProcedureImages(imageArray, userId);
    }

    const workbook = xlsx.readFile(uploadPath);
    const sheetNames = workbook.SheetNames;

    // const allSheetsData = {};
    // sheetNames.forEach((sheetName) => {
    //   const sheet = workbook.Sheets[sheetName];
    //   const jsonData = [];

    //   if (sheet && sheet["!ref"]) {
    //     const range = xlsx.utils.decode_range(sheet["!ref"]);
    //     for (let r = range.s.r; r <= range.e.r; r++) {
    //       const row = [];
    //       for (let c = range.s.c; c <= range.e.c; c++) {
    //         const addr = xlsx.utils.encode_cell({ r, c });
    //         const cell = sheet[addr];
    //         if (cell) {
    //           row.push(cell.f ? `=${cell.f}` : cell.v !== undefined ? cell.v : "");
    //         } else {
    //           row.push("");
    //         }
    //       }
    //       jsonData.push(row);
    //     }
    //   }

    //   allSheetsData[sheetName] = jsonData;
    // });

    let sheetData = {};
    let mergedCellsData = {};

    const allSheetsData = {
      sheets: sheetData,
      merges: mergedCellsData
    };

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const range = worksheet['!ref'] ? xlsx.utils.decode_range(worksheet['!ref']) : { e: { r: 0, c: 0 } };
      const cellData = [];

      for (let r = 0; r <= range.e.r; r++) {
        const row = [];
        for (let c = 0; c <= range.e.c; c++) {
          const cellAddress = xlsx.utils.encode_cell({ r, c });
          const cell = worksheet[cellAddress];

          if (cell) {
            // For formula cells, return the formula with = prefix
            if (cell.f) {
              row.push(`=${cell.f}`);
            }
            // For regular cells, return the value
            else {
              row.push(cell.v !== undefined ? cell.v : null);
            }
          } else {
            row.push(null);
          }
        }
        cellData.push(row);
      }

      const mergedCells = (worksheet['!merges'] || []).map(merge => ({
        row: merge.s.r,
        col: merge.s.c,
        rowspan: merge.e.r - merge.s.r + 1,
        colspan: merge.e.c - merge.s.c + 1
      }));

      sheetData[sheetName] = cellData;
      mergedCellsData[sheetName] = mergedCells;
    });

    const newEntry = await calibmasterexcel.create({
      FileName: fileName,
      FileLocation: uploadPath,
      ExcelData: allSheetsData,
      createdby: userId,
      labid: labId,
      master_design_procedure_id,
      diagram_image: savedImages,
    });

    res.status(200).json({
      message: true,
      data: newEntry,
    });
  } catch (err) {
    console.error(err);
    const error = new Error("Something went wrong");
    error.code = 500;
    error.path = "/api/calibmasterexcel/create-calibmaster-excel";
    return errorHandler(error, req, res, next);
  }
};


const FetchCalibmasterExcel = async (req, res, next) => {
  try {
    const labid = req.params.lab_id

    const result = await calibmasterexcel.findAll({
      where: { labid },
      order: [['cmeid', 'DESC']],
      include: [
        {
          model: MasterTable,
          attributes: ['calibration_procedure'],
          required: false // LEFT JOIN
        }
      ]
    })

    if (!result) {
      const error = new Error('Failed to fetched Calibmaster Excel Sheet')
      error.code = 500
      return errorHandler(error, req, res, next)
    } else {
      return res.status(200).json({
        msg: true,
        response: 'Calibmaster Excel File Fetched Successfully!!!',
        result
      })
    }
  } catch (err) {
    console.error(err)
    const error = new Error('Something went wrong')
    error.code = 500
    error.path = '/api/calibmasterexcel/create-calibmaster-excel'
    return errorHandler(error, req, res, next)
  }
}

const FetchOneCalibmasterExcel = async (req, res, next) => {
  try {
    const { lab_id, master_design_procedure_id } = req.body

    let result = await calibmasterexcel.findOne({
      attributes: ['cmeid', 'FileName', 'ExcelData', 'HiddenSheets'],
      where: { labid: lab_id, master_design_procedure_id }
    })

    if (!result) {
      const error = new Error('For This Procedure Not Found Excel Sheet!')
      error.code = 404
      return errorHandler(error, req, res, next)
    } else {
      return res.status(200).json({
        msg: true,
        response: 'Calibmaster Excel File Fetched Successfully!!!',
        result
      })
    }
  } catch (err) {
    console.error(err)
    const error = new Error('Something went wrong')
    error.code = 500
    error.path = '/api/calibmasterexcel/create-calibmaster-excel'
    return errorHandler(error, req, res, next)
  }
}

const updateCalibmasterExcel = async (req, res, next) => {
  try {
    const { lab_id, userid, ExcelJson, master_design_procedure_id, Fileid, selectedHiddenSheets } = req.body

    if ((!lab_id, !userid, !ExcelJson, !master_design_procedure_id, !Fileid)) {
      return res
        .status(400)
        .json({ message: 'User ID, Lab ID, and Excel file are required.' })
    }

    console.log(selectedHiddenSheets,"selectedHiddenSheets");
    

    const masterTableUpdate = await calibmasterexcel.update(
      {
        ExcelData: ExcelJson,
        HiddenSheets: selectedHiddenSheets,
        updatedby: userid,
      },
      {
        where: {
          master_design_procedure_id,
          labid: lab_id,
          cmeid: Fileid
        }
      }
    )

    console.log(masterTableUpdate);
    
    if (selectedHiddenSheets) {
      const existingRecord = await ProcedureResult.findOne({
        where: {
          master_design_procedure_id,
          labid: lab_id,
          cmeid: Fileid
        }
      })

      if (existingRecord) {
        await ProcedureResult.update(
          {
            HiddenSheets: selectedHiddenSheets,
          },
          {
            where: {
              master_design_procedure_id,
              labid: lab_id,
              cmeid: Fileid
            }
          }
        )
      }
      console.log(existingRecord, "existingRecord");

    }




    if (masterTableUpdate) {
      const updatedJson = await calibmasterexcel.findOne({
        where: {
          master_design_procedure_id,
          labid: lab_id,
          cmeid: Fileid
        }
      })

      return res.status(200).json({
        msg: 'Your Excel File Updated Successfully',
        updatedJson
      })
    }

    //   return res.json({
    //     msg: "Your Excel File Updated Successfully",
    //     masterTableUpdate,
    // });
  } catch (err) {
    console.error(err)
    const error = new Error('Something went wrong')
    error.code = 500
    error.path = '/api/calibmasterexcel/update-calibmaster-excel'
    return errorHandler(error, req, res, next)
  }
}

const DeleteCalibmasterExcel = async (req, res, next) => {
  try {
    const { lab_id, filename, master_design_procedure_id, Fileid } = req.body
    const result = await calibmasterexcel.destroy({
      where: {
        labid: lab_id,
        FileName: filename,
        master_design_procedure_id,
        cmeid: Fileid
      }
    })

    if (result) {
      const filePath = path.join(__dirname, '../excel_procedure', filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(
          `File ${filename} deleted successfully from excel_procedure folder.`
        )
      } else {
        console.log(`File ${filename} not found in excel_procedure folder.`)
      }
      return res.status(200).json({
        msg: 'Your Excel File Deleted Successfully from Database and Folder'
      })
    } else {
      return res.status(404).json({
        msg: 'Excel File Not Found in Database'
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      msg: 'Internal Server Error',
      error: error.message
    })
  }
}

module.exports = {
  CreateCalibmasterExcel,
  FetchCalibmasterExcel,
  FetchOneCalibmasterExcel,
  updateCalibmasterExcel,
  DeleteCalibmasterExcel
}
