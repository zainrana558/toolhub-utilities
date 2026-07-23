#!/bin/bash
# Batch fix: replace all stale BASE_URL and domain references

SRC="src"
OLD_DOMAIN="toolhub-utilities.vercel.app"
OLD_EMAIL="hello@toolverse.com"
NEW_DOMAIN="toolhub-utilities-seven.vercel.app"
NEW_EMAIL="toolshubbb@gmail.com"

# 1. Replace stale domain in all source files
for f in $(rg -l "$OLD_DOMAIN" "$SRC/" 2>/dev/null); do
  sed -i "s|$OLD_DOMAIN|$NEW_DOMAIN|g" "$f"
  echo "Fixed domain in: $f"
done

# 2. Replace stale email in all source files
for f in $(rg -l "$OLD_EMAIL" "$SRC/" 2>/dev/null); do
  sed -i "s|$OLD_EMAIL|$NEW_EMAIL|g" "$f"
  echo "Fixed email in: $f"
done

# 3. Delete stale static sitemaps (they have old domain and are redundant)
rm -f public/sitemaps/*.xml
echo "Deleted stale static sitemap XML files"

# 4. Delete the sitemaps directory if empty
rmdir public/sitemaps 2>/dev/null && echo "Removed empty public/sitemaps/" || echo "public/sitemaps/ not empty or doesn't exist"

echo "Done!"
