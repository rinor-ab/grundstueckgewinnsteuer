"""Canton engine registry – maps canton codes to engine instances."""

from __future__ import annotations

from grundstueckgewinnsteuer.engine.base import CantonEngine

# Lazy-loaded registry
_REGISTRY: dict[str, type[CantonEngine]] = {}


def register(canton_code: str, engine_cls: type[CantonEngine]) -> None:
    _REGISTRY[canton_code.upper()] = engine_cls


def get_engine(canton_code: str) -> CantonEngine:
    """Return an instantiated engine for the given canton code."""
    code = canton_code.upper()
    if code not in _REGISTRY:
        raise KeyError(f"No engine registered for canton '{code}'. Available: {list(_REGISTRY.keys())}")
    return _REGISTRY[code]()


def available_cantons() -> list[str]:
    return sorted(_REGISTRY.keys())


# --- Auto-register known cantons ---
def _auto_register() -> None:
    from grundstueckgewinnsteuer.cantons.sh import SchaffhausenEngine  # noqa: E402

    register("SH", SchaffhausenEngine)

    try:
        from grundstueckgewinnsteuer.cantons.zh import ZuerichEngine  # noqa: E402

        register("ZH", ZuerichEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.be import BernEngine  # noqa: E402

        register("BE", BernEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.lu import LuzernEngine  # noqa: E402

        register("LU", LuzernEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ag import AargauEngine  # noqa: E402

        register("AG", AargauEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.sg import StGallenEngine  # noqa: E402

        register("SG", StGallenEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.zg import ZugEngine  # noqa: E402

        register("ZG", ZugEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.bs import BaselStadtEngine  # noqa: E402

        register("BS", BaselStadtEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.bl import BaselLandEngine  # noqa: E402

        register("BL", BaselLandEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.gr import GraubuendenEngine  # noqa: E402

        register("GR", GraubuendenEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.so import SolothurnEngine  # noqa: E402

        register("SO", SolothurnEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.tg import ThurgauEngine  # noqa: E402

        register("TG", ThurgauEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.sz import SchwyzEngine  # noqa: E402

        register("SZ", SchwyzEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.gl import GlarusEngine  # noqa: E402

        register("GL", GlarusEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ai import AppenzellIREngine  # noqa: E402

        register("AI", AppenzellIREngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ar import AppenzellAREngine  # noqa: E402

        register("AR", AppenzellAREngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.nw import NidwaldenEngine  # noqa: E402

        register("NW", NidwaldenEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ow import ObwaldenEngine  # noqa: E402

        register("OW", ObwaldenEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ur import UriEngine  # noqa: E402

        register("UR", UriEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.vs import WallisEngine  # noqa: E402

        register("VS", WallisEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.fr import FreiburgEngine  # noqa: E402

        register("FR", FreiburgEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ge import GenfEngine  # noqa: E402

        register("GE", GenfEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ju import JuraEngine  # noqa: E402

        register("JU", JuraEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ne import NeuenburgEngine  # noqa: E402

        register("NE", NeuenburgEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.ti import TessinEngine  # noqa: E402

        register("TI", TessinEngine)
    except ImportError:
        pass

    try:
        from grundstueckgewinnsteuer.cantons.vd import WaadtEngine  # noqa: E402

        register("VD", WaadtEngine)
    except ImportError:
        pass


_auto_register()
