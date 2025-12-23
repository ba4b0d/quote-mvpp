import trustme
from pathlib import Path

p = Path(".")
ca = trustme.CA()
server_cert = ca.issue_cert("192.168.100.21", "localhost", "127.0.0.1")

# server cert/key for uvicorn
(p / "cert.pem").write_bytes(server_cert.cert_chain_pems[0].bytes())
(p / "key.pem").write_bytes(server_cert.private_key_pem.bytes())

# (اختیاری) CA برای نصب روی گوشی/سیستم
(p / "ca.pem").write_bytes(ca.cert_pem.bytes())

print("Wrote cert.pem, key.pem, ca.pem")
