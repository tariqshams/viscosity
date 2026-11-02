//! Values (the book's chapters “Tagging values at run time” and “Objects that live on the heap”): what a Drip variable can hold, and
//! how `print` shows them.

use crate::gc::Heap;
use crate::object::{
    Gc, ObjBoundMethod, ObjClass, ObjClosure, ObjFunction, ObjInstance, ObjList,
    ObjNative, StrRef,
};

/// A Drip value. Small values live right in the enum; objects live in the
/// heap and the value holds a typed handle to them.
///
/// The derived `==` is Drip's `==`: numbers compare as IEEE floats (so NaN
/// is not equal to itself, and -0 equals 0), and objects by identity, which
/// is right for strings too because they are interned.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Value {
    None,
    Bool(bool),
    Number(f64),
    String(StrRef),
    List(Gc<ObjList>),
    Function(Gc<ObjFunction>),
    Native(Gc<ObjNative>),
    Closure(Gc<ObjClosure>),
    Class(Gc<ObjClass>),
    Instance(Gc<ObjInstance>),
    BoundMethod(Gc<ObjBoundMethod>),
}

impl Value {
    /// `none` and `false` are false; everything else is true.
    pub fn is_falsey(self) -> bool {
        matches!(self, Value::None | Value::Bool(false))
    }

    /// The value as `print` and `str()` show it.
    pub fn format(self, heap: &Heap) -> String {
        let mut out = String::new();
        format_into(&mut out, heap, self, false, &mut Vec::new());
        out
    }
}

/// A list or instance being printed, to spot cycles.
#[derive(PartialEq)]
enum Open {
    List(Gc<ObjList>),
    Instance(Gc<ObjInstance>),
}

/// Print `value` into `out`. Inside a list or an instance (`nested`),
/// strings are quoted; `open` holds the containers being printed, so a
/// list that contains itself prints as `[...]`.
fn format_into(
    out: &mut String,
    heap: &Heap,
    value: Value,
    nested: bool,
    open: &mut Vec<Open>,
) {
    match value {
        Value::None => out.push_str("none"),
        Value::Bool(b) => out.push_str(if b { "true" } else { "false" }),
        Value::Number(n) => out.push_str(&format_number(n)),
        Value::String(s) if nested => quote_into(out, heap.str(s)),
        Value::String(s) => out.push_str(heap.str(s)),
        Value::List(list) => {
            if open.contains(&Open::List(list)) {
                out.push_str("[...]");
                return;
            }
            open.push(Open::List(list));
            out.push('[');
            for (i, item) in heap[list].items.iter().enumerate() {
                if i > 0 {
                    out.push_str(", ");
                }
                format_into(out, heap, *item, true, open);
            }
            out.push(']');
            open.pop();
        }
        Value::Instance(instance) => {
            let object = &heap[instance];
            out.push_str(heap.str(heap[object.class].name));
            if open.contains(&Open::Instance(instance)) {
                out.push_str(" {...}");
                return;
            }
            if object.field_order.is_empty() {
                out.push_str(" {}");
                return;
            }
            open.push(Open::Instance(instance));
            out.push_str(" { ");
            for (i, &key) in object.field_order.iter().enumerate() {
                if i > 0 {
                    out.push_str(", ");
                }
                out.push_str(heap.str(key));
                out.push_str(": ");
                let field = object.fields.get(key).expect("an ordered field exists");
                format_into(out, heap, field, true, open);
            }
            out.push_str(" }");
            open.pop();
        }
        Value::Function(function) => write_function(out, heap, function),
        Value::Closure(c) => write_function(out, heap, heap[c].function),
        Value::BoundMethod(b) => write_function(out, heap, heap[heap[b].method].function),
        Value::Native(n) => {
            out.push_str("native fn ");
            out.push_str(heap[n].name);
        }
        Value::Class(c) => {
            out.push_str("class ");
            out.push_str(heap.str(heap[c].name));
        }
    }
}

fn write_function(out: &mut String, heap: &Heap, function: Gc<ObjFunction>) {
    let f = &heap[function];
    match f.name {
        Some(name) => {
            out.push_str("fn ");
            out.push_str(heap.str(name));
        }
        None if f.is_script => out.push_str("script"),
        None => out.push_str("fn"),
    }
}

/// A string as it appears inside a list: quoted, with escapes.
fn quote_into(out: &mut String, s: &str) {
    out.push('"');
    for c in s.chars() {
        match c {
            '\\' => out.push_str(r"\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str(r"\n"),
            '\t' => out.push_str(r"\t"),
            c => out.push(c),
        }
    }
    out.push('"');
}

/// A value's type, with its article, as error messages name it.
pub fn describe(heap: &Heap, value: Value) -> String {
    match value {
        Value::None => "none".into(),
        Value::Bool(_) => "a boolean".into(),
        Value::Number(_) => "a number".into(),
        Value::String(_) => "a string".into(),
        Value::List(_) => "a list".into(),
        Value::Class(_) => "a class".into(),
        Value::Instance(i) => {
            let name = heap.str(heap[heap[i].class].name);
            let vowel =
                name.starts_with(['A', 'E', 'I', 'O', 'U', 'a', 'e', 'i', 'o', 'u']);
            format!("{} {name} instance", if vowel { "an" } else { "a" })
        }
        Value::Function(_)
        | Value::Native(_)
        | Value::Closure(_)
        | Value::BoundMethod(_) => "a function".into(),
    }
}

/// Format a number exactly as the TypeScript VM does: JavaScript's
/// `String(n)`, except that -0 prints as `-0`, NaN as `nan` and the
/// infinities as `inf` and `-inf`.
///
/// Rust's `{:e}` already finds the shortest digits that read back as the
/// same float, which is what JavaScript prints too. Only the layout
/// differs: JavaScript writes plain decimals from 1e-6 up to 1e21 and
/// exponents outside that range, as `1e+21` or `1.5e-7`.
pub fn format_number(n: f64) -> String {
    if n.is_nan() {
        return "nan".into();
    }
    if n.is_infinite() {
        return if n > 0.0 { "inf" } else { "-inf" }.into();
    }
    if n == 0.0 {
        return if n.is_sign_negative() { "-0" } else { "0" }.into();
    }
    let sign = if n < 0.0 { "-" } else { "" };
    // `{:e}` gives "d.ddde<exp>": split it into the digits and exponent.
    let sci = format!("{:e}", n.abs());
    let (mantissa, exp) = sci.split_once('e').expect("{:e} always has an 'e'");
    let digits: String = mantissa.chars().filter(|&c| c != '.').collect();
    let exp: i32 = exp.parse().expect("{:e} exponent is an integer");
    // In the ECMAScript spec's terms, the value is 0.digits × 10^point.
    let k = digits.len() as i32;
    let point = exp + 1;
    let body = if k <= point && point <= 21 {
        // An integer: the digits, then zeros.
        format!("{digits}{}", "0".repeat((point - k) as usize))
    } else if 0 < point && point <= 21 {
        // The decimal point falls inside the digits.
        let (int, frac) = digits.split_at(point as usize);
        format!("{int}.{frac}")
    } else if -6 < point && point <= 0 {
        // A small number: 0.000ddd.
        format!("0.{}{digits}", "0".repeat((-point) as usize))
    } else {
        // Exponential notation: d.ddde+x or d.ddde-x.
        let (first, rest) = digits.split_at(1);
        let dot = if rest.is_empty() { "" } else { "." };
        let exponent = point - 1;
        let exp_sign = if exponent < 0 { "-" } else { "+" };
        format!("{first}{dot}{rest}e{exp_sign}{}", exponent.abs())
    };
    format!("{sign}{body}")
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The bits of each double and what the TypeScript VM prints for it,
    /// collected by running `formatNumber` under Node 22.
    const NODE_OUTPUT: &[(u64, &str)] = &[
        (0x0000000000000000, "0"),
        (0x8000000000000000, "-0"),
        (0x3ff0000000000000, "1"),
        (0xbff0000000000000, "-1"),
        (0x3fe0000000000000, "0.5"),
        (0x3fd3333333333334, "0.30000000000000004"),
        (0x3fd5555555555555, "0.3333333333333333"),
        (0x3fe5555555555555, "0.6666666666666666"),
        (0x4059000000000000, "100"),
        (0x405edd2f1a9fbe77, "123.456"),
        (0xc05edd2f1a9fbe77, "-123.456"),
        (0x4415af1d78b58c40, "100000000000000000000"),
        (0x444b1ae4d6e2ef50, "1e+21"),
        (0x445b1ae4d6e2ef50, "2e+21"),
        (0x44ba249b1f10a06d, "1.2345678901234569e+23"),
        (0x3eb0c6f7a0b5ed8d, "0.000001"),
        (0x3e7ad7f29abcaf48, "1e-7"),
        (0x3e8421f5f40d8376, "1.5e-7"),
        (0x3eb4b3fd5942cd96, "0.000001234"),
        (0x3de3a256c02c62f3, "1.4285714285714285e-10"),
        (0x3e4ad7f29abcaf48, "1.25e-8"),
        (0x4340000000000000, "9007199254740992"),
        (0x43e56a95319d63e1, "12345678901234567000"),
        (0x0000000000000001, "5e-324"),
        (0x7fefffffffffffff, "1.7976931348623157e+308"),
        (0x7ff8000000000000, "nan"),
        (0x7ff0000000000000, "inf"),
        (0xfff0000000000000, "-inf"),
        (0x54b249ad2594c37d, "1e+100"),
        (0xab2bff2ee48e0530, "-1e-100"),
        (0x400921f9f01b866e, "3.14159"),
        (0x4132d68720000000, "1234567.125"),
        (0x3fb999999999999a, "0.1"),
        (0x444b1ae4d6e2ef4f, "999999999999999900000"),
        (0xbdf6e80fe033c8c6, "-3.333333333333333e-10"),
        (0x4011666666666666, "4.35"),
        (0x4341c37937e08000, "10000000000000000"),
        (0x3ff0000000000001, "1.0000000000000002"),
        (0x41f0000000000000, "4294967296"),
        (0x43f0000000000000, "18446744073709552000"),
        (0x3fd3333333333333, "0.3"),
        (0xbe7ad7f29abcaf48, "-1e-7"),
    ];

    #[test]
    fn numbers_print_like_the_typescript_vm() {
        for &(bits, expected) in NODE_OUTPUT {
            let n = f64::from_bits(bits);
            assert_eq!(format_number(n), expected, "bits {bits:#018x}");
        }
    }

    #[test]
    fn none_and_false_are_falsey() {
        assert!(Value::None.is_falsey());
        assert!(Value::Bool(false).is_falsey());
        assert!(!Value::Bool(true).is_falsey());
        assert!(!Value::Number(0.0).is_falsey());
    }

    #[test]
    fn equality_follows_ieee_for_numbers() {
        assert_ne!(Value::Number(f64::NAN), Value::Number(f64::NAN));
        assert_eq!(Value::Number(0.0), Value::Number(-0.0));
        assert_ne!(Value::None, Value::Bool(false));
    }
}
