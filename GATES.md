# Gates: Press Start to Consult

OWNS: README.md, 01-the-warp-zone.md, 02-story-mode.md, 03-new-game-plus.md, image-prompts.md, scripts/**, GATES.md, .gitignore

Scope: deliver three versions of the Cosmo case-prep guide plus a separate art-prompt file, synthesized from the BYU workshop without the training firm's IP, and push the set to the GitHub repo

- [x] G0: this ledger states outcomes that can fail
  CHECK: node C:/Users/Josep/.claude/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ac027316ce67b668c8498dda609de31023da7c9cc6fbcab64bde479838e91098; exit=0; EXPECT=matched; output-sha256=ab75605faa131f6a3972de7734198bd1ea2c0ece977670ad303ada14346431e5; output-bytes=698; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G1: all four deliverables exist with the contracted headings, valid placeholder lines, and the required mock-dialogue volume
  CHECK: node scripts/verify.mjs structure
  EXPECT: structure verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=636312103bd5324ae2b982e459dc585322d8adca9cf7c9997eebf909623c4e97; exit=0; EXPECT=matched; output-sha256=4d266c74cbbbe1ea950b09a0ac8971283b08f362c0fb1bc282e0976888e3947e; output-bytes=30; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [ ] G2: each book's prose word count lands in its page-length band (3, 10, and 30 to 40 pages)
  CHECK: node scripts/verify.mjs words
  EXPECT: word count verification passed
  EVIDENCE: pending

- [x] G3: every image placeholder in the books has exactly one complete art-bible entry and no entry is orphaned
  CHECK: node scripts/verify.mjs placeholders
  EXPECT: placeholder verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=5239255f0dcb762ce6a8b57d2ea321e055062cb5af4437c00f3cd940e3a704f3; exit=0; EXPECT=matched; output-sha256=64d77bf2adc30b9b8e8c4e5c3ec95331eef1ad024fd3de2e835f2c988273ec64; output-bytes=74; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G4: no training-firm names, case names, banned jargon, adverbs, or dashes appear in any deliverable, and the negative control still trips the check
  CHECK: node scripts/verify.mjs banned-all
  EXPECT: banned string verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=f294fa51c76854a7f2a0cd878c71bfe52c0685460c89c4b70ac5c20e3bdc27ae; exit=0; EXPECT=matched; output-sha256=dbdadc2df51e27ce938b23bfec6ab03848f2bc86ef3e62e792c3aa4f38ccac0e; output-bytes=34; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [ ] G5: no run of nine or more consecutive words is shared with the workshop transcript or deck, and the negative control still trips the check
  CHECK: node scripts/verify.mjs overlap-all
  EXPECT: source overlap verification passed
  EVIDENCE: pending

- [x] G6: every Fraction Scroll row in every book is arithmetically correct when recomputed and matches the fixture
  CHECK: node scripts/verify.mjs fractions
  EXPECT: fraction scroll verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=908a8a02c7eac4a01d20f95afc7338657799689bca4991157894563f997c6401; exit=0; EXPECT=matched; output-sha256=e029a6485700aaa11d669d39bf6ef004a08759099bc81a1180e9e7a6fd4a8504; output-bytes=36; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [ ] G7: population and sector figures agree across the three books and the tome carries the full atlas and codex
  CHECK: node scripts/verify.mjs atlas
  EXPECT: atlas and sector consistency verification passed
  EVIDENCE: pending

- [x] G8: the four worked examples recompute from their inputs to the printed strings, and those strings appear in the books
  CHECK: node scripts/verify.mjs math
  EXPECT: worked example verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=6fcae681fec797a1c66cb771ae4f3ac0616fefa7a67204f5462f06c0fd10260d; exit=0; EXPECT=matched; output-sha256=b8812236abb9066b0d3c50180d160f51b067084d44e0a478f95cb6fc96a2ed31; output-bytes=35; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [ ] G9: the working tree is clean, every deliverable is tracked, and HEAD matches origin/main on GitHub
  CHECK: node scripts/verify.mjs git
  EXPECT: git verification passed
  EVIDENCE: pending

- [ ] M1: the fixture fact-check disputes were reviewed and every accepted correction was applied to fixtures and copy before assembly
  EVIDENCE: pending

- [ ] M2: an independent stop-slop reviewer scored every section and the recorded totals are 40 of 50 or higher after fixes
  EVIDENCE: pending

- [ ] M3: an independent correctness and IP reviewer passed every section after fixes, and the running case, examples, and dialogues are original
  EVIDENCE: pending

- [ ] M4: a completeness critic compared the final books against the original brief and the workshop content, and every gap it found was closed
  EVIDENCE: pending
