"""Foundation tests — health, country registry, map links."""

from fastapi.testclient import TestClient

from app.countries.registry import CountryRegistry
from app.main import app
from app.services.map_service import MapService

client = TestClient(app)


def test_live_health() -> None:
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "alive"


def test_api_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "ok"


def test_countries_catalog_has_sixty_markets() -> None:
    CountryRegistry.load()
    assert CountryRegistry.count() == 60
    response = client.get("/api/v1/countries")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["count"] == 60


def test_country_detail_gb() -> None:
    response = client.get("/api/v1/countries/GB")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["country_code"] == "GB"
    assert data["country_name"] == "United Kingdom"
    assert data["support_level"] == "planned"


def test_generate_returns_seed_backed_candidate_for_planned_country() -> None:
    response = client.post("/api/v1/addresses/generate", json={"country": "GB"})
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["country_code"] == "GB"
    assert body["validation"]["geocoded"] is True
    assert body["validation"]["map_verified"] is True


def test_unknown_country() -> None:
    response = client.get("/api/v1/countries/ZZ")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "COUNTRY_NOT_SUPPORTED"


def test_map_links_service() -> None:
    links = MapService().links(51.5074, -0.1278, label="London")
    assert "openstreetmap" in links
    assert "google_maps" in links
    assert "apple_maps" in links
    assert "51.5074" in links["openstreetmap"]


def test_map_links_endpoint() -> None:
    response = client.post(
        "/api/v1/maps/links",
        json={"latitude": 51.5074, "longitude": -0.1278, "label": "London"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_request_id_header_present() -> None:
    response = client.get("/api/v1/health")
    assert "X-Request-ID" in response.headers


def test_search_place_seed_match() -> None:
    response = client.post("/api/v1/addresses/search", json={"query": "White House", "country": "US"})
    assert response.status_code == 200
    body = response.json()["data"]
    assert "1600 Pennsylvania" in body["address_line_1"]
    assert body["city"] == "Washington"
    assert body["address_line_2"] is not None
    assert body["coordinates"]["latitude"] is not None

