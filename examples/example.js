const path = require("path");
const XTPL = require("../src/bookWriter");
const { getPersons } = require("./data");

async function run() {
  const xtpl = new XTPL();
  await xtpl.readFile(path.join(__dirname, "template.xlsx"));
  const [person0, person1, person2] = await getPersons();
  xtpl.renderSheet(
    {
      ps: [person1, person2, person0],
      flowsImage: path.join(__dirname, "images/flows.png"),
    },
    "Details Design"
  );
  xtpl.renderSheet(
    {
      projectName: "xtpl",
      author: "xuanhoa88",
    },
    "Project Details"
  );
  await xtpl.writeFile(path.join(__dirname, "result.xlsx"));
}

run();
