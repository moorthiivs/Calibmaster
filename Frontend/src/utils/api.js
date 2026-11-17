
import config from "./config.json";


export const apiloginHandler = async (url, requestBody) => {

    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
    };
    return await fetch(config.Calibmaster.URL + url, requestOptions)
        .then(async (response) => {
            const data = await response.json();
            return { data: data, error: null }
        }).catch((error) => {
            return { data: null, error: error }
        });
}

// export const apipostHandler = async (url, requestBody) => {

//     const requestOptions = {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestBody),
//     };
//     return await fetch(config.Calibmaster.URL + url, requestOptions)
//         .then(async (response) => {
//             const data = await response.json();
//             return { data: data, error: null }
//         }).catch((error) => {
//             return { data: null, error: error }
//         });
// }
export const apipostHandler = async (url, requestBody, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const requestOptions = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
    };
    return await fetch(config.Calibmaster.URL + url, requestOptions)
        .then(async (response) => {
            const data = await response.json();
            return { data: data, error: null }
        }).catch((error) => {
            return { data: null, error: error }
        });
}