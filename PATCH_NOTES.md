PwnIt game UX polish patch

Included changes
- Shrunk Balance Grid, Codebreaker, Route Builder, Rule Lock, Transform Memory, and Sequence Restore so they fit more comfortably on one desktop screen.
- Rule Lock now explains what checks remaining means.
- Rule Lock now supports dragging seals from the bank into slots, while keeping click-to-place as fallback.
- Route Builder now explicitly explains that crossed tiles are blocked and cannot be used.
- Sequence Restore now explains that the words are neutral markers with no deeper meaning.

Not included
- The home/item-page lowercase game-title issue was not patched here because the game metadata already uses Title Case labels. That display transformation is likely in a separate card/page component outside these game files.
- Balance Grid and Sequence Restore logic were not replaced in this patch. This patch only softens layout/copy, not the verified scoring rules.
