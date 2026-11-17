import React, { useEffect, useState } from 'react';
import "./UncertaintyBudget.css";

const UncertaintyBudget = ({ uncertaintyMasterParameters }) => {

    const [calibration, setCalibration] = useState([]);
    console.log(uncertaintyMasterParameters);

    useEffect(() => {
        fetchDataHandler();
    }, [uncertaintyMasterParameters]);

    const fetchDataHandler = () => {
        const data = uncertaintyMasterParameters?.map((item) => {
            item.limits = 0;
            item.std_uncertainty = 0;
            item.sensitivity_coefficient = 1;
            item.uncertainty_contribution = 0;
            return item;
        })
        setCalibration(data);
    };

    const handleCalculation = (id, value) => {
        try {
            setCalibration(calibration.map(eachRow => {
                if (eachRow.uncertainty_master_parameter_id == id) {

                    const std_uncertainty_calculation = (parseFloat(value) / eachRow.dividing_factor);
                    const uncertainty_contribution_calculation = eachRow.sensitivity_coefficient * std_uncertainty_calculation;

                    return {
                        ...eachRow,
                        limits: parseFloat(value),
                        std_uncertainty: std_uncertainty_calculation.toFixed(5),
                        uncertainty_contribution: uncertainty_contribution_calculation.toFixed(5)
                    }
                } else {
                    return eachRow;
                }
            }));
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="uncertainty_budget">

            <div className="uncertainty_budget_top_area">
                <h3>Uncertainty Budget</h3>
            </div>

            <table className="uncertainty_budget_table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Limits</th>
                        <th>Type</th>
                        <th>Distribution</th>
                        <th>Dividing Factor</th>
                        <th>Std Uncertainty</th>
                        <th>Sensitivity Coefficient</th>
                        <th>Uncertainty Contribution</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        calibration.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td>
                                    <input type="number" step={1} onChange={(e) => {
                                        if (e.target.value) {
                                            const id = item.uncertainty_master_parameter_id;
                                            let value = e.target.value
                                            handleCalculation(id, value);
                                        }
                                    }} />
                                </td>
                                <td>{item.parameter_type}</td>
                                <td>{item.distribution}</td>
                                <td>{item.dividing_factor}</td>
                                <td>{item.std_uncertainty}</td>
                                <td>{item.sensitivity_coefficient}</td>
                                <td>{item.uncertainty_contribution}</td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    )
}

export default UncertaintyBudget;