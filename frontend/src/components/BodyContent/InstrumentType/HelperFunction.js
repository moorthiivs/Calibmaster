export const populateUomData = async (uomData) => {

    let uomArr = [{ value: '', label: 'Select' }];

    await uomData.map((item, index) => {
        uomArr[index + 1] = {
            value: item.uom_id,
            label: item.uom_printsysmbol
        }
    })

    return uomArr;
}

export const populateDisciplineData = async (disciplineData) => {

    let disciplineArr = [{ value: '', label: 'Select' }];

    await disciplineData.map((item, index) => {
        disciplineArr[index + 1] = {
            value: item.instrument_discipline_id,
            label: item.instrument_discipline
        }
    })

    return disciplineArr;
}

export const populateGroupData = async (GroupData) => {

    let groupArr = [{ value: '', label: 'Select' }];

    await GroupData.map((item, index) => {
        groupArr[index + 1] = {
            value: item.instrument_group_id,
            label: item.group_details
        }
    })

    return groupArr;
}

export const populateInstrumentData = async (instrumentData) => {

    let instrumentArr = [{ value: '', label: 'Select' }];

    await instrumentData.map((item, index) => {
        instrumentArr[index + 1] = {
            value: item.instrument_id,
            label: item.instrument_name
        }
    })

    return instrumentArr;
}

export const findInstrumentValue = async (id, arr) => {

    let name = "";

    await arr.filter((eachRow) => {
        if (eachRow?.value == id) {
            name = eachRow?.label
        }
    });

    return name;
}

export const findUOMValue = async (id, arr) => {
    let name = "";

    await arr.filter((eachRow) => {
        if (eachRow?.value == id) {
            name = eachRow?.label
        }
    });

    return name;
}