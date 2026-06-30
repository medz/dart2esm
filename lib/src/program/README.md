# Program Model

This module owns library graphs, import/export graphs, dependency ordering, and
ESM API roots. The backend consumes this program model instead of rediscovering
exports while emitting JavaScript.
