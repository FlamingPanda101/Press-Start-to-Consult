# Gates: Press Start to Consult

OWNS: README.md, 01-the-warp-zone.md, 02-story-mode.md, 03-new-game-plus.md, image-prompts.md, HANDOFF-TO-DESIGN.md, scripts/**, docs/**, GATES.md, .gitignore

Scope: deliver three versions of the Cosmo case-prep guide plus a separate art-prompt file, synthesized from the BYU workshop without the training firm's IP, publish a static website of the set that GitHub Pages can serve, and push everything to the GitHub repo

- [x] G0: this ledger states outcomes that can fail
  CHECK: node C:/Users/Josep/.claude/skills/unlazy/scripts/gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ac027316ce67b668c8498dda609de31023da7c9cc6fbcab64bde479838e91098; exit=0; EXPECT=matched; output-sha256=ab75605faa131f6a3972de7734198bd1ea2c0ece977670ad303ada14346431e5; output-bytes=698; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G1: all four deliverables exist with the contracted headings, valid placeholder lines, and the required mock-dialogue volume
  CHECK: node scripts/verify.mjs structure
  EXPECT: structure verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=636312103bd5324ae2b982e459dc585322d8adca9cf7c9997eebf909623c4e97; exit=0; EXPECT=matched; output-sha256=4d266c74cbbbe1ea950b09a0ac8971283b08f362c0fb1bc282e0976888e3947e; output-bytes=30; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G2: each book's prose word count lands in its page-length band (3, 10, and 30 to 40 pages)
  CHECK: node scripts/verify.mjs words
  EXPECT: word count verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=e8a2b2bcd838e2299d10b7a1f322e12928c3b3c710d811e20cdf5ac6bc026336; exit=0; EXPECT=matched; output-sha256=ed50a599c0f0d63b27504e215a2ebe9d76d838d9e7a00896ef4a28dc34f11590; output-bytes=299; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G3: every image placeholder in the books has exactly one complete art-bible entry and no entry is orphaned
  CHECK: node scripts/verify.mjs placeholders
  EXPECT: placeholder verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=5239255f0dcb762ce6a8b57d2ea321e055062cb5af4437c00f3cd940e3a704f3; exit=0; EXPECT=matched; output-sha256=ee4386ccc874d6498594deda72451b3337410a0c92b21f7302e7708371e4cf2d; output-bytes=74; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G4: no training-firm names, case names, banned jargon, adverbs, or dashes appear in any deliverable, and the negative control still trips the check
  CHECK: node scripts/verify.mjs banned-all
  EXPECT: banned string verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=f294fa51c76854a7f2a0cd878c71bfe52c0685460c89c4b70ac5c20e3bdc27ae; exit=0; EXPECT=matched; output-sha256=dbdadc2df51e27ce938b23bfec6ab03848f2bc86ef3e62e792c3aa4f38ccac0e; output-bytes=34; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G5: no run of nine or more consecutive words is shared with the workshop transcript or deck, and the negative control still trips the check
  CHECK: node scripts/verify.mjs overlap-all
  EXPECT: source overlap verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=919fb2126176c8f5221ebb1fef6e6e25a55d40bde33346ee77d8a5717ee618cb; exit=0; EXPECT=matched; output-sha256=89671581e137e55cb14ef5aa4a8739eb2d4d54afa9ed989a5f672f34cafa6fd1; output-bytes=35; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G6: every Fraction Scroll row in every book is arithmetically correct when recomputed and matches the fixture
  CHECK: node scripts/verify.mjs fractions
  EXPECT: fraction scroll verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=908a8a02c7eac4a01d20f95afc7338657799689bca4991157894563f997c6401; exit=0; EXPECT=matched; output-sha256=e029a6485700aaa11d669d39bf6ef004a08759099bc81a1180e9e7a6fd4a8504; output-bytes=36; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G7: population and sector figures agree across the three books and the tome carries the full atlas and codex
  CHECK: node scripts/verify.mjs atlas
  EXPECT: atlas and sector consistency verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=0389c913ac22c96ee4b5b9c4ff27b69feccaf8d8fdafac9a9b96c2c5a1d7c136; exit=0; EXPECT=matched; output-sha256=d87dc386a3405cbff091d5961215d2c44344ee372010226270c9dfbe19c38cfc; output-bytes=49; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G8: the four worked examples recompute from their inputs to the printed strings, and those strings appear in the books
  CHECK: node scripts/verify.mjs math
  EXPECT: worked example verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=6fcae681fec797a1c66cb771ae4f3ac0616fefa7a67204f5462f06c0fd10260d; exit=0; EXPECT=matched; output-sha256=b8812236abb9066b0d3c50180d160f51b067084d44e0a478f95cb6fc96a2ed31; output-bytes=35; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] G9: the working tree is clean, every deliverable is tracked, and HEAD matches origin/main on GitHub
  CHECK: node scripts/verify.mjs git
  EXPECT: git verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=5b349211b9ebb2183d6a766b01ad6ce07b51eab4f9e09e724909b43f288296fb; exit=0; EXPECT=matched; output-sha256=b2d5fdd7dc0af69debf9db6f8ea2927b67b9032596ee86d7fad035e4de35758a; output-bytes=24; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W1: the site regenerates from the source markdown alone, and a second build produces byte-identical output
  CHECK: node scripts/verify-site.mjs build-idempotent
  EXPECT: build idempotency verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=b5174730c7a6ea044818e5f0dd15d1f7f4033c45cc0c411b5df953127578223c; exit=0; EXPECT=matched; output-sha256=a904156730f7cb41dcf5897f729445b31c23fbd6f82a2dc769f02a8130823f77; output-bytes=60; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W2: every heading and every table row in each source book reaches its rendered page, so the site carries the whole guide
  CHECK: node scripts/verify-site.mjs parity
  EXPECT: source parity verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=e156e55b2271cd44113b1c15916212c0b593fa1e74f9dbf284eb8e11d0543ed1; exit=0; EXPECT=matched; output-sha256=6832510b8dbf620f0593732e851f3394dab4487a92dbd0b127719fbb418d1de8; output-bytes=23; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W3: all 45 art slots render, each supplied image file exists on disk, and each slot without art holds a sized placeholder carrying its ID
  CHECK: node scripts/verify-site.mjs art
  EXPECT: art slot verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=46cfc499f3bf45b7d348458538238aabef7ee8435cbfa8b8ac9691a88ccbbaa2; exit=0; EXPECT=matched; output-sha256=fb2973a0d5fbe16fd8a886e415c47aaef0c42f65835060f687cbcb63867a52a0; output-bytes=90; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W4: the built pages meet the accessibility floor: a language, one h1, no skipped heading level, a skip link, alt text on every image, and a labelled main landmark
  CHECK: node scripts/verify-site.mjs a11y
  EXPECT: accessibility verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=316b94412de75a2750ca8ef1c241eeeb24bbec720d7fb9ef6ebcb8208e3901be; exit=0; EXPECT=matched; output-sha256=caac093552ecd0040586d2995271f3f13cd56a4537840c10ff6ec42a4b1a0d79; output-bytes=34; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W5: every internal link and table-of-contents anchor resolves to an element that exists on the target page
  CHECK: node scripts/verify-site.mjs links
  EXPECT: link verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=9fbfc3164326ce37cf2284c2e25cf0ffcc79140d6f114b707f38b803749e4d79; exit=0; EXPECT=matched; output-sha256=961d40fc97dad0ec4173837e12d14d1296bf33d70a2f99d6039946c2862bfbae; output-bytes=75; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W6: every table sits inside a scroll container and no rule forces the page wider than the viewport
  CHECK: node scripts/verify-site.mjs overflow
  EXPECT: overflow verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=28f38314ff121e0d4d9540cdbb07e5bd8c00e107876bf5360a11acf673fe04d8; exit=0; EXPECT=matched; output-sha256=df53f7f4b1f00c0abf84ff06872e01d9e9283f6639e7ec7ab454040650670814; output-bytes=29; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W7: the output is GitHub Pages ready: an entry page, no Jekyll processing, and no absolute or off-site asset path
  CHECK: node scripts/verify-site.mjs pages-ready
  EXPECT: pages readiness verified
  EVIDENCE: automatic-evidence=v1; definition-sha256=311162fc3dae0894906dc272da08993a0e9c3b15393e904246db4df233232833; exit=0; EXPECT=matched; output-sha256=dfa2552328e9ffc97eef581c2292a29fca80bcc3c0a1c5b52a3e2650513073e2; output-bytes=25; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W8: the figures rendered into the site still match the fixtures, so the website cannot drift from the verified numbers
  CHECK: node scripts/verify-site.mjs figures
  EXPECT: rendered figure verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=f1d76c4623ca5e46314d0ad90ed3349f14d02b47154a934043efa7b9e206e230; exit=0; EXPECT=matched; output-sha256=a025e6478446239e4be14b61e0a27fb3a10b8627556084a8ea8c44b076bbc02e; output-bytes=36; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] W9: the rendered pages contain no training-firm name, banned string, or dash, checked against the same negative control as the books
  CHECK: node scripts/verify-site.mjs banned
  EXPECT: rendered banned string verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=c306b8e423f11782404fa15d8b1ca35dbed79b171a6d8ae7e47eb3c0325a3c18; exit=0; EXPECT=matched; output-sha256=c3d173d69cb4b0ae620f34181e9fe50298f5c770f34d9a2effbfaad2d0d4bee7; output-bytes=43; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\Josep\OneDrive\Desktop\Code\How To Survive Consulting BYU MBA; path=158e256bcb2d/31 entries

- [x] M1: the fixture fact-check disputes were reviewed and every accepted correction was applied to fixtures and copy before assembly
  EVIDENCE: Reviewed 2026-09-05. A fact-check agent verified all 230 leaf values in scripts/fixtures.json against current sources and disputed 12. All 12 were accepted and applied to both fixture copies and to every draft before assembly: US health spending $4.9T to $5.3T, spending per person $14.5K to $15.5K, health share of GDP 17.5% to 18%, world GDP $110T to $120T, US GDP $29T to $30T, global IT spend $5T to $6T, global internet users 5.5B to 6B, AWS cloud share 30% to 28%, Google Cloud 11% to 14%, Australia 26M to 28M, Pakistan 240M to 255M. Two further corrections followed from later review: Azure 22% to 21% for consistency with the same cited source, and Provo-Orem metro 700K to 780K after a reviewer found the fixture placed the metro below Utah County, the county inside it. No dispute was rejected. Gate G7 holds all three books to the corrected values.

- [x] M2: an independent stop-slop reviewer scored every section and the recorded totals are 40 of 50 or higher after fixes
  EVIDENCE: Two independent style reviewers, one on mechanics and one on craft, scored each section 1 to 10 on directness, rhythm, trust, authenticity, and density, and a later verifier rescored from a fresh read. Final totals: The Warp Zone 6 sections at 43 to 45, Story Mode 5 sections at 43 to 46, New Game+ 18 sections at 44 to 46, the art bible 4 sections at 43 to 44. Lowest total 43, none below 40. The verifier set style_pass true for every section of the three books. Gate G4 enforces the mechanical subset on every run, with a negative control that fails when the check is broken.

- [x] M3: an independent correctness and IP reviewer passed every section after fixes, and the running case, examples, and dialogues are original
  EVIDENCE: An adversarial correctness and intellectual-property reviewer read each file against the workshop transcript and slide deck. The final verifier set ip_pass true for every section of all four deliverables. The running client Wasatch Wheels, the five worked examples, and the mock dialogues are original inventions written to replace the workshop's own client and cases. A case-insensitive search across the five deliverables for the training firm, its products, its platform, its coaches, and its six example cases returns zero hits. Gates G4 and G5 enforce this on every run, each with a negative control.

- [x] M4: a completeness critic compared the final books against the original brief and the workshop content, and every gap it found was closed
  EVIDENCE: A completeness critic compared the set against the original brief, the transcript, and contract section 8, and reported 26 gaps: 3 high, 13 medium, 10 low. A separate brief-coverage reviewer then confirmed 17 brief requirements met and reported 3 further gaps. Two changed-passage verifiers reported 12 residual issues and a final art-and-table verifier reported 16. Every one was applied or resolved. The three high gaps all sat in Story Mode: it promised coverage of quantitative exhibits without reading one, its Sector Codex held fewer rows than the three-page cheat sheet, and its closing example cited two analyses that appear only in the tome. Review also caught two calculations that were wrong in draft copy: a sensitivity claim that halved a market when the inputs give a 43% fall, and a cash-conversion-cycle illustration whose station order contradicted the 60-day figure printed on it.
