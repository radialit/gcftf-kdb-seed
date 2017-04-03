'use strict';

const debug = require('debug')('section_parser');
// different criteria for differentiating a section definition from a data definition
const ROWTYPES_THAT_ARE_SECTIONS = ['group', 'section'];
const DATATYPES_THAT_ARE_SECTIONS = ['label'];
// most 'subsection' row types actaully define a collection, except for ones with these IDs
const ROWIDS_THAT_ARE_SECTIONS = ['redd_programs', 'institutional_framework', 'safeguards'];
const SECTION_ROWIDS_TO_SKIP = ['national_page']; // eliminated--pretend these don't exist
// some sections start with 'section ##', which is being stripped out
const UNWANTED_SECTION_LABEL_PREFIXES = ['section', 'sección', 'bagian', 'seção'];
const UNWANTED_SECTION_LABEL_REG_EXPS = UNWANTED_SECTION_LABEL_PREFIXES.map(
  prefix => new RegExp(`${prefix} [0-9]+ `, 'i'));

function isSection(rowObj) {
  return (
    ROWTYPES_THAT_ARE_SECTIONS.includes(rowObj.rowType)
    || DATATYPES_THAT_ARE_SECTIONS.includes(rowObj.dataType)
    || ROWIDS_THAT_ARE_SECTIONS.includes(rowObj.rowID)
  );
}

function isValid(rowObj) {
  return (!SECTION_ROWIDS_TO_SKIP.includes(rowObj.rowID));
}

function parseLabel(arg) {
  let label = arg;
  // remove unwanted 'Section' prefixes
  UNWANTED_SECTION_LABEL_REG_EXPS.some((regExp) => {
    const match = label.match(regExp);
    if (match) {
      label = label.substr(match[0].length).trim();
      label = label.replace(/^–/, '').trim(); // sometimes there's an mdash
      label = label.replace(/^-/, '').trim(); // sometimes there's a dash
      return true;
    }
    return false;
  });
  return label;
}

function getNewSection(rowObj, sectionHeaderLevelOffset = 0) {
  const section = {};
  function getSectionHeaderLevel() {
    // equivalent to header level (h1, h2, ...)
    let level = ROWTYPES_THAT_ARE_SECTIONS.indexOf(rowObj.rowType);
    if (level === -1) {
      /* not found */
      if (ROWIDS_THAT_ARE_SECTIONS.includes(rowObj.rowID)) {
        // just make the level greater than any of the rowtypes
        level = ROWTYPES_THAT_ARE_SECTIONS.length + 1;
      } else if (DATATYPES_THAT_ARE_SECTIONS.includes(rowObj.dataType)) {
        // just make the level greater than any of the rowtypes
        level = ROWTYPES_THAT_ARE_SECTIONS.length + 2;
      }
    } else {
      /* found */
      level += 1;
    }
    if (level === -1) {
      // give up
      debug('header level not established for %s', rowObj.rowID);
      level = 1;
    }
    level -= sectionHeaderLevelOffset;
    return level;
  }
  section.label = parseLabel(rowObj.label);
  section.entryIDs = [];
  section.headerLevel = getSectionHeaderLevel();
  section.translations = { label: {} };
  Object.keys(rowObj.translations).forEach((langCode) => {
    section.translations.label[langCode] = parseLabel(rowObj.translations[langCode]);
  });
  return section;
}

function getNewSectionParagraphCode(priorSectionCodeArg = '', newSectionHeaderLevel) {
  // dot-separated paragraph numbering
  if (newSectionHeaderLevel === 0) {
    debug('section header level of 0');
    return '';
  }
  const SEPARATOR = '.';
  let sectionIndexes;
  if (!priorSectionCodeArg.length) {
    sectionIndexes = [0]; // seed
  } else {
    sectionIndexes = priorSectionCodeArg.split(SEPARATOR).map(segment => Number(segment));
    if (newSectionHeaderLevel === 1) {
      sectionIndexes = [sectionIndexes[0]];
    }
    if (newSectionHeaderLevel > sectionIndexes.length) {
      sectionIndexes.push(0);
    } else if (newSectionHeaderLevel < sectionIndexes.length) {
      sectionIndexes = sectionIndexes.slice(0, newSectionHeaderLevel);
    }
  }
  sectionIndexes[sectionIndexes.length - 1] += 1; // increment the last segment
  return sectionIndexes.join(SEPARATOR);
}

function getEntryPrefix(rowObj) {
  const PREFIX_SEPARATOR = '-';
  // note the use of '-' to separate the prefix from the base ID
  // since the old data never used '-' in IDs, we are assured the
  // the new prefixed ID is unique
  return ROWIDS_THAT_ARE_SECTIONS.includes(rowObj.rowID) ? `${rowObj.rowID}${PREFIX_SEPARATOR}` : '';
}

module.exports = { isSection, isValid, getNewSection, getNewSectionParagraphCode, getEntryPrefix };
