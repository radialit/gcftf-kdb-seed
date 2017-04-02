'use strict';

// different criteria for differentiating a section definition from a data definition
const ROWTYPES_THAT_ARE_SECTIONS = ['group', 'section'];
const DATATYPES_THAT_ARE_SECTIONS = ['label'];
// most 'subsection' row types actaully define a collection, except for ones with these IDs
const ROWIDS_THAT_ARE_SECTIONS = ['redd_programs', 'institutional_framework', 'safeguards'];
const SECTION_ROWIDS_TO_SKIP = ['national_page']; // eliminated--pretend these don't exist

function isSection(rowObj) {
  return (
    ROWTYPES_THAT_ARE_SECTIONS.includes(rowObj.rowType)
    || DATATYPES_THAT_ARE_SECTIONS.includes(rowObj.dataType)
    || ROWIDS_THAT_ARE_SECTIONS.includes(rowObj.rowID)
  );
}

module.exports = { isSection };
