export const populateUomData = async (uomData) => {

    let uomArr = [{ value: '', label: 'Select' }];

    await uomData.map((item, index) => {
        uomArr[index + 1] = {
            value: item.uom_id,
            label: item.uom_name
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


export const populateUomWithsysmbol = async (uomData) => {

    let uomArr = [{ value: 0, label: 'Select' }];

    await uomData.map((item, index) => {
        uomArr[index + 1] = {
            value: item.uom_id,
            //: item.uom_name,
            label: item.uom_printsysmbol,
            sysmbol: item.uom_printsysmbol,
        }
    })

    return uomArr;
}
