import config from "../../../utils/config.js";

// export const searchByNameFunction = async (val, auth) => {

//     const data = await fetch(config.Calibmaster.URL + `/api/instrument-types/searchByName/${val}`, {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: "Bearer " + auth.token,
//         },
//     });

//     const response = await data.json();
//     return response.data;
// }



export const searchByNameFunction = async (val = "", labType, auth) => {
    const params = new URLSearchParams();

    if (val) params.append("name", val);
    if (labType) params.append("labType", labType);

    const response = await fetch(
        `${config.Calibmaster.URL}/api/instrument-types/searchByName?${params}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + auth.token,
            },
        }
    );

    const result = await response.json();
    return result.data;
};




export const addNewId = async (arr) => {

    for (let i = 0; i < arr.length; i++) {
        arr[i].id = i + 1;
    }

    return arr;
}
