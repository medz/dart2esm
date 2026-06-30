# Program Model

This module owns library graphs, import/export graphs, dependency ordering, and
ESM API roots. The backend consumes this program model instead of rediscovering
exports while emitting JavaScript.

`program_model.dart` is the aggregation boundary between Kernel analysis and
emission. It combines ESM API roots, world reachability, and dependency-ordered
libraries into one model for later lowering and backend phases.
