import { useEffect } from "react";
import { HyperFormula } from "hyperformula";
import { convertFixedToRound, schemavalidation } from "../utils/excelDataUtils";
import config from "../../../../../utils/config.json";

export function useExcelData(excelState, hotRef, auth, props) {
  const {
    sheetData, setSheetData,
    sheetNames, setSheetNames,
    selectedSheet, setSelectedSheet,
    mergedCells, setMergedCells,
    setChanges,
    setIsDirty,
    setHyperFormulaInstance,
    permissionsMap, setPermissionsMap,
    cellStyles, setCellStyles, cellStylesRef,
    setisLoader,
    setOriginalData,
    setGoNoGoJson,
    setDynamicGaugevalue,
    selectedHiddenSheets, setSelectedHiddenSheets,
    decimalPrecisionMap, setDecimalPrecisionMap,
    SessionFileData,
  } = excelState;

  const { file, saveData, setCalculated, setisFileEdit, hiddenSheetName, srf_id, srf_item_id } = props;

  const fetechExcelData = async () => {
    try {
      if (SessionFileData) {
        setisLoader(true);
        const response = await fetch(
          `${config.Calibmaster.URL}/api/calibmasterexcel/fetchOne-calibmaster-excel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + auth.token,
            },
            body: JSON.stringify({
              lab_id: auth.labId,
              master_design_procedure_id:
                SessionFileData.master_design_procedure_id,
            }),
          }
        );

        const jsonRes = await response.json();



        if (response.ok) {
          const hiddenSheet = jsonRes.result.HiddenSheets || [];
          setSelectedHiddenSheets(hiddenSheet);
          let sheets,
            merges = {},
            styles = {},
            permissions = {};
          const excelData = jsonRes.result.ExcelData;

          if ("sheets" in excelData && "merges" in excelData) {
            sheets = excelData.sheets;
            merges = excelData.merges;
            styles = excelData.styles || {};
            permissions = excelData.permissions || {};
          } else {
            sheets = excelData;
            merges = {};
            styles = {};
            permissions = {};
          }

          const options = {
            licenseKey: "gpl-v3",
            smartRounding: true,
            errorHandling: 'silent',
            errorMapping: false,

            // Add these performance optimizations:
            maxColumns: 50,
            maxRows: 2000,
            useStats: false,
            precisionRounding: 9,
            matrixDetection: false,
            // nullDate: true,    
            matrixFunctions: false,
          };

          const SheetSaveData = sheets;

          Object.keys(SheetSaveData).forEach((sheetName) => {
            SheetSaveData[sheetName] = convertFixedToRound(
              SheetSaveData[sheetName]
            );
          });
          const mergesData = schemavalidation(merges) ? merges : {};

          const stylesData = schemavalidation(styles) ? styles : {};

          setSheetData(SheetSaveData || {});
          setOriginalData(SheetSaveData);

          setMergedCells(mergesData);

          setCellStyles(stylesData);
          setPermissionsMap(permissions);

          const names = Object.keys(sheets);

          setSheetNames(names);

          setDecimalPrecisionMap(
            excelData?.decimalPrecision ? excelData?.decimalPrecision : {}
          );

          if (names.length > 0 && !selectedSheet) {
            setSelectedSheet(names[0]);
          }

          const hfInstance = HyperFormula.buildFromSheets(
            SheetSaveData,
            options
          );

          hfInstance.rebuildAndRecalculate();
          setHyperFormulaInstance(hfInstance);
        }
      } else {
        console.log("Data not get from session storage");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setisLoader(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {

        if (file && file.sheets) {
          setisLoader(true);
          const { sheets, merges, styles, decimalPrecision, permissions } = file;

          const options = {
            licenseKey: "gpl-v3",
            smartRounding: true,
            errorHandling: 'silent',
            errorMapping: false,

            // Add these performance optimizations:
            maxColumns: 50,
            maxRows: 2000,
            useStats: false,
            precisionRounding: 6,
            matrixDetection: false,
            // nullDate: true,    
            matrixFunctions: false,
          };

          // // Clone sheets to avoid direct mutation
          const visibleSheets = {};
          if (auth.department === "admin" || auth.department === "Manager") {
            Object.keys(sheets).forEach((sheetName) => {
              visibleSheets[sheetName] = convertFixedToRound(sheets[sheetName]);
            });
          } else {
            Object.keys(sheets).forEach((sheetName) => {
              if (!hiddenSheetName.includes(sheetName)) {
                visibleSheets[sheetName] = convertFixedToRound(sheets[sheetName]);
              }
            });
          }

          const SheetSaveData = sheets;

          Object.keys(SheetSaveData).forEach((sheetName) => {
            SheetSaveData[sheetName] = convertFixedToRound(
              SheetSaveData[sheetName]
            );
          });

          setSheetData(SheetSaveData || {});
          setMergedCells(merges || {});
          setCellStyles(styles || {});
          const names = Object.keys(visibleSheets);
          setSheetNames(names);
          setDecimalPrecisionMap(decimalPrecision);
          setPermissionsMap(permissions);
          if (names.length > 0 && !selectedSheet) {
            setSelectedSheet(names[0]);
          }

          const hfInstance = HyperFormula.buildFromSheets(SheetSaveData, options);

          setHyperFormulaInstance(hfInstance);
          setisLoader(false);



          const response = await fetch(`${config.Calibmaster.URL}/api/srf/fetchOneSrfItems`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + auth.token
            },
            body: JSON.stringify({
              lab_id: auth.labId,
              srf_id,
              srf_item_id
            })
          });

          const jsonRes = await response.json();
          const RangesJson = jsonRes.data.ranges
          setGoNoGoJson(RangesJson)
          setDynamicGaugevalue(RangesJson)
        } else {
          fetechExcelData();
        }
      } catch (error) {
        console.log(error);
      } finally {
        setisLoader(false);
      }
    }
    loadData()
  }, [file]);

  const handleSave = async () => {
    try {
      const hotInstance = hotRef.current?.hotInstance;
      if (!hotInstance) return;

      setisLoader(true);

      // Always read from the ref to get the true current cellStyles,
      // avoiding stale-closure issues where the function may have been
      // created before the latest setCellStyles call was committed.
      const stylesToSave = cellStylesRef.current;

      const savedData = {
        sheets: { ...sheetData },
        merges: { ...mergedCells },
        styles: { ...stylesToSave },
        decimalPrecision: { ...decimalPrecisionMap },
        permissions: { ...permissionsMap },
      };
      const formattedOutput = {
        sheets: {},
        merges: {},
        styles: {},
        decimalPrecision: {}, // <-- Include here
        permissions: {},
      };

      const activeSheet = selectedSheet; // track active tab

      if (hotRef.current?.hotInstance) {
        savedData.sheets[activeSheet] = hotRef.current.hotInstance.getSourceData();
      }

      Object.keys(savedData.sheets).forEach((sheetName) => {
        formattedOutput.sheets[sheetName] = savedData.sheets[sheetName];
        formattedOutput.merges[sheetName] = savedData.merges[sheetName] || [];
        formattedOutput.styles[sheetName] = { ...(savedData.styles[sheetName] || {}) };
        formattedOutput.decimalPrecision[sheetName] = savedData.decimalPrecision[sheetName] || [];
        formattedOutput.permissions[sheetName] = savedData.permissions[sheetName] || {};
      });

      // Use this extended object for saving
      if (file && file.sheets) {
        saveData(formattedOutput);
        setCalculated(true);
        setisFileEdit(false);
        setIsDirty(false);
        return;
      }

      const response = await fetch(
        `${config.Calibmaster.URL}/api/calibmasterexcel/update-calibmaster-excel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify({
            lab_id: auth.labId,
            userid: auth.userId,
            ExcelJson: formattedOutput,
            master_design_procedure_id:
              SessionFileData.master_design_procedure_id,
            Fileid: SessionFileData.cmeid,
            selectedHiddenSheets,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        fetechExcelData();
        // Notify ListCalibmasterExcel to refresh its data
        const channel = new BroadcastChannel('excel_list_update');
        channel.postMessage('REFRESH_EXCEL_LIST');
        channel.close();
      }

      setChanges([]);
      setIsDirty(false);
    } catch (error) {
      console.log(error);
    } finally {
      setisLoader(false);
    }
  };

  return { handleSave, fetechExcelData };
}
