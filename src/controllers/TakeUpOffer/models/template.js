function createInCondition(key, value, placeholderIndex) {
  let condition = "";
  let params = [];
  if (Array.isArray(value["value"])) {
    condition = `${key} IN (${value["value"]
      .map((_, i) => `$${placeholderIndex + i}`)
      .join(", ")}) `;
    params = value["value"];
    placeholderIndex += value["value"].length;
  } else {
    condition = `${key} = $${placeholderIndex}`;
    params = [value["value"]];
    placeholderIndex += 1;
  }
  return { condition, params: params, placeholderIndex };
}

const keyFunctions = {
  age: (key, value, placeholderIndex) => {
    const condition = `age BETWEEN $${placeholderIndex} and $${
      placeholderIndex + 1
    } `;
    // console.log(value);process.exit();
    const params = [value["value"][0], value["value"][1]];
    return {
      condition,
      params: params,
      placeholderIndex: placeholderIndex + 2,
    };
  },

  default: createInCondition,
};

function createCondition(key, value, placeholderIndex) {
  const keyFunction = keyFunctions[key] || keyFunctions.default;
  return keyFunction(key, value, placeholderIndex);
}

module.exports = { createCondition };
