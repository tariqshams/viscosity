//! JavaScript's `Number.prototype.toString()` for `f64`.
//!
//! Explain text and generated code interpolate numbers the way JavaScript
//! template literals do (`about ${size} elements`), so the port formats them
//! with the same algorithm (ECMA-262 Number::toString, radix 10). Rust's
//! shortest round-trip digits are the same digits JavaScript picks; only the
//! placement of the decimal point and the exponent differ, which this fixes.

/// Formats `x` exactly as JavaScript's `String(x)` does.
pub fn js_number(x: f64) -> String {
    if x.is_nan() {
        return "NaN".into();
    }
    if x == 0.0 {
        return "0".into(); // also -0
    }
    if x.is_infinite() {
        return if x > 0.0 { "Infinity".into() } else { "-Infinity".into() };
    }
    let sign = if x < 0.0 { "-" } else { "" };
    // `{:e}` gives the shortest round-trip digits: "1.2345e3", "5e-7".
    let sci = format!("{:e}", x.abs());
    let (mantissa, exp) = sci.split_once('e').expect("`{:e}` always has an exponent");
    let digits: String = mantissa.chars().filter(|c| *c != '.').collect();
    let k = digits.len() as i32;
    // n: the position of the decimal point relative to the digits.
    let n = exp.parse::<i32>().expect("valid exponent") + 1;
    let body = if k <= n && n <= 21 {
        format!("{digits}{}", "0".repeat((n - k) as usize))
    } else if 0 < n && n <= 21 {
        format!("{}.{}", &digits[..n as usize], &digits[n as usize..])
    } else if -6 < n && n <= 0 {
        format!("0.{}{digits}", "0".repeat((-n) as usize))
    } else {
        let e = n - 1;
        let esign = if e < 0 { '-' } else { '+' };
        if k == 1 {
            format!("{digits}e{esign}{}", e.abs())
        } else {
            format!("{}.{}e{esign}{}", &digits[..1], &digits[1..], e.abs())
        }
    };
    format!("{sign}{body}")
}

#[cfg(test)]
mod tests {
    use super::js_number;

    #[test]
    fn matches_javascript() {
        let cases: &[(f64, &str)] = &[
            (0.0, "0"),
            (-0.0, "0"),
            (1.0, "1"),
            (200.0, "200"),
            (2.5, "2.5"),
            (-1.5, "-1.5"),
            (0.1 + 0.2, "0.30000000000000004"),
            (1e21, "1e+21"),
            (123456789012345680000.0, "123456789012345680000"),
            (1e-7, "1e-7"),
            (0.000001, "0.000001"),
            (1.5e-10, "1.5e-10"),
            (2f64.powi(60), "1152921504606847000"),
            (f64::NAN, "NaN"),
            (f64::INFINITY, "Infinity"),
            (f64::NEG_INFINITY, "-Infinity"),
        ];
        for &(x, want) in cases {
            assert_eq!(js_number(x), want, "{x}");
        }
    }
}
