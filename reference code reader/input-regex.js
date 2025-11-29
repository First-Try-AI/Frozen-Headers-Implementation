// dev/ArT Reader/input-regex.js

class TextProcessor {
    constructor() {
        // No specific initialization needed for now
    }

    cleanText(inputText) {
        if (!inputText) {
            return '';
        }

        let cleanedText = inputText.trim();

        // Apply text reformatting transformations (8 focused rules)
        cleanedText = cleanedText
            // Rule 1: Strip asterisks from markdown formatting
            .replace(/\*+/g, '')
            // Rule 2: Remove tool call references
            .replace(/\[\d+ tools? called\]/g, '')
            // Rule 3: Make markdown headers consistent (add space after ##)
            .replace(/##([^\s#])/g, '## $1')
            // Rule 4: Remove markdown headers and add period
            .replace(/##\s+(.+?)(\n|$)/g, '$1.$2')
            // Rule 5: Remove any remaining markdown headers (cleanup)
            .replace(/##/g, '')
            // Rule 6: Replace complex emdash patterns
            .replace(/\{[^}]*\}\[emdash\]\{[^}]*\}/g, ' — ')
            // Rule 7: Normalize multiple line breaks
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            // Rule 8: Add period to lines ending without punctuation  
            .replace(/([a-zA-Z])(\s*)(\n|$)/g, '$1.$3');

        return cleanedText;
    }
}