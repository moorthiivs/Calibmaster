import { Table, Spinner, Card, } from "react-rainbow-components";
import { useState, useEffect, useContext, Fragment, useMemo } from "react";
import { AuthContext } from "../../../context/auth-context";
import { useDispatch } from "react-redux";
import { notificationActions } from "../../../store/nofitication";
import config from "../../../utils/config.js";
import DueDateItemList from "./DueDateItemList";
import YearDropdown from "./YearDropdown";
import Loader from "../../UI/Loader";
import { convertDateFormat } from "../../../utils/filters";
import './DueDateCount.css'

const DueDateChecker = () => {
    const [error, setError] = useState("");
    const [isLoaded, setIsLoaded] = useState(true);
    const auth = useContext(AuthContext);
    const dispatch = useDispatch();
    const [itemsCount, setItemsCount] = useState(Array(12).fill().map(() => Array(32).fill(0)));
    const [addItemModel, setAddItemModel] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [count, setCount] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const handleYearChange = (event) => {
        setSelectedYear(event.target.value);
    };

    const fetchDueDateCount = async () => {
        setIsLoaded(false);
        setItemsCount(Array(12).fill().map(() => Array(32).fill(0)));

        try {
            const response = await fetch(config.Calibmaster.URL + `/api/due-date/get-calibration-due-date`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + auth.token,
                },
                body: JSON.stringify({ labId: auth.labId, selectedYear })
            });

            const result = await response.json();

            if (result.items.length) {
                const updatedState = Array(12).fill().map(() => Array(32).fill(0));
                result.items.forEach(({ due_date, due_date_count }) => {
                    const date = new Date(due_date);
                    updatedState[date.getMonth()][date.getDate()] = due_date_count || 0;
                });
                setItemsCount(updatedState);
                dispatch(notificationActions.changenotification({
                    title: "Calibration Detail fetched Successfully",
                    icon: "success",
                    state: true,
                    timeout: 1500,
                }));
            } else {
                setItemsCount(Array(12).fill().map(() => Array(32).fill(0)));
            }
        } catch (error) {
            dispatch(notificationActions.changenotification({
                title: "Items Detail not Found",
                icon: "error",
                state: true,
                timeout: 15000,
            }));
        } finally {
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        fetchDueDateCount();
    }, [selectedYear]);

    const monthNames = useMemo(() => ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], []);
    const columns = useMemo(() => {
        const cols = [{ header: 'Month\\Date', field: 'month' }];
        for (let i = 1; i <= 31; i++) {
            cols.push({ header: i.toString(), field: `date_${i}` });
        }
        return cols;
    }, []);

    const data = useMemo(() => {
        return itemsCount.map((row, rowIndex) => {
            const monthData = { month: monthNames[rowIndex] || '' };
            for (let i = 1; i <= 31; i++) {
                monthData[`date_${i}`] = row[i] || '-';
            }
            return monthData;
        });
    }, [itemsCount, monthNames]);

    const handleCellClick = (month, day, value) => {
        if (isLoaded && value != '-') {
            setCount(value);
            setSelectedDate(day);
            setSelectedMonth(month);
            setAddItemModel(prev => !prev);
        }
    };

    const customCellRenderer = ({ row, colIndex }) => {
        const value = row[columns[colIndex + 1].field];
        const month = row.month;
        const day = colIndex + 1;

        const current_Date = convertDateFormat(new Date());
        const cell_Date = `${('0' + day).slice(-2)}/${('0' + (monthNames.indexOf(month) + 1)).slice(-2)}/${selectedYear}`;

        return (
            <div style={{
                cursor: isLoaded && value != '-' ? 'pointer' : 'default',
                textAlign: 'center',
                borderRadius: '60px',
                color: cell_Date === current_Date ? 'rgb(1, 182, 245)' : 'gray',
                border: `1px solid ${cell_Date === current_Date ? 'gray' : 'transparent'}`,
                fontWeight: cell_Date === current_Date ? 'bolder' : 'normal'
            }}
                onClick={() => handleCellClick(month, day, value)}
                title={cell_Date}>
                {value}
            </div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            <Card>
                <div style={{ alignItems: "center", padding: '15px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', display: 'flex', top: '-16px', padding: '0 0 0 80%', alignItems: 'center' }}>
                            <p className="text-md font-bold my-5">Select Year:</p>
                            <YearDropdown startYear={2000} endYear={2100} onChange={handleYearChange} />
                        </div>
                        <h3 className="text-lg font-bold my-5">Due Date for Calibration</h3>
                    </div>
                    {isLoaded ? (
                        <Table data={data} keyField="month">
                            <Table header={columns[0].header} field={columns[0].field} width={130} />
                            {columns.slice(1).map((col, colIndex) => (
                                <Table key={col.field} header={col.header} field={col.field} component={({ row }) => customCellRenderer({ row, colIndex })} />
                            ))}
                        </Table>
                    ) : (
                        <Fragment>
                            <div>There are no items</div>
                            <Loader />
                        </Fragment>
                    )}
                </div>
            </Card>
            {addItemModel && <DueDateItemList onclose={handleCellClick} isopen={addItemModel} month={selectedMonth} date={selectedDate} count={count} year={selectedYear} />}
        </div>
    );
}

export default DueDateChecker;
