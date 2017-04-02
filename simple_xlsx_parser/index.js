'use strict';

const XLSX = require('xlsx');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const MULTISPACE_REGEX = /[ \t]{2,}/;
const NEWLINE_REGEX = new RegExp(escapeRegExp('&#10;'), 'g');

// simple closure to build a non-sparse, 2 dimensional array of cell values
function tableBuilder() {
  const table = [];
  let rowOffset = 0;

  function addCell(cell) {
    if (cell.row > ((table.length - 1) + rowOffset)) {
      // new row
      table.push([]);
      rowOffset = cell.row - (table.length - 1);
    }
    // existing row
    for (let index = table[table.length - 1].length; index < cell.col; index += 1) {
      table[table.length - 1][index] = '';
    }
    table[table.length - 1][cell.col] = cell.value;
  }
  return { addCell, table };
}

function parseArray(filePath, optionsArg = {}) {
  const parsedData = { data: [], props: {} };
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const tb = tableBuilder();
  const options = {};
  options.rowStartIndex = optionsArg.rowStartIndex || 0;
  const modifiedDate = workbook.Props.ModifiedDate;
  if (modifiedDate) parsedData.props.mtime = modifiedDate.toISOString().substr(0, 16).replace('T', ' ');
  Object.keys(worksheet).forEach((wsRef) => {
    if (wsRef[0] === '!') return; // keys not begining with "!" are cell addresses
    const cell = {
      col: parseInt(wsRef.charCodeAt(0) - 65, 10),
      row: parseInt(wsRef.substring(1), 10) - 1,
      value: '',
    };
    if (cell.row < options.rowStartIndex) return;
    if (worksheet[wsRef].t === 's') {
      // Cell value is a string. Clean up the string by removing mutiple spaces, making newlines consistent, and trimming
      cell.value = worksheet[wsRef].v.replace(MULTISPACE_REGEX, ' ').trim();
      cell.value = cell.value.replace(NEWLINE_REGEX, '\n');
    } else if (worksheet[wsRef].t === 'n') {
      // Cell value is a number. Just pass it as is.
      cell.value = worksheet[wsRef].v;
    } else if (worksheet[wsRef].t === 'b') {
      // Cell value is a boolean. Just pass it as is
      cell.value = worksheet[wsRef].v;
    }
    tb.addCell(cell);
  });
  parsedData.data = tb.table;
  return parsedData;
}

function parseObject(filePath, optionsArg = {}) {
  const obj = {};
  const tableData = parseArray(filePath, optionsArg);

  let activeCategories = [];

  function processRow(row) {
    if (row[0]) {
      if (obj[row[0]]) {
        console.log(`WARNING: '${obj[row[0]]}' is repeated in ${filePath}. Prior instance will be overwritten.`);
      }
      obj[row[0]] = {};
      activeCategories = [obj[row[0]]];
    }
    if (row[1]) {
      if (!activeCategories[0].children) {
        activeCategories[0].children = {};
      }
      activeCategories[0].children[row[1]] = {};
      activeCategories[1] = activeCategories[0].children[row[1]];
    }
    if (row[2]) {
      activeCategories[activeCategories.length - 1][row[2]] = row[3];
    }
  }

  tableData.data.forEach((row) => {
    processRow(row);
  });

  return { data: obj, props: tableData.props };
}

module.exports = { parseArray, parseObject };
