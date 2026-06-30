# Optimizer

This module will own optimization passes over semantic IR or JS AST-like output
models. Output-shape improvements such as optional chaining, nullish
coalescing, direct `class extends`, and direct `instanceof` belong here or in
emitter policy, not as scattered backend patches.

