import {
  Type,
  Hash,
  Shield,
  Heart,
  Percent,
  Calendar,
  Banknote,
  ArrowLeftRight,
  CaseSensitive,
  Palette,
  Braces,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

export interface ToolDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  category: string;
  icon: LucideIcon;
  keywords: string[];
  metaTitle: string;
  metaDescription: string;
}

export const toolCategories = [
  { id: "text", name: "Text Tools", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { id: "math", name: "Math & Finance", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { id: "dev", name: "Developer Tools", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { id: "converter", name: "Converters", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
];

export const tools: ToolDef[] = [
  {
    id: "word-counter",
    name: "Word Counter",
    shortName: "Word Count",
    description: "Count words, characters, sentences, and paragraphs instantly.",
    longDescription: "Free online word counter tool. Instantly count words, characters (with and without spaces), sentences, paragraphs, and estimated reading time. Perfect for writers, students, bloggers, and SEO professionals who need to meet specific word count requirements.",
    category: "text",
    icon: Type,
    keywords: ["word counter", "character counter", "word count tool", "online word counter", "text counter", "sentence counter", "reading time calculator"],
    metaTitle: "Free Word Counter Tool - Count Words, Characters & Reading Time Online",
    metaDescription: "Count words, characters, sentences, paragraphs and reading time instantly. Free online word counter tool for writers, students and SEO professionals.",
  },
  {
    id: "password-generator",
    name: "Password Generator",
    shortName: "Password Gen",
    description: "Generate strong, secure passwords with customizable options.",
    longDescription: "Generate strong, secure, and random passwords instantly. Customize length, include uppercase, lowercase, numbers, and special characters. Check password strength in real-time. Perfect for creating secure passwords for all your online accounts.",
    category: "dev",
    icon: Shield,
    keywords: ["password generator", "strong password", "secure password", "random password", "password maker", "create password"],
    metaTitle: "Free Password Generator - Create Strong & Secure Passwords Online",
    metaDescription: "Generate strong, secure passwords instantly. Customize length, characters, and check password strength. Free online password generator tool.",
  },
  {
    id: "bmi-calculator",
    name: "BMI Calculator",
    shortName: "BMI Calc",
    description: "Calculate your Body Mass Index and see your health category.",
    longDescription: "Calculate your Body Mass Index (BMI) quickly and accurately. Enter your height and weight to find out if you're underweight, normal weight, overweight, or obese. Includes BMI chart and health category explanations for better understanding of your results.",
    category: "math",
    icon: Heart,
    keywords: ["bmi calculator", "body mass index", "bmi checker", "healthy weight", "bmi chart", "weight calculator"],
    metaTitle: "Free BMI Calculator - Calculate Body Mass Index Online | Health Tool",
    metaDescription: "Calculate your Body Mass Index (BMI) instantly. Free online BMI calculator with health categories and BMI chart. Check if your weight is healthy.",
  },
  {
    id: "percentage-calculator",
    name: "Percentage Calculator",
    shortName: "Percentage",
    description: "Calculate percentages, percentage change, and percentage difference.",
    longDescription: "Calculate any percentage easily with multiple calculation modes. Find what percent of a number is, calculate percentage increase or decrease, and find the percentage difference between two numbers. Essential for students, business owners, and financial calculations.",
    category: "math",
    icon: Percent,
    keywords: ["percentage calculator", "percent calculator", "percentage increase", "percentage decrease", "percent of", "calculate percentage"],
    metaTitle: "Free Percentage Calculator - Calculate Percentages Online Instantly",
    metaDescription: "Calculate percentages, percentage change, increase, and decrease instantly. Free online percentage calculator for students and business.",
  },
  {
    id: "age-calculator",
    name: "Age Calculator",
    shortName: "Age Calc",
    description: "Calculate your exact age in years, months, and days.",
    longDescription: "Calculate your exact age in years, months, weeks, days, hours, minutes, and seconds. Simply enter your date of birth and get a detailed breakdown of your age. Also calculates days until your next birthday.",
    category: "math",
    icon: Calendar,
    keywords: ["age calculator", "calculate age", "how old am I", "age in days", "birthday calculator", "date of birth calculator"],
    metaTitle: "Free Age Calculator - Calculate Your Exact Age in Years, Months & Days",
    metaDescription: "Calculate your exact age in years, months, days, hours and seconds. Free online age calculator with next birthday countdown.",
  },
  {
    id: "loan-calculator",
    name: "Loan Calculator",
    shortName: "Loan Calc",
    description: "Calculate monthly payments, total interest, and amortization.",
    longDescription: "Calculate your monthly loan payments, total interest paid, and view a complete amortization schedule. Works for mortgages, car loans, personal loans, and any fixed-rate loan. Adjust interest rate, loan term, and principal to find the perfect loan for your budget.",
    category: "math",
    icon: Banknote,
    keywords: ["loan calculator", "mortgage calculator", "emi calculator", "monthly payment", "interest calculator", "amortization schedule"],
    metaTitle: "Free Loan Calculator - Monthly Payment & Amortization Schedule",
    metaDescription: "Calculate monthly loan payments, total interest, and view amortization schedule. Free mortgage, car loan, and EMI calculator online.",
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    shortName: "Unit Convert",
    description: "Convert between units of length, weight, temperature, and more.",
    longDescription: "Convert between hundreds of units across multiple categories including length, weight, temperature, volume, area, speed, time, and data. Fast, accurate, and easy to use unit conversion tool for students, professionals, and everyday use.",
    category: "converter",
    icon: ArrowLeftRight,
    keywords: ["unit converter", "length converter", "weight converter", "temperature converter", "metric converter", "measurement converter"],
    metaTitle: "Free Unit Converter - Convert Length, Weight, Temperature & More",
    metaDescription: "Convert between units of length, weight, temperature, volume, speed and more. Free online unit conversion tool.",
  },
  {
    id: "case-converter",
    name: "Case Converter",
    shortName: "Case Convert",
    description: "Convert text to uppercase, lowercase, title case, and more.",
    longDescription: "Instantly convert your text between different cases including uppercase, lowercase, title case, sentence case, camelCase, PascalCase, snake_case, and kebab-case. Perfect for developers, writers, and anyone who needs to format text quickly.",
    category: "text",
    icon: CaseSensitive,
    keywords: ["case converter", "uppercase converter", "lowercase converter", "title case", "sentence case", "text case changer"],
    metaTitle: "Free Case Converter - Uppercase, Lowercase, Title Case & More",
    metaDescription: "Convert text to uppercase, lowercase, title case, sentence case, camelCase and more. Free online case converter tool.",
  },
  {
    id: "color-picker",
    name: "Color Picker",
    shortName: "Color Pick",
    description: "Pick colors and convert between HEX, RGB, and HSL formats.",
    longDescription: "Pick any color and instantly get its values in HEX, RGB, HSL, and CMYK formats. Use the color wheel or input specific values. Generate color palettes and find complementary colors. Essential tool for designers, developers, and artists.",
    category: "dev",
    icon: Palette,
    keywords: ["color picker", "hex color", "rgb color", "hsl color", "color converter", "color palette generator"],
    metaTitle: "Free Color Picker - HEX, RGB, HSL Color Converter & Palette Tool",
    metaDescription: "Pick colors and convert between HEX, RGB, HSL, and CMYK formats. Free online color picker tool for designers and developers.",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    shortName: "JSON Format",
    description: "Format, validate, and beautify JSON data with syntax highlighting.",
    longDescription: "Format, validate, and beautify your JSON data instantly. Paste messy JSON and get perfectly formatted, indented output with syntax highlighting. Includes error detection, JSON minification, and tree view. Essential tool for developers working with APIs and data.",
    category: "dev",
    icon: Braces,
    keywords: ["json formatter", "json beautifier", "json validator", "json viewer", "format json", "pretty print json"],
    metaTitle: "Free JSON Formatter & Validator - Beautify JSON Online",
    metaDescription: "Format, validate and beautify JSON data instantly with syntax highlighting. Free online JSON formatter, validator and viewer tool.",
  },
];