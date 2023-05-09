const { createCondition } = require("./template");
require("dotenv").config();

const getPrivateData = async (
  templateData,
  paramsData,
  onlyCount,
  pool,
  dbName
) => {
  const conditions = [];
  const params = [];
  const nonMandateCondition = [];
  var placeholderIndex = 1;
  let nonMandateKeys = [];
  let percentage = 0;
  Object.entries(templateData.fields).forEach(([key, value]) => {
    if (value["mandate"] === true) {
      const {
        condition: processedCondition,
        params: processedParams,
        placeholderIndex: updatedIndex,
      } = createCondition(key, value, placeholderIndex);
      conditions.push(processedCondition);
      params.push(...processedParams);
      placeholderIndex = updatedIndex;
    } else {
      const {
        condition: processedCondition,
        params: processedParams,
        placeholderIndex: updatedIndex,
      } = createCondition(key, value, placeholderIndex);
      if (
        processedCondition != undefined &&
        !processedCondition.includes("()")
      ) {
        nonMandateCondition.push(processedCondition);
      }
      params.push(...processedParams);
      placeholderIndex = updatedIndex;
      nonMandateKeys.push(key);
    }
  });

  if (nonMandateKeys.length > 0) {
    percentage = Math.round(
      nonMandateKeys.length * (templateData.percentage / 100)
    );
  }
  // placeholderIndex++;

  let query;
  if (onlyCount) {
    if (nonMandateCondition.length < 1 && conditions.length >= 1) {
      query = `
        SELECT Count(pid)
        FROM ${dbName}.${dbName}
        WHERE ${conditions.join(" AND ")};
        `;
    } else if (conditions.length >= 1) {
      params.push(percentage);
      query = `
        WITH subquery AS(
          Select *, ((${nonMandateCondition.join(
            ")::integer + ("
          )})::integer) AS r
          FROM ${dbName}.${dbName}
          WHERE ${conditions.join(" AND ")}
        )
        SELECT Count(pid)
        FROM subquery
        WHERE r >= $${params.length}
        `;
    } else {
      return {
        status: false,
        message: "Atleast one mandate field is required!",
      };
    }
    const res = await pool.query(query, params);

    await pool.end();

    return { data: res.rows, percentage: percentage };
  } else {
    if (nonMandateCondition.length < 1 && conditions.length >= 1) {
      query = `
      SELECT Count(pid)
      FROM ${dbName}.${dbName}
      WHERE ${conditions.join(" AND ")};
      `;
    } else if (conditions.length >= 1) {
      params.push(percentage);
      query = `
      WITH subquery AS(
        Select *, ((${nonMandateCondition.join(
          ")::integer + ("
        )})::integer) AS r
        FROM ${dbName}.${dbName}
        WHERE ${conditions.join(" AND ")}
      )
      SELECT Count(pid)
      FROM subquery
      WHERE r >= $${params.length}
      `;
    } else {
      return {
        status: false,
        message: "Atleast one mandate field is required!",
      };
    }

    let res = await pool.query(query, params);
    let totalPages = Math.round(res.rows[0]["count"] / paramsData["count"]); //1

    if (res.rows[0]["count"] < 1) {
      return {
        status: false,
        message: "No data found that matches the template",
      };
    }

    if (totalPages < paramsData["page"] || paramsData["page"] == 0) {
      paramsData["page"] = totalPages;
    }

    //If 1 <= mandate and 0 non mandate field are sent
    if (nonMandateCondition.length < 1 && conditions.length >= 1) {
      params.push(paramsData["count"]);
      params.push(paramsData["page"]);
      query = `
        SELECT pid, ${Object.keys(templateData.fields).join(", ")}
        FROM ${dbName}.${dbName}
        WHERE ${conditions.join(" AND ")}
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
        ;
        `;
    }
    //If 1 <= mandate and 1 <= non mandate fields are sent
    else if (conditions.length >= 1) {
      params.push(paramsData["count"]);
      params.push(paramsData["page"]);
      query = `
        WITH subquery AS(
          Select *, ((${nonMandateCondition.join(
            ")::integer + ("
          )})::integer) AS r
          FROM ${dbName}.${dbName}
          WHERE ${conditions.join(" AND ")}
        )
        SELECT pid, r, ${Object.keys(templateData.fields).join(", ")}
        FROM subquery
        Group By pid, r, ${Object.keys(templateData.fields).join(", ")}
        HAVING r >= $${params.length - 2}
        ORDER BY r desc
        LIMIT $${params.length - 1}
        OFFSET $${params.length};
        `;
    } else {
      return {
        status: false,
        message: "Atlease one mandate field is required",
      };
    }

    res = await pool.query(query, params);
    await pool.end();
    return { data: res.rows, percentage: percentage };
  }
};

module.exports = {
  getPrivateData,
};
