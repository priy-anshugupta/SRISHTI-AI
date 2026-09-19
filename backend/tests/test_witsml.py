from backend.integrations.witsml import parse_witsml_log


def test_parses_recognised_witsml_log_channels() -> None:
    payload = b'''<logs xmlns="http://www.witsml.org/schemas/1series"><log><mnemonicList>MD,ROP,RPM</mnemonicList><logData><data>1840.5,12.4,110</data></logData></log></logs>'''
    samples = parse_witsml_log(payload)
    assert samples[0]["measured_depth_m"] == 1840.5
    assert samples[0]["rop_m_per_hr"] == 12.4
    assert samples[0]["rpm"] == 110.0
