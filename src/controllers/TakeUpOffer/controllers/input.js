const createInput = (templateData, privateData, percentage) => {
  let nonMandateFields = {};
  //Removing "value", "required" key and putting value directly to key and removing it its not required
  for (const key in templateData) {
    if (templateData.hasOwnProperty(key)) {
      const element = templateData[key];
      if (element.mandate == true) {
        templateData[key] = element.value;
      } else {
        nonMandateFields[key] = element.value;
        delete templateData[key];
      }
    }
  }

  //Converting template data to hex
  templateData = convertValueToHex(templateData);

  //Converting non mandate data to hex
  nonMandateFields = convertValueToHex(nonMandateFields);

  //Converting private data to hex
  privateData.forEach((item) => {
    for (const key in item) {
      if (typeof item[key] === "string") {
        // item[key] = createHash('sha256').update(item[key]).digest('hex');
        item[key] = Buffer.from(item[key]).toString("hex");
      } else if (typeof item[key] === "number") {
        item[key] = item[key].toString();
      } else if (item[key] === null) {
        // Replace null values with 0
        item[key] = "0";
      }
    }
  });

  return {
    privateData: privateData,
    templateData: templateData,
    nonMandateFields: nonMandateFields,
    percentage: percentage.toString(),
  };
};

const convertValueToHex = (jsonObject) => {
  for (const key in jsonObject) {
    if (typeof jsonObject[key] === "string") {
      if (isNaN(parseInt(jsonObject[key])) || isNaN(item)) {
        // jsonObject[key] = createHash('sha256').update(jsonObject[key]).digest('hex');
        jsonObject[key] = Buffer.from(jsonObject[key]).toString("hex");
      } else {
        jsonObject[key] = String(jsonObject[key]);
      }
    } else if (Array.isArray(jsonObject[key])) {
      jsonObject[key] = jsonObject[key].map((item) => {
        if (
          typeof item === "string" &&
          (isNaN(parseInt(item)) || isNaN(item))
        ) {
          // return createHash('sha256').update(item).digest('hex');
          return Buffer.from(item).toString("hex");
        }
        return item;
      });
    }
  }
  return jsonObject;
};
module.exports = {
  createInput,
};
