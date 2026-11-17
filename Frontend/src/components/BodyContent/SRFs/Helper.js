import config from "../../../utils/config.json";

export const fetchSRFItems = async (auth, params = {}) => {
    const { page = 1, limit = 5, search = "", status = "", sortBy = "srf_item_id", sortOrder = "DESC" } = params;

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
            labId: auth.labId,
            userId: auth.userId,
            page,
            limit,
            search,
            status,
            sortBy,
            sortOrder
        }),
    };

    try {
        const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
        const { data } = await response.json();
        const items = data?.items || [];
        const pagination = data?.pagination || {};

        let counter = (page - 1) * limit + 1;
        for (let i = 0; i < items.length; i++) {
            items[i].slNo = counter++;
        }

        return { items, pagination };
    } catch (err) {
        console.log(err);
        return { items: [], pagination: {} };
    }
};