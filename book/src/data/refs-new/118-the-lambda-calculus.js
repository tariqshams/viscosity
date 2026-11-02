// New references for chapter 118 (the lambda calculus) and its staged
// second half (beta-reduction). Network note: only web search was
// reachable from this session (doi.org, jstor.org, press.princeton.edu and
// cis.upenn.edu did not resolve), so checkedAgainst says exactly what was
// read. Pierce's book is also cited by chapter 120.
export default [
  {
    id: 'church1936',
    authors: ['Alonzo Church'],
    title: 'An Unsolvable Problem of Elementary Number Theory',
    venue: 'American Journal of Mathematics, vol. 58, no. 2, pp. 345–363',
    year: 1936,
    doi: '10.2307/2371045',
    url: 'https://www.jstor.org/stable/2371045',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results: the PhilPapers bibliography for the Stanford Encyclopedia article on Church lists it as 1936a, American Journal of Mathematics 58(2): 345–363, with DOI 10.2307/2371045; the Journal of Symbolic Logic review listing (Cambridge) gives the same volume and pages; secondary notes describe it as the paper that defines effective calculability by lambda-definability (recursiveness) and uses it to give an unsolvable problem.',
    shaped: 'Chapter 118: the lambda calculus as a complete model of calculation, and its use in 1936 to show that some problems have no algorithm.',
  },
  {
    id: 'church1941',
    authors: ['Alonzo Church'],
    title: 'The Calculi of Lambda-Conversion',
    venue: 'Annals of Mathematics Studies, no. 6, Princeton University Press',
    year: 1941,
    doi: null,
    url: 'https://press.princeton.edu/books/paperback/9780691083940/calculi-of-lambda-conversion-am-6-volume-6',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results: the Internet Archive scan of the 1941 Princeton University Press edition (Annals of Mathematics Studies 6, editors Emil Artin and Marston Morse); Princeton University Press’s cart page for the AM-6 paperback reissue; library catalogue records (about 77–82 pages). Summaries describe it as a revised version of Church’s 1936 Princeton lectures, covering the basic theory of lambda-conversion (the conversion rules), combinatory equivalents and the representation of numbers.',
    shaped: 'Chapter 118 and its second half: the terms, the conversion (substitution) rule, and the numerals that carry Church’s name.',
  },
  {
    id: 'pierce2002',
    authors: ['Benjamin C. Pierce'],
    title: 'Types and Programming Languages',
    venue: 'MIT Press, ISBN 978-0-262-16209-8',
    year: 2002,
    doi: null,
    url: 'https://www.cis.upenn.edu/~bcpierce/tapl/',
    accessed: '2026-11-02',
    checkedAgainst: 'Web search results: the table of contents PDF on the author’s TAPL page (cis.upenn.edu/~bcpierce/tapl/contents.pdf), which lists chapter 3, Untyped Arithmetic Expressions (3.4 Semantic Styles, 3.5 Evaluation) from page 23, and chapter 5, The Untyped Lambda-Calculus (Basics, Programming in the Lambda-Calculus, Formalities) from page 51; retailer and library records for ISBN 9780262162098 (MIT Press, 2002, hardcover).',
    shaped: 'Chapters 118 and 120 and their second halves: the standard modern presentation of the untyped lambda calculus (free variables, capture-avoiding substitution, beta-reduction, evaluation strategies, Church encodings) and of small-step and big-step semantics for a small language of numbers and booleans.',
  },
];
