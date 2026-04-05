import config from "../../../utils/config.json";

export const fetchSRFItems = async (auth) => {

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId }),
    };

    const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
    const { data } = await response.json();
    const { items } = data;

    const newSRFList = async (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i].slNo = i + 1;
        }
        console.log(arr);
        return arr;
    }

    let getSRFList = await newSRFList(items);
    return getSRFList;
}