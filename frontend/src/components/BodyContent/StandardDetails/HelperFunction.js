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

export const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file); // Convert file to Base64
    });
}