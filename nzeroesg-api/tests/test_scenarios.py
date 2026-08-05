from domain.scenarios.comparison import compare_shipment_modes
from domain.shipments.models import NormalizedShipment


def test_scenario_reconciles_alternative_totals_to_the_same_calculator():
    shipments = (
        NormalizedShipment(
            shipment_id="S-001",
            origin="Edmonton",
            destination="Calgary",
            weight_kg=1_000,
            distance_km=100,
            transport_method="truck",
            source_row=2,
        ),
    )

    scenario = compare_shipment_modes(shipments, alternative_mode="train")

    assert scenario.baseline_total_kg == 6.2
    assert scenario.alternative_total_kg == 2.2
    assert scenario.delta_kg == -4.0
    assert scenario.delta_percent == -64.5161
    assert scenario.shipment_results[0].delta_kg == -4.0
    assert scenario.factor_version == "prototype-2026.1"
