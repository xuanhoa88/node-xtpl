const fs = require("fs");
const path = require("path");

function fsReadFileAsync(filename, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, options, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function getExtension(filepath) {
  return filepath.split(".").pop();
}

class Item {
  constructor(name, category, price, count) {
    this.name = name;
    this.category = category;
    this.price = price;
    this.count = count;
    this.date = new Date();
  }
}

function getItems() {
  const items = [];
  items.push(new Item("萝卜", "蔬菜", 1.11, 5));
  items.push(new Item("苹果", "水果", 2.22, 4));
  items.push(new Item("香蕉", "水果", 3.33, 3));
  items.push(new Item("白菜", "蔬菜", 1.11, 2));
  items.push(new Item("白菜", "蔬菜", 1.11, 1));
  return items;
}

async function getPersons() {
  const now = new Date();
  const items = getItems();
  const img0 = path.join(__dirname, "images/0.jpg");
  const img1 = path.join(__dirname, "images/1.jpg");
  const _img2 = path.join(__dirname, "images/2.jpg");
  const buffer = await fsReadFileAsync(_img2);
  const extension = getExtension(_img2);
  const img2 = { buffer, extension };
  const person0 = {
    address: "福建行中书省福宁州傲龙山庄",
    name: "龙傲天",
    fm: 178,
    date: now,
    img: img1,
  };
  const person1 = {
    address: "Somewhere over the rainbow",
    name: "Hello Wizard",
    fm: 156,
    date: now,
    img: img0,
  };
  const person2 = {
    address: "No Where",
    name: "No Name",
    fm: 333,
    date: now,
    img: img2,
  };
  person0["rows"] = items;
  person1["rows"] = items;
  person2["rows"] = items;
  person0["items"] = items;
  person1["items"] = items;
  person2["items"] = items;
  return [person0, person1, person2];
}

module.exports = { getPersons };
