#!/usr/bin/env python3
"""Expand all 21 tool FAQs from 3 to 6 questions each."""

FILE = "/home/z/my-project/src/lib/tools-data.ts"

with open(FILE, "r") as f:
    content = f.read()

# Define all FAQ replacements as (tool_id, new_faq_array)
faq_replacements = {
    "word-counter": """    faq: [
      { question: "What is a Word Counter?", answer: "A word counter is a free online tool that instantly counts the total number of words, characters, sentences, and paragraphs in any text you paste or type. It also estimates reading and speaking time, making it essential for writers, students, bloggers, and SEO professionals who need to meet specific word count requirements." },
      { question: "How are words counted?", answer: "The word counter splits your text by whitespace (spaces, tabs, and line breaks) and counts each contiguous group of non-whitespace characters as one word. It correctly handles multiple spaces between words, trailing and leading spaces, and mixed punctuation so every word is counted accurately." },
      { question: "Does punctuation count as a word or character?", answer: "Punctuation marks are counted as characters but never as separate words. For example, \\\"Hello!\\\" counts as one word and six characters (H-e-l-l-o-!). The word counter is smart enough to keep punctuation attached to the word it follows." },
      { question: "Can I upload a file to count words?", answer: "Currently the word counter works with text you paste or type directly into the text area. You can copy text from any document (Word, Google Docs, PDF) and paste it in. File upload support may be added in a future update." },
      { question: "Is my text stored or sent to a server?", answer: "No. All counting happens entirely in your browser using JavaScript. Your text is never uploaded, stored, or transmitted to any server. Once you close or refresh the page, your text is completely gone." },
      { question: "Does the word counter work offline?", answer: "Yes, once the page has loaded, the word counter works completely offline. All the counting logic runs in your browser with no internet connection required. You can even use it in airplane mode after the initial page load." },
    ],""",

    "character-counter": """    faq: [
      { question: "What is a Character Counter?", answer: "A character counter is a free online tool that counts the total number of characters in your text, including or excluding spaces. It also provides a detailed breakdown of character types \\u2014 letters, numbers, spaces, and special characters \\u2014 along with frequency analysis of your most-used characters." },
      { question: "How does the character frequency analysis work?", answer: "The tool scans your entire text and tallies every occurrence of each unique character. It then ranks characters by frequency and shows the top 10 most-used characters with both their raw count and percentage of total characters, helping you spot overused characters or unusual patterns." },
      { question: "Does it count hidden characters like tabs and line breaks?", answer: "Yes. The total character count includes all whitespace characters \\u2014 spaces, tabs, and line breaks. The \\\"without spaces\\\" count strips all whitespace so you can see only the visible, printable characters." },
      { question: "Can I use this for social media character limits?", answer: "Absolutely. The character counter is perfect for checking if your text fits within platform limits \\u2014 Twitter/X (280 characters), Instagram bio (150 characters), SMS messages (160 characters), Google meta descriptions (160 characters), and more. Use the \\\"without spaces\\\" count if the platform does not count spaces." },
      { question: "Is my text stored anywhere?", answer: "No. All processing happens entirely in your browser. Your text is never sent to any server or stored anywhere. When you close the tab, your text is gone forever." },
      { question: "Does it work offline?", answer: "Yes. Once the page has loaded in your browser, the character counter works completely offline with no internet connection needed. All counting and analysis runs locally using JavaScript." },
    ],""",

    "password-generator": """    faq: [
      { question: "What is a Password Generator?", answer: "A password generator is a free online tool that creates strong, random passwords using cryptographically secure algorithms. You can customize the length and character types (uppercase, lowercase, numbers, symbols) to generate passwords that meet any website's requirements." },
      { question: "How are the passwords generated?", answer: "Passwords are generated using the Web Crypto API's crypto.getRandomValues() function, which provides cryptographically secure pseudo-random numbers. This is the same level of randomness that browsers use for HTTPS/TLS encryption, making the generated passwords suitable for security-sensitive applications." },
      { question: "How long should my password be?", answer: "We recommend at least 12 characters for strong security. A 12-character password with mixed character types has over 200 trillion possible combinations. For high-security accounts (banking, email), consider 16-20 characters. Longer passwords are exponentially harder to crack through brute force." },
      { question: "Are my generated passwords stored or sent anywhere?", answer: "No. Passwords are generated entirely in your browser and are never transmitted to any server. There is no database, no logging, and no tracking. Once you navigate away from the page or close the tab, the password is gone forever." },
      { question: "Does it work offline?", answer: "Yes. The password generator uses only browser-native APIs (Web Crypto API) to generate passwords. Once the page has loaded, no internet connection is needed to generate, copy, or regenerate passwords." },
      { question: "What makes a password strong?", answer: "A strong password is long (12+ characters), uses a mix of character types (uppercase, lowercase, numbers, symbols), avoids dictionary words and common patterns, and is unique to each account. The built-in strength meter evaluates your password against these criteria in real time." },
    ],""",

    "bmi-calculator": """    faq: [
      { question: "What is a BMI Calculator?", answer: "A BMI (Body Mass Index) calculator is a free online tool that estimates whether your weight is in a healthy range relative to your height. It uses the standard BMI formula and categorizes your result as underweight, normal weight, overweight, or obese based on WHO guidelines." },
      { question: "How is BMI calculated?", answer: "BMI is calculated by dividing your weight in kilograms by the square of your height in meters (BMI = kg / m\\u00b2). For imperial units, the formula is: BMI = (weight in pounds \\u00d7 703) / (height in inches)\\u00b2. The calculator handles both unit systems automatically." },
      { question: "What is a healthy BMI range?", answer: "According to the World Health Organization, a BMI between 18.5 and 24.9 is considered normal weight. Below 18.5 is underweight, 25.0-29.9 is overweight, and 30.0 or above is classified as obese. These ranges apply to adults aged 20 and older." },
      { question: "Is BMI accurate for athletes and bodybuilders?", answer: "BMI has limitations \\u2014 it does not distinguish between muscle and fat mass. Athletes and bodybuilders may have a high BMI due to greater muscle mass, which weighs more than fat. For these individuals, BMI may overestimate body fat. Other measurements like body fat percentage may be more useful." },
      { question: "Is my health data stored or sent to a server?", answer: "No. All calculations happen entirely in your browser. Your height, weight, and BMI results are never transmitted to any server. No data is stored, logged, or shared with any third party." },
      { question: "Does the BMI calculator work offline?", answer: "Yes. Once the page has loaded, the calculator works completely offline. All the BMI computation is done using simple JavaScript math in your browser with no internet connection required." },
    ],""",

    "percentage-calculator": """    faq: [
      { question: "What is a Percentage Calculator?", answer: "A percentage calculator is a free online tool that lets you quickly compute percentages, percentage increases and decreases, and percentage differences between two numbers. It offers multiple calculation modes so you can solve any percentage problem without memorizing formulas." },
      { question: "How do I calculate a percentage increase or decrease?", answer: "Use the '% Change' tab. Enter the original value in the 'From' field and the new value in the 'To' field. The calculator will show you the percentage change \\u2014 positive for an increase and negative for a decrease. The formula used is: ((New - Original) / Original) \\u00d7 100." },
      { question: "Can I calculate what percentage one number is of another?", answer: "Yes. Use the '% of What?' tab. Enter the smaller number (the part) in the first field and the larger number (the whole) in the second field. For example, entering 50 and 200 gives you 25%, meaning 50 is 25% of 200." },
      { question: "Does the calculator handle decimal percentages?", answer: "Yes, you can enter decimal percentages like 0.5% or 12.75%. The calculator handles all decimal values with full precision, so you get accurate results even for very small or very specific percentages." },
      { question: "Is my data stored anywhere?", answer: "No. All percentage calculations are performed entirely in your browser using JavaScript. No numbers are sent to any server, and no calculation history is stored." },
      { question: "Does it work offline?", answer: "Yes. Once the page has loaded, the percentage calculator works completely offline. All computations are done locally in your browser with no internet connection needed." },
    ],""",

    "age-calculator": """    faq: [
      { question: "What is an Age Calculator?", answer: "An age calculator is a free online tool that computes your exact age in years, months, weeks, days, hours, minutes, and seconds from your date of birth. It also shows your zodiac sign, day of the week you were born, and a countdown to your next birthday." },
      { question: "How does the age calculator handle leap years?", answer: "The calculator uses JavaScript's built-in Date object which correctly accounts for leap years (years divisible by 4, except century years not divisible by 400). This means your age in days is always accurate, even if you were born on or near February 29." },
      { question: "Can I calculate age between any two dates?", answer: "Yes. By default, it calculates from your birth date to today, but you can change the 'Age at Date' field to any date \\u2014 past or future. This lets you calculate age differences between any two dates, not just birth dates." },
      { question: "How is the zodiac sign determined?", answer: "The zodiac sign is calculated based on your birth month and day using standard Western astrological date ranges. For example, March 21 to April 19 is Aries. The calculator handles all 12 zodiac signs and their exact date boundaries." },
      { question: "Is my date of birth stored or sent to a server?", answer: "No. All calculations happen entirely in your browser. Your date of birth and calculated age are never transmitted to any server or stored anywhere. Privacy is fully maintained." },
      { question: "Does the age calculator work offline?", answer: "Yes. Once the page has loaded, the age calculator works completely offline. All date calculations are performed locally in your browser using JavaScript with no internet connection required." },
    ],""",

    "loan-calculator": """    faq: [
      { question: "What is a Loan Calculator?", answer: "A loan calculator is a free online tool that computes your monthly payment, total interest paid, and total cost for any fixed-rate loan. It also generates a complete amortization schedule showing how each payment is split between principal and interest over the life of the loan." },
      { question: "How is the monthly payment calculated?", answer: "The monthly payment is calculated using the standard amortization formula: M = P \\u00d7 [r(1+r)^n] / [(1+r)^n - 1], where P is the loan principal, r is the monthly interest rate (annual rate / 12), and n is the total number of payments (years \\u00d7 12)." },
      { question: "What types of loans does this calculator support?", answer: "This calculator works for any fixed-rate loan including mortgages, car loans, personal loans, student loans, and business loans. It does not support adjustable-rate mortgages (ARMs) or loans with variable interest rates." },
      { question: "What is an amortization schedule?", answer: "An amortization schedule is a complete table showing every monthly payment over the life of the loan. For each payment, it breaks down how much goes toward interest and how much reduces the principal balance. It also shows the remaining balance after each payment." },
      { question: "Is my financial data stored or sent anywhere?", answer: "No. All calculations are performed entirely in your browser. Your loan amount, interest rate, and all results are never transmitted to any server. No financial data is stored or logged." },
      { question: "Does the loan calculator work offline?", answer: "Yes. Once the page has loaded, the loan calculator works completely offline. All amortization calculations are done locally in your browser with no internet connection needed." },
    ],""",

    "unit-converter": """    faq: [
      { question: "What is a Unit Converter?", answer: "A unit converter is a free online tool that converts values between different units of measurement across 7 categories: length, weight, temperature, volume, area, speed, and data storage. It supports both metric and imperial systems and converts between them instantly." },
      { question: "How accurate are the conversions?", answer: "All conversions use precise, internationally recognized conversion factors. For example, 1 inch equals exactly 2.54 centimeters by definition. Temperature conversions use the exact formulas. There is no rounding error beyond standard floating-point precision." },
      { question: "Can I convert between metric and imperial units?", answer: "Absolutely. The converter seamlessly handles conversions between metric (kilometers, kilograms, Celsius) and imperial (miles, pounds, Fahrenheit) systems. You can also convert between less common units like nautical miles, stone, or Kelvin." },
      { question: "What unit categories are available?", answer: "There are 7 categories with multiple units each: Length (mm, cm, m, km, inch, foot, yard, mile, nautical mile), Weight (mg, g, kg, pound, ounce, stone, ton), Temperature (Celsius, Fahrenheit, Kelvin), Volume (ml, liter, gallon, cup, fluid ounce), Area, Speed (m/s, km/h, mph, knots), and Data Storage (bit, byte, KB, MB, GB, TB)." },
      { question: "Is my data stored or sent to a server?", answer: "No. All conversions are calculated entirely in your browser using JavaScript. The values you enter are never transmitted to any server or stored anywhere." },
      { question: "Does the unit converter work offline?", answer: "Yes. Once the page has loaded, the unit converter works completely offline. All conversion factors are embedded in the tool, so no internet connection is needed to perform any conversion." },
    ],""",

    "case-converter": """    faq: [
      { question: "What is a Case Converter?", answer: "A case converter is a free online tool that transforms text between different letter cases including UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, and kebab-case. It is essential for developers, writers, and anyone who needs to reformat text quickly." },
      { question: "What is the difference between camelCase and PascalCase?", answer: "camelCase starts with a lowercase letter and each subsequent word starts with uppercase (e.g., myVariableName). PascalCase (also called UpperCamelCase) starts every word with an uppercase letter (e.g., MyVariableName). camelCase is standard in JavaScript and Java, while PascalCase is used for class names and React components." },
      { question: "What is snake_case used for?", answer: "snake_case uses underscores between words with all lowercase letters (e.g., my_variable_name). It is the standard naming convention in Python, Ruby, Rust, and for database column names and API parameters in many frameworks." },
      { question: "How does Title Case handle small words?", answer: "Title Case capitalizes the first letter of every word. This is commonly used for headings, titles, and subtitles. The tool converts all words regardless of length, giving you consistent capitalization across your entire text." },
      { question: "Is my text stored or sent to a server?", answer: "No. All case conversion happens entirely in your browser using JavaScript string methods. Your text is never uploaded, stored, or transmitted to any server." },
      { question: "Does the case converter work offline?", answer: "Yes. Once the page has loaded, the case converter works completely offline. All text transformations are done locally in your browser with no internet connection required." },
    ],""",

    "color-picker": """    faq: [
      { question: "What is a Color Picker?", answer: "A color picker is a free online tool that lets you select any color and instantly see its values in multiple formats: HEX (#FF5733), RGB (255, 87, 51), and HSL. It also generates color palettes, lighter/darker variations, and complementary colors for design work." },
      { question: "What is the difference between HEX and RGB?", answer: "HEX is a hexadecimal color code prefixed with # (e.g., #FF5733) and is the most common format in CSS and web design. RGB represents a color as three numbers from 0-255 representing the intensity of red, green, and blue light (e.g., rgb(255, 87, 51)). They represent the exact same color \\u2014 just in different notations." },
      { question: "What is HSL and when should I use it?", answer: "HSL stands for Hue (0-360\\u00b0 on the color wheel), Saturation (0-100% color intensity), and Lightness (0-100% brightness). HSL is more intuitive than HEX/RGB when you want to adjust a color \\u2014 for example, making it lighter or less saturated \\u2014 because each property maps to a visual characteristic." },
      { question: "How are complementary colors calculated?", answer: "A complementary color is found by shifting the hue by 180\\u00b0 on the color wheel. This creates the highest possible contrast between two colors. The tool automatically shows complementary, analogous, and triadic color harmonies in the Color Variations section." },
      { question: "Is any data stored or sent to a server?", answer: "No. All color conversion and palette generation happens entirely in your browser using JavaScript. No color selections, preferences, or data are transmitted to any server." },
      { question: "Does the color picker work offline?", answer: "Yes. Once the page has loaded, the color picker works completely offline. All color conversions between HEX, RGB, and HSL are computed locally in your browser." },
    ],""",

    "json-formatter": """    faq: [
      { question: "What is a JSON Formatter?", answer: "A JSON formatter (also called a JSON beautifier) is a free online developer tool that takes messy or minified JSON data and formats it with proper indentation, line breaks, and syntax highlighting. It also validates JSON syntax and can minify formatted JSON back to a compact single-line form." },
      { question: "Why is my JSON showing an error?", answer: "Common JSON errors include: trailing commas after the last item in an array or object (not allowed in standard JSON), single quotes instead of double quotes around strings and keys, unquoted object keys, missing commas between elements, and comments (JSON does not support comments). The error message shows the exact position of the problem." },
      { question: "Can I upload a .json file instead of pasting?", answer: "Yes. Click the 'Upload .json' button to load a JSON file directly from your device. The file is read entirely in your browser using the FileReader API \\u2014 it is never uploaded to any server." },
      { question: "What is JSON minification and why use it?", answer: "JSON minification removes all unnecessary whitespace (spaces, tabs, line breaks) to produce the most compact representation. This reduces file size for API payloads, reduces network transfer time, and is standard practice for production configurations and data exchange." },
      { question: "Is my JSON data sent to a server?", answer: "No. All JSON formatting, validation, and minification happens entirely in your browser using JavaScript's built-in JSON.parse() and JSON.stringify() methods. Your data is never transmitted to any external server." },
      { question: "Does the JSON formatter work offline?", answer: "Yes. Once the page has loaded, the JSON formatter works completely offline. All parsing and formatting is done locally in your browser with no internet connection required." },
    ],""",

    "image-compressor": """    faq: [
      { question: "What is an Image Compressor?", answer: "An image compressor is a free online tool that reduces the file size of images directly in your browser. It supports JPEG, PNG, and WebP formats and lets you adjust quality settings and dimensions. You can see the before/after file size comparison before downloading." },
      { question: "Does compression reduce image quality?", answer: "It depends on the format and quality setting. Lossy formats (JPEG, WebP) reduce file size by discarding some image data \\u2014 lower quality settings mean more data is discarded. PNG uses lossless compression, so quality is fully preserved. You control the quality level with the slider to find the right balance between file size and visual quality." },
      { question: "What image formats can I upload and export?", answer: "You can upload JPEG, PNG, WebP, GIF, and BMP images. For output, you can choose between JPEG (best for photos), PNG (best for graphics with text/transparency), and WebP (modern format with excellent compression for both photos and graphics)." },
      { question: "Is my image uploaded to a server?", answer: "No. All compression is performed entirely in your browser using the HTML5 Canvas API. Your images never leave your device \\u2014 there are no server uploads, no cloud processing, and no data transmission of any kind." },
      { question: "Can I resize images at the same time?", answer: "Yes. You can set a maximum width and/or height, and the compressor will resize the image proportionally while compressing it. This is useful for preparing images for web pages, social media, or email where specific dimensions are needed." },
      { question: "Does the image compressor work offline?", answer: "Yes. Once the page has loaded, the image compressor works completely offline. All processing uses browser-native Canvas APIs with no internet connection needed to compress images." },
    ],""",

    "qr-code-generator": """    faq: [
      { question: "What is a QR Code Generator?", answer: "A QR code generator is a free online tool that creates scannable QR codes from any text or URL. You can customize the size, colors, and download the result as a high-quality PNG image. QR codes are used for sharing links, business cards, WiFi passwords, and more." },
      { question: "What types of content can I encode?", answer: "You can encode any text content \\u2014 website URLs, email addresses (mailto:), phone numbers (tel:), WiFi credentials, vCard contact information, or plain text. The QR code simply stores whatever text you enter; how it is interpreted depends on the scanner app." },
      { question: "Is there a limit to how much text a QR code can hold?", answer: "Yes. A standard QR code can hold up to approximately 4,296 alphanumeric characters or 7,089 numeric digits. Longer content produces denser QR codes with smaller modules (dots), which may be harder to scan at small sizes. For best results, keep URLs under 300 characters." },
      { question: "Can I customize the QR code colors?", answer: "Yes. You can change both the foreground (dark modules) and background colors. However, for reliable scanning, maintain high contrast between foreground and background (e.g., dark foreground on light background). Very low contrast combinations may not scan properly." },
      { question: "Is my data stored or sent to a server?", answer: "No. The QR code is generated entirely in your browser using JavaScript. The text or URL you enter is never sent to any server. No data is stored, tracked, or logged." },
      { question: "Does the QR code generator work offline?", answer: "Yes. Once the page has loaded, the QR code generator works completely offline. The QR code rendering library is loaded with the page, so no internet connection is needed to generate or download QR codes." },
    ],""",

    "base64-encoder": """    faq: [
      { question: "What is Base64 encoding?", answer: "Base64 is a binary-to-text encoding scheme that represents binary data using a set of 64 ASCII characters (A-Z, a-z, 0-9, +, /). It is commonly used to embed images in HTML/CSS, send binary data in JSON payloads, encode email attachments, and represent binary data in text-based formats like XML or configuration files." },
      { question: "How does Base64 encoding work?", answer: "The encoder reads your input (text or file), converts it to a sequence of bytes (using UTF-8 for text), then groups those bytes into chunks of 3. Each 3-byte chunk (24 bits) is split into four 6-bit numbers, each mapped to one of the 64 Base64 characters. If the final chunk has fewer than 3 bytes, padding characters (=) are added." },
      { question: "Does it support Unicode characters and emojis?", answer: "Yes. The encoder first converts your text to UTF-8 bytes before Base64 encoding. This means it correctly handles all Unicode characters including emojis, Chinese/Japanese/Korean characters, accented letters, and any other non-ASCII text." },
      { question: "Can I encode files to Base64?", answer: "Yes. Click 'Upload File' on the Encode tab to convert any file to a Base64 data URI string. This is useful for embedding small images directly in HTML or CSS, or preparing binary data for JSON API payloads." },
      { question: "Is my data stored or sent to a server?", answer: "No. All encoding and decoding happens entirely in your browser using the btoa() and atob() JavaScript APIs (or the FileReader API for files). Your data is never uploaded or transmitted to any server." },
      { question: "Does the Base64 tool work offline?", answer: "Yes. Once the page has loaded, the Base64 encoder/decoder works completely offline. All encoding and decoding uses browser-native APIs with no internet connection required." },
    ],""",

    "url-encoder": """    faq: [
      { question: "What is a URL Encoder?", answer: "A URL encoder is a free online tool that converts special characters in URLs to percent-encoded format (e.g., space becomes %20) for safe transmission. It also decodes percent-encoded URLs back to readable text. It includes an automatic URL breakdown showing scheme, host, path, and query parameters." },
      { question: "What is percent encoding?", answer: "Percent encoding (also called URL encoding) replaces unsafe ASCII characters with a '%' symbol followed by two hexadecimal digits representing the character's byte value. For example, a space becomes %20, '&' becomes %26, and '?' becomes %3F. This ensures URLs can be safely transmitted over the internet without ambiguity." },
      { question: "When should I URL-encode a string?", answer: "URL-encode whenever you need to include special characters in a URL's query parameter or path segment. This includes spaces, ampersands, equals signs, question marks, hash symbols, and non-ASCII characters. Without encoding, these characters can break URL parsing or be misinterpreted by servers." },
      { question: "What is the difference between encodeURI and encodeURIComponent?", answer: "encodeURI() is designed for full URLs and leaves URL structure characters intact (:, /, ?, &, =, #). encodeURIComponent() encodes ALL special characters including these, making it the correct choice for individual query parameter values. The tool lets you choose which method to use." },
      { question: "Is my URL data stored or sent to a server?", answer: "No. All encoding and decoding happens entirely in your browser using JavaScript's built-in encodeURI(), encodeURIComponent(), decodeURI(), and decodeURIComponent() functions. Your URLs are never transmitted to any server." },
      { question: "Does the URL encoder work offline?", answer: "Yes. Once the page has loaded, the URL encoder/decoder works completely offline. All encoding and decoding uses browser-native JavaScript functions with no internet connection needed." },
    ],""",

    "lorem-ipsum-generator": """    faq: [
      { question: "What is a Lorem Ipsum Generator?", answer: "A lorem ipsum generator is a free online tool that creates placeholder (dummy) text for designs, mockups, and prototypes. It generates realistic-looking text that mimics natural language, allowing designers and developers to visualize how real content will look without needing actual copy." },
      { question: "What is lorem ipsum text?", answer: "Lorem ipsum is placeholder text derived from a 1st-century BC Latin text by the Roman philosopher Cicero (De Finibus Bonorum et Malorum). It has been the printing and typesetting industry's standard dummy text since the 1500s. While it resembles Latin, the text has been scrambled over centuries and is not grammatically correct." },
      { question: "Can I customize how much text is generated?", answer: "Yes. You can generate text in three modes: by Paragraphs (1-20), by Sentences (1-50), or by Words (1-500). The text regenerates instantly as you adjust the count, and you can toggle the classic 'Lorem ipsum dolor sit amet...' opening sentence." },
      { question: "Why use lorem ipsum instead of real text?", answer: "Lorem ipsum allows viewers to focus on the visual design (layout, typography, spacing) rather than reading the content. This is important during the design phase when actual copy may not be available yet. It provides a realistic impression of text density and flow without distracting the reviewer." },
      { question: "Is any data stored or sent to a server?", answer: "No. The lorem ipsum text is generated entirely in your browser using a built-in word list and generation algorithm. No data is transmitted to any server." },
      { question: "Does the lorem ipsum generator work offline?", answer: "Yes. Once the page has loaded, the generator works completely offline. The Latin word list and generation algorithm are embedded in the page, so no internet connection is needed to generate placeholder text." },
    ],""",

    "markdown-previewer": """    faq: [
      { question: "What is a Markdown Previewer?", answer: "A Markdown previewer is a free online tool that lets you write Markdown text in a split-view editor and see a live HTML preview in real time. It supports GitHub Flavored Markdown (GFM) including tables, code blocks, task lists, and more. You can also copy the rendered HTML output for use in blogs, CMS platforms, or emails." },
      { question: "What Markdown features are supported?", answer: "The previewer supports the full GitHub Flavored Markdown specification including: headings (h1-h6), bold and italic text, links and images, ordered and unordered lists, code blocks (fenced and inline), tables, task lists (checkboxes), blockquotes, horizontal rules, and strikethrough text." },
      { question: "Can I export the rendered HTML?", answer: "Yes. Click the 'Copy HTML' button to copy the fully rendered HTML to your clipboard. You can then paste it directly into a CMS (like WordPress), an HTML file, an email client, or any other application that accepts HTML content." },
      { question: "Does it support syntax highlighting for code blocks?", answer: "Code blocks are rendered with proper formatting, monospace font, and styled backgrounds for clear readability. The tool provides solid code block formatting, and you can copy the output HTML to use with any external syntax highlighting library in your project." },
      { question: "Is my text stored or sent to a server?", answer: "No. All Markdown parsing and HTML rendering happens entirely in your browser. Your text is never uploaded, stored, or transmitted to any server. The preview updates in real time using client-side JavaScript." },
      { question: "Does the Markdown previewer work offline?", answer: "Yes. Once the page has loaded, the Markdown previewer works completely offline. The Markdown parsing library and rendering engine are loaded with the page, so no internet connection is needed to write or preview Markdown." },
    ],""",

    "hash-generator": """    faq: [
      { question: "What is a Hash Generator?", answer: "A hash generator is a free online tool that creates cryptographic hash values from any text input. It supports SHA-1, SHA-256, and SHA-512 algorithms using the Web Crypto API. Hashes are used for verifying file integrity, securely storing passwords, generating checksums, and digital signatures." },
      { question: "How are the hashes generated?", answer: "Hashes are generated using the Web Crypto API (crypto.subtle.digest()) built into your browser. This is the same cryptographic library your browser uses for HTTPS/TLS connections. It produces standards-compliant hashes identical to those generated by OpenSSL, Node.js crypto, and other professional tools." },
      { question: "Which hash algorithm should I use?", answer: "SHA-256 is recommended for most modern applications \\u2014 it offers an excellent balance of security and performance. SHA-512 provides even stronger security for sensitive applications. SHA-1 is considered cryptographically weak and should only be used for backward compatibility with legacy systems." },
      { question: "Can I hash passwords with this tool?", answer: "You can generate hashes of any text, but for actual password storage in applications, you should use a purpose-built password hashing algorithm like bcrypt, Argon2, or PBKDF2 which add salt and iterations. The SHA hashes from this tool are useful for checksums, file verification, and general-purpose hashing." },
      { question: "Is my text stored or sent to a server?", answer: "No. All hashing happens entirely in your browser using the Web Crypto API. Your input text and generated hashes are never transmitted to any external server. No data is stored or logged." },
      { question: "Does the hash generator work offline?", answer: "Yes. Once the page has loaded, the hash generator works completely offline. The Web Crypto API is a browser-native feature, so no internet connection is needed to generate SHA-1, SHA-256, or SHA-512 hashes." },
    ],""",

    "number-base-converter": """    faq: [
      { question: "What is a Number Base Converter?", answer: "A number base converter is a free online tool that converts numbers between binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16) number systems. It uses JavaScript BigInt for arbitrary-precision arithmetic, so it handles very large numbers without any loss of precision." },
      { question: "What is binary and why is it important?", answer: "Binary (base 2) is the fundamental number system of computers, using only two digits: 0 and 1. All digital data \\u2014 text, images, video, programs \\u2014 is ultimately represented as binary. Understanding binary is essential for computer science, programming, and digital electronics." },
      { question: "What is hexadecimal used for?", answer: "Hexadecimal (base 16, using digits 0-9 and letters A-F) is widely used in programming because it represents binary data more compactly \\u2014 each hex digit maps to exactly 4 binary bits. Common uses include memory addresses, color codes (#FF5733), Unicode code points, and debugging binary data." },
      { question: "Does it support very large numbers?", answer: "Yes. The converter uses JavaScript's BigInt for arbitrary-precision arithmetic, meaning it can convert numbers of any size without rounding or precision loss. Regular JavaScript numbers lose precision above 2^53, but BigInt handles them correctly." },
      { question: "Is my data stored or sent to a server?", answer: "No. All number base conversions are calculated entirely in your browser using JavaScript BigInt. No numbers are transmitted to any server, and no conversion history is stored." },
      { question: "Does the number base converter work offline?", answer: "Yes. Once the page has loaded, the number base converter works completely offline. All conversion math is done locally in your browser with no internet connection required." },
    ],""",

    "text-diff-checker": """    faq: [
      { question: "What is a Text Diff Checker?", answer: "A text diff checker is a free online tool that compares two pieces of text side by side and highlights the differences. Added lines appear in green, removed lines in red, and unchanged lines remain neutral. It shows statistics for lines added, removed, and unchanged \\u2014 perfect for comparing code revisions, document versions, and text changes." },
      { question: "How does the comparison algorithm work?", answer: "The tool performs a line-by-line comparison between the two texts. It identifies which lines exist only in the original text (removed), which exist only in the modified text (added), and which are identical (unchanged). This gives you a clear visual picture of exactly what changed between two versions." },
      { question: "Is the comparison case-sensitive?", answer: "Yes, the diff comparison is case-sensitive by default. 'Hello' and 'hello' are treated as different lines. This is the correct behavior for source code comparison where casing matters (e.g., variable names in JavaScript, class names in Python)." },
      { question: "Can I compare code files?", answer: "Absolutely. The diff checker works with any plain text, including source code (JavaScript, Python, HTML, CSS, etc.), configuration files (JSON, YAML, .env), log files, and any other text-based format. Simply paste the content from both versions into the left and right textareas." },
      { question: "Is my text stored or sent to a server?", answer: "No. All text comparison happens entirely in your browser using JavaScript. Both texts are processed locally and are never transmitted to any server. No text is stored, cached, or logged." },
      { question: "Does the text diff checker work offline?", answer: "Yes. Once the page has loaded, the diff checker works completely offline. All comparison logic is implemented in client-side JavaScript with no internet connection needed." },
    ],""",

    "pdf-compressor": """    faq: [
      { question: "What is a PDF Compressor?", answer: "A PDF compressor is a free online tool that reduces the file size of PDF documents directly in your browser. It offers three compression levels \\u2014 Low, Medium, and High \\u2014 and shows you the file size reduction before you download. No upload to any server is required." },
      { question: "How does PDF compression work without a server?", answer: "The compression happens entirely in your browser using client-side JavaScript. Low level removes unused objects and optimizes the PDF structure. Medium level also strips metadata (author, title, creation date, etc.). High level additionally re-encodes embedded images at lower quality for maximum size reduction." },
      { question: "Will compression affect the quality of my PDF?", answer: "Low and Medium compression levels preserve all visual content perfectly. High compression may slightly reduce image quality within the PDF. However, text content, vector graphics, fonts, and page layout are always preserved at every compression level." },
      { question: "Is my PDF uploaded to a server?", answer: "No. All compression is performed entirely in your browser. Your PDF files are never uploaded, transmitted, or stored on any server. The file stays on your device throughout the entire process \\u2014 from upload to download." },
      { question: "What PDF compression level should I choose?", answer: "Use Low for minimal size reduction with zero quality loss. Use Medium for a good balance of size reduction and quality preservation \\u2014 recommended for most use cases. Use High when file size is the priority and slight image quality reduction is acceptable (e.g., email attachments with size limits)." },
      { question: "Does the PDF compressor work offline?", answer: "Yes. Once the page has loaded, the PDF compressor works completely offline. The PDF processing library is loaded with the page, so no internet connection is needed to compress PDF files." },
    ],""",
}

# Strategy: find each tool's id, then replace its faq array
for tool_id, new_faq in faq_replacements.items():
    id_pattern = f'id: "{tool_id}"'
    id_pos = content.find(id_pattern)
    if id_pos == -1:
        print(f"WARNING: Could not find tool '{tool_id}'")
        continue
    
    # Find the next tool id after this one to set a boundary
    next_id_pos = len(content)
    for other_id in faq_replacements:
        if other_id == tool_id:
            continue
        other_pos = content.find(f'id: "{other_id}"', id_pos + len(id_pattern))
        if other_pos != -1 and other_pos < next_id_pos:
            next_id_pos = other_pos
    
    search_region = content[id_pos:next_id_pos]
    
    faq_start_marker = "\n    faq: ["
    faq_start_in_region = search_region.find(faq_start_marker)
    if faq_start_in_region == -1:
        print(f"WARNING: Could not find faq array for '{tool_id}'")
        continue
    
    faq_abs_start = id_pos + faq_start_in_region
    bracket_count = 0
    i = faq_abs_start + len(faq_start_marker) - 1
    faq_abs_end = -1
    in_string = False
    string_char = None
    while i < len(content):
        c = content[i]
        if in_string:
            if c == '\\':
                i += 1
            elif c == string_char:
                in_string = False
        else:
            if c in ('"', "'"):
                in_string = True
                string_char = c
            elif c == '[':
                bracket_count += 1
            elif c == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    faq_abs_end = i + 1
                    if faq_abs_end < len(content) and content[faq_abs_end] == ',':
                        faq_abs_end += 1
                    break
        i += 1
    
    if faq_abs_end == -1:
        print(f"WARNING: Could not find end of faq array for '{tool_id}'")
        continue
    
    old_faq = content[faq_abs_start:faq_abs_end]
    content = content[:faq_abs_start] + new_faq + content[faq_abs_end:]
    print(f"Updated FAQ for '{tool_id}': {len(old_faq)} chars -> {len(new_faq)} chars")

with open(FILE, "w") as f:
    f.write(content)

print("\nAll FAQ updates complete!")