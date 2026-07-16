#!/usr/bin/env python3
"""Update all remaining meta titles from hyphen to en-dash separator."""

FILE = "/home/z/my-project/src/lib/tools-data.ts"

with open(FILE, "r") as f:
    content = f.read()

replacements = [
    ('metaTitle: "Free Password Generator - Create Strong Secure Passwords"',
     'metaTitle: "Free Password Generator \u2013 Create Strong Secure Passwords"'),
    ('metaTitle: "Free BMI Calculator - Calculate Body Mass Index Online"',
     'metaTitle: "Free BMI Calculator \u2013 Calculate Body Mass Index Online"'),
    ('metaTitle: "Free Percentage Calculator - Calculate Percentages Instantly"',
     'metaTitle: "Free Percentage Calculator \u2013 Calculate Percentages Instantly"'),
    ('metaTitle: "Free Age Calculator - Exact Age in Years, Months & Days"',
     'metaTitle: "Free Age Calculator \u2013 Exact Age in Years, Months & Days"'),
    ('metaTitle: "Free Loan Calculator - Monthly Payment & Amortization"',
     'metaTitle: "Free Loan Calculator \u2013 Monthly Payment & Amortization"'),
    ('metaTitle: "Free Unit Converter - Length, Weight, Temperature & More"',
     'metaTitle: "Free Unit Converter \u2013 Length, Weight, Temperature & More"'),
    ('metaTitle: "Free Case Converter - Uppercase, Title Case, camelCase & More"',
     'metaTitle: "Free Case Converter \u2013 Uppercase, Title Case, camelCase & More"'),
    ('metaTitle: "Free Color Picker - HEX, RGB, HSL Converter & Palette Tool"',
     'metaTitle: "Free Color Picker \u2013 HEX, RGB, HSL Converter & Palette Tool"'),
    ('metaTitle: "Free JSON Formatter & Validator - Beautify JSON Online"',
     'metaTitle: "Free JSON Formatter & Validator \u2013 Beautify JSON Online"'),
    ('metaTitle: "Free Image Compressor - Compress JPEG, PNG, WebP Online"',
     'metaTitle: "Free Image Compressor \u2013 Compress JPEG, PNG, WebP Online"'),
    ('metaTitle: "Free QR Code Generator - Create Custom QR Codes Online"',
     'metaTitle: "Free QR Code Generator \u2013 Create Custom QR Codes Online"'),
    ('metaTitle: "Free Base64 Encoder/Decoder - Text & File Conversion"',
     'metaTitle: "Free Base64 Encoder/Decoder \u2013 Text & File Conversion"'),
    ('metaTitle: "Free URL Encoder/Decoder - Percent Encoding Tool"',
     'metaTitle: "Free URL Encoder/Decoder \u2013 Percent Encoding Tool"'),
    ('metaTitle: "Free Lorem Ipsum Generator - Placeholder Text Tool"',
     'metaTitle: "Free Lorem Ipsum Generator \u2013 Placeholder Text Tool"'),
    ('metaTitle: "Free Markdown Previewer - Live Editor with HTML Export"',
     'metaTitle: "Free Markdown Previewer \u2013 Live Editor with HTML Export"'),
    ('metaTitle: "Free Hash Generator - SHA-1, SHA-256, SHA-512 Online"',
     'metaTitle: "Free Hash Generator \u2013 SHA-1, SHA-256, SHA-512 Online"'),
    ('metaTitle: "Free Number Base Converter - Binary, Hex, Octal, Decimal"',
     'metaTitle: "Free Number Base Converter \u2013 Binary, Hex, Octal, Decimal"'),
    ('metaTitle: "Free Text Diff Checker - Compare Two Texts Online"',
     'metaTitle: "Free Text Diff Checker \u2013 Compare Two Texts Online"'),
    ('metaTitle: "Free PDF Compressor - Reduce PDF File Size Online"',
     'metaTitle: "Free PDF Compressor \u2013 Reduce PDF File Size Online"'),
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
    else:
        print(f"NOT FOUND: {old[:60]}...")

with open(FILE, "w") as f:
    f.write(content)

print(f"Updated {count} meta titles to en-dash separator")