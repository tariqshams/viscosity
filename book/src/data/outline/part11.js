export default {
  id: 'XI', section: 'deep', days: '5–9', title: 'Deep dive: semantics and type theory',
  blurb: 'Lambda calculus, typing rules, a type checker for typed Drip, unification and Hindley–Milner, subtyping and variance, bidirectional checking, soundness, and what TypeScript gives up on purpose.',
  chapters: [
    { n: 186, title: 'The lambda calculus', introduces: {
      'lambda-calculus': 'a whole language made of functions and nothing else',
      'free-and-bound-variables': 'variables defined outside and inside a function',
      substitution: 'replacing a variable, carefully, without capturing names',
    } },
    { n: 187, title: 'Beta-reduction and Church encodings', introduces: {
      'beta-reduction': 'applying a function by substituting its argument',
    } },
    { n: 188, title: 'Operational semantics', introduces: {
      'operational-semantics': 'defining a language by rules for how programs run',
      'small-step-semantics': 'one tiny step of evaluation at a time',
    } },
    { n: 189, title: 'Big-step semantics and the interpreter', introduces: {
      'big-step-semantics': 'an expression and its final value in one rule',
    } },
    { n: 190, title: 'What a type system promises', introduces: {
      'type-system': 'rules that classify program pieces by the values they produce',
      'static-vs-dynamic-typing': 'checking types before running, or while running',
      'type-error': 'an operation applied to the wrong kind of value',
      'type-soundness-intro': 'the promise that well-typed programs do not go wrong',
    } },
    { n: 191, title: 'Reading typing rules', introduces: {
      'typing-judgment': 'Γ ⊢ e : T, read “in context Γ, e has type T”',
      'inference-rule': 'premises above a line, a conclusion below it',
      'type-environment': 'Γ: the types of the names in scope',
    } },
    { n: 192, title: 'A type checker for typed Drip', introduces: {
      'typed-drip': 'Drip with optional type annotations',
      'type-checker': 'a pass that applies the typing rules to a program',
    } },
    { n: 193, title: 'Checking annotations, functions and calls', introduces: {
      'type-annotation-checking': 'comparing declared types with computed ones',
    } },
    { n: 194, title: 'Unification', introduces: {
      'type-variable': 'a placeholder for a type not yet known',
      unification: 'solving equations between types',
    } },
    { n: 195, title: 'Inferring types, and the occurs check', introduces: {
      'occurs-check': 'refusing to solve α = List<α>',
    } },
    { n: 196, title: 'Hindley–Milner type inference', introduces: {
      'let-polymorphism': 'a let-bound function used at several types',
      generalization: 'turning leftover type variables into ∀',
      instantiation: 'giving a ∀ type fresh variables at each use',
    } },
    { n: 197, title: 'Algorithm W, step by step', introduces: {
      'hindley-milner': 'complete type inference for a language with let-polymorphism',
    } },
    { n: 198, title: 'Subtyping and variance', introduces: {
      subtyping: 'S <: T: an S can be used wherever a T is expected',
      'structural-vs-nominal': 'compatible by shape, or by declared name',
    } },
    { n: 199, title: 'Variance: functions, arrays and mutation', introduces: {
      variance: 'how subtyping of parts carries to wholes: co-, contra- and invariance',
    } },
    { n: 200, title: 'Bidirectional checking and soundness', introduces: {
      'bidirectional-typing': 'checking mode and synthesis mode',
    } },
    { n: 201, title: 'Soundness: progress and preservation', introduces: {
      soundness: 'progress and preservation, stated and proved',
      'progress-preservation': 'well-typed terms step, and stay well-typed',
      'unsound-by-design': 'where TypeScript chose convenience over soundness',
    } },
    { n: 202, title: 'Beyond: System F, dependent and linear types', introduces: {
      'system-f': 'the polymorphic lambda calculus',
      'dependent-types': 'types that mention values',
    } },
    { n: 203, title: 'Linear types and effect systems', introduces: {
      'linear-types': 'values that must be used exactly once',
      'effect-systems': 'types that track what code may do',
    } },
  ],
};
