if (table_type === "vertical") {

    for (let i = 0; i < cellTexts.length; i++) {
        for (let j = 0; j < headerTypes.length; j++) {
            if (headerTypes[j] == "Formula") {
                const mainObj = cellTexts[i][j];
                const textObj = { text: mainObj.val }
                Object.assign(mainObj, textObj);
            }
        }
    }

    cellTexts.unshift(FirstHeaderTexts, secondHeaderTexts);

    for (let i = 0; i < Columns; i++) {
        widthsArr.push(60);
    }

    const eachObj = {
        style: 'eachTableStyle',
        color: '#444',
        table: {
            widths: widthsArr,
            headerRows: 2,
            keepWithHeaderRows: 1,
            body: cellTexts
        }
    }
    bigEyeObj.push(eachObj);
} else {

    const verticalTable = [];

    for (let i = 0; i < cellTexts.length; i++) {
        const element = cellTexts[i];
        const halfBeforeTheUnwantedElement = element.slice(0, 2);
        const halfAfterTheUnwantedElement = element.slice(3)
        const copyWithoutThirdElement = halfBeforeTheUnwantedElement.concat(halfAfterTheUnwantedElement);
        verticalTable.push(copyWithoutThirdElement);
    }

    for (let i = 0; i < Columns; i++) {
        widthsArr.push("*");
    }

    const eachObj = {
        style: 'eachTableStyle',
        color: '#444',
        table: {
            widths: widthsArr,
            headerRows: 2,
            keepWithHeaderRows: 1,
            body: verticalTable
        }
    }
    bigEyeObj.push(eachObj);
}