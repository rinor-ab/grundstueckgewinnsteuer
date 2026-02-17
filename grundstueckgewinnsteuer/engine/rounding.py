"""Deterministic rounding functions matching JavaScript reference behavior.

All functions operate on ``Decimal`` for exact arithmetic.
"""

from decimal import ROUND_HALF_EVEN, Decimal

# ---------------------------------------------------------------------------
# JS-parity rounding helpers
# ---------------------------------------------------------------------------

_TWO_PLACES = Decimal("0.01")
_TWENTY = Decimal("20")


def to_fixed_2(x: Decimal) -> Decimal:
    """Equivalent to JavaScript ``Number.toFixed(2)``.

    JS ``toFixed`` uses "round half to even" (banker's rounding) in most
    engines.  We replicate that with ``ROUND_HALF_EVEN``.  Returns a Decimal
    quantised to two decimal places.
    """
    return Decimal(x).quantize(_TWO_PLACES, rounding=ROUND_HALF_EVEN)


def round_up_to_005(x: Decimal) -> Decimal:
    """Equivalent to JS ``Math.ceil(x * 20) / 20``.

    Rounds *x* **up** to the nearest CHF 0.05.

    Algorithm (mirrors JS):
        1. Multiply by 20.
        2. Apply ``ceiling`` (round towards +∞).
        3. Divide by 20.

    The result is always a multiple of 0.05 and ≥ *x*.
    """
    v = Decimal(x)
    # math.ceil equivalent for Decimal: quantize with ROUND_CEILING
    scaled = (v * _TWENTY).to_integral_value(rounding="ROUND_CEILING")
    return scaled / _TWENTY
