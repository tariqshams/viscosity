// New references for the second half of chapter 44 (staged split: the JSON parser).
export default [
  {
    id: 'jsontestsuite',
    authors: ['Nicolas Seriot'],
    title: 'JSONTestSuite: a comprehensive test suite for RFC 8259 compliant JSON parsers',
    venue: 'github.com/nst/JSONTestSuite',
    year: 2016,
    doi: null,
    url: 'https://github.com/nst/JSONTestSuite',
    accessed: '2026-11-02',
    checkedAgainst: 'https://raw.githubusercontent.com/nst/JSONTestSuite/master/README.md (“A comprehensive test suite for RFC 8259 compliant JSON parsers”, created as an appendix to the article “Parsing JSON is a Minefield”; test_parsing files are named y_ (must be accepted), n_ (must be rejected) and i_ (parsers are free to accept or reject)) and LICENSE (“Copyright (c) 2016 Nicolas Seriot”, MIT); one test file fetched as a sample: test_parsing/n_number_with_leading_zero.json, the five bytes [012].',
    shaped: 'Chapter 44b: differential testing of a JSON parser at scale, and the accept / reject / either convention.',
  },
];
