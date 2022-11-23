const path = require("path");
const XTPL = require("../dist/xtpl");
const { getPersons } = require("./data");

async function run() {
  const xtpl = new XTPL();
  await xtpl.readFile(path.join(__dirname, "template.xlsx"));
  const [person0, person1, person2] = await getPersons();
  const persons = {
    ps: [person1, person2, person0, person0],
    flowsImage: path.join(__dirname, "images/flows.png"),
  };
  xtpl.renderSheet(persons, "Details Design");
  await xtpl.writeFile(path.join(__dirname, "result.xlsx"));
}

run();
