from backend.services.document_processing import file_sha256


def test_file_hash_is_stable() -> None:
    assert file_sha256(b"well report") == file_sha256(b"well report")
    assert file_sha256(b"well report") != file_sha256(b"other report")
