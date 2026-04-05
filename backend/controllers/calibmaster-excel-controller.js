const calibmasterexcel = require('../models').CalibmasterExcel
const MasterTable = require('../models').master_design_procedure
const ProcedureResult = require('../models').ProcedureResult
const { errorHandler } = require('../helpers/error-handler')
const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')
const ExcelJS = require('exceljs')
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

    let sheetData = {};
    let mergedCellsData = {};
    let stylesData = {};

    if (fileName.toLowerCase().endsWith('.xlsx')) {
      // ✅ ExcelJS Path (supports Styles)
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(uploadPath);

      workbook.eachSheet((worksheet, sheetId) => {
        const sheetName = worksheet.name;
        const sheetRows = [];
        const sheetMerges = [];
        const sheetStyles = {};

        // Determine max dimensions
        let maxRow = 0;
        let maxCol = 0;
        worksheet.eachRow((row, rowNumber) => {
          maxRow = Math.max(maxRow, rowNumber);
          row.eachCell((cell, colNumber) => {
            maxCol = Math.max(maxCol, colNumber);
          });
        });

        // Initialize grid
        for (let r = 0; r < maxRow; r++) {
          sheetRows[r] = new Array(maxCol).fill(null);
        }

        // Extract Data & Styles
        worksheet.eachRow((row, rowNumber) => {
          const rIdx = rowNumber - 1; // 0-based
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const cIdx = colNumber - 1; // 0-based

            // 1. Value / Formula
            let val = null;
            if (cell.formula) {
              const f = String(cell.formula);
              val = f.startsWith('=') ? f : '=' + f;
            } else {
              val = cell.value;
              if (val && typeof val === 'object') {
                if (val.richText) val = val.richText.map(t => t.text).join('');
                else if (val.text) val = val.text;
                else if (val.result !== undefined) val = val.result; // formula result fallback
              }
            }

            if (rIdx < maxRow && cIdx < maxCol) {
              sheetRows[rIdx][cIdx] = val;
            }

            // 2. Styles
            const style = {};
            let hasStyle = false;

            // Font
            if (cell.font) {
              if (cell.font.bold) { style.bold = true; hasStyle = true; }
              if (cell.font.italic) { style.italic = true; hasStyle = true; }
              if (cell.font.color && cell.font.color.argb) {
                let argb = cell.font.color.argb;
                if (argb.length === 8) argb = argb.substring(2);
                style.fontColor = '#' + argb;
                hasStyle = true;
              }
            }

            // Fill
            if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor && cell.fill.fgColor.argb) {
              let argb = cell.fill.fgColor.argb;
              if (argb.length === 8) argb = argb.substring(2);
              style.backgroundColor = '#' + argb;
              hasStyle = true;
            }

            // Alignment
            if (cell.alignment && cell.alignment.horizontal) {
              const align = cell.alignment.horizontal;
              if (['left', 'center', 'right', 'justify'].includes(align)) {
                style.align = align;
                hasStyle = true;
              }
            }

            if (hasStyle) {
              style.row = rIdx;
              style.col = cIdx;
              sheetStyles[`${rIdx}-${cIdx}`] = style;
            }
          });
        });

        // 3. Merges
        if (worksheet.model.merges) {
          worksheet.model.merges.forEach(rangeStr => {
            const range = xlsx.utils.decode_range(rangeStr);
            sheetMerges.push({
              row: range.s.r,
              col: range.s.c,
              rowspan: range.e.r - range.s.r + 1,
              colspan: range.e.c - range.s.c + 1
            });
          });
        }

        sheetData[sheetName] = sheetRows;
        mergedCellsData[sheetName] = sheetMerges;
        stylesData[sheetName] = sheetStyles;
      });

    } else {
      // ✅ Fallback: XLSX Logic (Legacy support)
      const workbook = xlsx.readFile(uploadPath);
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
              if (cell.f) {
                const formula = String(cell.f);
                row.push(formula.startsWith('=') ? formula : `=${formula}`);
              } else {
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
    }

    const allSheetsData = {
      sheets: sheetData,
      merges: mergedCellsData,
      styles: stylesData
    };

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
      attributes: {
        exclude: ['ExcelData']   // 👈 Skip ExcelData from DB result
      },
      include: [
        {
          model: MasterTable,
          attributes: ['calibration_procedure'],
          required: false,
          include: ["instrument_type"]
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


// const updateProcedureImage = async (req, res) => {
//   try {
//     const { images, procedureId, userId } = req.body;

//     if (!images || !Array.isArray(images) || images.length === 0) {
//       return res.status(400).json({ message: 'No images provided' });
//     }

//     // Load existing DB images
//     const procedure = await calibmasterexcel.findByPk(procedureId);
//     if (!procedure) {
//       return res.status(404).json({ message: 'Procedure not found' });
//     }
//     const existingImages = Array.isArray(procedure.diagram_image)
//       ? procedure.diagram_image
//       : [];

//     // ✅ Separate incoming images
//     const newImagesToSave = [];
//     const finalImages = [];

//     images.forEach((img) => {
//       if (img && typeof img === "string" && img.startsWith("data:")) {
//         newImagesToSave.push(img); // base64 → needs saving
//       } else if (img) {
//         finalImages.push(img); // already filename → keep
//       }
//     });

//     // ✅ Save only base64 images
//     const savedImages = newImagesToSave.map((imageData) => {
//       const decoded = decodeBase64Image(imageData);
//       if (!decoded) return null;
//       const fileExtension = decoded.type.split("/")[1];
//       const imgFileName = `${Math.floor(Math.random() * 9999999)}-${procedureId}.${fileExtension}`;
//       fs.writeFileSync(`public/procedure_images/${imgFileName}`, decoded.data);
//       return imgFileName;
//     }).filter(Boolean); // remove nulls

//     // ✅ Create final updated list
//     const updatedImages = [...finalImages, ...savedImages];

//     // ✅ Save to DB
//     await procedure.update({ diagram_image: updatedImages });

//     return res.status(200).json({
//       message: "Images updated successfully",
//       images: updatedImages,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ message: "Failed to update images", error: error.message });
//   }
// };


const updateProcedureImage = async (req, res) => {
  try {
    const { images, procedureId } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const procedure = await calibmasterexcel.findByPk(procedureId);
    if (!procedure) {
      return res.status(404).json({ message: "Procedure not found" });
    }

    const finalImages = [];

    for (const img of images) {

      // ===============================
      // CASE 1: Base64 Image → Save File
      // ===============================
      if (img?.name?.startsWith("data:")) {

        const decoded = decodeBase64Image(img.name);
        if (!decoded) continue;

        const fileExtension = decoded.type.split("/")[1];
        const imgFileName = `${Math.floor(Math.random() * 9999999)}-${procedureId}.${fileExtension}`;

        fs.writeFileSync(
          `public/procedure_images/${imgFileName}`,
          decoded.data
        );

        finalImages.push({
          name: imgFileName,
          width: img.width || null,
          height: img.height || null,
        });

      }

      // ===============================
      // CASE 2: Already Saved Image
      // ===============================
      else if (img?.name) {

        finalImages.push({
          name: img.name,
          width: img.width || null,
          height: img.height || null,
        });

      }
    }

    // ✅ Save Proper JSON
    await procedure.update({
      diagram_image: finalImages,
    });

    return res.status(200).json({
      message: "Images updated successfully",
      images: finalImages,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update images",
      error: error.message,
    });
  }
};


// const deleteProcedureImage = async (req, res, next) => {
//   try {
//     const { imageId, procedureId } = req.query;

//     console.log(imageId, procedureId, "imageId, procedureId");

//     if (!procedureId) {
//       return res.status(400).json({ message: 'Procedure ID is required' });
//     }

//     const procedure = await calibmasterexcel.findByPk(procedureId);
//     if (!procedure) {
//       return res.status(404).json({ message: 'Procedure not found' });
//     }

//     const existingImages = procedure.diagram_image || [];
//     if (!existingImages.includes(imageId)) {
//       return res.status(404).json({ message: 'Image not found in procedure' });
//     }

//     const updatedImages = existingImages.filter(img => img !== imageId);

//     // Remove file from folder
//     const filePath = path.join(__dirname, '../public/procedure_images', imageId);
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

//     await procedure.update({ diagram_image: updatedImages });

//     return res.status(200).json({ message: 'Image deleted successfully', images: updatedImages });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Failed to delete image', error: error.message });
//   }
// }


const deleteProcedureImage = async (req, res) => {
  try {
    const { imageId, procedureId } = req.query;

    if (!procedureId || !imageId) {
      return res.status(400).json({
        message: "Procedure ID and Image ID are required",
      });
    }

    const procedure = await calibmasterexcel.findByPk(procedureId);
    if (!procedure) {
      return res.status(404).json({ message: "Procedure not found" });
    }

    const existingImages = procedure.diagram_image || [];

    // 🔥 Find image object by name
    const imageExists = existingImages.find(
      (img) => img?.name === imageId
    );

    if (!imageExists) {
      return res.status(404).json({
        message: "Image not found in procedure",
      });
    }

    // 🔥 Remove only that object
    const updatedImages = existingImages.filter(
      (img) => img?.name !== imageId
    );

    // 🔥 Delete physical file
    const filePath = path.join(
      __dirname,
      "../public/procedure_images",
      imageId
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 🔥 Update DB
    await procedure.update({
      diagram_image: updatedImages,
    });

    return res.status(200).json({
      message: "Image deleted successfully",
      images: updatedImages,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete image",
      error: error.message,
    });
  }
};


module.exports = {
  CreateCalibmasterExcel,
  FetchCalibmasterExcel,
  FetchOneCalibmasterExcel,
  updateCalibmasterExcel,
  DeleteCalibmasterExcel,
  updateProcedureImage,
  deleteProcedureImage
}
