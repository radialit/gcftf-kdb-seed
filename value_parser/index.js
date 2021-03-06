'use strict';

require('dotenv').config();
const debug = require('debug')('value_parser');

const reader = require('./reader');
const cleanup = require('./cleanup');

let entryDatatypeLookup;

function getTimestamp(dirName) {
  return `${dirName.substr(0, 4)}-${dirName.substr(4, 2)}-${dirName.substr(6, 2)}T${dirName.substr(8, 2)}:${dirName.substr(10, 2)}`;
}

function getEntries(rawData, timestamp) {
  const entriesBySubunit = {};
  let finalEntries;
  let pendingEntries;

  function processEntry(datum, dataType) {
    function getDefaultEntry(value = '', valueNative = '') {
      const timestamps = {};
      if (value !== '') timestamps.value = timestamp;
      if (valueNative !== '') timestamps.valueNative = timestamp;
      return {
        id: datum.id,
        dataType,
        value,
        valueNative,
        citation: '',
        timestamps,
        isCurrent: false,
      };
    }
    function processTextEntry() {
      const final = {
        value: cleanup.html(datum.value),
        valueNative: cleanup.html(datum['native-value']) };
      const pending = {
        value: cleanup.html(datum['editor-value']),
        valueNative: cleanup.html(datum['native-editor-value']) };
      if (final.value || final.valueNative) {
        finalEntries.push(getDefaultEntry(final.value, final.valueNative));
      }
      if (pending.value || pending.valueNative) {
        // don't add pending if values are the same as final
        if ((final.value !== pending.value) && (final.valueNative !== pending.valueNative)) {
          pendingEntries.push(getDefaultEntry(pending.value, pending.valueNative));
        } else {
          // debug('HA');
        }
      }
    }
    function processStringEntry() {
      const finalValue = cleanup.string(datum.value);
      const pendingValue = cleanup.string(datum['editor-value']);
      if (finalValue) {
        finalEntries.push(getDefaultEntry(finalValue));
      }
      if (pendingValue && (pendingValue !== finalValue)) {
        pendingEntries.push(getDefaultEntry(pendingValue));
      }
    }
    function processEnumEntry() {
      const finalValue = cleanup.integer(datum.value);
      const pendingValue = cleanup.integer(datum['editor-value']);
      if (Number.isInteger(finalValue)) {
        finalEntries.push(getDefaultEntry(finalValue));
      }
      if (Number.isInteger(pendingValue) && (finalValue !== pendingValue)) {
        pendingEntries.push(getDefaultEntry(pendingValue));
      }
    }
    function processNumberEntry() {
      const finalValue = cleanup.number(datum.value);
      const pendingValue = cleanup.number(datum['editor-value']);
      if (!Number.isNaN(finalValue)) {
        finalEntries.push(getDefaultEntry(finalValue));
      }
      if (!Number.isNaN(pendingValue) && (finalValue !== pendingValue)) {
        pendingEntries.push(getDefaultEntry(pendingValue));
      }
    }
    switch (dataType) {
      case 'text':
        processTextEntry();
        break;
      case 'string':
        processStringEntry();
        break;
      case 'enum':
        processEnumEntry();
        break;
      case 'number':
        processNumberEntry();
        break;
      default:
        break;
    }
  }
  rawData.forEach((subunit) => {
    entriesBySubunit[subunit.subunitID] = { final: [], pending: [] };
    finalEntries = entriesBySubunit[subunit.subunitID].final;
    pendingEntries = entriesBySubunit[subunit.subunitID].pending;
    const subunitType = (subunit.subunitID.includes('.')) ? 'jurisdiction' : 'nation';
    subunit.data.forEach((datum) => {
      const dataType = entryDatatypeLookup[subunitType][datum.id];
      if (!dataType) return;
      processEntry(datum, dataType);
    });
  });
  return entriesBySubunit;
}

function parseEntries(dirName) {
  return reader.parseSubdir(dirName)
  .then((rawData) => {
    return getEntries(rawData, getTimestamp(dirName));
  })
  .catch((err) => {
    return Promise.reject(err);
  });
}

function processArchives(coreEntries, archiveDirNames) {
  function updateTimestamps(archiveEntries, timestamp) {
    Object.keys(coreEntries).forEach((subunitID) => {
      ['final', 'pending'].forEach((statusCode) => {
        // check for corresponding entries in archive
        if (!archiveEntries[subunitID] || !archiveEntries[subunitID][statusCode]) return;
        const coreEntryArray = coreEntries[subunitID][statusCode];
        const archiveEntryArray = archiveEntries[subunitID][statusCode];
        coreEntryArray.forEach((coreEntry) => {
          // try to find the corresponding archive entry
          const archiveEntry = archiveEntryArray.find(testEntry => (testEntry.id === coreEntry.id));
          if (!archiveEntry) return;
          ['value', 'valueNative'].forEach((field) => {
            // update the timestamp if there WASN'T a change
            if (coreEntry[field] !== archiveEntry[field]) {
              coreEntry.timestamps[field] = timestamp;
            }
          });
        });
      });
    });
    return Promise.resolve();
  }
  function processArchive(directoryName) {
    return parseEntries(directoryName)
    .then((archiveEntries) => {
      return updateTimestamps(archiveEntries, getTimestamp(directoryName));
    })
    .catch((err) => {
      return Promise.reject(err);
    });
  }
  function reduceCallback(promise, directoryName) {
    debug('processing archive for %s', directoryName);
    return processArchive(directoryName);
  }
  const chainedPromises = archiveDirNames.reduce(reduceCallback, Promise.resolve());
  return chainedPromises
  .then(() => {
    debug('finished processing archives');
    return coreEntries;
  })
  .catch((err) => { return Promise.reject(err); });
}

function parse(entryDatatypeLookupArg) {
  entryDatatypeLookup = entryDatatypeLookupArg;
  let coreDirName;
  let archiveDirNames;
  try {
    const dirNames = reader.getSubdirListSync().reverse(); // descending order
    coreDirName = dirNames.shift();
    archiveDirNames = dirNames;
  } catch (err) {
    return Promise.reject(err);
  }
  return parseEntries(coreDirName)
  .then((coreEntries) => {
    return processArchives(coreEntries, archiveDirNames);
  })
  .catch((err) => {
    return Promise.reject(err);
  });
}

module.exports = { parse };
