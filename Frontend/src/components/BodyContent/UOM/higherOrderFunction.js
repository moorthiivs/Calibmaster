import config from "../../../utils/config.json";

export const searchByNameFunction = async (val, auth) => {

    const data = await fetch(config.Calibmaster.URL + `/api/uom/searchByName/${val}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
        },
    });

    const response = await data.json();
    return response.data;
}

export const searchByKindOfQuantity = async (val, auth) => {

    const data = await fetch(config.Calibmaster.URL + `/api/uom/searchByKindOfQuantity/${val}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
        },
    });

    const response = await data.json();
    return response.data;
}

export const addNewId = async (arr) => {
    for (let i = 0; i < arr.length; i++) {
        arr[i].id = i + 1;
    }
    return arr;
}