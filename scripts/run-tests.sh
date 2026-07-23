#!/bin/bash
# Start dev server, wait for it, run all endpoint tests, then shut down.
set -u

cd /home/z/toolhub

# 1. Kill any stale servers
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
sleep 2

# 2. Start dev server in background
nohup bun next dev -p 3000 > /tmp/toolhub-dev.log 2>&1 &
SRV_PID=$!
echo "Server PID: $SRV_PID"

# 3. Wait for ready (max 30s)
for i in $(seq 1 60); do
  if curl -sf -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 0.5
done

if ! curl -sf -o /dev/null http://localhost:3000/ 2>/dev/null; then
  echo "ERROR: server did not start"
  tail -50 /tmp/toolhub-dev.log
  kill -9 $SRV_PID 2>/dev/null || true
  exit 1
fi

# 4. Run all endpoint tests
cd /tmp/th-tests
mkdir -p out
PASS=0
FAIL=0
TOTAL=0

run() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  TOTAL=$((TOTAL+1))
  if [[ "$actual" == "$expected" ]]; then
    echo "  PASS  $name  (got: $actual)"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $name  (expected: $expected, got: $actual)"
    FAIL=$((FAIL+1))
  fi
}

http_code() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

echo
echo "=========================================================="
echo "Endpoint tests"
echo "=========================================================="

# ---- pdf-to-jpg ----
echo
echo "--- pdf-to-jpg ---"
# Pre-warm the route so Turbopack compiles it
curl -s -o /dev/null http://localhost:3000/api/pdf-to-jpg
run "pdf-to-jpg valid PDF -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'scale=1' -F 'quality=0.85' http://localhost:3000/api/pdf-to-jpg)"
# Save the actual ZIP for inspection
curl -s -o out/pdf-to-jpg.zip -X POST -F 'file=@sample.pdf' -F 'scale=1' -F 'quality=0.85' http://localhost:3000/api/pdf-to-jpg
echo "    ZIP size: $(stat -c%s out/pdf-to-jpg.zip) bytes  type: $(file -b out/pdf-to-jpg.zip)"

run "pdf-to-jpg bad scale=100 -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'scale=100' http://localhost:3000/api/pdf-to-jpg)"

run "pdf-to-jpg no file -> 400" \
  "400" \
  "$(http_code -X POST -F 'scale=1' http://localhost:3000/api/pdf-to-jpg)"

run "pdf-to-jpg bad content-type -> 400" \
  "400" \
  "$(http_code -X POST -H 'Content-Type: application/json' -d '{}' http://localhost:3000/api/pdf-to-jpg)"

# ---- jpg-to-pdf ----
echo
echo "--- jpg-to-pdf ---"
curl -s -o /dev/null http://localhost:3000/api/jpg-to-pdf
run "jpg-to-pdf single image -> 200" \
  "200" \
  "$(http_code -X POST -F 'files=@red.jpg' http://localhost:3000/api/jpg-to-pdf)"

run "jpg-to-pdf multiple images -> 200" \
  "200" \
  "$(http_code -X POST -F 'files=@red.jpg' -F 'files=@blue-portrait.jpg' -F 'files=@trans.png' http://localhost:3000/api/jpg-to-pdf)"

run "jpg-to-pdf no file -> 400" \
  "400" \
  "$(http_code -X POST http://localhost:3000/api/jpg-to-pdf)"

run "jpg-to-pdf bad pageSize -> 400" \
  "400" \
  "$(http_code -X POST -F 'files=@red.jpg' -F 'pageSize=bogus' http://localhost:3000/api/jpg-to-pdf)"

run "jpg-to-pdf bad orientation -> 400" \
  "400" \
  "$(http_code -X POST -F 'files=@red.jpg' -F 'orientation=diagonal' http://localhost:3000/api/jpg-to-pdf)"

run "jpg-to-pdf bad margin=9999 -> 400" \
  "400" \
  "$(http_code -X POST -F 'files=@red.jpg' -F 'margin=9999' http://localhost:3000/api/jpg-to-pdf)"

# ---- merge-pdf ----
echo
echo "--- merge-pdf ---"
curl -s -o /dev/null http://localhost:3000/api/merge-pdf
run "merge-pdf 2 PDFs -> 200" \
  "200" \
  "$(http_code -X POST -F 'files=@sample.pdf' -F 'files=@sample.pdf' http://localhost:3000/api/merge-pdf)"

run "merge-pdf only 1 file -> 400" \
  "400" \
  "$(http_code -X POST -F 'files=@sample.pdf' http://localhost:3000/api/merge-pdf)"

run "merge-pdf no file -> 400" \
  "400" \
  "$(http_code -X POST http://localhost:3000/api/merge-pdf)"

# ---- split-pdf ----
echo
echo "--- split-pdf ---"
curl -s -o /dev/null http://localhost:3000/api/split-pdf
# mode=every -> ZIP
run "split-pdf mode=every -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'mode=every' http://localhost:3000/api/split-pdf)"

run "split-pdf mode=extract valid range -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'mode=extract' -F 'ranges=1-2' http://localhost:3000/api/split-pdf)"

run "split-pdf mode=range valid -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'mode=range' -F 'ranges=1-2;3' http://localhost:3000/api/split-pdf)"

run "split-pdf mode=extract range out of bounds -> 400/500" \
  "ERR" \
  "$(CODE=$(http_code -X POST -F 'file=@sample.pdf' -F 'mode=extract' -F 'ranges=1-99' http://localhost:3000/api/split-pdf); \
     if [[ "$CODE" == "400" || "$CODE" == "500" ]]; then echo "ERR"; else echo "$CODE"; fi)"

run "split-pdf mode=extract missing ranges -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'mode=extract' http://localhost:3000/api/split-pdf)"

run "split-pdf bad mode -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'mode=banana' http://localhost:3000/api/split-pdf)"

run "split-pdf no file -> 400" \
  "400" \
  "$(http_code -X POST -F 'mode=every' http://localhost:3000/api/split-pdf)"

# ---- rotate-pdf ----
echo
echo "--- rotate-pdf ---"
curl -s -o /dev/null http://localhost:3000/api/rotate-pdf
run "rotate-pdf angle=90 -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'angle=90' http://localhost:3000/api/rotate-pdf)"

run "rotate-pdf angle=180 -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'angle=180' http://localhost:3000/api/rotate-pdf)"

run "rotate-pdf angle=270 -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'angle=270' http://localhost:3000/api/rotate-pdf)"

run "rotate-pdf angle=45 -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'angle=45' http://localhost:3000/api/rotate-pdf)"

run "rotate-pdf angle=abc -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'angle=abc' http://localhost:3000/api/rotate-pdf)"

run "rotate-pdf no file -> 400" \
  "400" \
  "$(http_code -X POST -F 'angle=90' http://localhost:3000/api/rotate-pdf)"

# ---- watermark-pdf ----
echo
echo "--- watermark-pdf ---"
curl -s -o /dev/null http://localhost:3000/api/watermark-pdf
run "watermark-pdf valid -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'text=DRAFT' -F 'fontSize=60' -F 'opacity=0.2' -F 'color=#888888' -F 'rotation=45' http://localhost:3000/api/watermark-pdf)"

run "watermark-pdf empty text -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'text=' http://localhost:3000/api/watermark-pdf)"

run "watermark-pdf bad fontSize -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'fontSize=9999' http://localhost:3000/api/watermark-pdf)"

run "watermark-pdf bad opacity -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'opacity=2' http://localhost:3000/api/watermark-pdf)"

run "watermark-pdf bad rotation (NaN) -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'rotation=abc' http://localhost:3000/api/watermark-pdf)"

# ---- pdf-number ----
echo
echo "--- pdf-number ---"
curl -s -o /dev/null http://localhost:3000/api/pdf-number
run "pdf-number valid -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'position=bottom-center' -F 'format={n}/{total}' -F 'fontSize=12' -F 'color=#333333' -F 'startAt=1' -F 'margin=30' http://localhost:3000/api/pdf-number)"

run "pdf-number bad position -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'position=middle' http://localhost:3000/api/pdf-number)"

run "pdf-number bad fontSize -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'fontSize=9999' http://localhost:3000/api/pdf-number)"

run "pdf-number bad startAt -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'startAt=-5' http://localhost:3000/api/pdf-number)"

run "pdf-number bad margin (NaN) -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'margin=abc' http://localhost:3000/api/pdf-number)"

run "pdf-number format missing {n} -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@sample.pdf' -F 'format=Hello' http://localhost:3000/api/pdf-number)"

# ---- pdf-to-word ----
echo
echo "--- pdf-to-word ---"
curl -s -o /dev/null http://localhost:3000/api/pdf-to-word
run "pdf-to-word valid -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' http://localhost:3000/api/pdf-to-word)"
# Save the actual DOCX
curl -s -o out/pdf-to-word.docx -X POST -F 'file=@sample.pdf' http://localhost:3000/api/pdf-to-word
echo "    DOCX size: $(stat -c%s out/pdf-to-word.docx)  type: $(file -b out/pdf-to-word.docx)"

run "pdf-to-word no file -> 400" \
  "400" \
  "$(http_code -X POST http://localhost:3000/api/pdf-to-word)"

run "pdf-to-word non-pdf -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@red.jpg' http://localhost:3000/api/pdf-to-word)"

# ---- word-to-pdf ----
echo
echo "--- word-to-pdf ---"
curl -s -o /dev/null http://localhost:3000/api/word-to-pdf
run "word-to-pdf valid -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.docx' http://localhost:3000/api/word-to-pdf)"
curl -s -o out/word-to-pdf.pdf -X POST -F 'file=@sample.docx' http://localhost:3000/api/word-to-pdf
echo "    PDF size: $(stat -c%s out/word-to-pdf.pdf)  type: $(file -b out/word-to-pdf.pdf)"

run "word-to-pdf non-docx -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@red.jpg' http://localhost:3000/api/word-to-pdf)"

run "word-to-pdf no file -> 400" \
  "400" \
  "$(http_code -X POST http://localhost:3000/api/word-to-pdf)"

# ---- pdf-to-text ----
echo
echo "--- pdf-to-text ---"
curl -s -o /dev/null http://localhost:3000/api/pdf-to-text
run "pdf-to-text valid -> 200" \
  "200" \
  "$(http_code -X POST -F 'file=@sample.pdf' http://localhost:3000/api/pdf-to-text)"
curl -s -o out/pdf-to-text.txt -X POST -F 'file=@sample.pdf' http://localhost:3000/api/pdf-to-text
echo "    TXT size: $(stat -c%s out/pdf-to-text.txt)  preview:"
head -10 out/pdf-to-text.txt | sed 's/^/      | /'

run "pdf-to-text no file -> 400" \
  "400" \
  "$(http_code -X POST http://localhost:3000/api/pdf-to-text)"

run "pdf-to-text non-pdf -> 400" \
  "400" \
  "$(http_code -X POST -F 'file=@red.jpg' http://localhost:3000/api/pdf-to-text)"

# ---- Summary ----
echo
echo "=========================================================="
echo "Results:  $PASS / $TOTAL passed, $FAIL failed"
echo "=========================================================="

# 5. Kill the dev server
kill -9 $SRV_PID 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true

exit 0
