"""Abstract canton engine interface."""

from __future__ import annotations

from abc import ABC, abstractmethod

from grundstueckgewinnsteuer.models import TaxInputs, TaxResult


class CantonEngine(ABC):
    """Base class that every canton-specific engine must implement."""

    @property
    @abstractmethod
    def canton_code(self) -> str:
        """Two-letter canton code (e.g. ``SH``)."""

    @property
    @abstractmethod
    def canton_name(self) -> str:
        """Full canton name (e.g. ``Schaffhausen``)."""

    @abstractmethod
    def compute(self, inputs: TaxInputs) -> TaxResult:
        """Run the full Grundstückgewinnsteuer computation and return a ``TaxResult``."""

    @abstractmethod
    def get_communes(self, tax_year: int) -> list[str]:
        """Return available commune names/IDs for a given tax year."""

    @abstractmethod
    def get_available_years(self) -> list[int]:
        """Return the list of tax years for which data is available."""

    @abstractmethod
    def get_confessions(self) -> list[str]:
        """Return confession keys supported by this canton (e.g. ``['evangR', 'roemK', ...]``)."""
