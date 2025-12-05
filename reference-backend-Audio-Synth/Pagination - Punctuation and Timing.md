# Pagination - Punctuation and Timing

## What is Brain-Aligned Pagination?

ArT Reader uses a sophisticated pagination system designed to match how your brain naturally processes spoken language. Instead of arbitrary page breaks, we analyze the text's punctuation and the audio's natural pauses to create pages that feel intuitive and reduce cognitive load.

## Why This Matters

Traditional text-to-speech systems either:
- Show all text at once (overwhelming)
- Break text arbitrarily by character count (jarring)
- Ignore the natural rhythm of speech (confusing)

ArT Reader synchronizes what you see with what you hear, creating a seamless reading experience that respects the natural flow of language.

## How It Works: 6 Priority Levels

Our pagination system uses a hierarchical approach with six priority levels, evaluated in order:

### 1st Priority: Numbered Items (No character limit)
**What it protects:**
- `1. First numbered item` - number + separator + first three words
- `2.) Second numbered item` - number + period + paren + first three words
- `3.] Third numbered item` - number + period + bracket + first three words
- `4: Fourth numbered item` - number + colon + first three words
- `5 - Fifth numbered item` - number + space + dash + first three words
- Any numbered list pattern: `#. First three words`, `#.) First three words`, `#.] First three words`, `#: First three words`, `# - First three words`

**Why:** The number and first three words of a numbered item form a structural unit that should never be split. This keeps the list marker with its associated content while allowing the rest of the line to be processed naturally.

**Example:** `1. First numbered item with more details.` → Only "1. First numbered item" is protected; "with more details." can be split at punctuation, conjunctions, or breathing gaps.

---

### 2nd Priority: Protected Content (≤64 characters)
**What it protects:**
- "Quoted speech or phrases"
- (Parenthetical comments)
- [Bracketed references]
- {Braced content}
- <Angle bracketed notes>
- <<Guillemet quotes>>

**Why:** Short quoted or parenthetical content should stay together as a semantic unit. Breaking these mid-phrase disrupts comprehension and feels unnatural.

**Example:** The phrase "This is important" and more text → The quote stays on one page.

---

### 3rd Priority: Sentence Endings
**Punctuation:** `.` `!` `?`

**Why:** Sentence boundaries are the strongest natural break points in written language. Your brain expects a pause here, making them ideal places to turn the page.

**Example:** This is sentence one. This is sentence two. → Break after "one."

---

### 4th Priority: Middle Punctuation
**Punctuation:** `,` `;` `:` `-` `—` `…`

**Why:** Within long sentences, commas and other middle punctuation mark natural breathing points where speakers pause. These create gentler page breaks that still feel natural.

**Example:** This is a long sentence, with multiple clauses, that needs breaking. → Can break after "sentence," or "clauses,"

---

### 5th Priority: Conjunction Breaks (>64 characters only)
**Conjunctions:** and, or, but, nor, yet, so, however

**Why:** In very long pages (over 64 characters), breaking before a conjunction creates a natural pause point. The conjunction word starts the next page, leading you smoothly into the next thought.

**Example:** This is a very long sentence that goes on and on and needs multiple breaks → Break before "and"

**Note:** Only applied to pages longer than 64 characters to avoid over-fragmenting shorter content.

---

### 6th Priority: Breathing Gaps (>64 characters only)
**Threshold:** 60 milliseconds of silence

**Why:** Even without punctuation, speakers naturally pause between words to breathe. Our system detects these micro-pauses in the generated audio and uses them as last-resort break points for long pages.

**Example:** A long unpunctuated sentence that keeps going without any commas or periods but has natural speech pauses → Break at 60ms+ pauses

**Note:** Only applied to pages longer than 64 characters after all other rules have been checked.

---

## Character Threshold: 64 Characters

The 64-character threshold serves multiple purposes:

1. **Protected Content:** Content ≤64 characters within quotes/parentheses stays together
2. **Long Page Detection:** Pages >64 characters may need additional splitting via conjunctions or breathing gaps
3. **Visual Comfort:** Approximately 2 lines of text at 75% width on most screens

This threshold balances readability with natural language flow, ensuring pages are neither too cramped nor too sparse.

---

## The Result

By combining punctuation analysis with audio timing analysis, ArT Reader creates pages that:
- ✅ Respect the natural structure of language
- ✅ Match what you hear with what you see
- ✅ Reduce cognitive load during reading
- ✅ Feel intuitive and effortless
- ✅ Protect semantic units (quotes, parentheses, numbered items)
- ✅ Keep numbered item markers with their first three words

You're not just reading text with audio—you're experiencing text the way your brain naturally processes spoken language.

