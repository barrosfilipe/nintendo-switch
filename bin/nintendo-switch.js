#!/usr/bin/env node

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const formatCurrency = require("format-currency");
const ora = require("ora");
const shoutSuccess = require("shout-success");
const shoutError = require("shout-error");
const Table = require("cli-table");
const colors = require("colors");
const table = new Table({
  head: ["Item", "Price"],
  colWidths: [30, 30]
});

const spinner = ora("Retrieving Nintendo Switch Price");
spinner.start();

const getBoaDicaPrice = async productId => {
  return new Promise(async resolve => {
    const dom = await JSDOM.fromURL(
      `https://www.boadica.com.br/produtos/${productId}`
    );

    resolve(
      dom.window.document.querySelector(
        "#miolo-central > div > div > div > div.row > div.col-md-8 > div:nth-child(2) > div > div.preco > div > div > div.pull-left > span:nth-child(1)"
      ).textContent
    );
  });
};

const getMelhorCambioEuro = async () => {
  return new Promise(async resolve => {
    const dom = await JSDOM.fromURL(
      `https://www.melhorcambio.com/cotacao/compra/euro/rio-de-janeiro`
    );

    resolve(
      dom.window.document
        .querySelector("#div-especie > h3 > span:nth-child(2)")
        .textContent.replace(",", ".")
    );
  });
};

const getAllPrices = async () =>
  Promise.all([
    getBoaDicaPrice("p148698"),
    getBoaDicaPrice("p148696"),
    getMelhorCambioEuro()
  ]);

const fixPrice = price =>
  price
    .replace("R$ ", "")
    .replace(".", "")
    .replace(",", ".");

(async () => {
  setTimeout(() => {
    spinner.stop();
    shoutError("Server is busy, try again later!");
    process.exit(1);
  }, 5000);

  const result = await getAllPrices();

  const totalBrazil =
    parseFloat(fixPrice(result[0])) + parseFloat(fixPrice(result[1]));

  const switchFrace = (parseFloat(result[2]) * 330).toFixed(2);
  const zeldaFrance = (parseFloat(result[2]) * 70).toFixed(2);
  const totalFrance = parseFloat(switchFrace) + parseFloat(zeldaFrance);

  spinner.stop();

  shoutSuccess("Here it go!");

  table.push(
    [
      colors.cyan("Switch Brazil"),
      `R$ ${colors.magenta(result[0].replace("R$ ", ""))}`
    ],
    [
      colors.cyan("Zelda Brazil"),
      `R$ ${colors.green(result[1].replace("R$ ", ""))}`
    ],
    [
      colors.cyan("Total Brazil"),
      `R$ ${colors.yellow(
        formatCurrency(totalBrazil)
          .replace(".", ",")
          .replace(",", ".")
      )}`
    ],
    [
      colors.cyan("Switch France"),
      `R$ ${colors.magenta(
        formatCurrency(switchFrace)
          .replace(".", ",")
          .replace(",", ".")
      )}`
    ],
    [
      colors.cyan("Zelda France"),
      `R$ ${colors.green(zeldaFrance.replace(".", ","))}`
    ],
    [
      colors.cyan("Total France"),
      `R$ ${colors.yellow(
        formatCurrency(totalFrance)
          .replace(".", ",")
          .replace(",", ".")
      )}`
    ]
  );

  console.log(table.toString());

  process.exit(1);
})();
