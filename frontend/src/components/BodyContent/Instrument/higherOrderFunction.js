import config from "../../../utils/config.json";

export const searchByNameFunction = async (val, lab_id, auth) => {
  const data = await fetch(
    config.Calibmaster.URL + `/api/instrument/searchByName/${val}&${lab_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
    }
  );

  const response = await data.json();
  return response.data;
};

export const addNewId = async (arr) => {
  for (let i = 0; i < arr.length; i++) {
    let { UOM, discipline, group } = arr[i];
    arr[i].id = i + 1;
    arr[i].instrument_discipline = discipline.instrument_discipline;
    arr[i].uom_name = UOM.uom_name;
    arr[i].group_details = group.group_details;
  }

  return arr;
};