#!/usr/bin/env python3
"""Update meta descriptions to benefit-focused format and add benefitHeading field."""

FILE = "/home/z/my-project/src/lib/tools-data.ts"

with open(FILE, "r") as f:
    content = f.read()

# 1. Add benefitHeading to the interface
content = content.replace(
    '  primaryKeyword: string;',
    '  primaryKeyword: string;\n  benefitHeading: string;'
)

# 2. Replace each tool's metaDescription + add benefitHeading
# Format: benefit-first lines ending with "Free online [Tool Name]."

replacements = [
    # word-counter
    (
        'metaDescription: "Count words, characters, sentences and reading time instantly. Free online word counter for writers, students and SEO professionals. No sign-up.",',
        'metaDescription: "Count words, characters, sentences, paragraphs, reading time, and speaking time instantly. Free online Word Counter.",\n    benefitHeading: "Count Words Online",',
    ),
    # character-counter
    (
        'metaDescription: "Count characters, analyze frequency and get text composition stats instantly. Free online character counter for social media, SMS and SEO. No sign-up.",',
        'metaDescription: "Count characters, analyze frequency distribution, and get detailed text composition stats instantly. Free online Character Counter.",\n    benefitHeading: "Analyze Characters & Text Composition",',
    ),
    # password-generator
    (
        'metaDescription: "Generate strong, secure passwords instantly. Customize length and characters. Check password strength. Free online tool, no data stored.",',
        'metaDescription: "Generate strong, cryptographically secure passwords with customizable length and character types. Check strength in real time. Free online Password Generator.",\n    benefitHeading: "Generate Secure Passwords",',
    ),
    # bmi-calculator
    (
        'metaDescription: "Calculate your BMI instantly with metric or imperial units. Free online BMI calculator with health categories and visual chart. No sign-up required.",',
        'metaDescription: "Calculate your Body Mass Index with metric or imperial units. See health categories and visual BMI chart. Free online BMI Calculator.",\n    benefitHeading: "Calculate Your Body Mass Index",',
    ),
    # percentage-calculator
    (
        'metaDescription: "Calculate percentages, increase, decrease and change instantly. Free online percentage calculator for students, business and finance. Works in browser.",',
        'metaDescription: "Calculate percentages, percentage increase, decrease, and difference between two numbers instantly. Free online Percentage Calculator.",\n    benefitHeading: "Calculate Percentages Instantly",',
    ),
    # age-calculator
    (
        'metaDescription: "Calculate your exact age in years, months, days, hours and seconds. Free online age calculator with next birthday countdown and zodiac sign.",',
        'metaDescription: "Calculate your exact age in years, months, days, hours, minutes, and seconds. Includes zodiac sign and birthday countdown. Free online Age Calculator.",\n    benefitHeading: "Calculate Your Exact Age",',
    ),
    # loan-calculator
    (
        'metaDescription: "Calculate monthly loan payments, total interest and view amortization schedule. Free mortgage and EMI calculator. Works for any fixed-rate loan.",',
        'metaDescription: "Calculate monthly payments, total interest, and view a full amortization schedule for any fixed-rate loan. Free online Loan Calculator.",\n    benefitHeading: "Calculate Loan Payments & Amortization",',
    ),
    # unit-converter
    (
        'metaDescription: "Convert between units of length, weight, temperature, volume, speed and data storage. Free online unit converter. Metric and imperial supported.",',
        'metaDescription: "Convert between units of length, weight, temperature, volume, area, speed, and data storage instantly. Free online Unit Converter.",\n    benefitHeading: "Convert Between Any Unit",',
    ),
    # case-converter
    (
        'metaDescription: "Convert text to uppercase, lowercase, title case, camelCase, snake_case and more. Free online case converter. Copy results instantly.",',
        'metaDescription: "Convert text between UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, and kebab-case instantly. Free online Case Converter.",\n    benefitHeading: "Convert Text to Any Case",',
    ),
    # color-picker
    (
        'metaDescription: "Pick colors and convert between HEX, RGB, HSL formats instantly. Free online color picker with palette generator for designers and developers.",',
        'metaDescription: "Pick any color and convert between HEX, RGB, and HSL formats. Generate palettes and complementary colors. Free online Color Picker.",\n    benefitHeading: "Pick Colors & Convert Formats",',
    ),
    # json-formatter
    (
        'metaDescription: "Format, validate and beautify JSON instantly with syntax highlighting. Free online JSON formatter with tree view and minifier. 100% private.",',
        'metaDescription: "Format, validate, beautify, and minify JSON data with syntax highlighting and error detection. Free online JSON Formatter.",\n    benefitHeading: "Format & Validate JSON Data",',
    ),
    # image-compressor
    (
        'metaDescription: "Compress and resize images online for free. Reduce file size up to 90%. Convert between JPEG, PNG and WebP. 100% private, all processing in your browser.",',
        'metaDescription: "Compress and resize images with quality control. Supports JPEG, PNG, and WebP. Reduce file size up to 90% in your browser. Free online Image Compressor.",\n    benefitHeading: "Compress & Resize Images",',
    ),
    # qr-code-generator
    (
        'metaDescription: "Generate free QR codes from text or URLs. Customize colors and size. Download as PNG. No sign-up required, 100% free.",',
        'metaDescription: "Generate customizable QR codes from text, URLs, or any data. Choose size, colors, and download as PNG. Free online QR Code Generator.",\n    benefitHeading: "Generate Custom QR Codes",',
    ),
    # base64-encoder
    (
        'metaDescription: "Encode text or files to Base64 and decode Base64 back. Supports Unicode text, file uploads, and data URI conversion. Free online tool.",',
        'metaDescription: "Encode text or files to Base64 and decode Base64 back to text. Supports Unicode, emojis, and file uploads. Free online Base64 Encoder.",\n    benefitHeading: "Encode & Decode Base64",',
    ),
    # url-encoder
    (
        'metaDescription: "Encode and decode URLs instantly. See automatic URL breakdown with scheme, host, path and query params. Free online tool for developers.",',
        'metaDescription: "Encode and decode URLs with percent-encoding. See automatic URL breakdown with scheme, host, path, and query params. Free online URL Encoder.",\n    benefitHeading: "Encode & Decode URLs",',
    ),
    # lorem-ipsum-generator
    (
        'metaDescription: "Generate lorem ipsum placeholder text by paragraphs, sentences or words. Customizable count and options. Copy instantly. Free online tool.",',
        'metaDescription: "Generate lorem ipsum placeholder text by paragraphs, sentences, or words with customizable count. Copy instantly. Free online Lorem Ipsum Generator.",\n    benefitHeading: "Generate Placeholder Text",',
    ),
    # markdown-previewer
    (
        'metaDescription: "Write Markdown and see live HTML preview instantly. Supports GFM, tables, code blocks. Copy HTML output. Free online tool, no sign-up.",',
        'metaDescription: "Write Markdown with a live HTML preview, split-view editor, and GFM support. Copy rendered HTML with one click. Free online Markdown Previewer.",\n    benefitHeading: "Preview Markdown in Real Time",',
    ),
    # hash-generator
    (
        'metaDescription: "Generate SHA-1, SHA-256 and SHA-512 hashes from any text instantly. Uses Web Crypto API. Free online tool, 100% private.",',
        'metaDescription: "Generate SHA-1, SHA-256, and SHA-512 cryptographic hashes from any text. Real-time hashing with Web Crypto API. Free online Hash Generator.",\n    benefitHeading: "Generate Cryptographic Hashes",',
    ),
    # number-base-converter
    (
        'metaDescription: "Convert between binary, octal, decimal and hexadecimal instantly. Supports large numbers with BigInt. Free online tool for programmers and students.",',
        'metaDescription: "Convert between binary, octal, decimal, and hexadecimal instantly. Supports arbitrary-precision with BigInt. Free online Number Base Converter.",\n    benefitHeading: "Convert Between Number Bases",',
    ),
    # text-diff-checker
    (
        'metaDescription: "Compare two texts and see differences highlighted instantly. Shows added, removed and unchanged lines with statistics. Free online diff tool.",',
        'metaDescription: "Compare two texts side by side and see added, removed, and unchanged lines highlighted with statistics. Free online Text Diff Checker.",\n    benefitHeading: "Compare Two Texts Side by Side",',
    ),
    # pdf-compressor
    (
        'metaDescription: "Compress PDF files online for free. Three compression levels. No upload needed — all processing in your browser. Reduce PDF size by up to 80%.",',
        'metaDescription: "Compress PDF files with three compression levels directly in your browser. Reduce file size by up to 80% with zero uploads. Free online PDF Compressor.",\n    benefitHeading: "Compress PDF Files in Your Browser",',
    ),
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f"NOT FOUND: {old[:80]}...")

with open(FILE, "w") as f:
    f.write(content)

print(f"Updated {count} meta descriptions + added benefitHeading field")