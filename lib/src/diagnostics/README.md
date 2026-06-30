# Diagnostics

This module owns structured compiler diagnostics and metrics. The initial
metrics pass reports raw/gzip output size, line count, emitted helper count, and
optional `dart compile js -O2` comparison ratios.

Future diagnostics work should add reachability counts and helper/runtime size
share without pushing that accounting back into backend emission.
