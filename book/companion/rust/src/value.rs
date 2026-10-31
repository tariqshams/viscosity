//! Values (book chapters 49 and 50): what a Drip variable can hold.

use std::fmt;

use crate::gc::Heap;
use crate::object::{
    Gc, ObjBoundMethod, ObjClass, ObjClosure, ObjFunction, ObjInstance, ObjNative, StrRef,
};

/// A Drip value. Small values live right in the enum; objects live in the
/// heap and the value holds a typed handle to them.
///
/// The derived `==` is Drip's `==`: numbers compare as IEEE floats (so NaN
/// is not equal to itself, and -0 equals 0), and objects by identity, which
/// is right for strings too because they are interned.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Value {
    Nil,
    Bool(bool),
    Number(f64),
    String(StrRef),
    Function(Gc<ObjFunction>),
    Native(Gc<ObjNative>),
    Closure(Gc<ObjClosure>),
    Class(Gc<ObjClass>),
    Instance(Gc<ObjInstance>),
    BoundMethod(Gc<ObjBoundMethod>),
}

impl Value {
    /// `nil` and `false` are falsey; everything else is truthy.
    pub fn is_falsey(self) -> bool {
        matches!(self, Value::Nil | Value::Bool(false))
    }

    /// A value that prints itself, given the heap its objects live in.
    pub fn display(self, heap: &Heap) -> Display<'_> {
        Display { value: self, heap }
    }
}

/// The result of [`Value::display`].
pub struct Display<'a> {
    value: Value,
    heap: &'a Heap,
}

impl fmt::Display for Display<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let heap = self.heap;
        match self.value {
            Value::Nil => f.write_str("nil"),
            Value::Bool(b) => write!(f, "{b}"),
            Value::Number(n) => f.write_str(&format_number(n)),
            Value::String(s) => f.write_str(heap.str(s)),
            Value::Function(func) => write_function(f, heap, func),
            Value::Native(_) => f.write_str("<native fn>"),
            Value::Closure(c) => write_function(f, heap, heap[c].function),
            Value::Class(c) => f.write_str(heap.str(heap[c].name)),
            Value::Instance(i) => {
                let class = heap[i].class;
                write!(f, "{} instance", heap.str(heap[class].name))
            }
            Value::BoundMethod(b) => {
                let method = heap[b].method;
                write_function(f, heap, heap[method].function)
            }
        }
    }
}

fn write_function(
    f: &mut fmt::Formatter<'_>,
    heap: &Heap,
    func: Gc<ObjFunction>,
) -> fmt::Result {
    match heap[func].name {
        Some(name) => write!(f, "<fn {}>", heap.str(name)),
        None => f.write_str("<script>"),
    }
}

/// Format a number exactly as the TypeScript VM does: JavaScript's
/// `String(n)`, except that -0 prints as `-0`.
///
/// Rust's `{:e}` already finds the shortest digits that read back as the
/// same float, which is what JavaScript prints too. Only the layout
/// differs: JavaScript writes plain decimals from 1e-7 up to 1e21 and
/// exponents outside that range, as `1e+21` or `1.5e-7`.
pub fn format_number(n: f64) -> String {
    if n.is_nan() {
        return "NaN".into();
    }
    if n.is_infinite() {
        return if n > 0.0 { "Infinity" } else { "-Infinity" }.into();
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
        (0x7ff8000000000000, "NaN"),
        (0x7ff0000000000000, "Infinity"),
        (0xfff0000000000000, "-Infinity"),
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
    fn nil_and_false_are_falsey() {
        assert!(Value::Nil.is_falsey());
        assert!(Value::Bool(false).is_falsey());
        assert!(!Value::Bool(true).is_falsey());
        assert!(!Value::Number(0.0).is_falsey());
    }

    #[test]
    fn equality_follows_ieee_for_numbers() {
        assert_ne!(Value::Number(f64::NAN), Value::Number(f64::NAN));
        assert_eq!(Value::Number(0.0), Value::Number(-0.0));
        assert_ne!(Value::Nil, Value::Bool(false));
    }
}
