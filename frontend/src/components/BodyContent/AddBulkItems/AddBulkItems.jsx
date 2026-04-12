import { Upload, Button, message } from 'antd';
import { UploadOutlined, DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { useContext, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { itemsActions } from '../../../store/items';
import { notificationActions } from '../../../store/nofitication';
import { srfitemsActions } from '../../../store/srfitems';
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import * as excelJs from 'exceljs';

const AddBulkItems = (props) => {
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();

    const headers = [
        { header: 'Instrument Types', key: 'instrument_types' },
        { header: 'Make', key: 'make' },
        { header: 'Model', key: 'model' },
        { header: 'Serial Number', key: 'serial_no' },
        { header: 'Id/Asset Number', key: 'identification_details' },
        { header: 'Next Calibration (in Months)', key: 'frequency_days' },
        { header: 'Next Calibration Reminder', key: 'reminder_frequency' },
        { header: 'Remarks', key: 'remarks' },
        { header: '', key: 'note' },
    ];

    const nextCalibrationReminderOptions = [
        { value: 0, label: 'No Reminder' },
        { value: 1, label: '1 Reminder 7 days before' },
        { value: 2, label: '2 Reminders 15 days before' }
    ];

    const [masterlist, setMasterlist] = useState([]);
    const [xlsxFiles, setXlsxFiles] = useState(null);
    const [xlsxFilesErr, setXlsxFilesErr] = useState(null);
    const [srfItem, setSrfItem] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const FetchInstrumentTypes = async () => {
        setIsFetching(true);
        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ lab_id: auth.labId }),
            };
            const response = await fetch(config.Calibmaster.URL + "/api/instrument-types/list", requestOptions);
            const data = await response.json();
            let oldmasterlist = data?.data;
            const modified = oldmasterlist.map((v, i) => {
                return {
                    id: v.instrument_type_id,
                    sno: i + 1,
                    name: `${v.instrument_full_name}${v.type ? 'Type-' + v.type : ''}`,
                    units: v.ins_uom_name,
                    instrument_name: v.instrument_name
                };
            });
            setMasterlist(modified);
        }
        catch (err) {
            console.error(err);
        }
        setIsFetching(false);
    }

    const generateTemplate = async () => {
        const workbook = new excelJs.Workbook();

        // Instrument Types Options
        const hiddenWs = workbook.addWorksheet('Instrument Types Drop Downs');
        hiddenWs.addRow(['Instrument Types']);  // Header
        masterlist.forEach(option => {
            hiddenWs.addRow([option.name.trim()]);
        });
        hiddenWs.state = 'veryHidden';

        // Items
        const ws = workbook.addWorksheet('SRF Items');
        // Adding headers
        ws.columns = headers;

        // Note
        ws.getCell(`${ws.getColumn('note').letter}2`).value = 'NOTE:'
        ws.getCell(`${ws.getColumn('note').letter}3`).value = '1) The mandatory fields are Instrument Types, Serial Number, and Remarks.'
        ws.getCell(`${ws.getColumn('note').letter}4`).value = '2) The dropdown fields are Instrument Types and Next Calibration Reminder.'

        const Range = (key) => {
            const columnLetter = ws.getColumn(key)?.letter;
            if (!columnLetter) {
                console.error(`Invalid column key: ${key}`);
                return;
            }
            return `${columnLetter}2:${columnLetter}99999`;
        };

        ws.dataValidations.add(Range('instrument_types'), {
            type: 'list',
            allowBlank: false,
            formulae: ['=\'Instrument Types Drop Downs\'!$A$2:$A$99999'],
            showErrorMessage: true,
            errorStyle: "error",
            errorTitle: 'Invalid Input',
            error: 'Please select a valid instrument types.'
        });

        ws.dataValidations.add(Range('frequency_days'), {
            type: 'whole',
            operator: 'greaterThanOrEqual',
            formulae: ['0'],
            showErrorMessage: true,
            errorStyle: "error",
            errorTitle: 'Invalid Value',
            error: 'Please provide a valid next calibration month.',
        });

        ws.dataValidations.add(Range('reminder_frequency'), {
            type: 'list',
            allowBlank: true,
            formulae: [`"${(nextCalibrationReminderOptions.map(option => option.label)).join(',')}"`],
            showErrorMessage: true,
            errorStyle: "error",
            errorTitle: 'Invalid Input',
            error: 'Please select a valid calibration reminder.'
        });

        // Auto-Adjust Column Width
        ws.columns.forEach((col, index) => {
            let maxLength = 0;
            col.eachCell({ includeEmpty: true }, (cell) => {
                const cellLength = cell.value ? cell.value.toString().length : 0;
                if (cellLength > maxLength) {
                    maxLength = cellLength;
                }
            });
            col.width = maxLength + 2;
        });

        // All cells styling
        ws.eachRow((row) => {
            row.eachCell((cell) => {
                cell.font = {
                    name: 'Calibri',
                    size: 11,
                };
                cell.alignment = {
                    horizontal: 'center',
                    vertical: 'middle',
                };
            });
        });

        // Only for first row styling
        ws.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' },
        };
        ws.getRow(1).font = {
            bold: true,
            size: 12,
        };

        // Note styling
        ws.getColumn('note').alignment = { horizontal: 'left' };

        const excelBlob = await workbook.xlsx.writeBuffer();
        const excelUrl = URL.createObjectURL(
            new Blob([excelBlob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        );

        const link = document.createElement('a');
        link.href = excelUrl;
        link.download = 'srfitem_template.xlsx';
        document.body.appendChild(link);
        link.click();

        URL.revokeObjectURL(excelUrl);
        document.body.removeChild(link);
    };

    // Handles File uploads
    const UploadFileHandler = async (file) => {
        setXlsxFilesErr(null);

        // Check if the file type is not .xlsx
        if (file?.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            setXlsxFilesErr("Invalid file format. Only .xlsx format is accepted.");
            return Upload.LIST_IGNORE;
        }

        setXlsxFiles(file);

        const wb = new excelJs.Workbook();
        const reader = new FileReader();

        reader.onerror = () => {
            setXlsxFilesErr("Unable to read the selected file. Please try again.");
            setXlsxFiles(null);
            setSrfItem([]);
        };

        reader.readAsArrayBuffer(file);

        reader.onload = () => {
            const buffer = reader.result;

            try {
                wb.xlsx.load(buffer).then((workbook) => {
                    let validSheetFound = false;

                    workbook.eachSheet((sheet) => {
                        const firstRow = sheet.getRow(1).values;
                        firstRow.shift();
                        if (JSON.stringify(firstRow) == JSON.stringify(headers.map(({ header }) => header))) {
                            validSheetFound = true;
                            const srfItems = [];

                            sheet.eachRow((row, rowIndex) => {
                                if (rowIndex === 1) return;
                                const rowValue = row.values;
                                rowValue.shift();
                                srfItems.push(rowValue);
                            });
                            setSrfItem(srfItems);
                        }
                    });

                    if (!validSheetFound) {
                        setXlsxFilesErr("The file does not contain the expected header row. Please ensure that your file matches the required sample template format.");
                        setXlsxFiles(null);
                        setSrfItem([]);
                    }
                }).catch((error) => {
                    setXlsxFilesErr(`Error loading workbook: ${error.message}. Please check the file format or try again.`);
                    setXlsxFiles(null);
                    setSrfItem([]);
                });
            } catch (error) {
                setXlsxFilesErr(`Error processing file: ${error.message}. Please ensure the file is not corrupted and is in the correct format.`);
                setXlsxFiles(null);
                setSrfItem([]);
            }
        };

        return false; // Prevent antd auto-upload
    };

    const handleRemoveFile = () => {
        setXlsxFiles(null);
        setSrfItem([]);
        setXlsxFilesErr(null);
    };

    const ImportHandler = async () => {
        setIsLoading(true);
        if (props?.srf) {
            const items = [];
            let updatedCounts = 0;
            srfItem.forEach((eachItem) => {
                let intrument_type_id = null;
                let IsInstrumentTypes = false;
                const description = String(eachItem[0] != null ? eachItem[0] : '') || null;
                const make = String(eachItem[1] != null ? eachItem[1] : '') || null;
                const model = String(eachItem[2] != null ? eachItem[2] : '') || null;
                const serial_no = String(eachItem[3] != null ? eachItem[3] : '') || null;
                const identification_details = String(eachItem[4] != null ? eachItem[4] : '') || null;
                const frequency_days = eachItem[5] || 0;
                let reminder_frequency = eachItem[6] || 0;
                const remarks = String(eachItem[7] != null ? eachItem[7] : '') || null;
                let instrument_name = null

                const item = masterlist.find((list) => list.name.trim() === description);

                if (item) {
                    IsInstrumentTypes = true;
                    intrument_type_id = item.id || null;
                    instrument_name = item.instrument_name || null;
                }
                const reminder = nextCalibrationReminderOptions.find((item) => item.label === reminder_frequency);
                if (reminder) {
                    reminder_frequency = reminder.value;
                }
                if (!IsInstrumentTypes || !intrument_type_id || !serial_no || !remarks || isNaN(Number(frequency_days)) || Number(frequency_days) < 0) return;

                const newitem = {
                    srf_item_no: 1,
                    make,
                    model,
                    serial_no,
                    identification_details,
                    frequency_days,
                    reminder_frequency,
                    remarks,
                    url_number: null,
                    intrument_type_id,
                    name: instrument_name
                };
                items.push(newitem);
                updatedCounts++;
            });

            const bodyData = {
                srf_id: props?.srf?.srf_id,
                items,
                labId: auth.labId
            };
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify(bodyData)
            };
            try {
                const response = await fetch(config.Calibmaster.URL + "/api/srf/addbulkitemtosrf", requestOptions);
                const data = await response.json();
                const newNotification = {
                    title: "Imported Successfully",
                    description: updatedCounts ? `Count of Added Items: ${updatedCounts}` : 'No Items',
                    icon: "info",
                    state: true,
                    timeout: 10000,
                };
                dispatch(notificationActions.changenotification(newNotification));
                dispatch(srfitemsActions.changesrfitems(data?.data?.items));
                setXlsxFiles(null);
                setSrfItem([]);
            } catch (error) {
                console.error(error);
                const newNotification = {
                    title: "Import Failed",
                    icon: "error",
                    state: true,
                    timeout: 10000,
                };
                dispatch(notificationActions.changenotification(newNotification));
            }

        }
        else {
            let updatedCounts = 0;
            srfItem.forEach((eachItem) => {
                let masterlistId = null;
                let IsInstrumentTypes = false;
                const description = String(eachItem[0] != null ? eachItem[0] : '') || null;
                const make = String(eachItem[1] != null ? eachItem[1] : '') || null;
                const model = String(eachItem[2] != null ? eachItem[2] : '') || null;
                const serialno = String(eachItem[3] != null ? eachItem[3] : '') || null;
                const idno = String(eachItem[4] != null ? eachItem[4] : '') || null;
                const frequency_days = eachItem[5] || 0;
                let reminder_frequency = eachItem[6] || 0;
                const remarks = String(eachItem[7] != null ? eachItem[7] : '') || null;

                const item = masterlist.find((list) => list.name.trim() === description);
                if (item) {
                    IsInstrumentTypes = true;
                    masterlistId = item.id || null;
                }
                const reminder = nextCalibrationReminderOptions.find((item) => item.label === reminder_frequency);
                if (reminder) {
                    reminder_frequency = reminder.value;
                }
                if (!IsInstrumentTypes || !masterlistId || !serialno || !remarks || isNaN(Number(frequency_days)) || Number(frequency_days) < 0) return;

                const newitem = {
                    description,
                    make,
                    model,
                    serialno,
                    idno,
                    frequency_days,
                    reminder_frequency,
                    remarks,
                    ulrno: null,
                    masterlistId,
                    calibrationDueDate: null,
                };
                dispatch(itemsActions.additem(newitem));
                updatedCounts++;
            });

            const newNotification = {
                title: "Imported Successfully",
                description: updatedCounts ? `Count of Added Items: ${updatedCounts}` : 'No Items',
                icon: "info",
                state: true,
                timeout: 10000,
            };
            dispatch(notificationActions.changenotification(newNotification));
            setXlsxFiles(null);
            setSrfItem([]);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        FetchInstrumentTypes();
    }, []);

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-5 mb-6 bg-white rounded-xl border border-blue-100 shadow-sm ring-1 ring-blue-50/50 hover:shadow-md transition-shadow duration-300">
            {/* Left: Template Download */}
            <div className="flex items-center gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 hover:bg-blue-50 transition-colors duration-300">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg shadow-sm">
                    <DownloadOutlined className="text-white text-lg" />
                </div>
                <div>
                    <h5 className="text-sm font-bold text-gray-800 m-0 leading-tight">
                        Template Required?
                    </h5>
                    <a
                        className={`text-xs text-blue-600 font-medium hover:text-blue-800 underline transition-all flex items-center gap-1 mt-1 ${isFetching ? "pointer-events-none opacity-50" : ""}`}
                        onClick={generateTemplate}
                    >
                        Click here to download template
                    </a>
                </div>
            </div>

            {/* Right: Actions and Info */}
            <div className="flex flex-col items-end gap-2 ml-auto w-full md:w-auto">
                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <Upload
                        accept=".xlsx"
                        beforeUpload={UploadFileHandler}
                        onRemove={handleRemoveFile}
                        maxCount={1}
                        fileList={xlsxFiles ? [{ uid: '-1', name: xlsxFiles.name, status: 'done' }] : []}
                        showUploadList={false}
                    >
                        <Button 
                            icon={<UploadOutlined />} 
                            size="large"
                            className="h-12 px-6 font-medium rounded-lg border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm flex items-center"
                        >
                            {xlsxFiles ? 'Selected: ' + (xlsxFiles.name.length > 15 ? xlsxFiles.name.substring(0, 15) + '...' : xlsxFiles.name) : 'Choose XLSX File'}
                        </Button>
                    </Upload>
                    <Button
                        type="primary"
                        icon={<ImportOutlined />}
                        onClick={ImportHandler}
                        disabled={!xlsxFiles}
                        loading={isLoading}
                        size="large"
                        className="h-12 px-8 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center border-none"
                    >
                        Import Now
                    </Button>
                </div>
                
                {/* File info / status bar */}
                <div className="flex items-center gap-2">
                    {xlsxFiles && !xlsxFilesErr && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-[10px] font-bold text-green-700 uppercase tracking-wider border border-green-100">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse text-xs"></span>
                            Ready to import
                        </span>
                    )}
                    {xlsxFilesErr && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-[10px] font-bold text-red-600 uppercase tracking-wider border border-red-100">
                            {xlsxFilesErr}
                        </span>
                    )}
                    {!xlsxFiles && !xlsxFilesErr && (
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">
                            Format Support: .xlsx only
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddBulkItems;
