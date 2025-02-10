import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import Base, engine, SessionLocal
from backend.app.models import Product
import io

client = TestClient(app)

# Fixture to create the database tables before tests and drop them after
@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# Fixture to provide a clean database session for each test
@pytest.fixture
def db_session():
    session = SessionLocal()
    yield session
    session.close()

def test_import_products_success(db_session):
    csv_content = "code,name,price,quantity\nSP001,Product1,100,10\nSP002,Product2,200,20"
    response = client.post(
        "/products/import",
        files={"file": ("products.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    assert response.json() == {"detail": "Products imported successfully."}

    # Verify that products are added to the database
    products = db_session.query(Product).all()
    assert len(products) == 2
    assert products[0].code == "SP001"
    assert products[0].name == "Product1"
    assert products[0].price == 100
    assert products[0].quantity == 10
    assert products[1].code == "SP002"
    assert products[1].name == "Product2"
    assert products[1].price == 200
    assert products[1].quantity == 20

def test_import_products_missing_fields(db_session):
    csv_content = "code,name,price\nSP001,Product1,100"
    response = client.post(
        "/products/import",
        files={"file": ("products.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "CSV file is missing required headers."}

def test_import_products_invalid_data_types(db_session):
    csv_content = "code,name,price,quantity\nSP001,Product1,invalid_price,10\nSP002,Product2,200,invalid_quantity"
    response = client.post(
        "/products/import",
        files={"file": ("products.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Price and quantity must be numeric."}

def test_import_products_duplicate_codes(db_session):
    # First import
    csv_content = "code,name,price,quantity\nSP001,Product1,100,10"
    response = client.post(
        "/products/import",
        files={"file": ("products.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200

    # Attempt to import duplicate
    response_duplicate = client.post(
        "/products/import",
        files={"file": ("products_duplicate.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response_duplicate.status_code == 400
    assert response_duplicate.json() == {"detail": "Duplicate product code SP001 found."}

def test_import_products_empty_file(db_session):
    csv_content = ""
    response = client.post(
        "/products/import",
        files={"file": ("empty.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "CSV file is empty."}

def test_import_products_special_characters(db_session):
    csv_content = "code,name,price,quantity\nSP001,Příliš žluťoučký kůň,100,10"
    response = client.post(
        "/products/import",
        files={"file": ("products_special.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response.status_code == 200
    assert response.json() == {"detail": "Products imported successfully."}

    # Verify that the product with special characters is added correctly
    product = db_session.query(Product).filter_by(code="SP001").first()
    assert product is not None
    assert product.name == "Příliš žluťoučký kůň"
    assert product.price == 100
    assert product.quantity == 10

def test_import_products_large_file(db_session):
    # Generate a large number of products
    large_csv = "code,name,price,quantity\n"
    for i in range(1, 1001):
        large_csv += f"SP{i:04d},Product{i},{i*10},{i}\n"

    response = client.post(
        "/products/import",
        files={"file": ("large_products.csv", io.StringIO(large_csv), "text/csv")}
    )
    assert response.status_code == 200
    assert response.json() == {"detail": "Products imported successfully."}

    # Verify that all products are added
    products = db_session.query(Product).filter(Product.code.like("SP%")).all()
    assert len(products) == 1001  # Including previous imports

def test_import_products_concurrent_requests(db_session):
    import threading

    def import_products(csv_content, results, index):
        response = client.post(
            "/products/import",
            files={"file": (f"products_{index}.csv", io.StringIO(csv_content), "text/csv")}
        )
        results[index] = response

    csv_content = "code,name,price,quantity\nSP1001,Product1001,100,10"

    threads = []
    results = {}
    for i in range(5):
        thread = threading.Thread(target=import_products, args=(csv_content, results, i))
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

    success_count = sum(1 for resp in results.values() if resp.status_code == 200)
    duplicate_count = sum(1 for resp in results.values() if resp.status_code == 400 and "Duplicate product code" in resp.json().get("detail", ""))

    assert success_count == 1
    assert duplicate_count == 4

def test_import_products_unauthorized_access(db_session):
    # Assuming the import endpoint requires authentication
    csv_content = "code,name,price,quantity\nSP0001,Product1,100,10"
    response = client.post(
        "/products/import",
        files={"file": ("products.csv", io.StringIO(csv_content), "text/csv")},
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Unauthorized."}

def test_import_products_injection_attempt(db_session):
    csv_content = "code,name,price,quantity\nSP0002,Product2,100,10\nSP0003,Product3,100,10\nSP0004,\"Product4; DROP TABLE products;\",100,10"
    response = client.post(
        "/products/import",
        files={"file": ("products_injection.csv", io.StringIO(csv_content), "text/csv")}
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Malformed CSV data detected."}
