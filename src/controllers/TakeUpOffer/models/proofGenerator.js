const fs = require("fs");
const path = require("path");

const batchSize = 5;
const zokSourceCodeKeywords = require("./zokSourceCodeKeywords.json");

const zokRanges = require("./zokRanges.json");
const getSource = async (input) => {
  return new Promise((resolve, reject) => {
    const sourcePath = path.join(__dirname, "root.zok");
    var readStream = fs.createReadStream(sourcePath, "utf8");

    readStream.on("data", function (chunk) {
      source = chunk;
      try {
        source = addRequiredFiledsToSource(source, input);
        if (source.status == false) return reject(source);
        source = source.replace("PDL", batchSize); //Private data array length
        resolve(source);
      } catch (error) {
        console.log(error);
      }
    });
  });
};

const addRequiredFiledsToSource = (source, input) => {
  const zokratesConstants = [];
  const structPrivateValues = [];
  const structNonMandateFields = [];
  const structPublicValues = [];
  const compareArray = [];
  const compareSingleValue = [];
  const checkFieldsMatch = [];

  // console.log(input);process.exit();
  if (input[0].length < 1) {
    return {
      status: false,
      message: "No data found that matches the template",
    };
  }
  Object.entries(input[1]).forEach(([key, value]) => {
    //If public data is array and private data is single
    if (Array.isArray(value) && !Array.isArray(input[0][0][value])) {
      //Key is range like age, annual income, spends
      if (zokRanges.rangeItems.includes(key)) {
        structPrivateValues.push(`  u32 ${key};`);
        structPublicValues.push(`   u32[2] ${key};`);
        compareArray.push(
          `         assert(y.${key}[0] <= x[i].${key} && x[i].${key} <= y.${key}[1]);`
        );
      } else {
        zokratesConstants.push(
          `const u32 ${key.toUpperCase()}_LENGTH = ${value.length};`
        );
        structPrivateValues.push(`  field ${key};`);
        structPublicValues.push(
          `   field[${key.toUpperCase()}_LENGTH] ${key};`
        );
        compareArray.push(
          `         assert(compare::<${key.toUpperCase()}_LENGTH>(x[i].${key}, y.${key}) == true);`
        );
      }
    }

    //If public data is array and private data is also array
    else if (
      Array.isArray(value) &&
      Array.isArray(input[0][0][value]) &&
      !zokRanges.rangeItems.includes(key)
    ) {
      zokratesConstants.push(
        `const u32 PRIVATE_${key.toUpperCase()}_LENGTH = ${
          input[0][0][value].length
        };`
      );
      zokratesConstants.push(
        `const u32 ${key.toUpperCase()}_LENGTH = ${value.length};`
      );

      structPrivateValues.push(`  field ${key};`);
      structPublicValues.push(`   field[${key.toUpperCase()}_LENGTH] ${key};`);
      compareArray.push(
        `     assert(compareArrays::<${key.toUpperCase()}_LENGTH, PRIVATE_${key.toUpperCase()}_LENGTH>(x[i].${key}, y.${key}) == true);`
      );
    }

    //If public data is single and private data is single
    else if (!Array.isArray(value) && !Array.isArray(input[0][0][value])) {
      structPrivateValues.push(`  field ${key};`);
      structPublicValues.push(`  field ${key};`);
      compareSingleValue.push(
        `     assert((y.${key} == 0 && x[i].${key} == 0) || y.${key} == x[i].${key});`
      );
    }
  });

  Object.entries(input[2]).forEach(([key, value]) => {
    //If public data is array and private data is single
    if (Array.isArray(value) && !Array.isArray(input[0][0][value])) {
      //Key is range like age, annual income, spends
      if (zokRanges.rangeItems.includes(key)) {
        structPrivateValues.push(`  u32 ${key};`);
        structNonMandateFields.push(`   u32[2] ${key};`);
        checkFieldsMatch.push(
          `     totalFieldMatchCount = (nonMandateData.${key}[0] <= privateData.${key} && privateData.${key} <= nonMandateData.${key}[1])? totalFieldMatchCount+1 : totalFieldMatchCount+0;`
        );
      } else {
        zokratesConstants.push(
          `const u32 ${key.toUpperCase()}_LENGTH = ${value.length};`
        );
        structPrivateValues.push(`  field ${key};`);
        structNonMandateFields.push(
          `   field[${key.toUpperCase()}_LENGTH] ${key};`
        );
        checkFieldsMatch.push(
          `     totalFieldMatchCount = (compareNonMandate::<${key.toUpperCase()}_LENGTH>(privateData.${key}, nonMandateData.${key}) == true) ? totalFieldMatchCount+1 : totalFieldMatchCount+0;`
        );
      }
    }
    //If public data is array and private data is also array
    else if (
      Array.isArray(value) &&
      Array.isArray(input[0][0][value]) &&
      !zokRanges.rangeItems.includes(key)
    ) {
      zokratesConstants.push(
        `const u32 ${key.toUpperCase()}_LENGTH = ${value.length};`
      );
      zokratesConstants.push(
        `const u32 PRIVATE_${key.toUpperCase()}_LENGTH = ${
          input[0][0][value].length
        };`
      );
      structPrivateValues.push(`  field ${key};`);
      structNonMandateFields.push(
        `   field[${key.toUpperCase()}_LENGTH] ${key};`
      );
      checkFieldsMatch.push(
        `     totalFieldMatchCount = (compareNonMandateArrays::<${key.toUpperCase()}_LENGTH>(privateData.${key}, nonMandateData.${key}) == true) ? totalFieldMatchCount+1 : totalFieldMatchCount+0;`
      );
    }
    //If public data is single and private data is single
    else if (!Array.isArray(value) && !Array.isArray(input[0][0][value])) {
      structPrivateValues.push(`  field ${key};`);
      structNonMandateFields.push(`  field ${key};`);
      checkFieldsMatch.push(
        `     totalFieldMatchCount = ((nonMandateData.${key} == 0 && privateData.${key} == 0) || nonMandateData.${key} == privateData.${key}) ? totalFieldMatchCount+1 : totalFieldMatchCount+0;`
      );
    }
  });
  // read the file into an array of lines
  const lines = source.split("\n");
  // filter out the lines that contain a value from the data object
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const u32 PRIVATE_DATA_LENGTH =")) {
      lines.splice(i + 1, 0, ...zokratesConstants);
    }

    //Generate Public data struct fileds in zokrates
    if (lines[i].includes("struct PublicData {")) {
      lines.splice(i + 1, 0, ...structPublicValues);
    }

    //Generate Private data struct fileds in zokrates
    if (lines[i].includes("struct PrivateData {")) {
      lines.splice(i + 1, 0, ...structPrivateValues);
    }

    //Generate non-mandate struct fileds in zokrates
    if (lines[i].includes("struct NonMandateFields {")) {
      lines.splice(i + 1, 0, ...structNonMandateFields);
    }

    if (lines[i].includes("for u32 i in 0..PRIVATE_DATA_LENGTH {")) {
      lines.splice(i + 1, 0, ...compareArray, ...compareSingleValue);
    }

    //Add field match
    if (lines[i].includes("u8 mut totalFieldMatchCount = 0;")) {
      lines.splice(i + 1, 0, ...checkFieldsMatch);
    }
  }

  return lines.join("\n");
};

const getFileData = (fileName) => {
  return new Promise((resolve, reject) => {
    const inputFile = path.join(__dirname, "..", fileName);

    fs.readFile(inputFile, (err, data) => {
      if (err) return reject(err);
      resolve(JSON.parse(data));
    });
  });
};

const randomize = (originalArray, length) => {
  // create a set to keep track of selected objects
  const selectedObjects = new Set();

  // loop until we have selected 100 unique objects
  while (selectedObjects.size < length) {
    // generate a random index
    const randomIndex = Math.floor(Math.random() * originalArray.length);

    // check if the corresponding object has already been selected
    if (!selectedObjects.has(originalArray[randomIndex])) {
      // if not, add it to the selected set
      selectedObjects.add(originalArray[randomIndex]);
    }
  }

  // create a new array from the selected objects
  return Array.from(selectedObjects);
};

const generateProof = async (templateId, proofUsersCount) => {
  try {
    let { initialize } = await import("zokrates-js");

    let zokratesProvider = await initialize();

    const largePrivateData = await getFileData(
      `privateData_${templateId}.json`
    );

    //length of user data array is smaller than requested user count proof dont randomize
    let privateData;
    console.log(`Original Length of private data: ${largePrivateData.length}`);
    console.log(`Requested proof user count: ${proofUsersCount}`);
    if (largePrivateData.length < proofUsersCount) {
      console.log("private data > proofUsersCount: Not Randomizing");
      privateData = largePrivateData;
    } else {
      console.log("Randomizing data...");
      privateData = randomize(largePrivateData, proofUsersCount);
    }

    const templateData = await getFileData(`templateData_${templateId}.json`);
    const nonMandateFields = await getFileData(
      `nonMandateFields_${templateId}.json`
    );
    const percentage = await getFileData(`percentage_${templateId}.json`);
    const input = [privateData, templateData, nonMandateFields, percentage];

    // console.log(input);
    source = await getSource(input).catch((err) => {
      return err;
    });

    // console.log(source);

    if (source.status == false) return source;

    // console.log(source);
    const artifacts = zokratesProvider.compile(source);

    // computation
    // console.log("computation");

    console.log(`Trimming array to multiple of batch size i.e ${batchSize}`);

    // Trim the length of input[0] to the nearest multiple of 10
    const inputLength = Math.floor(input[0].length / batchSize) * batchSize;
    input[0] = input[0].slice(0, inputLength);

    console.log(`Trimmed Input length: ${input[0].length}`);

    if (input[0].length < batchSize) {
      return {
        status: false,
        message: `Need atleast ${batchSize} users to generate proof!`,
      };
    }
    console.log("Recursive proof generation started...");
    return recursiveVerifier(
      input,
      (i = 0),
      null,
      null,
      null,
      zokratesProvider,
      artifacts
    );
  } catch (err) {
    if (err.code === "ENOENT") {
      return {
        status: false,
        message: `No data found related to this template_id: ${templateId}`,
      };
    } else {
      console.log(err);
      return {
        status: false,
        message: `Something went wrong! Error code: ${err.code}`,
      };
    }
  }
};

function recursiveVerifier(
  input,
  i = 0,
  keypair = null,
  proof = null,
  verifier = null,
  zokratesProvider,
  artifacts
) {
  if (i >= input[0].length) {
    return {
      status: "success",
      verifying_key: keypair.vk,
      proof: proof,
      solidity: Buffer.from(verifier).toString("base64"),
    };
  }

  const finalInput = [
    input[0].slice(i, i + batchSize),
    input[1],
    input[2],
    input[3],
  ];

  const { witness, output } = zokratesProvider.computeWitness(
    artifacts,
    finalInput
  );

  if (!keypair) {
    keypair = zokratesProvider.setup(artifacts.program);
  }

  proof = zokratesProvider.generateProof(
    artifacts.program,
    witness,
    keypair.pk
  );
  const isVerified = zokratesProvider.verify(keypair.vk, proof);

  if (!isVerified) {
    return { status: false, message: `Invalid data at index ${i}` };
  }

  if (i == input[0].length - batchSize) {
    verifier = zokratesProvider.exportSolidityVerifier(keypair.vk);
    return {
      status: "success",
      verifying_key: keypair.vk,
      proof: proof,
      solidity: Buffer.from(verifier).toString("base64"),
    };
  }

  return recursiveVerifier(
    input,
    i + batchSize,
    keypair,
    proof,
    verifier,
    zokratesProvider,
    artifacts
  );
}

module.exports = {
  generateProof,
};
