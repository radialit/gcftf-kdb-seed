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

  function getDefaultEntry(value = '', valueNative = '') {
    const timestamps = {};
    if (value !== '') timestamps.value = timestamp;
    if (valueNative !== '') timestamps.valueNative = timestamp;
    return {
      id: '',
      value,
      valueNative,
      citation: '',
      timestamps,
      isCurrent: false,
    };
  }
  function processEntry(datum, dataType) {
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
        pendingEntries.push(getDefaultEntry(finalValue));
      }
    }
    switch (dataType) {
      case 'text':
        processTextEntry();
        break;
      case 'string':
        processStringEntry();
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
      processEntry(datum, dataType, timestamp);
    });
  });
  return entriesBySubunit;
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
  return reader.parseSubdir(coreDirName)
  .then((rawData) => {
    const entriesBySubunit = getEntries(rawData, getTimestamp(coreDirName));
    debug('got core data');
    return Promise.resolve(entriesBySubunit);
  })
  .catch((err) => {
    return Promise.reject(err);
  });
}

module.exports = { parse };
