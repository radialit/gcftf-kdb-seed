'use strict';

require('dotenv').config();
const debug = require('debug')('value_parser');
const path = require('path');
const fs = require('fs-extra');
const klawSync = require('klaw-sync');
const parseString = require('xml2js').parseString;

const C = require('../constants');

const SOURCE_DATA_DIR = C.SOURCE_DATA_DIR;
const SOURCE_DATA_VALUE_DIR = path.join(SOURCE_DATA_DIR, 'xml_data');
const UNUSED_VALUE_FILES = ['global.xml', 't.xml'];

function getSubdirListSync() {
  let dirNames;
  try {
    const dirs = klawSync(SOURCE_DATA_VALUE_DIR, { nofile: true });
    // just the direcotry name (not the full path)
    dirNames = dirs.map(testDir => path.relative(SOURCE_DATA_VALUE_DIR, testDir.path));
    dirNames = dirNames.sort();
  } catch (err) {
    throw (err);
  }
  return dirNames;
}

function getFileListSync(subdirName) {
  const fullDirName = path.join(SOURCE_DATA_VALUE_DIR, subdirName);
  let fileNames;
  try {
    const files = klawSync(fullDirName, { nodir: true }); // only files
    fileNames = files.map(testFile => path.basename(testFile.path)); // eliminate path
    fileNames = fileNames.filter(testFileName => (path.extname(testFileName) === '.xml')); // only .xml files
    // filter out the unused files
    fileNames = fileNames.filter(
      testFileName => (!UNUSED_VALUE_FILES.includes(path.basename(testFileName))));
    // sort by basename just to improve legibility during development
    fileNames.sort((a, b) => {
      const aTest = path.basename(a, '.xml');
      const bTest = path.basename(b, '.xml');
      if (aTest > bTest) return 1;
      else if (aTest < bTest) return -1;
      return 0;
    });
  } catch (err) {
    throw (err);
  }
  return fileNames;
}

function readSubdirSync(subdirName) {
  const data = [];
  const fileNames = getFileListSync(subdirName);
  fileNames.forEach((fileName) => {
    try {
      const filePath = path.join(SOURCE_DATA_VALUE_DIR, subdirName, fileName);
      const subunitID = path.basename(fileName, path.extname(fileName));
      const xml = fs.readFileSync(filePath, { encoding: 'utf8' });
      data.push({ subunitID, xml });
    } catch (err) {
      throw err;
    }
  });
  // debug(data);
  return data;
}

function parseXML(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
}

function parseEntries(parsedXML) {
  const entries = [];
  const rawEntries = parsedXML.entries;
  if (!(rawEntries)) return entries;
  if (rawEntries.entry) {
    rawEntries.entry.forEach((rawEntry) => {
      // const timestamps = getEntryTimestamps(rawEntry.$);
      const timestamps = {};
      // merge timestamps object with pushed data entry
      // data.push(Object.assign({}, entry.$, { timestamps }));
      entries.push(Object.assign({}, rawEntry.$, { timestamps }));
    });
  }
  if (rawEntries['paired-data']) {
    rawEntries['paired-data'].forEach((pairedDataEntry) => {
      if (pairedDataEntry.entry) {
        const entry = { id: pairedDataEntry.$.id, timestamps: {}, children: [] };
        entries.push(entry);
        pairedDataEntry.entry.forEach((childEntry) => {
          // remove the base name and dot from the ID
          const id = childEntry.$.id.substr(entry.id.length + 1);
          // const timestamps = getEntryTimestamps(childEntry.$);
          const timestamps = {};
          // merge timestamps object with pushed data entry
          // data.push(Object.assign({}, childEntry.$, { timestamps }));
          entry.children.push(Object.assign({}, childEntry.$, { id }, { timestamps }));
        });
      }
    });
  }
  return entries;
}

function parseSubdir(subdirName) {
  let content;
  try {
    content = readSubdirSync(subdirName);
  } catch (err) {
    return Promise.reject();
  }
  return Promise.all(content.map((contentItem) => {
    return parseXML(contentItem.xml)
    .then((parsedXML) => {
      return { subunitID: contentItem.subunitID, data: parseEntries(parsedXML) };
    });
  }));
}

debug('\x1Bc'); // clear and reset the console
parseSubdir('201703090855').then((data) => {
  debug(data);
});

module.exports = {
  SOURCE_DATA_VALUE_DIR,
  getSubdirListSync,
  getFileListSync,
  readSubdirSync,
  parseSubdir };
