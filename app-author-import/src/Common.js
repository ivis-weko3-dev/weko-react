import * as bridge from './Bridge';

export const prepareSuccessMsg = (type) => {
    let msg = '';
    switch (type) {
        case 'new':
            msg = bridge.register_success_label;
            break;
        case 'update':
            msg = bridge.update_success_label;
            break;
        case 'deleted':
            msg = bridge.delete_success_label;
            break;
        default:
            break;
    }

    return msg;
};

export const cleanArrayData = (data) => {
    return data ? data.filter(el => { return el != null && el !== ''; }) : [];
};

export const prepareDisplayName = (authorNameInfo) => {
    if (authorNameInfo) {
        return cleanArrayData(
            authorNameInfo.map((nameInfo) => {
                const showComma = nameInfo.familyName && nameInfo.firstName ? ', ' : '';
                return nameInfo.familyName + showComma + nameInfo.firstName;
            })
        );
    }
    return [];
};

export const JSONToCSVConvertor = (JSONData, ReportTitle, ShowLabel) => {
    // If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    let arrData = typeof JSONData !== "object" ? JSON.parse(JSONData) : JSONData;
    let CSV = "";

    // This condition will generate the Label/Header
    if (ShowLabel) {
        let row = "";
        // This loop will extract the label from 1st index of on array
        for (let index in arrData[0]) {
            // Now convert each value to string and comma-seprated
            row += index + "\t";
        }
        row = row.slice(0, -1);
        // Append Label row with line break
        CSV += row + "\r\n";
    }

    // 1st loop is to extract each row
    for (let i = 0; i < arrData.length; i++) {
        let row = "";
        // 2nd loop will extract each column and convert it in string comma-seprated
        for (let index in arrData[i]) {
            row += '"' + arrData[i][index] + '"\t';
        }
        row = row.slice(0, -1);
        // Add a line break after each row
        CSV += row + "\r\n";
    }

    if (CSV === "") {
        alert("Invalid data");
        return;
    }

    // This will remove the blank-spaces from the title and replace it with an underscore
    let fileName = ReportTitle.replace(/ /g, "_") + ".tsv";

    const blob = new Blob([CSV], { type: 'text/tsv' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
        const url = window.URL.createObjectURL(blob);
        const tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = url;
        tempLink.download = fileName;
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(url);
    }
};
